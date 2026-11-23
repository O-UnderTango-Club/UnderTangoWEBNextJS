import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useSavedSetting } from "./saved-setting";

function useTransport() {
  const [bpm,setBpm]=useSavedSetting("mixerBpm",111);
  const [locked,setLocked]=useState(false);
  const phase=useRef({context:null as BaseAudioContext|null,origin:0,bpm});
  const clock=useCallback((ctx:BaseAudioContext)=>{
    const t=phase.current, now=ctx.currentTime;
    if(t.context!==ctx){t.context=ctx;t.origin=now;t.bpm=bpm;}
    if(t.bpm!==bpm){
      const elapsed=(now-t.origin)*t.bpm/60;
      t.origin=now-elapsed*60/bpm;t.bpm=bpm;
    }
    return t.origin;
  },[bpm]);
  return useMemo(()=>({bpm,setBpm,clock,locked,setLocked}),[bpm,setBpm,clock,locked]);
}
const Tempo=createContext<ReturnType<typeof useTransport>|null>(null);
export function TempoProvider({children}:{children:ReactNode}){
  return <Tempo.Provider value={useTransport()}>{children}</Tempo.Provider>;
}
export function useTempo(){
  const transport=useContext(Tempo);
  if(!transport)throw new Error("Falta el reloj de la partitura");
  return transport;
}
