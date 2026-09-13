"use client";
import { useEffect, useRef, useState } from 'react';
import { FRONTS, ALL_DAYS, type Board } from '../../src/lib/panel-model';
import css from './panel.module.css';
import WeekdayPicker from './WeekdayPicker';
export default function GroupForm({data,id,busy,onClose,onSave}:{data:Board;id?:string;busy:boolean;onClose:()=>void;onSave:(changes:Record<string,unknown>)=>Promise<void>}) {
  const group=data.tasks.find(t=>t.id===id);
  const [name,setName]=useState(group?.name||''),[front,setFront]=useState(group?.front||'Secundario'),[rank,setRank]=useState(group?.rank||1);
  const [weekdays,setWeekdays]=useState(group?.weekdays??ALL_DAYS);
  const [members,setMembers]=useState<string[]>(group?.memberIds||[]),[query,setQuery]=useState(''),[error,setError]=useState('');
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const d=dialog.current;d?.showModal();return()=>d?.close();},[]);
  const available=data.tasks.filter(t=>!t.isGroup&&(!t.groupId||t.groupId===id)&&(!['done','cancelled'].includes(t.stage)||t.groupId===id));
  const selected=members.map(member=>available.find(t=>t.id===member)!);
  function move(index:number,offset:number){const next=[...members];[next[index],next[index+offset]]=[next[index+offset],next[index]];setMembers(next);}
  return <dialog ref={dialog} className={css.dialog} aria-labelledby="group-heading" onCancel={e=>{e.preventDefault();if(!busy)onClose();}}><h2 id="group-heading">{id?'Editar grupo':'Crear grupo de acciones'}</h2>
    <form onSubmit={async e=>{e.preventDefault();setError('');try{await onSave({name,front,rank,members,weekdays});}catch(e){setError(e instanceof Error?e.message:'No se pudo guardar.');}}}>
      <label htmlFor="group-name">Nombre del grupo</label><input id="group-name" maxLength={250} required value={name} disabled={busy} onChange={e=>setName(e.target.value)}/>
      <div className={css.two}><div><label htmlFor="group-front">Frente</label><select id="group-front" value={front} disabled={busy} onChange={e=>setFront(e.target.value)}>{FRONTS.map(f=><option key={f}>{f}</option>)}</select></div><div><label htmlFor="group-rank">Posición del grupo</label><input id="group-rank" type="number" min={1} required value={rank} disabled={busy} onChange={e=>setRank(Number(e.target.value))}/></div></div>
      <p className={css.help}>El grupo ocupa un lugar en el ranking. Sus pasos conservan estado y dependencias. Cambiar el orden no resuelve dependencias.</p>
      <WeekdayPicker value={weekdays} onChange={setWeekdays} disabled={busy}/>
      <h3>Pasos, en orden</h3><ol className={css.groupSteps}>{selected.map((t,i)=><li key={t.id}><span>{t.name}</span><div className={css.actions}><button type="button" className={css.button} aria-label={`Subir ${t.name}`} disabled={busy||i===0} onClick={()=>move(i,-1)}>↑</button><button type="button" className={css.button} aria-label={`Bajar ${t.name}`} disabled={busy||i===selected.length-1} onClick={()=>move(i,1)}>↓</button><button type="button" className={css.button} disabled={busy} onClick={()=>setMembers(members.filter(x=>x!==t.id))}>Retirar</button></div></li>)}</ol>
      <label htmlFor="group-search">Buscar acciones para agregar</label><input id="group-search" value={query} disabled={busy} onChange={e=>setQuery(e.target.value)}/>
      <div className={css.groupChoices}>{available.filter(t=>!members.includes(t.id)&&t.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())).slice(0,40).map(t=><button type="button" className={css.button} key={t.id} disabled={busy||members.length>=30} onClick={()=>setMembers([...members,t.id])}>+ {t.name}</button>)}</div>
      {id&&<p className={css.help}>Los pasos que retires volverán al ranking como acciones independientes, junto a la posición anterior del grupo.</p>}
      {error&&<p className={css.error} role="alert">{error}</p>}<footer><button className={css.button} type="button" disabled={busy} onClick={onClose}>Cancelar</button><button className={css.primary} disabled={busy||!members.length}>{busy?'Guardando…':'Guardar grupo'}</button></footer>
    </form></dialog>;
}
