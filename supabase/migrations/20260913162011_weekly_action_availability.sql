begin;
set local lock_timeout = '5s';
alter table operativo.follow_ups add column dias_semana numeric not null default 127
  constraint follow_ups_dias_semana_valid check (dias_semana between 1 and 127 and dias_semana=trunc(dias_semana));
comment on column operativo.follow_ups.dias_semana is 'Availability bitmask: Monday=1, Tuesday=2, Wednesday=4, Thursday=8, Friday=16, Saturday=32, Sunday=64. 127=every day. America/Argentina/Cordoba. Does not reopen completed tasks.';
update operativo.migration_manifest set definition=jsonb_set(definition,'{fields}',(definition->'fields')||jsonb_build_array(jsonb_build_object(
  'id','weekdays_mask','name','Días de la semana','type','number','column','dias_semana','sqlType','numeric','config',jsonb_build_object('precision',0)
))) where target_table='follow_ups';
insert into operativo.panel_write_fields(table_name,field_id) values ('follow_ups','weekdays_mask');
create function public.ut_panel_snapshot_v6() returns jsonb
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare s jsonb; tasks jsonb;
begin
 s:=public.ut_panel_snapshot_v5();
 select coalesce(jsonb_agg(t||jsonb_build_object('fields',(t->'fields')||jsonb_build_object('weekdays_mask',f.dias_semana)) order by t->>'id'),'[]'::jsonb)
 into tasks from jsonb_array_elements(s->'tasks') t join operativo.follow_ups f on f.id=t->>'id';
 return s||jsonb_build_object('contract',6,'tasks',tasks);
end $$;
revoke all on function public.ut_panel_snapshot_v6() from public,anon,authenticated;
grant execute on function public.ut_panel_snapshot_v6() to service_role;
commit;
