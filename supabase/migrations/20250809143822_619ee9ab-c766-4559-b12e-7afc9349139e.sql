
-- Remove qualquer trigger em public.profiles que invoque validate_profile_role_fields
do $$
declare
  t_rec record;
begin
  for t_rec in
    select tgname
    from pg_trigger
    where tgrelid = 'public.profiles'::regclass
      and not tgisinternal
      and position('validate_profile_role_fields' in pg_get_triggerdef(oid)) > 0
  loop
    execute format('drop trigger %I on public.profiles;', t_rec.tgname);
  end loop;
end $$;

-- Remove a função de validação (não mais necessária)
drop function if exists public.validate_profile_role_fields();
