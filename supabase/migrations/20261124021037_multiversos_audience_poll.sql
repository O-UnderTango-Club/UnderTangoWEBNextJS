-- Database: UnderTango Analytics. The web server calls one restricted RPC.
create schema multiversos_votos;
revoke all on schema multiversos_votos from public, anon, authenticated;

create table multiversos_votos.sesiones (
  id uuid primary key,
  conductor text not null check (length(conductor) = 64),
  escena integer check (escena in (92,96,100)),
  vence timestamptz not null default (now() + interval '1 day')
);
create index sesiones_vencimiento on multiversos_votos.sesiones(vence);
create table multiversos_votos.rondas (
  sesion uuid not null references multiversos_votos.sesiones(id) on delete cascade,
  escena integer not null check (escena in (92,96,100)),
  cierre timestamptz not null,
  primary key(sesion,escena)
);
create table multiversos_votos.votos (
  sesion uuid not null,
  escena integer not null,
  navegador text not null check (length(navegador) = 64),
  color text not null check (color in ('azul','ambar','violeta')),
  sonido text not null check (sonido in ('aire','campana','agua')),
  primary key(sesion,escena,navegador),
  foreign key(sesion,escena) references multiversos_votos.rondas(sesion,escena) on delete cascade
);
alter table multiversos_votos.sesiones enable row level security;
alter table multiversos_votos.rondas enable row level security;
alter table multiversos_votos.votos enable row level security;
revoke all on all tables in schema multiversos_votos from public, anon, authenticated;
grant usage on schema multiversos_votos to service_role;
grant select, insert, update, delete on all tables in schema multiversos_votos to service_role;

create function public.ut_860_poll(
  p_action text, p_session uuid, p_voter text, p_host text,
  p_scene integer, p_duration integer, p_color text, p_sound text
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  ses multiversos_votos.sesiones%rowtype;
  limite timestamptz;
  ahora timestamptz;
  total integer;
  propio boolean;
  ganador jsonb;
begin
  if p_session is null or p_voter is null or p_voter !~ '^[a-f0-9]{64}$' then
    raise sqlstate 'PT400' using message = 'Solicitud inválida';
  end if;
  if p_action = 'create' then
    if p_host is null or p_host !~ '^[a-f0-9]{64}$' then raise sqlstate 'PT403' using message='Conductor requerido'; end if;
    delete from multiversos_votos.sesiones where vence <= now();
    insert into multiversos_votos.sesiones(id,conductor) values (p_session,p_host) on conflict do nothing;
  end if;

  -- A transition is exclusive. Ballots may arrive concurrently but cannot cross that transition.
  if p_action in ('open','close') then
    select * into ses from multiversos_votos.sesiones where id=p_session for update;
  elsif p_action = 'vote' then
    select * into ses from multiversos_votos.sesiones where id=p_session for share;
  else
    select * into ses from multiversos_votos.sesiones where id=p_session;
  end if;
  ahora := clock_timestamp();
  if ses.id is null or ses.vence <= ahora then raise sqlstate 'PT404' using message='Función ausente'; end if;
  if p_action='state' and exists (
    select 1 from multiversos_votos.rondas where sesion=p_session and escena=ses.escena and cierre<=ahora
  ) then
    -- A final read waits for the last accepted ballot to commit before publishing its winner.
    select * into ses from multiversos_votos.sesiones where id=p_session for update;
    ahora:=clock_timestamp();
  end if;
  if p_action in ('create','open','close') and ses.conductor is distinct from p_host then
    raise sqlstate 'PT403' using message='Conductor incorrecto';
  end if;
  if p_action in ('open','close','vote') and (p_scene is null or p_scene not in (92,96,100)) then
    raise sqlstate 'PT400' using message='Escena inválida';
  end if;

  if p_action = 'open' then
    if p_duration is null or p_duration not between 1 and 120 then raise sqlstate 'PT400' using message='Plazo inválido'; end if;
    if p_scene < ses.escena then raise sqlstate 'PT409' using message='Ronda anterior'; end if;
    if p_scene is distinct from ses.escena then
      update multiversos_votos.rondas set cierre=least(cierre,ahora) where sesion=p_session and escena=ses.escena;
      insert into multiversos_votos.rondas(sesion,escena,cierre) values(p_session,p_scene,ahora + make_interval(secs=>p_duration));
      update multiversos_votos.sesiones set escena=p_scene where id=p_session;
      ses.escena:=p_scene;
    end if;
  elsif p_action='close' then
    if p_scene is distinct from ses.escena then raise sqlstate 'PT409' using message='Ronda anterior'; end if;
    update multiversos_votos.rondas set cierre=least(cierre,ahora) where sesion=p_session and escena=p_scene;
  elsif p_action='vote' then
    select cierre into limite from multiversos_votos.rondas where sesion=p_session and escena=p_scene;
    if p_scene is distinct from ses.escena or limite is null or limite<=ahora then raise sqlstate 'PT409' using message='Ronda cerrada'; end if;
    if p_color is null or p_color not in ('azul','ambar','violeta') or p_sound is null or p_sound not in ('aire','campana','agua') then
      raise sqlstate 'PT400' using message='Opción inválida';
    end if;
    insert into multiversos_votos.votos values(p_session,p_scene,p_voter,p_color,p_sound) on conflict do nothing;
  elsif p_action not in ('state','create') then
    raise sqlstate 'PT400' using message='Acción inválida';
  end if;

  select cierre into limite from multiversos_votos.rondas where sesion=p_session and escena=ses.escena;
  select count(*), coalesce(bool_or(navegador=p_voter),false) into total,propio
    from multiversos_votos.votos where sesion=p_session and escena=ses.escena;
  if limite<=ahora and total>0 then
    -- Each category uses plurality. A tie uses the order printed on the ballot.
    select jsonb_build_object('color',
      (select color from multiversos_votos.votos where sesion=p_session and escena=ses.escena group by color
       order by count(*) desc, array_position(array['azul','ambar','violeta'],color) limit 1),
      'sound',
      (select sonido from multiversos_votos.votos where sesion=p_session and escena=ses.escena group by sonido
       order by count(*) desc, array_position(array['aire','campana','agua'],sonido) limit 1)) into ganador;
  end if;
  return jsonb_build_object('session',p_session,'scene',ses.escena,'closesAt',limite,'serverTime',ahora,
    'open',coalesce(limite>ahora,false),'total',total,'winner',ganador,'voted',propio);
end
$$;

revoke all on function public.ut_860_poll(text,uuid,text,text,integer,integer,text,text) from public, anon, authenticated;
grant execute on function public.ut_860_poll(text,uuid,text,text,integer,integer,text,text) to service_role;
notify pgrst, 'reload schema';
