
create or replace function public.admin_delete_registration(p_registration_id uuid)
returns void
language plpgsql
security definer
set search_path = 'public'
as $function$
begin
  -- Admin ou Super Admin: podem excluir qualquer cadastro
  if public.get_current_user_role() = 'admin' or public.is_super_admin(auth.uid()) then
    -- permitido
  elsif public.get_current_user_role() = 'social_worker' then
    -- Assistente social: somente se o cadastro estiver atribuído a ele/ela
    if not exists (
      select 1
      from public.social_registrations
      where id = p_registration_id
        and assigned_social_worker_id = auth.uid()
    ) then
      raise exception 'Not authorized';
    end if;
  else
    raise exception 'Not authorized';
  end if;

  -- Exclui dados relacionados antes do cadastro
  delete from public.documents where social_registration_id = p_registration_id;
  delete from public.messages where social_registration_id = p_registration_id;
  delete from public.family_compositions where social_registration_id = p_registration_id;
  delete from public.registration_tracking where social_registration_id = p_registration_id;
  delete from public.social_registrations where id = p_registration_id;
end;
$function$;
