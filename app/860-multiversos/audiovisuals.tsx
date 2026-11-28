import { useEffect, useRef, useState } from "react";
import { localMediaFiles, type LibraryFile } from "./media-library";
import { useProjectionSignals } from "./projection-signals";
import { useSavedSetting } from "./saved-setting";
import { ACTIVE_SCORE, displaySceneNumber, type ShowScene } from "./show-score";

type Film = { id:string; title:string; url:string; scene:ShowScene; opacity:number };
type FilmSettings = Pick<Film, "scene" | "opacity">;
const filmLibrary = "860-multiversos-audiovisuales";
const initialFilm: FilmSettings = {scene:62,opacity:24};

export function useAudiovisuals() {
  const [enabled,setEnabled] = useSavedSetting("showAudiovisuals",true);
  const [settings,setSettings] = useSavedSetting<Record<string,FilmSettings>>("audiovisualSettings",{});
  const [local,setLocal] = useState<Film[]>([]);
  const [notice,setNotice] = useState("");
  const urls=useRef(new Map<string,string>());
  useEffect(()=>{
    let active=true;
    void localMediaFiles(filmLibrary).then(records=>{
      if (active) merge(records);
    }).catch(()=>{
      if (active) setNotice("No se pudo abrir la biblioteca de videos de este navegador.");
    });
    return ()=>{
      active=false;
      for (const url of urls.current.values()) URL.revokeObjectURL(url);
      urls.current.clear();
    };
  },[]);

  function merge(records:LibraryFile[]) {
    const added=records.map(({id,file}):Film=>{
      let url=urls.current.get(id);
      if (!url) {url=URL.createObjectURL(file);urls.current.set(id,url);}
      return {id, title:file.name, url, scene:initialFilm.scene, opacity:initialFilm.opacity};
    });
    setLocal(current=>[...new Map([...current,...added].map(film=>[film.id,film])).values()]);
  }

  async function addVideos(files:File[]) {
    const records=files.filter(file=>file.type.startsWith("video/") || /\.(mp4|webm|ogv|mov|m4v)$/i.test(file.name))
      .map(file=>({id:JSON.stringify([file.name,file.size,file.lastModified]),file}));
    if (!records.length) {setNotice("Elegí un archivo de video.");return;}
    merge(records);
    setNotice("");
    try {await localMediaFiles(filmLibrary,records);}
    catch {setNotice("El video queda disponible durante esta sesión. El navegador no pudo guardarlo.");}
  }

  const films=local.map(film=>({...film,...settings[film.id]}));
  function change(film:Film, update:Partial<FilmSettings>) {
    setSettings(current=>({...current,[film.id]:{scene:film.scene,opacity:film.opacity,...current[film.id],...update}}));
  }
  return {enabled,setEnabled,films,change,notice,addVideos,setNotice};
}

type Audiovisuals = ReturnType<typeof useAudiovisuals>;

export function AudiovisualControls({audiovisuals}: {audiovisuals:Audiovisuals}) {
  const {enabled,setEnabled,films,change,notice,addVideos}=audiovisuals;
  return <>
    <label className="zero-subtitle-toggle">Activar audiovisuales
      <input type="checkbox" role="switch" checked={enabled} onChange={event=>setEnabled(event.currentTarget.checked)} />
    </label>
    <details className="av-settings">
      <summary>Ajustes de audiovisuales</summary>
      <div className="av-options">
        {films.map(film=><div className="av-setting" key={film.id}>
          <strong title={film.title}>{film.title}</strong>
          <label>Desde escena
            <select value={film.scene} aria-label={"Escena de inicio de "+film.title}
              onChange={event=>change(film,{scene:Number(event.currentTarget.value) as ShowScene})}>
              {ACTIVE_SCORE.map(({number,title})=><option key={number} value={number}>
                {displaySceneNumber(number)} · {title}
              </option>)}
            </select>
          </label>
          <label>Opacidad · {film.opacity} %
            <input type="range" min={0} max={100} value={film.opacity} aria-label={"Opacidad de "+film.title}
              onChange={event=>change(film,{opacity:event.currentTarget.valueAsNumber})}/>
          </label>
        </div>)}
        <label className="av-files">Agregar audiovisual
          <input type="file" accept="video/*,.mp4,.webm,.mov" multiple onChange={event=>{
            const files=Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value="";
            if (files.length) void addVideos(files);
          }}/>
        </label>
      </div>
    </details>
    {notice && <small role="status">{notice}</small>}
  </>;
}

function FilmLayer({film,paused,onError}: {film:Film; paused:boolean; onError:(message:string)=>void}) {
  const video=useRef<HTMLVideoElement>(null);
  const signals=useProjectionSignals();
  const maximum=film.opacity/100;
  useEffect(()=>{
    const element=video.current!;
    if (paused) {element.pause();return;}
    let active=true;
    void element.play().catch((error:DOMException)=>{
      if (active && error.name!=="AbortError") onError("No se pudo reproducir «"+film.title+"».");
    });
    return ()=>{active=false;element.pause();};
  },[film.title,film.url,onError,paused]);

  useEffect(()=>{
    const element=video.current!;
    const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || paused) {
      element.style.opacity=String(maximum);
      return;
    }
    let frame=0, energy=0, last=0;
    function draw(now:number) {
      frame=requestAnimationFrame(draw);
      if (now-last<30) return;
      const {rms,attack,low}=signals.current;
      energy += (Math.min(1,rms*3 + attack*.38 + low*.18)-energy)*.22;
      element.style.opacity=(maximum*(.76+.24*energy)).toFixed(3);
      last=now;
    }
    frame=requestAnimationFrame(draw);
    return ()=>cancelAnimationFrame(frame);
  },[maximum,paused,signals]);

  return <video className="av-layer" data-audiovisual={film.id} ref={video} src={film.url} muted loop playsInline
    aria-hidden="true" style={{opacity:maximum}} />;
}

export function AudiovisualLayers({audiovisuals,scene,paused}: {
  audiovisuals:Audiovisuals; scene:ShowScene|null; paused:boolean;
}) {
  if (scene===null || !audiovisuals.enabled) return null;
  return <>{audiovisuals.films.filter(film=>scene>=film.scene && film.opacity>0).map(film=>
    <FilmLayer key={film.id} film={film} paused={paused} onError={audiovisuals.setNotice} />
  )}</>;
}
