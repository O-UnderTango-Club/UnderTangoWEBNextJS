"use client";
import { useState } from 'react';
import { board, F, nextPanelDay, type Snapshot, type Board } from '../../../src/lib/panel-model';
import { applyGroupPlan, planGroup, type GroupChanges } from '../../../src/lib/action-groups';
import ActionGroup from '../ActionGroup';
import GroupForm from '../GroupForm';
import css from '../panel.module.css';
export default function GroupPreview({initial}:{initial:Snapshot}){
  const [snapshot,setSnapshot]=useState(initial),[editing,setEditing]=useState<string|undefined>(),[editorOpen,setEditorOpen]=useState(false),[notice,setNotice]=useState('');
  const data=board(snapshot),group=data.tasks.find(t=>t.id==='test-group')!;
  const units=data.tasks.filter(t=>!t.groupId&&!['done','cancelled'].includes(t.stage)&&t.front===group.front);
  function finish(id:string){setSnapshot(previous=>({...previous,tasks:previous.tasks.map(t=>t.id===id?{...t,fields:{...t.fields,[F.tasks.status]:'Hecho',[F.tasks.gate]:'Terminada'}}:t)}));setNotice('Paso completado en la simulación. La posición del grupo se conserva.');}
  function today(id:string){setSnapshot(previous=>({...previous,tasks:previous.tasks.map(t=>t.id===id?{...t,fields:{...t.fields,[F.tasks.activateAt]:nextPanelDay()}}:t)}));setNotice('El grupo queda para mañana en la simulación.');}
  function edit(id?:string){setEditing(id);setEditorOpen(true);}
  const renderTask=(task:Board['tasks'][number])=><article className={css.card} key={task.id}><span className={css.badge}>{({ready:'Disponible',recurring:'Recurrente',waiting:'En espera',scheduled:'Programada',doing:'En curso',catalog:'Por revisar',done:'Finalizada',cancelled:'Descartada'})[task.stage]}</span><h3>{task.name}</h3>{task.blockers.length>0&&<p>Depende de: {task.blockers.join('; ')}</p>}<p className={css.muted}>{task.owner}</p>{['ready','recurring','doing'].includes(task.stage)&&<button className={css.button} onClick={()=>finish(task.id)}>Probar completar paso</button>}</article>;
  const renderGroup=(g:typeof group)=><ActionGroup key={g.id} group={g} data={data} renderTask={renderTask} onEdit={()=>edit(g.id)} onPosition={()=>edit(g.id)} onToday={()=>today(g.id)} disabled={false}/>;
  return <main className={css.panel}><header className={css.top}><div><span className={css.brand}>Ø UnderTango · Vista previa</span><h1>Grupos de acciones</h1><p>Una posición para un conjunto de pasos.</p></div><div className={css.actions}><button className={css.button} onClick={()=>edit()}>+ Crear grupo</button><button className={css.button} onClick={()=>{setSnapshot(initial);setNotice('Simulación reiniciada.');}}>Reiniciar prueba</button></div></header>
    <div className={css.notice}>Simulación local con una lectura del panel del 13/09/2026. Los cambios de esta pantalla no se guardan en Supabase.</div>{notice&&<p role="status" className={css.notice}>{notice}</p>}
    <div className={css.previewGrid}><section><h2>Brasil/Pix</h2><p className={css.help}>Las cinco acciones existentes se reúnen en una tarjeta. Abrí los pasos, completá uno de prueba o cambiá la posición del grupo.</p>{renderGroup(group)}<h2>Otras prioridades de {group.front}</h2>{data.fronts.find(f=>f.name===group.front)?.tasks.filter(id=>id!==group.id).map(id=>{const t=data.tasks.find(t=>t.id===id)!;return t.isGroup?renderGroup(t):renderTask(t);})}</section>
    <section><h2>Ranking de {group.front}</h2><p className={css.help}>Acciones y grupos comparten la misma lista. Los pasos internos no se repiten aquí.</p><ol className={css.groupRanking}>{units.map(t=><li key={t.id} className={t.isGroup?css.highlightGroup:undefined}><strong>{t.rank}.</strong> <span>{t.name}{t.isGroup&&<small> Grupo · {t.memberIds.length} pasos</small>}</span></li>)}</ol></section></div>
    {editorOpen&&<GroupForm data={data} id={editing} busy={false} onClose={()=>setEditorOpen(false)} onSave={async changes=>{setSnapshot(applyGroupPlan(snapshot,planGroup(snapshot,editing,changes as GroupChanges),'preview-'+crypto.randomUUID()));setEditorOpen(false);setNotice('Grupo guardado en la simulación.');}}/>}
  </main>;
}
