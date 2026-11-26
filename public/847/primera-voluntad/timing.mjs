// The live invitations keep alternating after the local clip is complete.
export const introMs = 1000;
export const invitationMs = 6000;
export const clipLength = 15000;

export function clipName(duration, extension) {
  return `primera-voluntad-${duration / 1000}s.${extension}`;
}
