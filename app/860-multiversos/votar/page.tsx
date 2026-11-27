"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {ballotRequest,BallotError,INKS,questionFor,remainingSeconds,ROUNDS,winnerLabel,type Ballot,type Color} from "../coda-ballot";
import styles from "./votar.module.css";

const sessionPattern=/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;
const lastRound=ROUNDS[ROUNDS.length-1];

export default function VotePage(){
  const [session,setSession]=useState<string|null>(null);
  const [state,setState]=useState<Ballot|null>(null);
  const [message,setMessage]=useState("");
  const [submitting,setSubmitting]=useState<number|null>(null);
  const [option,setOption]=useState("");
  const [offset,setOffset]=useState(0);
  const [,tick]=useState(0);
  const latest=useRef<Ballot|null>(null);
  const accept=useCallback((next:Ballot)=>{
    const previous=latest.current;
    if(previous && (Date.parse(previous.serverTime)>Date.parse(next.serverTime) ||
      (previous.scene??0)>(next.scene??0) ||
      (previous.scene===next.scene && ((!previous.open && next.open) || (previous.voted && !next.voted)))))return false;
    if(previous?.scene!==next.scene)setOption("");
    latest.current=next;
    setState(next);setOffset(Date.parse(next.serverTime)-Date.now());
    return true;
  },[]);
  useEffect(()=>{setSession(new URLSearchParams(location.search).get("s")||"");},[]);
  useEffect(()=>{
    if(!session || !sessionPattern.test(session))return;
    const abort=new AbortController();let timer=0, polling=false;
    const poll=async()=>{
      if(polling || abort.signal.aborted)return;
      polling=true;
      clearTimeout(timer);
      try{
        const next=await ballotRequest<Ballot>(session,undefined,abort.signal);
        if(abort.signal.aborted)return;
        if(accept(next))setMessage("");
        if(next.scene===lastRound && !next.open)return;
      }catch(error){
        if(abort.signal.aborted)return;
        if(error instanceof BallotError && error.status===404){setMessage("Esta función terminó o ya no está disponible.");return;}
        setMessage("Se perdió la conexión. Reconectando…");
      }finally{polling=false;}
      timer=window.setTimeout(poll,1500);
    };
    const wake=()=>{if(!document.hidden)void poll();};
    document.addEventListener("visibilitychange",wake);
    window.addEventListener("online",wake);
    void poll();
    return ()=>{
      abort.abort();clearTimeout(timer);
      document.removeEventListener("visibilitychange",wake);window.removeEventListener("online",wake);
    };
  },[session,accept]);
  useEffect(()=>{
    if(!state?.open)return;
    const timer=window.setInterval(()=>tick(n=>n+1),300);
    return ()=>clearInterval(timer);
  },[state?.open]);
  const remaining=state?remainingSeconds(state,offset):0;
  const open=!!state?.open && remaining>0;
  const scene=state?.scene??null;
  const question=questionFor(scene);
  const busy=submitting===scene && scene!==null;
  const invalid=session!==null && !sessionPattern.test(session);
  const last=scene===lastRound && state?.open===false;
  const result=state?.winner && winnerLabel(scene,state.winner);
  async function vote(){
    if(!session || scene===null || !option || busy || !open || state?.voted)return;
    setSubmitting(scene);
    try{
      if(accept(await ballotRequest<Ballot>(session,{action:"vote",scene,option})))setMessage("");
    }catch(error){
      if(latest.current?.scene===scene)setMessage(error instanceof BallotError && error.status===409?
        "La ronda ya cerró.": "Tu voto todavía no se pudo confirmar. Podés reintentar durante esta ronda.");
    }finally{setSubmitting(current=>current===scene ? null : current);}
  }
  return <main className={styles.page}><div className={styles.card}>
    <header><span>Ø UnderTango Club</span><b>Multiversos 860</b></header>
    {invalid?<><h1>Votación de la sala</h1><p>Escaneá el QR de la proyección para entrar en tu función.</p></>:<>
      <div className={styles.status}><span>{question && scene!==null?`Ronda ${ROUNDS.findIndex(round=>round===scene)+1} de ${ROUNDS.length}`:"Votación de la sala"}</span>
        {open && <span className={styles.timer} aria-label="Segundos restantes">{remaining} s</span>}</div>
      <h1>{last?"Gracias por participar":open && state?.voted?"Voto registrado":open && question?question.title:scene!==null?"Ronda cerrada":"La sala elige"}</h1>
      {open && !state?.voted && question?<form onSubmit={e=>{e.preventDefault();void vote();}}>
        <fieldset disabled={busy} aria-label={question.title}><div className={styles.choices}>
          {question.options.map(({id,label})=><label key={id}><input type="radio" name="option" value={id} checked={option===id} onChange={()=>setOption(id)}/>
            <span>{scene===100 && <i aria-hidden="true" style={{background:INKS[id as Color]}}/>}{label}</span></label>)}
        </div></fieldset>
        <button disabled={!option||busy} type="submit">{busy?"Enviando…":"Enviar mi voto"}</button>
      </form>:<p aria-live="polite">{result && <>La sala eligió <strong>{result}</strong>.{" "}</>}
        {last?"La combinación final se escucha y se ve en la sala.":state?.open && !open?"Contando los votos…":"Dejá esta página abierta. La próxima pregunta aparece acá cuando se habilite."}</p>}
      {message && <p role="status">{message}</p>}
    </>}
  </div></main>;
}
