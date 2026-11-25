import assert from 'node:assert/strict';
import test from 'node:test';
import { longestLine, sameLine } from '../public/847/primera-voluntad/line-detector.mjs';

import { SignMotion } from '../public/847/primera-voluntad/motion.mjs';
import { visibleCrop } from '../public/847/primera-voluntad/scene.mjs';

const width = 192, height = 138;

function frame(segments = [], noise = 0) {
  const data = new Uint8ClampedArray(width * height * 4);
  let seed = 73;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let light = 40;
      for (const [ax, ay, bx, by, intensity = 195] of segments) {
        const dx = bx - ax, dy = by - ay;
        const t = Math.min(1, Math.max(0, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
        const distance = Math.hypot(x - ax - t * dx, y - ay - t * dy);
        const coverage = Math.max(0, Math.min(1, 2.1 - distance));
        light = Math.max(light, 40 + coverage * (intensity - 40));
      }
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const i = (y * width + x) * 4;
      const value = light + noise * (seed / 2**32 - .5);
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
  assert.equal(longestLine(frame([[12, 20, 30, 20], [80, 38, 96, 46]])), null);
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
    const a = degrees * Math.PI / 180;
    const dx = 60 * Math.cos(a), dy = 60 * Math.sin(a);
    const segment = [96 - dx, 69 - dy, 96 + dx, 69 + dy];
    expectSegment(longestLine(frame([segment], 5)), segment);
  }
});

test('separated collinear fragments do not outvote a continuous vertical edge', () => {
  const long = [139, 16, 139, 122];
  expectSegment(longestLine(frame([[12, 44, 78, 44], [95, 44, 171, 44], long])), long);
});

test('tracking accepts a tilted edge and swapped endpoints, and rejects unrelated edges', () => {
  const first = { a: {x:.1, y:.5}, b: {x:.9, y:.5} };
  assert.ok(sameLine(first, {a:{x:.89,y:.51}, b:{x:.11,y:.49}}, width, height));
  assert.ok(sameLine(first, {a:{x:.1,y:.18}, b:{x:.9,y:.82}}, width, height));
  for (const next of [
    {a:{x:.1,y:.73}, b:{x:.9,y:.73}},
    {a:{x:.48,y:.1}, b:{x:.52,y:.9}},
    {a:{x:.2,y:.5}, b:{x:.4,y:.5}},
  ]) assert.equal(sameLine(first, next, width, height), false);
});

test('the first accepted frame places the sign and reversed camera tilt reverses its roll', () => {
  const downRight = { a: {x:.09,y:.45}, b: {x:.91,y:.54} };
  const downLeft = { a: {x:.91,y:.42}, b: {x:.09,y:.57} };
  const sign = new SignMotion(downRight, 390, 844);
  assert.equal(sign.phase, 'roll');
  assert.equal(sign.fraction, .5);
  for (let i = 0; i < 12; i++) sign.advance(1/60);
  assert.ok(sign.fraction > .5);
  sign.observe(downLeft);
  for (let i = 0; i < 20; i++) sign.advance(1/60);
  const x = sign.x;
  for (let i = 0; i < 9; i++) sign.advance(1/60);
  assert.ok(sign.x < x - 8);
  assert.ok(sign.guide.ty < 0);
  assert.equal(sign.phase, 'roll');
});

test('the endpoint launches a tumbling sign, with bounded rebounds on both axes', () => {
  const sign = new SignMotion({a:{x:.04,y:.45}, b:{x:.96,y:.63}}, 390, 844);
  let hits = 0, launch = null, wallX = false, wallY = false;
  for (let frame = 0; frame < 340; frame++) {
    const phase = sign.phase, vx = sign.vx, vy = sign.vy;
    const hit = sign.advance(1/60);
    if (phase === 'roll' && sign.phase === 'flight') {
      assert.ok(hit);
      assert.equal(sign.fraction, 1);
      assert.ok(sign.vx < 0 && sign.vy < 0);
      launch = frame;
    } else if (sign.phase === 'flight') {
      assert.ok(sign.x >= sign.radius && sign.x <= 390 - sign.radius);
      assert.ok(sign.y >= sign.radius && sign.y <= 844 - sign.radius);
      if (hit) {
        hits++;
        wallX ||= vx * sign.vx < 0;
        wallY ||= vy * sign.vy < 0;
      }
    }
  }
  assert.ok(launch > 0 && launch < 90);
  assert.ok(hits >= 3 && wallX && wallY);
  assert.ok(sign.tumble > 6);
});

test('sampling and local distortions share the same object-fit cover crop', () => {
  assert.deepEqual(visibleCrop(640, 480, 240, 480), {x:200, y:0, w:240, h:480});
  assert.deepEqual(visibleCrop(480, 640, 480, 240), {x:0, y:200, w:480, h:240});
});
