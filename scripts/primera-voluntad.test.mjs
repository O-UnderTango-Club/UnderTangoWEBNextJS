import assert from 'node:assert/strict';
import test from 'node:test';
import { longestLine, sameLine, visibleLines } from '../public/847/primera-voluntad/line-detector.mjs';

import { readFloor, SignMotion } from '../public/847/primera-voluntad/motion.mjs';
import { visibleCrop } from '../public/847/primera-voluntad/scene.mjs';

import { cameraMotion, carryPoint } from '../public/847/primera-voluntad/camera-motion.mjs';

import { RollingSign, ShowBoard, collide } from '../public/847/primera-voluntad/stage-physics.mjs';
import { announcements, cueAt } from '../public/847/primera-voluntad/show-board.mjs';

const width = 192,
  height = 138;

function frame(segments = [], noise = 0) {
  const data = new Uint8ClampedArray(width * height * 4);
  let seed = 73;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let light = 40;
      for (const [ax, ay, bx, by, intensity = 195] of segments) {
        const dx = bx - ax,
          dy = by - ay;
        const t = Math.min(1, Math.max(0, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
        const distance = Math.hypot(x - ax - t * dx, y - ay - t * dy);
        const coverage = Math.max(0, Math.min(1, 2.1 - distance));
        light = Math.max(light, 40 + coverage * (intensity - 40));
      }
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const i = (y * width + x) * 4;
      const value = light + noise * (seed / 2 ** 32 - 0.5);
      data[i] = data[i + 1] = data[i + 2] = value;
      data[i + 3] = 255;
    }
  }
  return { data, width, height };
}

function expectSegment(line, [ax, ay, bx, by]) {
  assert.ok(line, 'A real segment should be detected');
  const distance = (point, x, y) => Math.hypot(point.x * width - x, point.y * height - y);
  const forward = Math.max(distance(line.a, ax, ay), distance(line.b, bx, by));
  const reverse = Math.max(distance(line.b, ax, ay), distance(line.a, bx, by));
  assert.ok(Math.min(forward, reverse) < 5.5, JSON.stringify(line));
}

test('a blank image, noise and isolated short edges do not start a route', () => {
  assert.equal(longestLine(frame()), null);
  assert.equal(longestLine(frame([], 80)), null);
  assert.equal(
    longestLine(
      frame([
        [12, 20, 30, 20],
        [80, 38, 96, 46],
      ])
    ),
    null
  );
});

test('the longest visible segment wins over a brighter, shorter edge', () => {
  const long = [14, 92, 174, 92, 110];
  const detected = longestLine(frame([long, [111, 17, 111, 67, 255]], 8));
  expectSegment(detected, long);
  assert.ok(Math.abs(detected.a.y - detected.b.y) * height < 1);
});

test('a diagonal retains its finite endpoints', () => {
  const long = [22, 106, 169, 29];
  expectSegment(longestLine(frame([long, [36, 32, 79, 32]], 7)), long);
});

test('slopes between voting angles retain the length of the real edge', () => {
  for (const degrees of [8.3, 18.8, 31.1, 55.7, 79.3, 93.9, 137.6]) {
    const a = (degrees * Math.PI) / 180;
    const dx = 60 * Math.cos(a),
      dy = 60 * Math.sin(a);
    const segment = [96 - dx, 69 - dy, 96 + dx, 69 + dy];
    expectSegment(longestLine(frame([segment], 5)), segment);
  }
});

test('separated collinear fragments do not outvote a continuous vertical edge', () => {
  const long = [139, 16, 139, 122];
  expectSegment(longestLine(frame([[12, 44, 78, 44], [95, 44, 171, 44], long])), long);
});

test('tracking accepts a tilted edge and swapped endpoints, and rejects unrelated edges', () => {
  const first = { a: { x: 0.1, y: 0.5 }, b: { x: 0.9, y: 0.5 } };
  assert.ok(sameLine(first, { a: { x: 0.89, y: 0.51 }, b: { x: 0.11, y: 0.49 } }, width, height));
  assert.ok(sameLine(first, { a: { x: 0.1, y: 0.18 }, b: { x: 0.9, y: 0.82 } }, width, height));
  for (const next of [
    { a: { x: 0.1, y: 0.73 }, b: { x: 0.9, y: 0.73 } },
    { a: { x: 0.48, y: 0.1 }, b: { x: 0.52, y: 0.9 } },
    { a: { x: 0.2, y: 0.5 }, b: { x: 0.4, y: 0.5 } },
  ])
    assert.equal(sameLine(first, next, width, height), false);
});

