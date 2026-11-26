import assert from 'node:assert/strict';
import test from 'node:test';
import { longestLine, sameLine, visibleLines } from '../public/847/primera-voluntad/line-detector.mjs';

import { readFloor, SignMotion } from '../public/847/primera-voluntad/motion.mjs';
import { visibleCrop } from '../public/847/primera-voluntad/scene.mjs';
import { arrangeScore } from '../public/847/primera-voluntad/footsteps.mjs';
import { clipLength, clipName } from '../public/847/primera-voluntad/timing.mjs';

import { cameraMotion, carryPoint } from '../public/847/primera-voluntad/camera-motion.mjs';

import {
  RollingSign,
  ShowBoard,
  collide,
  screenGravity,
  tiltFromRest,
} from '../public/847/primera-voluntad/stage-physics.mjs';
import { touchesTray, settlePrize } from '../public/847/primera-voluntad/prize-goal.mjs';
import { announcements, cueAt } from '../public/847/primera-voluntad/show-board.mjs';

import { metalAt } from '../public/847/primera-voluntad/solid-sign.mjs';

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
  paths: [{ a: { x: 240, y: 700 }, b: { x: 150, y: 220 } }],
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

const portrait = { width: 400, height: 800, left: 14, right: 14, top: 14, bottom: 68 };
function plate(view = portrait) {
  const board = new ShowBoard();
  board.fit(view, { width: 200, height: 100 });
  board.x = view.width / 2;
  board.y = view.height / 2;
  return board;
}
function settle(board, seconds, view = portrait, hz = 60) {
  for (let i = 0; i < Math.round(seconds * hz); i++) board.advance(view, 1 / hz, false);
}

test('the board follows phone pans in both directions and stays still on a steady neutral frame', () => {
  const board = plate();
  board.gravity = { x: 0, y: 0 };
  const x = board.x;
  board.carry({ a: 1, b: 0, dx: -0.09, dy: 0 });
  settle(board, 1);
  assert.ok(board.x > x + 43 && board.x < x + 47);
  board.carry({ a: 1, b: 0, dx: 0.18, dy: 0 });
  settle(board, 1);
  assert.ok(board.x < x - 21);
  settle(board, 2);
  const rest = board.x;
  settle(board, 2);
  assert.ok(Math.abs(board.x - rest) < 0.02);
});

test('gravity follows the physical low edge in portrait, both landscape orientations and upside down', () => {
  const down = screenGravity(90, 0, 0),
    up = screenGravity(-90, 0, 0);
  assert.ok(down.y > 0.99 && up.y < -0.99);
  assert.ok(screenGravity(0, -80, 90).y > 0.98 && screenGravity(0, 80, 270).y > 0.98);
  assert.ok(screenGravity(90, 0, 180).y < -0.99);
  assert.ok(screenGravity(0, 0, 0).y > 0 && screenGravity(180, 0, 0).y < 0);
  assert.equal(screenGravity(null, 0, 0), null);
  for (const sign of [1, -1]) {
    const board = plate();
    board.gravity = screenGravity(38, sign * 42, 0);
    settle(board, 1.25);
    assert.ok((board.x - 200) * sign > 40 && board.y > 420);
    board.gravity = up;
    settle(board, 2);
    assert.ok(board.y < 374);
  }
  const slow = plate(),
    fast = plate();
  slow.gravity = fast.gravity = { x: 0.27, y: -0.42 };
  settle(slow, 1.6, portrait, 30);
  settle(fast, 1.6, portrait, 120);
  assert.ok(Math.hypot(slow.x - fast.x, slow.y - fast.y) < 2);
});

test('slow finger movement accumulates for the last few pixels of a demo landing', () => {
  const board = plate(), start = board.y;
  for (let i = 0; i < 25; i++) {
    board.steer(0, 0.25 / (portrait.height * 1.95));
    board.advance(portrait, 1 / 60, false);
  }
  settle(board, 0.4);
  assert.ok(board.y > start + 6 && board.y <= start + 6.25);
});

