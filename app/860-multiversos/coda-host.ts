import {useEffect, useRef, useState} from "react";
import {ballotRequest, isRound, type Ballot, type Choice, type Host} from "./coda-ballot";

type Cue = {scene:number; beginsAt:number; duration:number; clock:AudioContext};

/** One serial command stream per presentation, including seeks, retries and early advances. */
export function useHostedBallot(cue:Cue) {
  const desired=useRef(cue);
  const wake=useRef(()=>{});
  const [host,setHost]=useState<Host|null>(null);
  const [state,setState]=useState<Ballot|null>(null);
  const [colorSound,setColorSound]=useState<Choice|null>(null);
  const [issue,setIssue]=useState(false);
  const [clockOffset,setClockOffset]=useState(0);
  useEffect(()=>{
    desired.current=cue;
    wake.current();
  },[cue.scene,cue.beginsAt,cue.duration,cue.clock]);
  useEffect(()=>{
    let disposed=false, busy=false, again=false, created=false;
    let credentials:Host|undefined, snapshot:Ballot|null=null;
    let previous=desired.current.scene, timer=0;
    const abort=new AbortController();
    const command=(action:string, extra:Record<string,unknown>={})=>
      ballotRequest<Ballot>(credentials!.session,{action,hostToken:credentials!.hostToken,...extra},abort.signal);
    function receive(next:Ballot){
      snapshot=next;
      if(disposed)return;
      setState(next);
      setClockOffset(Date.parse(next.serverTime)-Date.now());
      if(!next.open && next.winner && next.scene!==null && desired.current.scene>next.scene)setColorSound(next.winner);
    }
    async function sync(){
      window.clearTimeout(timer);
      if(disposed)return;
      if(busy){again=true;return;}
      busy=true;
      again=false;
      let delay=0;
      try {
        const {scene,clock,beginsAt,duration}=desired.current;
        if(!location.protocol.startsWith("http")){setIssue(true);return;}
        if(scene<previous && snapshot?.scene && scene<=snapshot.scene){
          if(snapshot.open)await command("close",{scene:snapshot.scene});
          credentials=undefined;created=false;snapshot=null;
          if(!disposed){setState(null);setHost(null);setColorSound(null);}
        }
        previous=scene;
        if(!created && scene<=100){
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
        if(isRound(scene) && snapshot?.scene!==scene){
          const left=duration ? duration-Math.max(0,clock.currentTime-beginsAt) : 28;
          if(left>0)receive(await command("open",{scene,duration:Math.max(1,Math.min(22,Math.floor(left-(left>7?3:0))))}));
        }else if(snapshot?.open || !snapshot){
          receive(await ballotRequest<Ballot>(credentials.session,undefined,abort.signal));
        }
        if(snapshot && !snapshot.open && snapshot.winner && snapshot.scene!==null && scene>snapshot.scene && !disposed)setColorSound(snapshot.winner);
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
  },[]);
  return {session:host?.session,state,colorSound,issue,clockOffset};
}
