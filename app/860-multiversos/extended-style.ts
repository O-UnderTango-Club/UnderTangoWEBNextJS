export const EXTENDED_STYLE = `
  .voice-loop-strip { display:flex; flex-wrap:wrap; align-items:center; gap:.3rem .65rem; padding:.4rem .65rem; border-bottom:1px solid #534b60; color:#f4f0f7; }
  .voice-loop-strip output { color:#d5c2ed; font-variant-numeric:tabular-nums; }
  .voice-loop-strip small { max-width:16rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .zero-stage[data-extended-dark] .zero-scene-number { color: #eee9fa; }
  .extended-instrument { width: min(95%, 1120px); padding-top: clamp(26px, 6dvh, 56px); }
  .extended-cubes { position: relative; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(.4rem, 1.1vw, 1rem); }
  .extended-instrument:is([data-extended-scene="31"],[data-extended-scene="45"]) .extended-cubes { display:none; }
  .zero-stage:has(.voluntad-stage,.audience-projection,.type-projection) { grid-template-rows:minmax(0,1fr) fit-content(50%); background:#080810 !important; }
  .zero-stage:has(.voluntad-stage,.audience-projection,.type-projection) .scene-mixer { position:relative; grid-row:2; width:100%; max-height:100%; }
  .type-projection { grid-row:1; display:block; width:100%; height:100%; min-width:0; min-height:0; background:#08090c; }
  .voluntad-stage { position:relative; grid-row:1; width:100%; height:100%; display:grid; place-items:center; container-type:size; }
  .voluntad-poster { --pulse:0; --strike:0; --tone:0deg; display:block; position:relative; width:min(100cqw,78.13cqh); border:0; padding:0; background:#080810; cursor:crosshair; touch-action:none; }
  .voluntad-poster img { width:100%; height:auto; display:block; pointer-events:none; }
  .voluntad-poster .voluntad-resonance { position:absolute; inset:0; clip-path:polygon(0 88%, 0 69%, 8% 43%, 22% 33%, 72% 30%, 88% 4%, 100% 4%, 100% 64%, 90% 83%, 65% 87%);
    opacity:var(--pulse); mix-blend-mode:screen; filter:brightness(1.5) hue-rotate(var(--tone)); transform:translate(calc(var(--strike) * 1.2%),calc(var(--strike) * -0.8%)); }
  .voluntad-retry { position:absolute; z-index:3; top:.5rem; right:.5rem; }
  .audience-projection { position:relative; grid-row:1; width:100%; height:100%; min-height:0; overflow:hidden; background:#080810; }
  .audience-projection video,.audience-projection canvas { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
  .audience-projection canvas { pointer-events:none; mix-blend-mode:screen; }
  .audience-camera-status { position:absolute; inset:0; display:grid; place-content:center; justify-items:center; gap:.8rem; padding:1rem; color:#fff; background:#080810; text-align:center; }
  .audience-camera-status button { padding:.6rem 1rem; cursor:pointer; }
  @media (prefers-reduced-motion:reduce) { .voluntad-poster .voluntad-resonance { transform:none; } }
  .extended-generative {display:block;width:100%;height:min(48dvh,460px);background:#fff;}
  .extended-track {
    container-type: inline-size; min-width: 0; display: grid; grid-template-rows: auto auto auto; justify-items: stretch;
    padding: .38rem; color: #332a45; border: 1px solid #dad4e3; border-radius: 6px;
  }
  .extended-track[data-selected=true] { border-color: #9982c6; }
  .extended-track-select {
    justify-self: center; min-height: 30px; padding: .25rem .6rem; border: 1px solid transparent; border-radius: 4px;
    background: transparent; color: inherit; font: 500 .75rem/1 system-ui, sans-serif; cursor: pointer;
  }
  .extended-track-select[aria-pressed=true] { background: #eae2f9; color: #473178; }
  .extended-cube-space { position: relative; min-width: 0; height: clamp(112px, 34dvh, 300px); }
  .extended-cube-space .extended-cube {
    --cube-depth: min(61cqi, 20dvh, 178px); --cube-color: 1;
    width: var(--cube-depth); height: var(--cube-depth); top: 50%; left: 50%;
    transform: rotateX(-35.26439deg) rotateY(-45deg);
  }
  .extended-cube .zero-note-hz { font-size: clamp(.48rem, 4.6cqi, .9rem); }
  .extended-cube[data-folding] .zero-cube-face { gap: clamp(1px, 1.4cqi, 4px); padding: clamp(1px, 1.8cqi, 5px); }
  .extended-instrument .extended-loop-timeline {
    --loop-beat-width: clamp(4.9rem, 8vw, 7.5rem); --loop-playhead: 25%; --loop-ruler-height: 1.25rem;
    grid-row: auto; width: 100%; height: clamp(92px, 17dvh, 146px); margin: 0;
  }
  .extended-instrument .zero-loop-readout { gap: .3rem; padding: .34rem .4rem; font-size: .68rem; }
  .extended-instrument .zero-loop-readout > div { gap: .21rem; }
  .extended-instrument .zero-loop-card { gap: .28rem; padding-inline: .35rem; font-size: .65rem; }
  .extended-instrument .zero-loop-pitches span { font-size: .58rem; }
  .extended-manual-strip {
    width: min(100%, 720px); height: clamp(92px, 17dvh, 146px); margin: .65rem auto 0;
    display: grid; place-items: center; color: #e9dbfa; font: .85rem/1.25 system-ui, sans-serif; text-align: center;
  }
  .zero-stage[data-extended-dark] .extended-track { color: #e5daff; border-color: #4c395f; background: #1b142b; }
  .zero-stage[data-extended-dark] .extended-track[data-selected=true] { border-color: #9a76d3; }
  .zero-stage[data-extended-dark] .extended-track-select[aria-pressed=true] { background: #4b3468; color: #f4e9ff; }
  .extended-effect-caption { margin: .7rem 0 0; color: #e9dbfa; font: 400 clamp(1.3rem, 3vw, 2.35rem)/1.15 Georgia, serif; text-align: center; }
  .extended-settings { margin: .65rem 0; color: #e5e9f9; font: .77rem/1.4 system-ui, sans-serif; }
  .extended-settings > label:not(.extended-midi-split) { display: flex; justify-content: space-between; gap: .35rem; }
  .extended-settings select {
    width: 100%; min-height: 35px; margin-top: .3rem; padding-inline: .35rem; border: 1px solid #626c83; border-radius: 5px;
    background: #202533; color: #f2f3f7; font: inherit; color-scheme: dark;
  }
  .extended-settings .zero-loop-options select { margin-top: 0; }
  .extended-midi-split { display: flex; align-items: flex-start; gap: .3rem; margin-top: .45rem; }
  .extended-keys { margin: .5rem 0; color: #ccd3e7; }
  .extended-fractal, .extended-tuning, .extended-timbre-cue { position: absolute; inset: 0; display: grid; place-items: center; }
  .extended-fractal, .extended-tuning { background: radial-gradient(ellipse at 50% 44%, #26173a, #11101b 69%); color: #f0e8fb; }
  .extended-fractal canvas { position: absolute; width: 100%; height: 100%; }
  .extended-condition { position: absolute; bottom: 6%; width: min(88%, 620px); text-align: center; opacity: var(--extended-reveal, 0); }
  .extended-condition p { margin: 0 0 .38rem; font: 500 clamp(.73rem, 1.5vw, 1.1rem)/1 system-ui, sans-serif; letter-spacing: .16em; text-transform: uppercase; color: #d9b9fd; }
  .extended-condition h2 { margin: 0 0 .48rem; font: 400 clamp(1.62rem, 4.1vw, 3.8rem)/1.07 Georgia, serif; }
  .extended-condition span { color: #d9d0ec; font-size: clamp(.75rem, 1.58vw, 1.12rem); }
  .extended-tuning-orbit {
    position: absolute; width: clamp(105px, 26vw, 290px); aspect-ratio: 1; top: 50%; translate: -50% -50%; border: 1px solid #8870a3;
    border-radius: 50%; background: radial-gradient(circle, transparent 31%, #c393dc37 32% 32.7%, transparent 33% 63%, #c393dc45 64% 64.8%, transparent 65%);
    opacity: .55;
  }
  .extended-orbit-left { left: 24%; }
  .extended-orbit-right { left: 76%; border-color: #86bbc5; filter: hue-rotate(260deg); }
  .extended-bach {
    z-index: 1; position: absolute; top: 13%; left: 50%; translate: -50% 0; width: min(39%, 245px, 33dvh); margin: 0;
    text-align: center; opacity: var(--bach-visibility, 0); pointer-events: none;
  }
  .extended-bach img { width: 100%; max-height: 52dvh; object-fit: cover; object-position: 50% 27%; border-radius: 2px; box-shadow: 0 0 35px #dfb4ff96; }
  .extended-bach figcaption { margin-top: .32rem; color: #eee4fb; font: .65rem/1.2 system-ui, sans-serif; }
  .extended-tuning-bridge {
    z-index: 2; position: relative; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
    width: min(91%, 840px); gap: clamp(.45rem, 2.4vw, 1.9rem); text-align: center;
  }
  .extended-tuning-bridge::before {
    content: ""; position: absolute; inset-inline: 14%; top: calc(100% + .68rem); height: 2px; background: #e4c0ff;
    box-shadow: 0 0 13px #e5c1ff; transform-origin: left; transform: scaleX(var(--extended-reveal, 0));
  }
  .extended-tuning-bridge > div { position: relative; padding: .5rem .4rem; background: #241735; }
  .extended-tuning-bridge h2 { margin: 0; font: 400 clamp(.95rem, 2.6vw, 2.6rem)/1.05 Georgia, serif; }
  .extended-tuning-bridge p { margin: .3rem 0 0; font: 400 clamp(.66rem, 1.35vw, .95rem)/1.2 system-ui, sans-serif; color: #dbcde9; }
  .extended-tuning-bridge .extended-a4 {
    display: grid; gap: .15rem; padding: .46rem .65rem; border: 1px solid #9574bc; border-radius: 4px;
    color: #f5e4ff; font: 500 clamp(.68rem, 1.42vw, .99rem)/1.1 system-ui, sans-serif;
  }
  .extended-timbre-cue p { margin: 0; padding-inline: 8%; text-align: center; font: 400 clamp(1.65rem, 4.7vw, 4.3rem)/1.12 Georgia, serif; color: #282131; }
  @media (max-width: 760px) {
    .extended-cubes { grid-template-columns: none; grid-auto-columns: min(79%, 350px); grid-auto-flow: column; overflow-x: auto; scroll-snap-type: x mandatory; }
    .extended-instrument:is([data-extended-scene="31"],[data-extended-scene="45"]) .extended-cubes { display:none; }
  .extended-generative {display:block;width:100%;height:min(48dvh,460px);background:#fff;}
  .extended-track { scroll-snap-align: center; }
    .extended-instrument { padding-top: min(7dvh, 38px); }
    .extended-cube-space { height: clamp(96px, 28dvh, 229px); }
    .extended-cube-space .extended-cube { --cube-depth: min(61cqi, 16.2dvh, 154px); }
    .extended-instrument .extended-loop-timeline { height: clamp(77px, 13dvh, 112px); }
    .extended-manual-strip { height: clamp(77px, 13dvh, 112px); }
    .extended-condition { bottom: 5%; }
    .extended-bach { top: 11%; }
  }
`;
