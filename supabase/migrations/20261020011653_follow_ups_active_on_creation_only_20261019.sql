-- Every newly opened action enters the operational queue, never history or review.
create function operativo.enforce_follow_up_active_on_insert()
returns trigger
language plpgsql
set search_path = 'pg_catalog','pg_temp'
as $func$
begin
  if new.estado is distinct from 'Pendiente'
     or new.estado_de_accion is null
     or new.estado_de_accion not in ('Acción inmediata','Acción recurrente') then
    raise exception using errcode='23514', message='Las acciones nuevas deben comenzar activas';
  end if;
  return new;
end;
$func$;

create trigger follow_up_insert_must_be_active
before insert on operativo.follow_ups
for each row execute function operativo.enforce_follow_up_active_on_insert();
