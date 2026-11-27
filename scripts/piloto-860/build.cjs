const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const [controlFile, outputFile, durationFile, mediaListFile] = process.argv.slice(2);
if (!controlFile || !outputFile) throw Error("Uso: node scripts/piloto-860/build.cjs Controles-860.json|--publico ensayo.html [duraciones.json] [lista-de-medios.json]");
const portable = controlFile === "--publico";
const storageName = portable ? "860-portatil" : "860-piloto-apertura";
const root = path.resolve(__dirname, "../..");
const route = path.join(root, "app/860-multiversos");
const read = file => fs.readFileSync(file, "utf8");
const controls = portable ? null : JSON.parse(read(controlFile));
const officialTimes = durationFile ? JSON.parse(read(durationFile)) : null;
if (durationFile && (!Array.isArray(officialTimes) || officialTimes.length !== 111 || !officialTimes.every(n => Number.isFinite(n) && n > 0))) {
  throw Error("Se necesitan las duraciones de las 111 escenas oficiales.");
}
if (!portable && (controls.format !== "undertango-860/controles-v1" || !controls.settings)) throw Error("Falta el mapa del Órganon.");
const entries = fs.readdirSync(route).filter(name => /\.tsx?$/.test(name) && !["page.tsx","layout.tsx"].includes(name));
entries.push("organon/page.tsx", "votar/page.tsx");
const mime = {".wav":"audio/wav",".mp3":"audio/mpeg",".mp4":"video/mp4",".png":"image/png",".jpg":"image/jpeg"};
const assets = new Map();
function inlineAssets(source) {
  return source.replaceAll(/(["'])\/multiversos\/([\w.-]+)\1/g, (_, quote, asset) => {
    if (!assets.has(asset)) {
      const bytes=fs.readFileSync(path.join(root,"public/multiversos",asset));
      assets.set(asset,"data:"+mime[path.extname(asset)]+";base64,"+bytes.toString("base64"));
    }
    return "__assets["+JSON.stringify(asset)+"]";
  });
}

const modules = entries.map(name => {
  let source = read(path.join(route,name));
  // File previews have their own ballot on this computer and never open a public voting session.
  if (name === "coda-ballot.ts") source = read(path.join(__dirname, "file-ballot.ts")).replaceAll("../../app/860-multiversos/coda-questions","./coda-questions");
  if (name === "coda-host.ts") {
    source = source.replace('if(!location.protocol.startsWith("http")){setIssue(true);return;}', "")
      .replace(/void fetch\("\/api\/860-votos",[\s\S]*?\}\)\.catch\(\(\)=>\{\}\);/, 'void ballotRequest(credentials.session,{action:"close",hostToken:credentials.hostToken,scene:snapshot.scene}).catch(()=>{});');
  }
  if (name === "coda-projection.tsx") {
    source = source.replace('"/860-multiversos/votar?s="+session','location.href.split("#")[0]+"#votar?s="+session')
      .replace(/<img src=\{[^}]+votar\/qr[^>]+\/>/, '<span style={{display:"block",color:"#171925",padding:"1em"}}>Votar en esta PC ↗</span>');
  }
  if (name === "votar/page.tsx") source = source.replace('new URLSearchParams(location.search)', 'new URLSearchParams(location.hash.split("?")[1])');
  source = inlineAssets(source);
  // A JSX attribute needs an expression for an embedded resource.
  source = source.replaceAll(/src=__assets\["([^"]+)"\]/g,'src={__assets["$1"]}');
  if (name==="partitura.tsx") source=source.replace('href="/860-multiversos/organon"','href="#organon"')
    .replace('href="/860-multiversos/materiales.html"', portable ? 'href="./Guia-de-montaje.html"' : 'href="https://www.undertangoclub.com/860-multiversos/materiales.html"');
  if (name==="organon/page.tsx") source=source.replace('href="/860-multiversos"', 'href={location.href.split("#")[0]}');
  if (name==="control-map.ts") source=source.replaceAll("860-multiversos:",storageName+":")
    .replace("const directory = await navigator.storage.getDirectory();",
      'const directory = await (await navigator.storage.getDirectory()).getDirectoryHandle('+JSON.stringify(storageName)+', {create:true});');
  if (name==="dj-library.ts") source=source.replace('"860-multiversos-dj"',JSON.stringify(storageName+"-dj"));
  if (name.endsWith(".tsx")) source='import React from "react";\n'+source;
  const result=ts.transpileModule(source,{fileName:name,reportDiagnostics:true,compilerOptions:{
    jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2021,module:ts.ModuleKind.CommonJS,esModuleInterop:true
  }});
  if (result.diagnostics?.length) throw Error(ts.flattenDiagnosticMessageText(result.diagnostics[0].messageText,"\n")+" · "+name);
  return JSON.stringify(name.replace(/\.tsx?$/,""))+":(module,exports,require)=>{\n"+result.outputText+"\n}";
});
const videoCatalog = JSON.stringify(JSON.parse(read(path.join(route,"scene-videos.json"))));
modules.push('"scene-videos.json":(module)=>{module.exports='+inlineAssets(videoCatalog)+';}');
const styles = {};
const css = ["page.module.css","organon/page.module.css","votar/votar.module.css"].map(file=>{
  const mapping={};
  const prefix=file.includes("/") ? file.split("/")[0]+"-" : "";
  const sheet=read(path.join(route,file)).replace(/\.([A-Za-z_][\w-]*)/g,(_,key)=>{
    mapping[key]=prefix+key;
    return "."+mapping[key];
  });
  styles[file]=mapping;
  return sheet;
}).join("\n");

