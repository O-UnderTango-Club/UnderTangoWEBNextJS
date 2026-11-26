-- Contact is collected by the server only when the winner chooses WhatsApp.
create table public.primera_voluntad_premios (
  partida uuid primary key,
  nombre text check (nombre = btrim(nombre) and char_length(nombre) between 1 and 80),
  instagram text check (instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  registrado_en timestamptz not null default now(),
  check (nombre is not null or instagram is not null)
);
alter table public.primera_voluntad_premios enable row level security;
revoke all on table public.primera_voluntad_premios from public, anon, authenticated;
grant select, insert on table public.primera_voluntad_premios to service_role;

create function public.ut_847_reclamar(p_partida uuid, p_nombre text, p_instagram text)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.primera_voluntad_premios (partida, nombre, instagram)
    values (p_partida, p_nombre, p_instagram) on conflict (partida) do nothing;
  if found then return true; end if;
  -- A double tap or a retry after a dropped response refers to the same claim.
  return exists (select 1 from public.primera_voluntad_premios
    where partida = p_partida and nombre is not distinct from p_nombre
      and instagram is not distinct from p_instagram);
end
$$;
revoke all on function public.ut_847_reclamar(uuid,text,text) from public, anon, authenticated;
grant execute on function public.ut_847_reclamar(uuid,text,text) to service_role;
notify pgrst, 'reload schema';
