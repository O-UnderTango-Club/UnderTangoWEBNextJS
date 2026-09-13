"use client";
import { useState, type ReactNode } from 'react';
import { frontPosition, weekdayLabel, ALL_DAYS, type Board } from '../../src/lib/panel-model';
import css from './panel.module.css';
import GroupForm from './GroupForm';
type Task = Board['tasks'][number];
export default function ActionGroup({group,data,renderTask,onEdit,onPosition,onToday,disabled,initialExpanded=false,onBeginEdit,onSaveGroup,onCreateTask}:{group:Task;data:Board;renderTask:(task:Task)=>ReactNode;onEdit:()=>void;onPosition:()=>void;onToday:()=>void;disabled:boolean;initialExpanded?:boolean;onBeginEdit?:()=>void;onSaveGroup?:(changes:Record<string,unknown>)=>Promise<void>;onCreateTask?:(name:string,project:string,front:string)=>Promise<string>}) {
  const [expanded,setExpanded]=useState(initialExpanded),[editing,setEditing]=useState<'add'|'order'|undefined>(),[message,setMessage]=useState('');
  const members=group.memberIds.map(id=>data.tasks.find(t=>t.id===id)!);
  const next=members.find(t=>t.id===group.nextId);
  const completed=members.filter(t=>['done','cancelled'].includes(t.stage)).length;
  return <article className={css.card} aria-label={`Grupo ${group.name}`}>
    <div className={css.cardProject}><span className={css.actionLabel}>Grupo de acciones</span><button className={css.positionButton} disabled={disabled||!!editing} onClick={onPosition}><strong>{frontPosition(group.front,group.rank)}</strong><span>Posición del grupo</span></button></div>
    <h3>{group.name}</h3>{group.weekdays!==ALL_DAYS&&<p className={css.help}>Días: {weekdayLabel(group.weekdays)}.</p>}<p className={css.muted}>{members.length} pasos · {completed} {completed===1?'resuelto':'resueltos'}</p>
    {group.stage==='scheduled'?<p>Para el {new Date(group.nextAvailableAt||group.activateAt).toLocaleDateString('es-AR',{timeZone:'America/Argentina/Cordoba'})}</p>:next?<p><strong>Próximo paso:</strong> {next.name}</p>:<p>{completed===members.length?'Todos los pasos están resueltos.':'Sin pasos disponibles ahora. Revisá sus estados y dependencias.'}</p>}
    <div className={css.actions}><button className={css.button} disabled={!!editing} aria-expanded={expanded} aria-controls={`group-${group.id}`} onClick={()=>setExpanded(!expanded)}>{expanded?'Cerrar pasos':'Ver pasos'}</button><button className={css.button} disabled={disabled||!!editing} onClick={onEdit}>Editar grupo</button>{onSaveGroup&&<><button className={css.button} disabled={disabled||!!editing||members.length<2} onClick={()=>{onBeginEdit?.();setExpanded(true);setEditing('order');setMessage('');}}>Ordenar acciones</button></>}{['ready','doing'].includes(group.stage)&&<button className={css.button} disabled={disabled||!!editing} onClick={onToday}>Por hoy está bien</button>}</div>
    {message&&<p role="status">{message}</p>}
    <div id={`group-${group.id}`} hidden={!expanded}>{editing&&onSaveGroup?<GroupForm key={group.id} data={data} id={group.id} embedded focusAdd={editing==='add'} busy={disabled} onCreateTask={onCreateTask} onClose={()=>{setEditing(undefined);setMessage('Borrador del grupo cancelado. Se conserva el orden guardado.');}} onSave={async changes=>{await onSaveGroup(changes);setEditing(undefined);setMessage('Grupo guardado. Las acciones se muestran en el orden confirmado.');}}/>:expanded&&<ol className={css.groupSteps}>{members.map(t=><li key={t.id}>{renderTask(t)}</li>)}</ol>}</div>
    {onSaveGroup&&!editing&&<div className={css.actions}><button className={css.button} disabled={disabled||!!editing} onClick={()=>{onBeginEdit?.();setExpanded(true);setEditing('add');setMessage('');}}>Agregar otra acción</button></div>}
  </article>;
}