test('a sideways reframe cannot drop a stationary plate and a level phone stops descending', () => {
  const board = plate(), start = board.y;
  board.carry({ a: Math.cos(0.2), b: Math.sin(0.2), dx: -0.05, dy: 0 });
  settle(board, 3);
  assert.equal(board.y, start);
  board.carry({ a: 1, b: 0, dx: 0, dy: -0.02 });
  settle(board, 0.6);
  const rest = board.y;
  settle(board, 5);
  assert.ok(rest > start + 15 && Math.abs(board.y - rest) < 0.01);
  board.gravity = { x: 0, y: 0.6 };
  settle(board, 0.4);
  const tilted = board.y;
  board.gravity.y = 0;
  board.carry({ a: 1, b: 0, dx: 0, dy: -0.15 });
  settle(board, 4);
  assert.ok(tilted > rest + 40 && Math.abs(board.y - tilted) < 0.02);
});

test('a horizontal or sloping edge carries the foot along the actual detected segment', () => {
  for (const [a, b] of [
    [
      { x: 0.08, y: 0.66 },
      { x: 0.88, y: 0.66 },
    ],
    [
      { x: 0.82, y: 0.85 },
      { x: 0.32, y: 0.24 },
    ],
  ]) {
    const floor = readFloor([{ a, b }], 400, 800);
    const route = new SignMotion(floor, 400, 800);
    const wheel = new RollingSign(route);
    const dx = (b.x - a.x) * 400,
      dy = (b.y - a.y) * 800;
    const start = wheel.x;
    let travel = 0;
    for (let i = 0; i < 660; i++) {
      route.advance(1 / 90);
      wheel.advance(route, 1 / 90);
      const off = Math.abs((wheel.x - a.x * 400) * dy - (wheel.y - a.y * 800) * dx) / Math.hypot(dx, dy);
      assert.ok(off < 0.2);
      travel = Math.max(travel, Math.abs(wheel.x - start));
    }
    assert.ok(travel > 82);
  }
});

test('a single flicker cannot replace a line; a confirmed neighbour gets a continuous hop', () => {
  const first = { a: { x: 0.1, y: 0.7 }, b: { x: 0.85, y: 0.7 } };
  const next = { a: { x: 0.72, y: 0.37 }, b: { x: 0.74, y: 0.8 } };
  const floor = (lines) => readFloor(lines, 400, 800);
  const route = new SignMotion(floor([first]), 400, 800);
  const old = { x: route.x, y: route.y };
  assert.equal(route.observe(floor([next]), 115), false);
  assert.equal(route.observe(floor([first]), 250), true);
  assert.equal(route.hop, null);
  route.observe(floor([next]), 410);
  assert.equal(route.observe(floor([next]), 615), true);
  route.advance(0);
  assert.ok(Math.hypot(route.x - old.x, route.y - old.y) < 0.01);
  let lift = 0;
  for (let i = 0; i < 150; i++) {
    route.advance(1 / 90);
    lift = Math.max(lift, route.lift);
  }
  assert.ok(lift > 5 && route.hop === null && route.lift === 0);
  assert.ok(Math.abs(route.x - 292) < 5);
});

test('the wheel can change rails at a measured junction even when both edges remain visible', () => {
  const h = { a: { x: 0.1, y: 0.6 }, b: { x: 0.87, y: 0.6 } };
  const v = { a: { x: 0.84, y: 0.25 }, b: { x: 0.84, y: 0.77 } };
  const floor = readFloor([h, v], 400, 800);
  const route = new SignMotion(floor, 400, 800);
  let switched = false;
  for (let i = 0; i < 600; i++) {
    if (i % 12 === 0) route.observe(floor, (i * 1000) / 90);
    route.advance(1 / 90);
    if (route.hop) switched = true;
  }
  assert.ok(switched);
});

test('the same color cycle includes ivory and graphite with fully neutral highlights', () => {
  assert.equal(metalAt(3100).ivory, 1);
  assert.equal(metalAt(9000).graphite, 1);
  assert.equal(metalAt(6200).ivory + metalAt(6200).graphite, 0);
  assert.equal(metalAt(17100).ivory, 1);
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
  assert.ok(board.allowsFootstep(1019));
  const hit = collide(sign, board, 1020);
  assert.equal(board.allowsFootstep(1020), false);
  assert.equal(board.allowsFootstep(1100), false);
  assert.ok(board.allowsFootstep(1300));
  assert.ok(hit && Math.abs(hit.nx - nx) < 0.001 && Math.abs(hit.ny - ny) < 0.001);
  assert.ok(board.vx * nx + board.vy * ny < -40);
  assert.ok((sign.vx - board.vx) * nx + (sign.vy - board.vy) * ny > 0);
  assert.equal(collide(sign, board, 1030), null);
});

