import {useEffect, useRef, useState} from "react";
import {applyWinner, ballotRequest, DEFAULT_ATMOSPHERE, isRound, type Ballot, type Host} from "./coda-ballot";

type Cue = {scene:number; beginsAt:number; duration:number; clock:AudioContext|null};

/** One serial command stream per presentation, including seeks, retries and early advances. */
export function useHostedBallot(cue:Cue) {
  const desired=useRef(cue);
  const wake=useRef(()=>{});
  const [host,setHost]=useState<Host|null>(null);
  const [state,setState]=useState<Ballot|null>(null);
  const [atmosphere,setAtmosphere]=useState(DEFAULT_ATMOSPHERE);
  const [issue,setIssue]=useState(false);
  const [clockOffset,setClockOffset]=useState(0);
  useEffect(()=>{
    desired.current=cue;
    wake.current();
  },[cue.scene,cue.beginsAt,cue.duration,cue.clock]);
  useEffect(()=>{
    setHost(null);setState(null);setAtmosphere(DEFAULT_ATMOSPHERE);setIssue(false);
    const clock=cue.clock;
    if(!clock)return;
    let disposed=false, busy=false, again=false, created=false;
    let credentials:Host|undefined, snapshot:Ballot|null=null;
    let timer=0;
    const abort=new AbortController();
    const command=(action:string, extra:Record<string,unknown>={})=>
      ballotRequest<Ballot>(credentials!.session,{action,hostToken:credentials!.hostToken,...extra},abort.signal);
    function receive(next:Ballot){
      snapshot=next;
      if(disposed)return;
      setState(next);
      setClockOffset(Date.parse(next.serverTime)-Date.now());
      if(!next.open && next.winner && next.scene!==null){
        const {scene,winner}=next;
        setAtmosphere(previous=>applyWinner(previous,scene,winner));
      }
    }
    const sync=async()=>{
      window.clearTimeout(timer);
      if(disposed)return;
      if(busy){again=true;return;}
      busy=true;
      again=false;
      let delay=0;
      try {
        const {scene,beginsAt,duration}=desired.current;
        if(!location.protocol.startsWith("http")){setIssue(true);return;}
        if(!created && scene>=90 && scene<=100){
          credentials??={session:crypto.randomUUID(),hostToken:crypto.randomUUID()};
          const result=await ballotRequest<Host>(credentials.session,{action:"create",hostToken:credentials.hostToken},abort.signal);
          credentials=result;created=true;
          if(!disposed)setHost(result);
        }
        if(disposed || !created || !credentials)return;
        if(snapshot?.scene!==null && snapshot?.scene!==undefined && snapshot.scene!==scene && snapshot.open){
          receive(await command("close",{scene:snapshot.scene}));
        }
        if(scene!==desired.current.scene){again=true;return;}
        if(isRound(scene) && scene>(snapshot?.scene??0)){
          const left=duration ? duration-Math.max(0,clock.currentTime-beginsAt) : 28;
          if(left>0)receive(await command("open",{scene,duration:Math.max(1,Math.min(22,Math.floor(left-(left>7?3:0))))}));
        }else if(snapshot?.open || !snapshot){
          receive(await ballotRequest<Ballot>(credentials.session,undefined,abort.signal));
        }
        if(!disposed)setIssue(false);
        if(snapshot?.open)delay=1000;
      }catch{
        if(!disposed){setIssue(true);delay=2200;}
      }finally{
        busy=false;
        if(!disposed && (again||delay))timer=window.setTimeout(sync,again?0:delay);
      }
    }
    wake.current=()=>void sync();
    void sync();
    return ()=>{
      disposed=true;wake.current=()=>{};window.clearTimeout(timer);abort.abort();
      if(created && credentials && snapshot?.open){
        void fetch("/api/860-votos",{method:"POST",keepalive:true,headers:{"Content-Type":"application/json"},
          body:JSON.stringify({action:"close",...credentials,scene:snapshot.scene})}).catch(()=>{});
      }
    };
  },[cue.clock]);
  return {session:host?.session,state,atmosphere,issue,clockOffset};
}
