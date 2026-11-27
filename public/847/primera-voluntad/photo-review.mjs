// Some browsers play only the sound of a Photo-JPEG movie. Use its exact
// pictures and PCM track for in-page playback, keeping the original file for sharing.
function waveHeader(bytes) {
  const header = new ArrayBuffer(44), data = new DataView(header);
  const label = (offset, text) => {
    for (let i = 0; i < text.length; i++) data.setUint8(offset + i, text.charCodeAt(i));
  };
  label(0, 'RIFF'); data.setUint32(4, bytes + 36, true);
  label(8, 'WAVE'); label(12, 'fmt '); data.setUint32(16, 16, true);
  data.setUint16(20, 1, true); data.setUint16(22, 1, true);
  data.setUint32(24, 48000, true); data.setUint32(28, 96000, true);
  data.setUint16(32, 2, true); data.setUint16(34, 16, true);
  label(36, 'data'); data.setUint32(40, bytes, true);
  return header;
}

export function photoReview(player, image) {
  let file, offsets, audioUrl, pictureUrl, frame = -1, raf = 0;
  function paint() {
    cancelAnimationFrame(raf);
    if (!offsets) return;
    const index = Math.min(offsets.length - 2, Math.floor(player.currentTime * 30));
    if (index !== frame && Number.isFinite(index)) {
      frame = index;
      const old = pictureUrl;
      pictureUrl = URL.createObjectURL(file.slice(offsets[index], offsets[index + 1], 'image/jpeg'));
      image.src = pictureUrl;
      if (old) URL.revokeObjectURL(old);
    }
    if (!player.paused && !player.ended) raf = requestAnimationFrame(paint);
  }
  for (const event of ['playing', 'seeked', 'loadedmetadata', 'pause', 'ended'])
    player.addEventListener(event, paint);

  function clear() {
    cancelAnimationFrame(raf);
    image.hidden = true;
    image.removeAttribute('src');
    if (pictureUrl) URL.revokeObjectURL(pictureUrl);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    file = offsets = audioUrl = pictureUrl = null;
    frame = -1;
  }
  return {
    clear,
    source(clip) {
      if (!clip.photoOffsets) return clip.url;
      if (file === clip.file) return audioUrl;
      clear();
      file = clip.file;
      offsets = clip.photoOffsets;
      const pcm = file.slice(offsets.at(-1));
      audioUrl = URL.createObjectURL(new Blob([waveHeader(pcm.size), pcm], { type: 'audio/wav' }));
      image.hidden = false;
      paint();
      return audioUrl;
    },
  };
}
