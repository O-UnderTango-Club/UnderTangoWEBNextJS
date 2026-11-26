// Sparse block matching on the visible video crop. Look for corners across the
// frame and fit a single pan/roll/zoom to the points that moved together.
function landmarks({ gray, width: w, height: h }) {
  const points = [],
    cell = Math.max(12, Math.round(Math.max(w, h) / 9));
  for (let top = 5; top < h - 5; top += cell) {
    for (let left = 5; left < w - 5; left += cell) {
      let best = 0,
        point = null;
      for (let y = top; y < Math.min(top + cell, h - 4); y += 2) {
        for (let x = left; x < Math.min(left + cell, w - 4); x += 2) {
          let xx = 0,
            yy = 0,
            xy = 0;
          for (let j = -2; j <= 2; j += 2) {
            for (let k = -2; k <= 2; k += 2) {
              const i = (y + j) * w + x + k;
              const gx = gray[i + 1] - gray[i - 1],
                gy = gray[i + w] - gray[i - w];
              xx += gx * gx;
              yy += gy * gy;
              xy += gx * gy;
            }
          }
          const score = (xx * yy - xy * xy) / (xx + yy + 1);
          if (score > 290 && score > best) {
            best = score;
            point = { x, y, score };
          }
        }
      }
      if (point) points.push(point);
    }
  }
  return points.sort((a, b) => b.score - a.score).slice(0, 36);
}

function patchMatches(previous, current) {
  const { width: w, height: h, gray: a } = previous,
    b = current.gray;
  const pairs = [];
  for (const { x, y } of landmarks(previous)) {
    let best = Infinity,
      second = Infinity,
      bestX = 0,
      bestY = 0;
    const distance = (dx, dy) => {
      const u = x + dx,
        v = y + dy;
      if (u < 3 || v < 3 || u >= w - 3 || v >= h - 3) return Infinity;
      let error = 0,
        offset = 0;
      for (let j = -2; j <= 2; j++) {
        const p = (y + j) * w + x,
          q = (v + j) * w + u;
        for (let i = -2; i <= 2; i++) {
          const diff = a[p + i] - b[q + i];
          error += diff * diff;
          offset += diff;
        }
      }
      return (error - (0.85 * offset * offset) / 25) / 25 + 0.045 * (dx * dx + dy * dy);
    };
    // An integer search also recovers abrupt direction reversals. Searching
    // zero first makes a stationary high-contrast floor cost almost nothing.
    const still = distance(0, 0);
    if (still < 1) {
      pairs.push({ x, y, u: x, v: y });
      continue;
    }
    for (let dy = -10; dy <= 10; dy++)
      for (let dx = -10; dx <= 10; dx++) {
        const error = distance(dx, dy);
        if (error < best) {
          second = best;
          best = error;
          bestX = dx;
          bestY = dy;
        } else if (error < second) second = error;
      }
    if (best < 560 && (best < 32 || best < second * 0.92)) {
      const refine = (lo, hi) => {
        const curvature = lo + hi - 2 * best;
        return Number.isFinite(curvature) && curvature > 1
          ? Math.max(-0.5, Math.min(0.5, (lo - hi) / (2 * curvature)))
          : 0;
      };
      const u = x + bestX + refine(distance(bestX - 1, bestY), distance(bestX + 1, bestY));
      const v = y + bestY + refine(distance(bestX, bestY - 1), distance(bestX, bestY + 1));
      pairs.push({ x, y, u, v });
    }
  }
  return pairs;
}

