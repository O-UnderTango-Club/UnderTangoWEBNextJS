// Find finite segments in the visible, downsampled frame. Coordinates returned to
// the renderer are fractions of this frame, including its object-fit crop.
const angleCount = 120;
const angleTolerance = 12;
const normals = Array.from({ length: angleCount }, (_, index) => {
  const angle = Math.PI * index / angleCount;
  return { x: Math.cos(angle), y: Math.sin(angle) };
});

export function luminance({data, width, height}) {
  const gray = new Uint8Array(width * height);
  for (let i = 0, k = 0; i < gray.length; i++, k += 4) {
    gray[i] = (77 * data[k] + 150 * data[k + 1] + 29 * data[k + 2]) >> 8;
  }
  return {gray, width, height};
}

function edgeMap({ gray, width, height }) {
  const size = width * height;
  const horizontal = new Uint16Array(size);
  const smooth = new Uint8Array(size);
  const magnitude = new Uint32Array(size);
  const direction = new Int8Array(size);
  const edges = new Int8Array(size).fill(-1);

  // A small Gaussian blur suppresses sensor noise before the Sobel gradients.
  for (let i = 1; i < size - 1; i++) {
    horizontal[i] = gray[i - 1] + 2 * gray[i] + gray[i + 1];
  }
  for (let i = width; i < size - width; i++) {
    smooth[i] = (horizontal[i - width] + 2 * horizontal[i] + horizontal[i + width]) >> 4;
  }
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      const i = y * width + x;
      const t = i - width, b = i + width;
      const gx = smooth[t + 1] + 2 * smooth[i + 1] + smooth[b + 1]
               - smooth[t - 1] - 2 * smooth[i - 1] - smooth[b - 1];
      const gy = smooth[b - 1] + 2 * smooth[b] + smooth[b + 1]
               - smooth[t - 1] - 2 * smooth[t] - smooth[t + 1];
      magnitude[i] = gx * gx + gy * gy;
      if (magnitude[i] >= 70 * 70) {
        direction[i] = (Math.round(Math.atan2(gy, gx) * angleCount / Math.PI) + angleCount) % angleCount;
      }
    }
  }
  const across = [1, width + 1, width, width - 1];
  for (let y = 3; y < height - 3; y++) {
    for (let x = 3; x < width - 3; x++) {
      const i = y * width + x;
      const offset = across[Math.round(direction[i] * 4 / angleCount) % 4];
      if (magnitude[i] >= 70 * 70 && magnitude[i] >= magnitude[i - offset] && magnitude[i] >= magnitude[i + offset]) {
        edges[i] = direction[i];
      }
    }
  }
  return edges;
}

function aligned(edge, angle) {
  if (edge < 0) return false;
  const d = Math.abs(edge - angle);
  return d <= angleTolerance || d >= angleCount - angleTolerance;
}

// A Hough peak is an infinite line. Walk it and retain only runs backed by
// nearby, similarly oriented edge pixels. Allow a small break at an intersection, while requiring 85% support.
function longestRun(edges, width, height, angle, rho, minimumLength) {
  const normal = normals[angle];
  const alongX = Math.abs(normal.y) >= Math.abs(normal.x);
  const divisor = alongX ? normal.y : normal.x;
  const slope = -(alongX ? normal.x : normal.y) / divisor;
  const intercept = rho / divisor;
  const limit = alongX ? width : height;
  const crossLimit = alongX ? height : width;
  const stride = alongX ? width : 1;
  const unitLength = Math.hypot(1, slope);
  let start = 0, last = -10, hits = 0, directHits = 0, best = null;

  for (let u = 3; u < limit - 3; u++) {
    const v = Math.round(intercept + u * slope);
    if (v < 2 || v >= crossLimit - 2) continue;
    const i = alongX ? v * width + u : u * width + v;
    const direct = aligned(edges[i], angle);
    if (!direct && !aligned(edges[i - stride], angle) && !aligned(edges[i + stride], angle)) continue;
    if (u - last > 7) {
      start = u;
      hits = directHits = 0;
    }
    last = u;
    hits++;
    if (direct) directHits++;
    const span = last - start;
    const length = span * unitLength;
    if (length >= minimumLength && hits >= .85 * (span + 1) && (!best || length > best.length)) {
      best = { start, end: last, length, fit: (hits + directHits) / (2 * (span + 1)) };
    }
  }
  if (!best) return null;
  const point = u => {
    const v = intercept + u * slope;
    return { x: ((alongX ? u : v) + .5) / width, y: ((alongX ? v : u) + .5) / height };
  };
  return { a: point(best.start), b: point(best.end), length: best.length, fit: best.fit };
}

