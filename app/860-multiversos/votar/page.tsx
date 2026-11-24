"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {ballotRequest,BallotError,INKS,PALETTES,remainingSeconds,ROUNDS,TIMBRES,type Ballot,type Color,type Timbre} from "../coda-ballot";
import styles from "./votar.module.css";

export default function VotePage(){
  const [session,setSession]=useState<string|null>(null);
  const [state,setState]=useState<Ballot|null>(null);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [color,setColor]=useState<Color|null>(null);
  const [sound,setSound]=useState<Timbre|null>(null);
  const [offset,setOffset]=useState(0);
  const [,tick]=useState(0);
  const latest=useRef<Ballot|null>(null);
  const accept=useCallback((next:Ballot)=>{
    const previous=latest.current;
    if(previous && Date.parse(previous.serverTime)>Date.parse(next.serverTime))return;
    if(previous?.scene!==next.scene){setColor(null);setSound(null);}
    latest.current=next;
    setState(next);setOffset(Date.parse(next.serverTime)-Date.now());
  },[]);
  useEffect(()=>{setSession(new URLSearchParams(location.search).get("s")||"");},[]);
  useEffect(()=>{
    if(!session || !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(session))return;
    const abort=new AbortController();let timer=0;
    const poll=async()=>{
      try{
        const next=await ballotRequest<Ballot>(session,undefined,abort.signal);
        if(abort.signal.aborted)return;
        accept(next);setMessage("");
        if(next.scene===100 && !next.open)return;
      }catch(error){
        if(abort.signal.aborted)return;
        if(error instanceof BallotError && error.status===404){setMessage("Esta función ya no está disponible. Escaneá el QR de la pantalla.");return;}
        setMessage("Se perdió la conexión. Reconectando…");
      }
      timer=window.setTimeout(poll,1500);
    };
    void poll();
    return ()=>{abort.abort();clearTimeout(timer);};
  },[session,accept]);
  useEffect(()=>{
    if(!state?.open)return;
    const timer=window.setInterval(()=>tick(n=>n+1),300);
    return ()=>clearInterval(timer);
  },[state?.open]);
  const remaining=state?remainingSeconds(state,offset):0;
  const open=!!state?.open && remaining>0;
  const invalid=session!==null && !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(session);
  async function vote(){
    if(!session||!state?.scene||!color||!sound||busy||!open||state.voted)return;
    setBusy(true);
    try{accept(await ballotRequest<Ballot>(session,{action:"vote",scene:state.scene,color,sound}));setMessage("");}
    catch(error){
      setMessage(error instanceof BallotError && error.status===409?"La ronda ya cerró.":"Tu voto no se pudo confirmar. Volvé a intentar mientras la ronda esté abierta.");
    }finally{setBusy(false);}
  }
  const last=state?.scene===100 && !open;
  return <main className={styles.page}><div className={styles.card}>
    <header><span>Ø UnderTango Club</span><b>Multiversos 860</b></header>
    {invalid?<><h1>Votación de la sala</h1><p>Escaneá el QR que aparece en la proyección para entrar en tu función.</p></>:<>
      <div className={styles.status}><span>{state?.scene?`Ronda ${ROUNDS.indexOf(state.scene as typeof ROUNDS[number])+1} de 3`:"Votación de la sala"}</span>
        {open && <span className={styles.timer} aria-label="Segundos restantes">{remaining} s</span>}</div>
      <h1>{state?.voted && open?"Tu voto quedó registrado":open?"Elegí la próxima escena":last?"Gracias por participar":state?.scene?"La ronda cerró":"La sala elige"}</h1>
      {open && !state?.voted?<form onSubmit={e=>{e.preventDefault();void vote();}}>
        <fieldset disabled={busy}><legend>Color</legend><div className={styles.choices}>
          {(Object.keys(PALETTES) as Color[]).map(c=><label key={c}><input type="radio" name="color" checked={color===c} onChange={()=>setColor(c)}/>
            <span><i style={{background:INKS[c]}}/>{PALETTES[c]}</span></label>)}</div></fieldset>
        <fieldset disabled={busy}><legend>Sonido</legend><div className={styles.choices}>
          {(Object.keys(TIMBRES) as Timbre[]).map(s=><label key={s}><input type="radio" name="sound" checked={sound===s} onChange={()=>setSound(s)}/><span>{TIMBRES[s]}</span></label>)}
        </div></fieldset>
        <button disabled={!color||!sound||busy} type="submit">{busy?"Enviando…":"Enviar mi voto"}</button>
      </form>:<p aria-live="polite">{state?.voted && open?"La elección de la sala aparecerá en la proyección.":state?.winner?
        `La sala eligió ${PALETTES[state.winner.color].toLowerCase()} y ${TIMBRES[state.winner.sound].toLowerCase()}.`:
        state?.open?"Contando los votos…":last?"La última votación terminó.":state?.scene?"Esperá la siguiente ronda en esta página.":"Dejá esta página abierta. Cuando empiece la ronda podés elegir un color y un sonido."}</p>}
      {message && <p role="status">{message}</p>}
    </>}
  </div></main>;
}
