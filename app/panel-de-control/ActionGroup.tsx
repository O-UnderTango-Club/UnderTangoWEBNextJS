"use client";
import { useState, type ReactNode } from 'react';
import { frontPosition, weekdayLabel, ALL_DAYS, type Board } from '../../src/lib/panel-model';
import css from './panel.module.css';
import GroupForm from './GroupForm';
type Task = Board['tasks'][number];
export default function ActionGroup({group,data,renderTask,onEdit,statusEditor,statusEditing=false,statusLabel,onPosition,onToday,disabled,positionLabel,positionCaption,positionEditable=true,initialExpanded=false,onBeginEdit,onSaveGroup,onCreateTask}:{group:Task;data:Board;renderTask:(task:Task)=>ReactNode;onEdit:()=>void;statusEditor?:ReactNode;statusEditing?:boolean;statusLabel?:string;onPosition:()=>void;onToday:()=>void;disabled:boolean;positionLabel?:string;positionCaption?:string;positionEditable?:boolean;initialExpanded?:boolean;onBeginEdit?:()=>void;onSaveGroup?:(changes:Record<string,unknown>)=>Promise<void>;onCreateTask?:(name:string,project:string,front:string)=>Promise<string>}) {
  const [expanded,setExpanded]=useState(initialExpanded),[editing,setEditing]=useState<'add'|'order'|'details'|undefined>(),[message,setMessage]=useState('');
  const members=group.memberIds.map(id=>data.tasks.find(t=>t.id===id)!);
  const next=members.find(t=>t.id===group.nextId);
  const completed=members.filter(t=>['done','cancelled'].includes(t.stage)).length;
  const closed=['done','cancelled'].includes(group.stage);
  const label=statusLabel||({ready:'Acción inmediata',recurring:'Acción recurrente',scheduled:'Programada',doing:'En curso',waiting:'En espera',done:'Finalizada',cancelled:'Descartada'} as const)[group.stage];
  return <article className={css.card} aria-label={`Grupo ${group.name}`}>
    <div className={css.cardProject}><span className={css.actionLabel}>Grupo de acciones</span>{!closed&&(positionEditable?<button className={css.positionButton} disabled={disabled||!!editing||statusEditing} onClick={onPosition} title={positionLabel?"Puesto visible aquí; el editor cambia la posición general.":undefined}><strong>{positionLabel||frontPosition(group.front,group.rank)}</strong><span>{positionCaption||"Posición del grupo"}</span></button>:<div className={css.positionButton} role="note" aria-label={"Grupo en espera "+(positionLabel||"")}><strong>{positionLabel||"En espera"}</strong><span>{positionCaption||"Turno de espera"}</span></div>)}</div>
    <h3>{group.name}</h3>{group.weekdays!==ALL_DAYS&&<p className={css.help}>Días: {weekdayLabel(group.weekdays)}.</p>}<p className={css.muted}>{members.length} pasos · {completed} {completed===1?'resuelto':'resueltos'}</p>
    {group.stage==='scheduled'?<p>Para el {new Date(group.nextAvailableAt||group.activateAt).toLocaleDateString('es-AR',{timeZone:'America/Argentina/Cordoba'})}</p>:next?<p><strong>Próximo paso:</strong> {next.name}</p>:<p>{completed===members.length?'Todos los pasos están resueltos.':'Sin pasos disponibles ahora. Revisá sus estados y dependencias.'}</p>}
    <div className={css.statusRow}><span className={`${css.badge} ${['scheduled','waiting'].includes(group.stage)?css.warning:''}`}>{label}</span><button className={css.button} disabled={disabled||!!editing} onClick={onEdit} aria-expanded={statusEditing}>Editar grupo</button></div>
    {statusEditor}
    <div className={css.actions}><button className={css.button} disabled={!!editing} aria-expanded={expanded} aria-controls={`group-${group.id}`} onClick={()=>setExpanded(!expanded)}>{expanded?'Cerrar pasos':'Ver pasos'}</button>{onSaveGroup&&!closed&&<><button className={css.button} disabled={disabled||!!editing||statusEditing} onClick={()=>{onBeginEdit?.();setExpanded(true);setEditing('details');setMessage('');}}>Editar detalles</button><button className={css.button} disabled={disabled||!!editing||statusEditing||members.length<2} onClick={()=>{onBeginEdit?.();setExpanded(true);setEditing('order');setMessage('');}}>Ordenar acciones</button></>}{['ready','doing'].includes(group.stage)&&<button className={css.button} disabled={disabled||!!editing||statusEditing} onClick={onToday}>Por hoy está bien</button>}</div>
    {message&&<p role="status">{message}</p>}
    <div id={`group-${group.id}`} hidden={!expanded}>{editing&&onSaveGroup?<GroupForm key={group.id} data={data} id={group.id} embedded focusAdd={editing==='add'} busy={disabled} onCreateTask={onCreateTask} onClose={()=>{setEditing(undefined);setMessage('Borrador del grupo cancelado. Se conserva el orden guardado.');}} onSave={async changes=>{await onSaveGroup(changes);setEditing(undefined);setMessage('Grupo guardado. Las acciones se muestran en el orden confirmado.');}}/>:expanded&&<ol className={css.groupSteps}>{members.map(t=><li key={t.id}>{renderTask(t)}</li>)}</ol>}</div>
    {onSaveGroup&&!editing&&!closed&&<div className={css.actions}><button className={css.button} disabled={disabled||statusEditing} onClick={()=>{onBeginEdit?.();setExpanded(true);setEditing('add');setMessage('');}}>Agregar otra acción</button></div>}
  </article>;
}
