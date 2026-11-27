import {useRef,type CSSProperties} from "react";
import type {CcBinding} from "./control-map";
import {MASTER_FILTERS,filterFader,type FilterFader,type FilterValues,type MasterFilter} from "./master-filters";

export function FilterControls({values,change,bindings,learning,learn}:{
  values:FilterValues;change:(id:MasterFilter,value:number)=>void;
  bindings:Record<string,CcBinding>;learning:FilterFader|null;learn:(target:FilterFader)=>void;
}) {
  const drag=useRef<{pointer:number;id:MasterFilter;x:number;y:number;value:number}|null>(null);
  return <div className="master-filters" role="group" aria-label="Filtros del máster">
    <strong>Filtros</strong>
    <div className="master-filter-row">
      {MASTER_FILTERS.map(({id,label,short,description})=>{
        const value=values[id] ?? 0;
        const target=filterFader(id), binding=bindings[target], active=learning===target;
        const prompt=active ? "Cancelar asignación MIDI de "+label :
          (binding ? "Reasignar MIDI de " : "Asignar MIDI a ")+label;
        const assigned=binding ? (binding.inputName || binding.inputId)+" · "+
          (binding.cc<0 ? "Pitch Bend" : "CC "+binding.cc)+" · canal "+((binding.bendChannel ?? binding.ccChannel ?? 0)+1) : "";
        return <div key={id} className="master-filter" title={description+" · "+value+"%"}>
          <span className="master-filter-face" data-active={value>0} style={{"--knob-angle":(-135+value*2.7)+"deg"} as CSSProperties}>
            <input type="range" aria-label={label} aria-valuetext={value+" %"} min={0} max={100} step={1} value={value}
              onChange={event=>change(id,event.currentTarget.valueAsNumber)}
              onKeyDown={event=>{
                const offsets:Record<string,number>={ArrowUp:1,ArrowRight:1,ArrowDown:-1,ArrowLeft:-1,PageUp:10,PageDown:-10,Home:-100,End:100};
                const offset=offsets[event.key];
                if(offset===undefined)return;
                event.preventDefault();
                change(id,Math.max(0,Math.min(100,value+offset)));
              }}
              onPointerDown={event=>{
                if(event.button!==0)return;
                event.preventDefault();
                event.currentTarget.focus();
                event.currentTarget.setPointerCapture(event.pointerId);
                drag.current={pointer:event.pointerId,id,x:event.clientX,y:event.clientY,value};
              }}
              onPointerMove={event=>{
                const start=drag.current;
                if(start?.pointer!==event.pointerId || start.id!==id)return;
                const delta=event.clientX-start.x+start.y-event.clientY;
                change(id,Math.max(0,Math.min(100,Math.round(start.value+delta))));
              }}
              onLostPointerCapture={()=>{drag.current=null;}}
              onDoubleClick={()=>change(id,0)}
            />
          </span>
          <span aria-hidden="true">{short}</span>
          <button type="button" className="master-filter-midi" aria-label={prompt}
            title={assigned ? prompt+" · "+assigned : prompt} aria-pressed={active}
            data-assigned={!!binding} onClick={()=>learn(target)}>MIDI</button>
        </div>;
      })}
    </div>
  </div>;
}
