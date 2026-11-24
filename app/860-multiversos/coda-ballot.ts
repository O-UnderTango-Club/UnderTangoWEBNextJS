export const ROUNDS = [92, 96, 100] as const;
export const PALETTES = { azul: "Azul", ambar: "Ámbar", violeta: "Violeta" } as const;
export const TIMBRES = { aire: "Aire", campana: "Campana", agua: "Agua" } as const;
export const INKS = { azul: "#78c4ef", ambar: "#f7c378", violeta: "#b29bed" } as const;
export type Color = keyof typeof PALETTES;
export type Timbre = keyof typeof TIMBRES;
export type Choice = { color: Color; sound: Timbre };
export type Ballot = {
  session:string; scene:number|null; closesAt:string|null; serverTime:string;
  open:boolean; total:number; winner:Choice|null; voted:boolean;
};
export type Host = {session:string;hostToken:string};
export const isRound = (scene:number) => ROUNDS.some(value => value === scene);
export function remainingSeconds(state:Ballot, offset:number) {
  return state.open && state.closesAt
    ? Math.max(0, Math.ceil((Date.parse(state.closesAt) - Date.now() - offset) / 1000)) : 0;
}
export class BallotError extends Error {
  constructor(readonly status:number){super("No se pudo consultar la votación");}
}
export async function ballotRequest<T>(session:string, post?:Record<string,unknown>, signal?:AbortSignal):Promise<T> {
  const endpoint = "/api/860-votos" + (post ? "" : "?session=" + encodeURIComponent(session));
  const response = await fetch(endpoint, {method:post?"POST":"GET", credentials:"same-origin",cache:"no-store",
    headers:post?{"Content-Type":"application/json"}:undefined, body:post?JSON.stringify({...post,session}):undefined,signal});
  if(!response.ok) throw new BallotError(response.status);
  return response.json() as Promise<T>;
}
