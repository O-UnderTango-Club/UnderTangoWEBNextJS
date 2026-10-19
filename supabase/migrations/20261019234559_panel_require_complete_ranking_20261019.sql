-- An open, ungrouped action must always have an independently assigned front and position.
-- Ensure SQL NULL cannot make the CHECK evaluate to UNKNOWN.
alter table operativo.follow_ups alter column estado set not null;
alter table operativo.follow_ups drop constraint follow_ups_open_action_has_ranking;
alter table operativo.follow_ups add constraint follow_ups_open_action_has_ranking
check (
  estado in ('Hecho','Cancelado')
  or grupo_de_accion is not null
  or (
    frente_de_accion is not null
    and posicion_de_accion is not null
    and frente_de_accion in ('Primario','Secundario','Terciario')
    and posicion_de_accion > 0
  )
);
