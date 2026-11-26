import assert from 'node:assert/strict';
import test from 'node:test';
import { longestLine, sameLine, visibleLines } from '../public/847/primera-voluntad/line-detector.mjs';

import { readFloor, SignMotion } from '../public/847/primera-voluntad/motion.mjs';
import { visibleCrop } from '../public/847/primera-voluntad/scene.mjs';
import { musicLoop, arrangeScore } from '../public/847/primera-voluntad/footsteps.mjs';
import { clipLength, clipName } from '../public/847/primera-voluntad/timing.mjs';

import { cameraMotion, carryPoint } from '../public/847/primera-voluntad/camera-motion.mjs';

import {
  RollingSign,
  ShowBoard,
  collide,
  screenGravity,
} from '../public/847/primera-voluntad/stage-physics.mjs';
import { prizeGoal, inPrizeGoal } from '../public/847/primera-voluntad/prize-goal.mjs';
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

test('optical roll works without a sensor and does not oscillate while held', () => {
  const board = plate();
  board.carry({ a: Math.cos(-0.45), b: Math.sin(-0.45), dx: 0, dy: 0 });
  settle(board, 2);
  assert.ok(board.x > 267 && board.y > 460);
  board.carry({ a: Math.cos(0.9), b: Math.sin(0.9), dx: 0, dy: 0 });
  settle(board, 4);
  assert.ok(board.x < 143);
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
  assert.ok(sign.vx * nx + sign.vy * ny > 0 && board.vx * nx + board.vy * ny < 0);
  assert.equal(collide(sign, board, 1030), null);
});

test('both cities appear within the clip and Posadas stays after the download becomes available', () => {
  for (const ms of [0, 999]) assert.equal(cueAt(ms), -1);
  for (const ms of [1000, 7999]) {
    assert.equal(
      announcements[cueAt(ms)].text,
      'El 2 de diciembre nos vemos en la Cabaña de los Muñecos'
    );
  }
  for (const ms of [8000, 14999, 15000, 60000]) {
    assert.equal(
      announcements[cueAt(ms)].text,
      'El 12 de diciembre nos vemos en Silicon Misiones, en Posadas'
    );
  }
});

test('the score spans both invitations, loops across the original end and resolves at 15 seconds', () => {
  const ctx = {
    createBuffer(channels, length, sampleRate) {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { numberOfChannels: channels, length, sampleRate, getChannelData: (i) => data[i] };
    },
  };
  const source = ctx.createBuffer(2, 13240, 1000);
  source.getChannelData(0).fill(0.32);
  source.getChannelData(1).fill(-0.18);
  const loop = musicLoop(ctx, source);
  const score = arrangeScore(ctx, loop, clipLength);
  assert.ok(loop.length < source.length && loop.getChannelData(0).at(-1) === loop.getChannelData(0)[0]);
  assert.equal(score.length, 15000);
  assert.equal(clipName(clipLength, 'webm'), 'primera-voluntad-15s.webm');
  for (let ch = 0; ch < 2; ch++) {
    const pcm = score.getChannelData(ch);
    for (const i of [0, 14999]) assert.ok(Math.abs(pcm[i]) < 1e-6);
    for (const i of [200, 7999, 13184, 13185, 14000, 14800])
      assert.equal(pcm[i], source.getChannelData(ch)[0]);
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
    assert.ok(board[pos] - initial > (vertical ? 12 : 7));
    const at = board[pos];
    board.carry(reverse, 140);
    board.advance(portrait, 1 / 60, false);
    assert.ok(board[pos] < at);
    const flash = cameraMotion(start, stripe(vertical, 0, 18));
    assert.ok(!flash || (Math.abs(flash.dx) + Math.abs(flash.dy) < 0.001));
  }
});

test('the plate stays at the top at rest and wins only inside the drawn goal', () => {
  for (const view of [portrait, {width: 740, height: 360, left: 16, right: 16, top: 12, bottom: 68}]) {
    const board = new ShowBoard();
    board.fit(view, {width: 200, height: 100});
    const goal = prizeGoal(view, board), start = board.y;
    settle(board, 20, view);
    assert.equal(board.y, start);
    assert.equal(inPrizeGoal(board, goal), false);
    board.y = view.height - view.bottom - board.height / 2;
    assert.ok(inPrizeGoal(board, goal));
    board.x = goal.x;
    assert.equal(inPrizeGoal(board, goal), false);
  }
});