// A wide, image-wide translation estimate recovers a fast pan or a floor with
// too few distinctive corners. Only accept it if it explains the changed pixels
// substantially better than a stationary frame and has a distinct optimum.
function widePan(previous, current) {
  const { width: w, height: h, gray: old } = previous,
    fresh = current.gray;
  const rx = Math.min(22, Math.floor(w * 0.19)),
    ry = Math.min(22, Math.floor(h * 0.19));
  const positions = [];
  for (let y = ry + 2; y < h - ry - 2; y += 3)
    for (let x = rx + 2; x < w - rx - 2; x += 3) {
      const i = y * w + x;
      if (Math.abs(old[i + 2] - old[i - 2]) + Math.abs(old[i + 2 * w] - old[i - 2 * w]) > 12)
        positions.push(i);
    }
  if (positions.length < 12) return null;
  const cost = (x, y) => {
    const delta = y * w + x;
    let sum = 0;
    for (const i of positions) sum += Math.min(60, Math.abs(old[i] - fresh[i + delta]));
    return sum / positions.length + 0.012 * (Math.abs(x) + Math.abs(y));
  };
  const still = cost(0, 0);
  if (still < 1.3) return null;
  let best = still,
    bx = 0,
    by = 0;
  // Record a separated runner-up; repetitive tiles alone must not cause a jump.
  const options = [];
  for (let y = -ry; y <= ry; y += 2)
    for (let x = -rx; x <= rx; x += 2) {
      const err = cost(x, y);
      options.push({ x, y, err });
      if (err < best) {
        best = err;
        bx = x;
        by = y;
      }
    }
  const cx = bx,
    cy = by;
  for (let y = cy - 1; y <= cy + 1; y++)
    for (let x = cx - 1; x <= cx + 1; x++) {
      const err = cost(x, y);
      if (err < best) {
        best = err;
        bx = x;
        by = y;
      }
    }
  let runner = Infinity;
  for (const e of options)
    if (Math.abs(e.x - bx) + Math.abs(e.y - by) > 4) runner = Math.min(runner, e.err);
  if (best >= still * 0.8 || best >= runner * 0.88 || best > 27) return null;
  return { a: 1, b: 0, dx: bx / w, dy: by / h };
}

// A wall or a single stair can move vertically without offering a corner to
// track. Compare signed brightness gradients across three strips on each axis.
function stripMotion(before, after, vertical) {
  const { width, height } = before;
  const length = vertical ? height : width, breadth = vertical ? width : height;
  const radius = Math.min(22, Math.floor(length * 0.18));
  if (radius < 2 || breadth < 9) return null;
  const votes = [];
  for (let strip = 0; strip < 3; strip++) {
    const old = new Float32Array(length), fresh = new Float32Array(length);
    const first = Math.floor((strip + 0.08) * breadth / 3);
    const last = Math.floor((strip + 0.92) * breadth / 3);
    let columns = 0;
    for (let cross = first; cross < last; cross += 3) {
      columns++;
      for (let pos = 1; pos < length - 1; pos++) {
        const i = vertical ? pos * width + cross : cross * width + pos;
        const step = vertical ? width : 1;
        old[pos] += before.gray[i + step] - before.gray[i - step];
        fresh[pos] += after.gray[i + step] - after.gray[i - step];
      }
    }
    let energy = 0, difference = 0;
    for (let i = radius + 1; i < length - radius - 1; i++) {
      energy += old[i] ** 2;
      difference += (old[i] - fresh[i]) ** 2;
    }
    if (energy < columns ** 2 * 55 || difference < energy * 0.015) continue;
    const scores = [];
    let best = -1, offset = 0;
    for (let shift = -radius; shift <= radius; shift++) {
      let dot = 0, norm = 0;
      for (let i = radius + 1; i < length - radius - 1; i++) {
        const g = fresh[i + shift];
        dot += old[i] * g;
        norm += g * g;
      }
      const score = norm ? dot / Math.sqrt(energy * norm) : 0;
      scores.push(score);
      if (score > best) { best = score; offset = shift; }
    }
    if (best < 0.78 || best - scores[radius] < 0.035) continue;
    const ambiguous = scores.some((score, i) => Math.abs(i - radius - offset) > 2 && score > best - 0.055);
    if (!ambiguous) votes.push(offset);
  }
  if (!votes.length) return null;
  votes.sort((a, b) => a - b);
  const median = votes[Math.floor(votes.length / 2)];
  if (votes.filter(v => Math.abs(v - median) <= 2).length <= votes.length / 2) return null;
  return median / length;
}