test('a level head-on strike is braced harder than a lateral shove', () => {
  function strike(sideways) {
    const plate = Object.assign(new ShowBoard(), { x: 150, y: 210, width: 200, height: 78, vy: 150, vx: sideways, driveX: sideways });
    const wheel = { x: 150, y: 289, radius: 20, vx: 0, vy: 0, sinceCounter: 0.36 };
    assert.ok(collide(wheel, plate, 1000));
    return plate.vy;
  }
  assert.ok(strike(0) < -160);
  assert.ok(strike(85) < -160); // a slight sideways drift is still a head-on descent
  assert.ok(strike(128) > 65);
});

test('the defender lunges from the rail into a descending plate and returns when it withdraws', () => {
  const rail = { a: { x: 40, y: 430 }, b: { x: 360, y: 430 } };
  const route = { ...new SignMotion(floorFixture(), 400, 800), path: rail, x: 215, y: 430,
    radius: 28, lift: 0 };
  const sign = new RollingSign(route);
  const board = plate();
  board.x = 168;
  board.y = 307;
  for (let n = 0; n < 90; n++) sign.advance(route, 1 / 90, board);
  assert.equal(sign.lift, 0);
  assert.equal(sign.x, route.x);
  board.vy = 80;
  let height = 0, left = sign.x, hit = null;
  for (let n = 0; n < 70; n++) {
    sign.advance(route, 1 / 90, board);
    height = Math.max(height, sign.lift);
    left = Math.min(left, sign.x);
    assert.ok(sign.x > rail.a.x && sign.x < rail.b.x);
    hit = hit || collide(sign, board, n * 1000 / 90);
  }
  assert.ok(hit && board.rebounding && board.vy < -145);
  assert.ok(height > 41 && left < route.x - 10);
  board.vy = -45;
  for (let n = 0; n < 70; n++) sign.advance(route, 1 / 90, board);
  assert.ok(sign.lift < 0.1 && Math.abs(sign.x - route.x) < 4);
});

test('the city on the solid changes every six seconds, including after the clip', () => {
  assert.equal(clipLength, 15000);
  for (const ms of [0, 999]) assert.equal(cueAt(ms), -1);
  for (const ms of [1000, 6999, 13000, 14999, 15000, 18999, 25000])
    assert.deepEqual(announcements[cueAt(ms)], { city: 'Puerto Iguazú',
      text: 'El 2 de diciembre nos vemos en la Cabaña de los Muñecos, en Puerto Iguazú' });
  for (const ms of [7000, 12999, 19000, 24999, 60000])
    assert.deepEqual(announcements[cueAt(ms)], { city: 'Posadas',
      text: 'El 12 de diciembre nos vemos en Silicon Misiones, en Posadas' });
});

test('the export plays the first 15 continuous seconds and fades at the end', () => {
  const ctx = {
    createBuffer(channels, length, sampleRate) {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { numberOfChannels: channels, length, sampleRate, getChannelData: (i) => data[i] };
    },
  };
  const source = ctx.createBuffer(2, 15250, 1000);
  for (let i = 0; i < source.length; i++) {
    source.getChannelData(0)[i] = i / source.length;
    source.getChannelData(1)[i] = -i / source.length;
  }
  const score = arrangeScore(ctx, source, clipLength);
  assert.equal(score.length, 15000);
  assert.equal(clipName(clipLength, 'webm'), 'primera-voluntad-15s.webm');
  for (let ch = 0; ch < 2; ch++) {
    const pcm = score.getChannelData(ch);
    for (const i of [0, 14999]) assert.ok(Math.abs(pcm[i]) < 1e-6);
    for (const i of [200, 7999, 13184, 13185, 14000, 14800])
      assert.equal(pcm[i], source.getChannelData(ch)[i]);
  }
});

