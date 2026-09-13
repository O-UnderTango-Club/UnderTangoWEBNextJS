type DependencyTask={id:string;name:string;stage:string;projectIds:string[];dependencies:string[]};
export function dependencyGroups(tasks:DependencyTask[],projects:{id:string;name:string}[],taskId?:string,query=""){
  // A prerequisite must not already depend on the action being edited.
  const reaches=(id:string,seen=new Set<string>()):boolean=>{
    if(id===taskId)return true;
    if(seen.has(id))return false;
    seen.add(id);
    return tasks.find(t=>t.id===id)?.dependencies.some(dep=>reaches(dep,seen))||false;
  };
  const pending=tasks.filter(t=>!["done","cancelled"].includes(t.stage)&&!reaches(t.id));
  const needle=query.trim().toLocaleLowerCase();
  return [...projects.map(p=>({id:p.id,name:p.name,items:pending.filter(t=>t.projectIds.includes(p.id))})),{id:"unassigned",name:"Sin proyecto",items:pending.filter(t=>!t.projectIds.length)}]
    .map(g=>({...g,items:g.items.filter(t=>!needle||g.name.toLocaleLowerCase().includes(needle)||t.name.toLocaleLowerCase().includes(needle))})).filter(g=>g.items.length);
}
