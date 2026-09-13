import { F, FRONTS, closed, validWeekdays, type Raw, type Snapshot } from './panel-model';

export const NEW_GROUP = '__new_group__';
export type GroupChanges = { name: string; members: string[]; front: string; rank: number; weekdays?: number };
export type GroupPatch = { table: 'follow_ups'; id: string | null; create: boolean; fields: Record<string, unknown> };
export const isGroup = (t: Raw) => t.fields[F.tasks.kind] === 'group';
export const isMember = (t: Raw) => !!t.fields[F.tasks.group];

/** Plan against one snapshot; the server commits all patches at its revision. */
export function planGroup(data: Snapshot, id: string | undefined, change: GroupChanges): GroupPatch[] {
  const current = id ? data.tasks.find(t => t.id === id && isGroup(t) && !closed(t)) : undefined;
  if (id && !current) throw new Error('El grupo ya no está disponible.');
  const name = typeof change.name === 'string' ? change.name.replace(/\s+/g, ' ').trim() : '';
  if (!name || name.length > 250) throw new Error('Escribí un nombre de hasta 250 caracteres.');
  if (data.tasks.some(t => t.id !== id && isGroup(t) && !closed(t) && String(t.fields[F.tasks.name]).trim().toLocaleLowerCase() === name.toLocaleLowerCase())) throw new Error('Ya existe un grupo con ese nombre.');
  if (!FRONTS.includes(change.front) || !Number.isInteger(change.rank) || change.rank < 1) throw new Error('Elegí frente y posición.');
  if (!Array.isArray(change.members) || !change.members.length || change.members.length > 30 || new Set(change.members).size !== change.members.length) throw new Error('Seleccioná de 1 a 30 acciones, sin repetir.');
  const members = change.members.map(memberId => {
    const member = data.tasks.find(t => t.id === memberId);
    if (!member || isGroup(member) || (isMember(member) && member.fields[F.tasks.group] !== id)) throw new Error('Una acción no puede pertenecer a dos grupos ni contener otro grupo.');
    if (closed(member) && member.fields[F.tasks.group] !== id) throw new Error('Sólo se pueden incorporar acciones abiertas.');
    return member;
  });
  if(change.weekdays!==undefined&&!validWeekdays(change.weekdays))throw new Error("Elegí al menos un día de la semana.");
  const groupId = id || NEW_GROUP;
  const previous = data.tasks.filter(t => t.fields[F.tasks.group] === id && !!id);
  const removed = previous.filter(t => !change.members.includes(t.id));
  const patches: GroupPatch[] = [{ table: 'follow_ups', id: id || null, create: !id, fields: {
    ...(change.weekdays===undefined?{}:{[F.tasks.weekdays]:change.weekdays}),
    [F.tasks.name]: name, [F.tasks.kind]: 'group', [F.tasks.front]: change.front,
    [F.tasks.status]: 'Pendiente', [F.tasks.gate]: 'Acción inmediata',
  } }];
  const add = (memberId: string, fields: Record<string, unknown>) => {
    const found = patches.find(p => p.id === memberId && !p.create);
    if (found) Object.assign(found.fields, fields);
    else patches.push({ table: 'follow_ups', id: memberId, create: false, fields });
  };
  members.forEach((t, index) => add(t.id, { [F.tasks.group]: groupId, [F.tasks.groupOrder]: index + 1, [F.tasks.front]: null, [F.tasks.rank]: null }));
  removed.forEach(t => add(t.id, { [F.tasks.group]: null, [F.tasks.groupOrder]: null, [F.tasks.front]: closed(t)?null:current!.fields[F.tasks.front], [F.tasks.rank]: null }));
  const affected = new Set([change.front, current?.fields[F.tasks.front], ...members.filter(t => !isMember(t)).map(t => t.fields[F.tasks.front])]);
  for (const front of affected) {
    if (!FRONTS.includes(front)) continue;
    const units = data.tasks.filter(t => !closed(t) && !isMember(t) && t.id !== id && !change.members.includes(t.id) && t.fields[F.tasks.front] === front)
      .sort((a,b) => a.fields[F.tasks.rank] - b.fields[F.tasks.rank] || a.id.localeCompare(b.id));
    // Removed members become independent after the old group position, preserving internal order.
    if (current && front === current.fields[F.tasks.front]) units.splice(Math.max(0, Math.min(units.length, current.fields[F.tasks.rank] - 1)), 0, ...removed.filter(t => !closed(t)).sort((a,b) => a.fields[F.tasks.groupOrder] - b.fields[F.tasks.groupOrder]));
    if (front === change.front) units.splice(Math.min(change.rank - 1, units.length), 0, { id: groupId, fields: {} });
    units.forEach((t,index) => {
      if (t.id === groupId) patches[0].fields[F.tasks.rank] = index + 1;
      else if (t.fields[F.tasks.rank] !== index + 1) add(t.id, { [F.tasks.rank]: index + 1 });
    });
  }
  return patches;
}

/** Used only by local tests and the explicitly labelled simulation. */
export function applyGroupPlan(data: Snapshot, patches: GroupPatch[], newId: string): Snapshot {
  const tasks = data.tasks.map(t => ({ ...t, fields: { ...t.fields } }));
  for (const patch of patches) {
    const id = patch.create ? newId : patch.id!;
    let row = tasks.find(t => t.id === id);
    if (!row) { row = { id, fields: {} }; tasks.push(row); }
    for (const [key, value] of Object.entries(patch.fields)) {
      if (value === null) delete row.fields[key];
      else row.fields[key] = value === NEW_GROUP ? newId : value;
    }
  }
  return { ...data, tasks };
}
