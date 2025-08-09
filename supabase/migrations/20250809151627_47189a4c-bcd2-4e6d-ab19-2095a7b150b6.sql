
-- 1) Ampliar a auditoria de cadastros para registrar QUALQUER alteração de dados
create or replace function public.auto_track_registration_changes()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $function$
begin
  -- INSERT: novo cadastro
  if tg_op = 'INSERT' then
    perform public.create_tracking_entry(
      new.user_id,
      new.id,
      'cadastro_criado',
      'Cadastro social criado',
      new.user_id
    );
    return new;
  end if;

  -- UPDATE: mudanças de status (audita com status específico)
  if tg_op = 'UPDATE' then
    if old.status is distinct from new.status then
      perform public.create_tracking_entry(
        new.user_id,
        new.id,
        new.status,
        'Status atualizado para: ' || new.status,
        auth.uid()
      );
    end if;

    -- UPDATE: mudança de designação (assistente social)
    if old.assigned_social_worker_id is distinct from new.assigned_social_worker_id then
      perform public.create_tracking_entry(
        new.user_id,
        new.id,
        'em_analise',
        'Assistente social designado',
        auth.uid()
      );
    end if;

    -- UPDATE: QUALQUER OUTRA alteração de dados (ignora cols técnicas e as já tratadas)
    if ( to_jsonb(old) - array['updated_at','created_at','status','assigned_social_worker_id']::text[] )
       is distinct from
       ( to_jsonb(new) - array['updated_at','created_at','status','assigned_social_worker_id']::text[] ) then
      perform public.create_tracking_entry(
        new.user_id,
        new.id,
        'dados_atualizados',
        'Dados do cadastro foram alterados',
        auth.uid()
      );
    end if;

    return new;
  end if;

  return null;
end;
$function$;


-- 2) Triggers de auditoria e auxiliares (criados somente se não existirem)
do $$
begin
  -- social_registrations: auditoria após INSERT/UPDATE
  if not exists (select 1 from pg_trigger where tgname = 'trg_track_social_reg_insert') then
    create trigger trg_track_social_reg_insert
    after insert on public.social_registrations
    for each row execute function public.auto_track_registration_changes();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_track_social_reg_update') then
    create trigger trg_track_social_reg_update
    after update on public.social_registrations
    for each row execute function public.auto_track_registration_changes();
  end if;

  -- social_registrations: criar responsável automaticamente após INSERT
  if not exists (select 1 from pg_trigger where tgname = 'trg_auto_responsible_on_insert') then
    create trigger trg_auto_responsible_on_insert
    after insert on public.social_registrations
    for each row execute function public.auto_create_responsible_on_registration();
  end if;

  -- documents: auditoria de INSERT/UPDATE/DELETE
  if not exists (select 1 from pg_trigger where tgname = 'trg_track_document_insert') then
    create trigger trg_track_document_insert
    after insert on public.documents
    for each row execute function public.auto_track_document_changes();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_track_document_update') then
    create trigger trg_track_document_update
    after update on public.documents
    for each row execute function public.auto_track_document_changes();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_track_document_delete') then
    create trigger trg_track_document_delete
    after delete on public.documents
    for each row execute function public.auto_track_document_changes();
  end if;
end
$$;


-- 3) Triggers de updated_at automático nas tabelas principais (somente se não existirem)
do $$
begin
  -- social_registrations
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_social_registrations') then
    create trigger set_updated_at_social_registrations
    before update on public.social_registrations
    for each row execute function public.update_updated_at_column();
  end if;

  -- family_compositions
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_family_compositions') then
    create trigger set_updated_at_family_compositions
    before update on public.family_compositions
    for each row execute function public.update_updated_at_column();
  end if;

  -- documents
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_documents') then
    create trigger set_updated_at_documents
    before update on public.documents
    for each row execute function public.update_updated_at_column();
  end if;

  -- messages
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_messages') then
    create trigger set_updated_at_messages
    before update on public.messages
    for each row execute function public.update_updated_at_column();
  end if;

  -- profiles
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_profiles') then
    create trigger set_updated_at_profiles
    before update on public.profiles
    for each row execute function public.update_updated_at_column();
  end if;
end
$$;


-- 4) Permitir exclusão via função também para assistente social (SEGURANÇA DEFINER)
create or replace function public.admin_delete_registration(p_registration_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- Admin ou Super Admin: podem excluir qualquer cadastro
  if public.get_current_user_role() = 'admin' or public.is_super_admin(auth.uid()) then
    -- permitido
  elsif public.get_current_user_role() = 'social_worker' then
    -- Permitido para assistente social (qualquer cadastro)
    -- (Se preferir restringir a apenas atribuídos, avise e eu restauro a checagem)
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
