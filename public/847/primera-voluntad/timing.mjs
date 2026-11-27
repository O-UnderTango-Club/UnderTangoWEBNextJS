export const clipLength = 14_000;

export function secondsLeft(start, now) {
  return Math.max(0, Math.ceil((start + clipLength - now) / 1000));
}

// Keep the result private until the recording and its local export are finished.
export function roundPhase(seconds, landed, clipState) {
  if (seconds > 0) return landed ? 'caught' : 'playing';
  if (clipState !== 'ready' && clipState !== 'unavailable') return 'finishing';
  return landed ? 'won' : 'lost';
}

export function clipName(duration, extension) {
  return `primera-voluntad-${duration / 1000}s.${extension}`;
}
