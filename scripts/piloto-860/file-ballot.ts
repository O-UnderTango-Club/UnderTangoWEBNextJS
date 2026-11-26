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
type LocalRound = {host:string; scene:number|null; closes:number; vote:Choice|null};
function rehearsalRequest(session:string, post?:Record<string,unknown>):Ballot|Host {
  const key="860-piloto-apertura:voto:"+session;
  const action=post?.action??"state", saved=localStorage.getItem(key);
  const round:LocalRound|undefined=saved?JSON.parse(saved):undefined;
  const now=Date.now();
  if(action==="create"){
    const host=String(post?.hostToken??"");
    if(round && round.host!==host)throw new BallotError(403);
    if(!round)localStorage.setItem(key,JSON.stringify({host,scene:null,closes:0,vote:null}));
    return {session,hostToken:host};
  }
  if(!round)throw new BallotError(404);
  if((action==="open"||action==="close") && post?.hostToken!==round.host)throw new BallotError(403);
  if(action==="open"){
    const scene=Number(post?.scene);
    if(!isRound(scene))throw new BallotError(400);
    if(round.scene!==scene){round.scene=scene;round.closes=now+Number(post?.duration)*1000;round.vote=null;}
  } else if(action==="close" && post?.scene===round.scene)round.closes=Math.min(round.closes,now);
  else if(action==="vote"){
    if(round.scene!==post?.scene || now>=round.closes)throw new BallotError(409);
    const color=String(post?.color), sound=String(post?.sound);
    if(!Object.hasOwn(PALETTES,color)||!Object.hasOwn(TIMBRES,sound))throw new BallotError(400);
    round.vote??={color:color as Color,sound:sound as Timbre};
  }
  if(action!=="state")localStorage.setItem(key,JSON.stringify(round));
  const open=now<round.closes;
  return {session,scene:round.scene,closesAt:round.closes?new Date(round.closes).toISOString():null,serverTime:new Date(now).toISOString(),
    open,total:round.vote?1:0,voted:!!round.vote,winner:open?null:round.vote};
}

export async function ballotRequest<T>(session:string,post?:Record<string,unknown>,signal?:AbortSignal):Promise<T> {
    const read=()=>{signal?.throwIfAborted();return rehearsalRequest(session,post) as T;};
    return navigator.locks ? navigator.locks.request("860-piloto-apertura:voto:"+session,read) : read();
}
