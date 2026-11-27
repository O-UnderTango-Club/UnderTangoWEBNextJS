export const clipLength = 14_000;

export function secondsLeft(start, now) {
  return Math.max(0, Math.ceil((start + clipLength - now) / 1000));
}

export function roundPhase(seconds, landed) {
  if (landed) return 'won';
  return seconds > 0 ? 'playing' : 'lost';
}

export function clipName(duration, extension) {
  return `primera-voluntad-${duration / 1000}s.${extension}`;
}