test('a stripe alone steers promptly in either axis, reversing in the next picture', () => {
  function stripe(vertical, offset, lighting = 0) {
    const width = 108, height = 192, gray = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const p = (vertical ? y : x) - offset;
      gray[y * width + x] = (p > 36 && p < 46 ? 175 : p > 62 && p < 73 ? 112 : 30) + lighting;
    }
    return { width, height, gray };
  }
  for (const vertical of [true, false]) {
    const start = stripe(vertical, 0), next = stripe(vertical, -5, 12);
    const flow = cameraMotion(start, next), reverse = cameraMotion(next, start);
    const axis = vertical ? 'dy' : 'dx';
    assert.ok(Math.abs(flow[axis] * (vertical ? 192 : 108) + 5) < 0.1);
    assert.ok(Math.abs(reverse[axis] + flow[axis]) < 0.001);
    const board = plate(), pos = vertical ? 'y' : 'x', initial = board[pos];
    board.carry(flow, 100);
    board.advance(portrait, 1 / 60, false);
    assert.ok(board[pos] - initial > (vertical ? 9 : 7));
    const at = board[pos];
    board.carry(reverse, 140);
    board.advance(portrait, 1 / 60, false);
    assert.ok(board[pos] < at);
    const flash = cameraMotion(start, stripe(vertical, 0, 18));
    assert.ok(!flash || (Math.abs(flash.dx) + Math.abs(flash.dy) < 0.001));
  }
});

test('the first tray contact catches even a fast, tilted or off-centre plate without bouncing', () => {
  for (const [width, height] of [[320, 568], [390, 664], [760, 360]]) {
    const view = { ...portrait, width, height, bottom: 86 };
    const board = new ShowBoard();
    board.fit(view, { width: (width - 28) * (width < height ? 0.88 : 0.66), height: 100 });
    const goal = { x: width / 2, width: board.width, lipHeight: 11, bottom: height - view.bottom };
    assert.equal(touchesTray(board, goal), false);
    board.gravity = { x: -0.6, y: 1 };
    let caught = false;
    for (let n = 0; n < 600 && !caught; n++) {
      board.advance(view, 1 / 90, false);
      caught = touchesTray(board, goal);
    }
    assert.ok(caught && !board.rebounding);
    assert.ok(Math.abs(board.x - goal.x) > 8 && Math.abs(board.angle) > 0.045);
    const entry = { angle: board.angle, offsetX: board.x - goal.x,
      offsetY: board.y - (goal.bottom - board.height / 2), progress: 0 };
    for (let n = 0; n < 22; n++) {
      const y = board.y;
      settlePrize(board, goal, entry, 1 / 90);
      assert.ok(board.y >= y - 1e-6 && !board.rebounding);
    }
    assert.equal(entry.progress, 1);
    assert.equal(board.x, goal.x);
    assert.equal(board.y + board.height / 2, goal.bottom);
  }
});

test('the space beside the tray is playable and the first post can catch a plate sliding in', () => {
  const board = plate();
  const goal = { x: 200, width: board.width, lipHeight: 11, bottom: 700 };
  board.y = goal.bottom - board.height / 2;
  board.x = 405;
  assert.equal(touchesTray(board, goal), false);
  board.x = 399;
  assert.equal(touchesTray(board, goal), true);
  board.y -= 13;
  assert.equal(touchesTray(board, goal), false);
});

test('a tilted corner can enter the opening before the face actually touches a post or the base', () => {
  const board = plate();
  const goal = { x: board.x, width: board.width, bottom: portrait.height - portrait.bottom, lipHeight: 11 };
  board.x -= 12;
  board.angle = 0.11;
  const lowerCorner = (Math.cos(board.angle) * board.height + Math.sin(board.angle) * board.width) / 2;
  board.y = goal.bottom - 5 - lowerCorner;
  assert.equal(touchesTray(board, goal), false);
  board.y += 5;
  assert.equal(touchesTray(board, goal), true);
});