async function openScore(factories, styles, baseline, officialTimes) {
  const cache = new Map([["react",React],["react-dom",ReactDOM],...Object.entries(styles)]);
  function load(name) {
    if(cache.has(name)) return cache.get(name);
    const module={exports:{}};
    const resolve=id=>{
      if(!id.startsWith(".")) return load(id);
      const parts=name.split("/").slice(0,-1);
      for(const part of id.split("/")) {
        if(part==="..") parts.pop();
        else if(part!==".") parts.push(part);
      }
      return load(parts.join("/"));
    };
    cache.set(name,module.exports);
    factories[name](module,module.exports,resolve);
    cache.set(name,module.exports);
    return module.exports;
  }
  const voter=location.hash.startsWith("#votar?");
  if(!voter){
    const map=load("control-map");
    try {
      const previousTimes = map.SETTINGS_PREFIX + "sceneSeconds111";
      const pilotTimes = map.SETTINGS_PREFIX + "sceneSeconds112";
      if (officialTimes && localStorage.getItem(previousTimes) === null && localStorage.getItem(pilotTimes) === null) {
        localStorage.setItem(previousTimes, JSON.stringify(officialTimes));
      }
      const seed=async()=>{
        if(localStorage.getItem(map.JOURNAL_KEY))return;
        let first=baseline;
        try {
          const dir=await (await navigator.storage.getDirectory()).getDirectoryHandle("860-piloto-apertura");
          const existing=await (await (await dir.getFileHandle(map.CONTROL_FILE)).getFile()).text();
          if(existing){map.parseControlFile(existing);first=JSON.parse(existing);}
        } catch { /* A first rehearsal starts with the exported operator map. */ }
        const verified=map.parseControlFile(JSON.stringify(first));
        for(const [name,value] of Object.entries(verified.settings)){
          const key=map.SETTINGS_PREFIX+name;
          if(localStorage.getItem(key)===null)localStorage.setItem(key,JSON.stringify(value));
        }
        localStorage.setItem(map.JOURNAL_KEY,JSON.stringify(first));
      };
      if (baseline) {
        if(navigator.locks)await navigator.locks.request(map.JOURNAL_KEY,seed);
        else await seed();
      }
      await map.archiveControls();
      for(const [name,value] of [["mixerMatrixEnabled",false],["mixerLiveEnabled",true]]){
        const key=map.SETTINGS_PREFIX+name;
        if(localStorage.getItem(key)===null) localStorage.setItem(key,JSON.stringify(value));
      }
    } catch (error) {console.warn("No se pudo preparar el mapa local de 860.",error);}
  }
  const view=location.hash==="#organon"?"organon/page":voter?"votar/page":"partitura";
  ReactDOM.createRoot(document.getElementById("app")).render(React.createElement(load(view).default));
}
const preamble = 'const __assets='+JSON.stringify(Object.fromEntries(assets))+';\n';
const runtime = preamble+"("+openScore.toString()+")({"+modules.join(",\n")+"},"+JSON.stringify(styles)+","+JSON.stringify(controls)+","+JSON.stringify(officialTimes)+");";
const reactDir = path.dirname(require.resolve("react/package.json"));
const domDir = path.dirname(require.resolve("react-dom/package.json"));
const scripts = [read(path.join(reactDir,"umd/react.production.min.js")),read(path.join(domDir,"umd/react-dom.production.min.js")),runtime];
const title=portable ? "860 Multiversos · Partitura portátil" : "860 Multiversos · Piloto de apertura";
const html='<!doctype html><html lang="es-AR" data-ensayo="860"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+'</title><style>:root{--font-undertango-sans:system-ui;--font-undertango-editorial:Georgia}body{margin:0;background:#11131a}*,*::before,*::after{box-sizing:border-box}'+css+'</style></head><body><div id="app"></div>'+scripts.map(js=>'<script>'+js.replaceAll(/<\/script/gi,'<\\/script')+'</script>').join("")+'</body></html>';
fs.writeFileSync(outputFile,html);
if (mediaListFile) fs.writeFileSync(mediaListFile, JSON.stringify([...assets.keys()].sort()));
console.log(path.resolve(outputFile)+" · "+assets.size+" recursos audiovisuales");
