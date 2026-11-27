export const ROUNDS = [92, 96, 100] as const;
export const PALETTES = { azul: "Azul", ambar: "Ámbar", violeta: "Violeta" } as const;
export const TIMBRES = { aire: "Aire", campana: "Campana", agua: "Agua" } as const;
export const INKS = { azul: "#78c4ef", ambar: "#f7c378", violeta: "#b29bed" } as const;
export type Color = keyof typeof PALETTES;
export type Timbre = keyof typeof TIMBRES;
export type Choice = { color: Color; sound: Timbre };
export const GROOVES = { movido:"Movido", tranquilo:"Tranquilo", romantico:"Romántico" } as const;
export type Groove = keyof typeof GROOVES;
export type Atmosphere = Choice & { groove: Groove };
export const DEFAULT_ATMOSPHERE: Atmosphere = {groove:"tranquilo", sound:"aire", color:"azul"};

const grooveCodes = {movido:"azul", tranquilo:"ambar", romantico:"violeta"} as const;
const groovesByCode = {azul:"movido", ambar:"tranquilo", violeta:"romantico"} as const;
const optionList = (labels:Record<string,string>) => Object.entries(labels).map(([id,label]) => ({id,label}));
export const QUESTIONS = {
  92:{title:"¿Cómo quieren que se mueva la música?", options:optionList(GROOVES)},
  96:{title:"¿Qué timbre quieren escuchar?", options:optionList(TIMBRES)},
  100:{title:"¿De qué color quieren la escena?", options:optionList(PALETTES)},
};
export const questionFor = (scene:number|null) => isRound(scene) ? QUESTIONS[scene] : null;

// The tally has two existing fields. Only the field for this question varies.
export function encodeVote(scene:number, option:unknown):Choice|null {
  if(typeof option!=="string")return null;
  if(scene===92 && Object.hasOwn(grooveCodes,option))return {color:grooveCodes[option as Groove],sound:"aire"};
  if(scene===96 && Object.hasOwn(TIMBRES,option))return {color:"azul",sound:option as Timbre};
  if(scene===100 && Object.hasOwn(PALETTES,option))return {color:option as Color,sound:"aire"};
  return null;
}

export function applyWinner(current:Atmosphere, scene:number, winner:Choice):Atmosphere {
  if(scene===92)return {...current,groove:groovesByCode[winner.color]};
  if(scene===96)return {...current,sound:winner.sound};
  if(scene===100)return {...current,color:winner.color};
  return current;
}

export function winnerLabel(scene:number|null,winner:Choice) {
  if(scene===92)return GROOVES[groovesByCode[winner.color]];
  if(scene===96)return TIMBRES[winner.sound];
  if(scene===100)return PALETTES[winner.color];
  return null;
}

export const atmosphereLabel = ({groove,sound,color}:Atmosphere) => [GROOVES[groove],TIMBRES[sound],PALETTES[color]].join(" · ");
export const isRound = (scene:number|null): scene is typeof ROUNDS[number] => ROUNDS.some(value => value === scene);