test('a plate on its side or upside down is caught by the first visible contact', () => {
  const board = plate();
  const goal = { x: board.x, width: board.width, bottom: 700, lipHeight: 11 };
  for (const angle of [Math.PI / 2, -Math.PI / 2, Math.PI]) {
    board.angle = angle;
    const reach = (board.width * Math.abs(Math.sin(angle)) + board.height * Math.abs(Math.cos(angle))) / 2;
    board.y = goal.bottom - goal.lipHeight - reach - 2;
    assert.equal(touchesTray(board, goal), false);
    board.y = goal.bottom - reach;
    assert.equal(touchesTray(board, goal), true);
  }
});

test('waiting for the small wheel or making a large downward swipe cannot force a straight crossing', () => {
  const w = 390, h = 708, dt = 1 / 90;
  const view = { ...portrait, width: w, height: h, left: 12, right: 15, top: 12, bottom: 87 };
  for (const optical of [false, true]) {
    const rail = { a: { x: 0.08, y: 0.86 }, b: { x: 0.89, y: 0.34 } };
    const route = new SignMotion(readFloor([rail], w, h), w, h);
    const wheel = new RollingSign(route), board = new ShowBoard();
    board.fit(view, { width: (w - 27) * 0.88, height: 128 });
    const goal = { x: (w + view.left - view.right) / 2, bottom: h - view.bottom, width: board.width, lipHeight: 11 };
    let hits = 0, largestBlock = 0;
    function step(frame) {
      board.advance(view, dt, false);
      route.advance(dt);
      wheel.advance(route, dt, board);
      wheel.keepInPlay(view);
      const hit = collide(wheel, board, frame * dt * 1000);
      wheel.keepInPlay(view);
      if (hit) { hits++; route.rebound(hit); largestBlock = Math.max(largestBlock, wheel.radius); }
      board.confine(view);
      return touchesTray(board, goal);
    }
    for (let n = 0; n < 250; n++) step(n);
    assert.ok(wheel.radius < w * 0.071);
    board.gravity = { x: 0, y: optical ? 0 : 1 };
    for (let n = 250; n < 1100; n++) {
      if (optical && n % 13 === 0) board.steer(0, 0.16);
      assert.equal(step(n), false);
    }
    assert.ok(hits >= 2 && largestBlock > w * 0.115);
    let landed = false;
    for (let n = 1100; n < 4700 && !landed; n++) {
      board.gravity = { x: Math.sign(Math.sin((n - 1100) * dt * 7)) * 0.98, y: 0.65 };
      landed = step(n);
    }
    assert.ok(landed);
  }
});

test('tilting from an upright start responds in both directions and follows screen rotation', () => {
  const rest = { beta: 82, gamma: 0 };
  const tilt = beta => tiltFromRest(rest, { beta, gamma: 0 });
  assert.equal(Math.abs(tilt(82.6).y), 0);
  assert.ok(tilt(92).y > 0.44 && tilt(72).y < -0.44);
  const board = plate(), start = board.y;
  board.gravity = tilt(92);
  board.carry({ a: 1, b: 0, dx: 0, dy: 0.05 });
  settle(board, 0.3);
  assert.ok(board.y > start + 24);
  const lower = board.y;
  board.gravity = tilt(72);
  settle(board, 0.45);
  assert.ok(board.y < lower - 17);
  for (const [angle, sign] of [[90, -1], [270, 1]]) {
    const g = tiltFromRest({ beta: 0, gamma: 12 }, { beta: 0, gamma: 24 }, angle);
    assert.ok(g.y * sign > 0.55 && Math.abs(g.x) < 0.005);
  }
  assert.ok(tiltFromRest({ beta: 0, gamma: 0 }, { beta: 180, gamma: 0 }).y < -0.4);
});

test('a new vertical edge entering a horizontally uniform scene cannot pull the plate sideways', () => {
  const width = 113, height = 192;
  const row = (y) => y > 58 && y < 71 ? 161 : y > 103 && y < 108 ? 218 : 48;
  const gray = Uint8Array.from({ length: width * height }, (_, i) => row(Math.floor(i / width)));
  const after = gray.map((v, i) => i % width > 29 && i % width < 36 ? 179 : v);
  const flow = cameraMotion({ width, height, gray }, { width, height, gray: after });
  assert.ok(!flow || Math.abs(flow.dx) < 0.001);
});