test('separate floor seams locate a vanishing point in the visible frame', () => {
  const image = frame([
    [76, 42, 13, 131],
    [107, 45, 181, 131],
    [90, 54, 84, 129],
    [10, 104, 183, 104],
  ]);
  const lines = visibleLines(image);
  assert.ok(lines.length >= 3);
  const floor = readFloor(lines, width, height);
  assert.equal(floor.kind, 'convergence');
  assert.ok(Math.hypot(floor.vanish.x - 90, floor.vanish.y - 22) < 13, JSON.stringify(floor));
  assert.equal(readFloor([], width, height), null);
  assert.equal(readFloor(visibleLines(frame([[15, 74, 178, 74]])), width, height).kind, 'edge');
});

function texturedImage() {
  const w = 128,
    h = 96,
    gray = new Uint8Array(w * h);
  let seed = 42;
  gray.fill(44);
  for (let n = 0; n < 200; n++) {
    const next = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2 ** 32;
    };
    const x = Math.floor(next() * (w - 8)),
      y = Math.floor(next() * (h - 7)),
      shade = Math.round(55 + 190 * next());
    for (let j = 0; j < 5; j++) for (let i = 0; i < 7; i++) gray[(y + j) * w + x + i] = shade;
  }
  return { width: w, height: h, gray };
}
function resample(frame, angle, scale, dx, dy) {
  const { width: w, height: h, gray } = frame,
    result = new Uint8Array(w * h).fill(44);
  const a = Math.cos(angle) / scale,
    b = Math.sin(angle) / scale;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const u = x - w / 2 - dx,
        v = y - h / 2 - dy,
        px = a * u + b * v + w / 2,
        py = -b * u + a * v + h / 2;
      const i = Math.floor(px),
        j = Math.floor(py);
      if (i < 0 || j < 0 || i + 1 >= w || j + 1 >= h) continue;
      const fx = px - i,
        fy = py - j;
      result[y * w + x] =
        (1 - fy) * ((1 - fx) * gray[j * w + i] + fx * gray[j * w + i + 1]) +
        fy * ((1 - fx) * gray[(j + 1) * w + i] + fx * gray[(j + 1) * w + i + 1]);
    }
  return { width: w, height: h, gray: result };
}
const floorFixture = () => ({
  kind: 'convergence',
  near: { x: 240, y: 700 },
  vanish: { x: 150, y: 220 },
  spread: 240,
  angle: 0,
});
test('panning either way, rolling and zooming the same floor move the sign before its own next step', () => {
  const frame = texturedImage();
  for (const [dx, dy, angle, scale] of [
    [5, -3, 0, 1],
    [17, -12, 0, 1],
    [-6, 4, 0, 1],
    [0, 0, 0.08, 1],
    [0, 0, -0.075, 1],
    [0, 0, 0, 1.075],
    [0, 0, 0, 0.93],
  ]) {
    const flow = cameraMotion(frame, resample(frame, angle, scale, dx, dy));
    assert.ok(flow, JSON.stringify([dx, dy, angle, scale]));
    assert.ok(
      Math.abs(flow.dx * frame.width - dx) < 1 && Math.abs(flow.dy * frame.height - dy) < 1,
      JSON.stringify(flow)
    );
    assert.ok(Math.abs(Math.atan2(flow.b, flow.a) - angle) < 0.023);
    assert.ok(Math.abs(Math.hypot(flow.a, flow.b) - scale) < 0.024);
    const sign = new SignMotion(floorFixture(), 400, 800),
      oldRadius = sign.radius;
    const expected = carryPoint(
      sign.x,
      sign.y,
      {
        a: scale * Math.cos(angle),
        b: scale * Math.sin(angle),
        dx: dx / frame.width,
        dy: dy / frame.height,
      },
      400,
      800
    );
    sign.carry(flow);
    assert.ok(Math.hypot(sign.x - expected.x, sign.y - expected.y) < 6);
    assert.ok(Math.abs(sign.radius / oldRadius - scale) < 0.024);
  }
});
test('a static frame gives identity, and a uniform frame supplies no camera motion', () => {
  const im = texturedImage();
  assert.deepEqual(cameraMotion(im, im), { a: 1, b: 0, dx: 0, dy: 0 });
  const flat = { ...im, gray: new Uint8Array(im.gray.length).fill(82) };
  assert.equal(cameraMotion(flat, flat), null);
});
test('forward and return travel share a perspective projection and keep reversing on the floor', () => {
  const sign = new SignMotion(floorFixture(), 400, 800);
  let near = 0,
    far = Infinity,
    nearY = 0,
    farY = 800,
    turns = 0;
  for (let i = 0; i < 2400; i++) {
    if (sign.advance(1 / 60)) turns++;
    if (sign.depth < 1.03) {
      near = Math.max(near, sign.radius);
      nearY = Math.max(nearY, sign.y);
    }
    if (sign.depth > 3.11) {
      far = Math.min(far, sign.radius);
      farY = Math.min(farY, sign.y);
    }
    assert.ok(sign.x - sign.radius >= 0 && sign.y <= 800);
  }
  assert.ok(turns >= 8 && near / far > 2.7 && nearY - farY > 200);
});