// a,b represent scale*cos(roll), scale*sin(roll). Translation is relative to
// the picture center, so a zoom does not masquerade as a pan.
function featureMotion(previous, current) {
  const pairs = patchMatches(previous, current);
  if (pairs.length < 3) return widePan(previous, current);
  const w = current.width,
    h = current.height;
  let inliers = [],
    bestError = Infinity;
  for (let i = 0; i < pairs.length - 1; i++) {
    const p = pairs[i];
    for (let j = i + 1; j < pairs.length; j++) {
      const q = pairs[j],
        x = q.x - p.x,
        y = q.y - p.y,
        square = x * x + y * y;
      if (square < Math.min(w, h) ** 2 * 0.035) continue;
      const u = q.u - p.u,
        v = q.v - p.v;
      const a = (x * u + y * v) / square,
        b = (x * v - y * u) / square;
      if (a < 0.76 || a > 1.29 || Math.abs(b) > 0.37) continue;
      const good = [];
      let error = 0;
      for (const r of pairs) {
        const rx = r.x - p.x,
          ry = r.y - p.y;
        const miss = (p.u + a * rx - b * ry - r.u) ** 2 + (p.v + b * rx + a * ry - r.v) ** 2;
        if (miss <= 3.4) {
          good.push(r);
          error += miss;
        }
      }
      if (good.length > inliers.length || (good.length === inliers.length && error < bestError)) {
        inliers = good;
        bestError = error;
      }
      if (good.length === pairs.length && error === 0) break;
    }
    if (inliers.length === pairs.length && bestError === 0) break;
  }
  if (inliers.length < Math.max(3, pairs.length * 0.48)) return widePan(previous, current);
  let x = 0,
    y = 0,
    u = 0,
    v = 0;
  for (const p of inliers) {
    x += p.x;
    y += p.y;
    u += p.u;
    v += p.v;
  }
  const n = inliers.length;
  x /= n;
  y /= n;
  u /= n;
  v /= n;
  let sum = 0,
    dot = 0,
    cross = 0;
  for (const p of inliers) {
    const px = p.x - x,
      py = p.y - y;
    sum += px * px + py * py;
    dot += px * (p.u - u) + py * (p.v - v);
    cross += px * (p.v - v) - py * (p.u - u);
  }
  if (!sum) return widePan(previous, current);
  const a = dot / sum,
    b = cross / sum;
  return {
    a,
    b,
    dx: (u - w / 2 - a * (x - w / 2) + b * (y - h / 2)) / w,
    dy: (v - h / 2 - b * (x - w / 2) - a * (y - h / 2)) / h,
  };
}

// Adding a vertical edge to an otherwise horizontally uniform frame gives no
// evidence of horizontal travel. Both pictures need contrast along that axis.
function hasAxisDetail({ gray, width, height }, step) {
  let support = 0;
  for (let y = 2; y < height - 2; y += 2) {
    for (let x = 2; x < width - 2; x += 2) {
      const pos = y * width + x;
      if (Math.abs(gray[pos + step] - gray[pos - step]) > 12 && ++support >= 8) return true;
    }
  }
  return false;
}

export function cameraMotion(previous, current) {
  if (!previous || previous.width !== current.width || previous.height !== current.height) return null;
  const flow = featureMotion(previous, current);
  // A rotating or zooming frame needs the complete transform. During translation
  // a crisp band independently resolves its own axis, even if corner matches drift.
  if (flow && (Math.abs(flow.b) > 0.016 || Math.abs(flow.a - 1) > 0.018)) return flow;
  const dy = stripMotion(previous, current, true);
  const dx = stripMotion(previous, current, false);
  if (!flow && dy === null && dx === null) return null;
  const supported = (pan, step) =>
    pan && hasAxisDetail(previous, step) && hasAxisDetail(current, step) ? pan : 0;
  return {
    a: flow?.a ?? 1, b: flow?.b ?? 0,
    dx: supported(dx ?? flow?.dx ?? 0, 1),
    dy: supported(dy ?? flow?.dy ?? 0, current.width),
  };
}

export function carryPoint(x, y, change, width, height) {
  const px = x - width / 2,
    py = y - height / 2;
  return {
    x: width / 2 + change.a * px - change.b * py + change.dx * width,
    y: height / 2 + change.b * px + change.a * py + change.dy * height,
  };
}
