import { SHOW_SCORE } from "./show-score";

const shortestShow = 20 * 60;
const longestShow = 40 * 60;
const defaults = SHOW_SCORE.map(scene => scene.seconds);
const minimums = SHOW_SCORE.map(scene => {
  switch (scene.number) {
    case 1: return 12;
    case 4: return 4;
    case 9: return 2;
    default: return 1;
  }
});

function secondsTotal(durations: number[]) {
  return durations.reduce((sum, duration) => sum + duration, 0);
}

export function resolveShowDurations(saved: unknown): number[] {
  if (!Array.isArray(saved)) return [...defaults];
  const durations = defaults.map((fallback, index) => {
    const value: unknown = saved[index];
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return fallback;
    return Math.max(minimums[index], Math.min(longestShow, Math.round(value)));
  });
  const total = secondsTotal(durations);
  const target = Math.min(longestShow, Math.max(shortestShow, total));
  if (total === target) return durations;

  // Repair the fewest individual overrides. The 30-minute score is always a feasible baseline.
  const direction = Math.sign(target - total);
  const adjustments = durations.map((seconds, index) => ({
    index, room: direction * (defaults[index] - seconds),
  })).filter(change => change.room > 0).sort((a, b) => b.room - a.room);
  let remaining = Math.abs(target - total);
  for (const { index, room } of adjustments) {
    const change = Math.min(room, remaining);
    durations[index] += direction * change;
    remaining -= change;
    if (remaining === 0) break;
  }
  return durations;
}

function boundsForIndex(index: number, durations: number[]) {
  const others = secondsTotal(durations) - durations[index];
  return { min: Math.max(minimums[index], shortestShow - others), max: longestShow - others };
}

function sceneIndex(scene: number) {
  return Number.isInteger(scene) && scene >= 1 && scene <= defaults.length ? scene - 1 : -1;
}

export function durationBounds(scene: number, durations: number[]): { min: number; max: number } {
  const index = sceneIndex(scene);
  if (index < 0) return { min: 0, max: 0 };
  return boundsForIndex(index, resolveShowDurations(durations));
}

export function editShowDuration(scene: number, seconds: number, current: number[]): number[] {
  const durations = resolveShowDurations(current);
  const index = sceneIndex(scene);
  if (index < 0 || !Number.isFinite(seconds)) return durations;
  const { min, max } = boundsForIndex(index, durations);
  durations[index] = Math.max(min, Math.min(max, Math.round(seconds)));
  return durations;
}
