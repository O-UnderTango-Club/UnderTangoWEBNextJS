// One second of the moving image before the two seven-second invitations.
export const introMs = 1000;
export const invitationMs = 7000;
export const clipLength = introMs + 2 * invitationMs;

export function clipName(duration, extension) {
  return `primera-voluntad-${duration / 1000}s.${extension}`;
}
