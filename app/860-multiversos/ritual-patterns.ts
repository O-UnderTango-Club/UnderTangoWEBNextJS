const RITUAL = {
  19:{name:"Piel grave", pitch:55.5, ratio:2, fm:.75, sweep:3.1, decay:.46, cutoff:2100, noise:.027},
  21:{name:"Semilla de aire", pitch:666, ratio:2.75, fm:1.55, sweep:1.25, decay:.11, cutoff:5600, noise:.18},
  23:{name:"Tom ritual", pitch:111, ratio:1.5, fm:.85, sweep:1.84, decay:.36, cutoff:2750, noise:.043},
  25:{name:"Metal respirado", pitch:333, ratio:3.47, fm:2.1, sweep:1.08, decay:.54, cutoff:4700, noise:.095},
  27:{name:"Bombo rave", pitch:55.5, ratio:2.5, fm:1.45, sweep:4.2, decay:.29, cutoff:2150, noise:.055},
  29:{name:"Membrana resonante", pitch:166.5, ratio:1.73, fm:1.25, sweep:2.15, decay:.48, cutoff:3300, noise:.071},
} as const;

export function ritualLayer(scene:number|null) {
  return scene!==null && Object.hasOwn(RITUAL,scene) ? RITUAL[scene as keyof typeof RITUAL] : undefined;
}