test('sampling and local distortions share the same object-fit cover crop', () => {
  assert.deepEqual(visibleCrop(640, 480, 240, 480), { x: 200, y: 0, w: 240, h: 480 });
  assert.deepEqual(visibleCrop(480, 640, 480, 240), { x: 0, y: 200, w: 480, h: 240 });
});

test('a sudden camera displacement drives the visible sign over consecutive frames', () => {
  const route = new SignMotion(floorFixture(), 400, 800),
    sign = new RollingSign(route);
  const start = sign.x;
  route.x += 120;
  for (let frame = 0; frame < 60; frame++) {
    const before = sign.x;
    sign.advance(route, 1 / 60);
    assert.ok(sign.x > before && sign.x - before < 5.1);
    if (frame === 0) assert.ok(sign.x - start < 2);
  }
  assert.ok(sign.x - start > 112);
});

test('a held camera roll lets the board settle down the corresponding side', () => {
  const view = { width: 400, height: 800, left: 14, right: 14, top: 14, bottom: 68 };
  const board = new ShowBoard();
  board.fit(view, { width: 280, height: 120 });
  for (let i = 0; i < 240; i++) board.advance(view, 1 / 60, i / 60, true);
  const centered = { x: board.x, y: board.y };
  for (const angle of [-0.3, 0.6]) {
    board.carry({ a: Math.cos(angle), b: Math.sin(angle), dx: 0 });
    for (let i = 0; i < 240; i++) board.advance(view, 1 / 60, i / 60, true);
    assert.ok((board.x - centered.x) * (angle < 0 ? 1 : -1) > 30);
    assert.ok(board.y > centered.y + 120);
    const half =
      (board.width * Math.abs(Math.cos(board.angle)) + board.height * Math.abs(Math.sin(board.angle))) /
      2;
    assert.ok(board.x - half >= view.left - 0.01 && board.x + half <= view.width - view.right + 0.01);
  }
});

test('the visible rotated face rejects a miss and transfers momentum on contact', () => {
  const board = Object.assign(new ShowBoard(), { x: 180, y: 275, width: 170, height: 76, angle: 0.21 });
  const r = 21,
    nx = -Math.sin(board.angle),
    ny = Math.cos(board.angle);
  const distance = board.height / 2 + r * 1.04;
  const sign = {
    x: board.x + nx * (distance + 2),
    y: board.y + ny * (distance + 2) + r,
    radius: r,
    vx: -nx * 100,
    vy: -ny * 100,
  };
  assert.equal(collide(sign, board, 1000), null);
  sign.x -= nx * 4;
  sign.y -= ny * 4;
  const hit = collide(sign, board, 1020);
  assert.ok(hit && Math.abs(hit.nx - nx) < 0.001 && Math.abs(hit.ny - ny) < 0.001);
  assert.ok(sign.vx * nx + sign.vy * ny > 0 && board.vx * nx + board.vy * ny < 0);
  assert.equal(collide(sign, board, 1030), null);
});

test('both cities appear within the clip and Posadas stays after the download becomes available', () => {
  assert.equal(cueAt(0), -1);
  assert.equal(announcements[cueAt(9999)].city, 'Puerto Iguazú');
  for (const ms of [10000, 19999, 20000, 60000]) assert.equal(announcements[cueAt(ms)].city, 'Posadas');
});
