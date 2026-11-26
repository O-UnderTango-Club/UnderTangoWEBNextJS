-- Returning players can add an Instagram to their original name-only claim once.
grant update (instagram) on table public.primera_voluntad_premios to service_role;

create or replace function public.ut_847_reclamar(p_partida uuid, p_nombre text, p_instagram text)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.primera_voluntad_premios as premio (partida, nombre, instagram)
    values (p_partida, p_nombre, p_instagram)
    on conflict (partida) do update set instagram = excluded.instagram
      where premio.instagram is null and excluded.instagram is not null;
  if found then return true; end if;

  -- Retries from either form keep the first contact details and registration time.
  return exists (
    select 1 from public.primera_voluntad_premios
    where partida = p_partida and (
      (p_instagram is not null and lower(instagram) = lower(p_instagram))
      or (p_instagram is null and p_nombre is not null and nombre = p_nombre)
    )
  );
end
$$;