export function visibleLines(frame) {
  const { width, height } = frame;
  const edges = edgeMap(frame.gray ? frame : luminance(frame));
  const minimumLength = Math.max(22, Math.min(width, height) * .28, Math.max(width, height) * .14);
  const radius = Math.ceil(Math.hypot(width, height));
  const rhoCount = 2 * radius + 1;
  const votes = new Uint16Array(angleCount * rhoCount);
  for (let y = 3; y < height - 3; y++) {
    for (let x = 3; x < width - 3; x++) {
      const edge = edges[y * width + x];
      if (edge < 0) continue;
      for (let d = -angleTolerance; d <= angleTolerance; d++) {
        const angle = (edge + d + angleCount) % angleCount;
        const normal = normals[angle];
        const rho = Math.round(x * normal.x + y * normal.y);
        votes[angle * rhoCount + radius + rho]++;
      }
    }
  }

  const contenders = [];
  let longest = 0;
  for (let angle = 0; angle < angleCount; angle++) {
    const offset = angle * rhoCount;
    for (let r = 1; r < rhoCount - 1; r++) {
      const count = votes[offset + r];
      if (count < minimumLength * .35 || count < votes[offset + r - 1] || count < votes[offset + r + 1]) continue;
      const line = longestRun(edges, width, height, angle, r - radius, minimumLength);
      if (line) {
        longest = Math.max(longest, line.length);
        contenders.push(line);
      }
    }
  }
  // Lengths within two downsampled pixels are indistinguishable. Prefer the
  // edge supported at its center, so a slant crossing a thick stripe loses.
  let best = null;
  for (const line of contenders) {
    if (line.length < longest - 2) continue;
    if (!best || line.fit > best.fit || (line.fit === best.fit && line.length > best.length)) best = line;
  }
  if (!best) return [];
  const distinct = [best];
  contenders.sort((a, b) => b.length - a.length);
  for (const line of contenders) {
    if (!distinct.some(other => sameRidge(line, other, width, height))) distinct.push(line);
    if (distinct.length === 10) break;
  }
  return distinct;
}

function sameRidge(first, next, width, height) {
  const dx = (first.b.x - first.a.x) * width, dy = (first.b.y - first.a.y) * height;
  const ex = (next.b.x - next.a.x) * width, ey = (next.b.y - next.a.y) * height;
  const mx = (next.a.x + next.b.x - first.a.x - first.b.x) * width / 2;
  const my = (next.a.y + next.b.y - first.a.y - first.b.y) * height / 2;
  const len = Math.hypot(dx, dy);
  return Math.abs(dx * ey - dy * ex) < .115 * len * Math.hypot(ex, ey) &&
    Math.abs(dx * my - dy * mx) / len < 4 &&
    Math.abs(dx * mx + dy * my) / len < (len + Math.hypot(ex, ey)) / 2;
}

export function longestLine(frame) {
  return visibleLines(frame)[0] || null;
}

export function sameLine(first, next, width, height) {
  const dx = (first.b.x - first.a.x) * width, dy = (first.b.y - first.a.y) * height;
  const ex = (next.b.x - next.a.x) * width, ey = (next.b.y - next.a.y) * height;
  const length = Math.hypot(dx, dy), nextLength = Math.hypot(ex, ey);
  const mx = (next.a.x + next.b.x - first.a.x - first.b.x) * width / 2;
  const my = (next.a.y + next.b.y - first.a.y - first.b.y) * height / 2;
  // Follow rotations about the same midpoint while rejecting disconnected parallel edges.
  return Math.abs(dx * ex + dy * ey) > .52 * length * nextLength &&
    Math.min(length, nextLength) >= .52 * Math.max(length, nextLength) &&
    Math.abs(dx * my - dy * mx) / length < .13 * Math.max(width, height) &&
    Math.abs(dx * mx + dy * my) / length < .35 * length;
}
