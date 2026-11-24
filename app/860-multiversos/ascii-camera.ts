/** Resample the live camera into character cells. Luminance sets ink density; the mix colours the ink. */
export function drawAsciiCamera(video: HTMLVideoElement, canvas: HTMLCanvasElement, analyser: {current: AnalyserNode | null}) {
  const ink = canvas.getContext("2d");
  const sampler = document.createElement("canvas");
  const pixels = sampler.getContext("2d", {willReadFrequently:true});
  if (!ink || !pixels) return;
  const glyphs = " .,:;+=x#%@";
  const spectrum = new Uint8Array(512);
  let frame = 0, previous = 0;
  const draw = (now: number) => {
    frame = requestAnimationFrame(draw);
    if (now - previous < 65 || video.readyState < 2 || !video.videoWidth) return;
    previous = now;
    const width = Math.round(canvas.clientWidth), height = Math.round(canvas.clientHeight);
    if (!width || !height) return;
    if (canvas.width !== width || canvas.height !== height) {canvas.width = width; canvas.height = height;}
    const cols = Math.min(140, Math.max(30, Math.floor(width / 8)));
    const step = width / cols, font = step / .6, rows = Math.max(1, Math.ceil(height / font));
    if (sampler.width !== cols || sampler.height !== rows) {sampler.width = cols; sampler.height = rows;}
    const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
    const cropW = width / scale, cropH = height / scale;
    pixels.drawImage(video, (video.videoWidth-cropW)/2, (video.videoHeight-cropH)/2, cropW, cropH, 0, 0, cols, rows);
    const rgba = pixels.getImageData(0, 0, cols, rows).data;
    spectrum.fill(0);
    analyser.current?.getByteFrequencyData(spectrum);
    const bass = (spectrum[2]+spectrum[3]+spectrum[4])/765;
    const air = (spectrum[24]+spectrum[40]+spectrum[70])/765;
    ink.fillStyle = "#050910";
    ink.fillRect(0, 0, width, height);
    ink.font = font + 'px "Courier New", monospace';
    ink.textBaseline = "top";
    for(let y=0; y<rows; y++){
      let line = "";
      for(let x=0; x<cols; x++){
        const i = (y*cols+x)*4;
        const luma = (.2126*rgba[i]+.7152*rgba[i+1]+.0722*rgba[i+2])/255;
        const density = Math.min(1, Math.max(0, (luma-.45)*(1+bass*.45)+.45));
        line += glyphs[Math.round(density*(glyphs.length-1))];
      }
      ink.fillStyle = "hsl(" + (163 + 36*y/rows + air*110) + ",76%," + (68+bass*13) + "%)";
      ink.fillText(line, 0, y*font);
    }
  };
  frame = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(frame);
}
