"use client";
import { useState, type ReactNode } from 'react';
import { frontPosition, type Board } from '../../src/lib/panel-model';
import css from './panel.module.css';
type Task = Board['tasks'][number];
export default function ActionGroup({group,data,renderTask,onEdit,onPosition,onToday,disabled}:{group:Task;data:Board;renderTask:(task:Task)=>ReactNode;onEdit:()=>void;onPosition:()=>void;onToday:()=>void;disabled:boolean}) {
  const [expanded,setExpanded]=useState(false);
  const members=group.memberIds.map(id=>data.tasks.find(t=>t.id===id)!);
  const next=members.find(t=>t.id===group.nextId);
  const completed=members.filter(t=>['done','cancelled'].includes(t.stage)).length;
  return <article className={css.card} aria-label={`Grupo ${group.name}`}>
    <div className={css.cardProject}><span className={css.actionLabel}>Grupo de acciones</span><button className={css.positionButton} disabled={disabled} onClick={onPosition}><strong>{frontPosition(group.front,group.rank)}</strong><span>Posición del grupo</span></button></div>
    <h3>{group.name}</h3><p className={css.muted}>{members.length} pasos · {completed} {completed===1?'resuelto':'resueltos'}</p>
    {group.stage==='scheduled'?<p>Para el {new Date(group.activateAt).toLocaleDateString('es-AR',{timeZone:'America/Argentina/Cordoba'})}</p>:next?<p><strong>Próximo paso:</strong> {next.name}</p>:<p>{completed===members.length?'Todos los pasos están resueltos.':'Sin pasos disponibles ahora. Revisá sus estados y dependencias.'}</p>}
    <div className={css.actions}><button className={css.button} aria-expanded={expanded} aria-controls={`group-${group.id}`} onClick={()=>setExpanded(!expanded)}>{expanded?'Cerrar pasos':'Ver pasos'}</button><button className={css.button} disabled={disabled} onClick={onEdit}>Editar grupo</button>{['ready','doing'].includes(group.stage)&&<button className={css.button} disabled={disabled} onClick={onToday}>Por hoy está bien</button>}</div>
    <div id={`group-${group.id}`} hidden={!expanded}>{expanded&&<ol className={css.groupSteps}>{members.map(t=><li key={t.id}>{renderTask(t)}</li>)}</ol>}</div>
  </article>;
}
