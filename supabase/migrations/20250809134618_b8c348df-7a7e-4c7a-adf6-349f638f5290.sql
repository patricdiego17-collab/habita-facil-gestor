
-- 1) Adicionar colunas ao perfil e índices únicos parciais
alter table public.profiles
  add column if not exists cpf text,
  add column if not exists cress text,
  add column if not exists functional_code text;

create unique index if not exists profiles_cpf_unique on public.profiles (cpf) where cpf is not null;
create unique index if not exists profiles_cress_unique on public.profiles (cress) where cress is not null;
create unique index if not exists profiles_functional_code_unique on public.profiles (functional_code) where functional_code is not null;

-- 2) Validação por role (somente em INSERT ou quando o role muda)
create or replace function public.validate_profile_role_fields()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if TG_OP = 'INSERT' or (OLD.role is distinct from NEW.role) then
    if NEW.role = 'social_worker' then
      if NEW.cress is null or length(trim(NEW.cress)) = 0 then
        raise exception 'CRESS é obrigatório para Assistente Social';
      end if;
    elsif NEW.role = 'citizen' then
      if NEW.cpf is null or length(trim(NEW.cpf)) = 0 then
        raise exception 'CPF é obrigatório para Cidadão';
      end if;
    elsif NEW.role = 'admin' then
      if NEW.functional_code is null or length(trim(NEW.functional_code)) = 0 then
        raise exception 'Matrícula funcional é obrigatória para Administrador';
      end if;
    end if;
  end if;
  return NEW;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_validate_profile_role_fields') then
    create trigger trg_validate_profile_role_fields
    before insert or update on public.profiles
    for each row execute function public.validate_profile_role_fields();
  end if;
end $$;

-- 3) Atualizar handle_new_user para copiar campos extras do metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  requested_role text;
  admin_count int;
  v_full_name text;
  v_cpf text;
  v_cress text;
  v_functional text;
begin
  requested_role := coalesce(nullif(NEW.raw_user_meta_data ->> 'role', ''), 'citizen');
  v_full_name := coalesce(NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  v_cpf := nullif(NEW.raw_user_meta_data ->> 'cpf', '');
  v_cress := nullif(NEW.raw_user_meta_data ->> 'cress', '');
  v_functional := nullif(NEW.raw_user_meta_data ->> 'functional_code', '');

  select count(*) into admin_count from public.profiles where role = 'admin';

  if requested_role = 'admin' and admin_count = 0 then
    insert into public.profiles (user_id, email, full_name, role, cpf, cress, functional_code)
    values (NEW.id, NEW.email, v_full_name, 'admin', v_cpf, v_cress, v_functional);
    return NEW;
  end if;

  insert into public.profiles (user_id, email, full_name, role, cpf, cress, functional_code)
  values (NEW.id, NEW.email, v_full_name, 'citizen', v_cpf, v_cress, v_functional);

  if requested_role in ('admin','social_worker') then
    insert into public.role_requests (requester_user_id, requested_role, status, notes)
    values (NEW.id, requested_role, 'pending', 'Solicitado no cadastro');
  end if;

  return NEW;
end;
$function$;

-- 4) Garantir trigger no auth.users
do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where t.tgname = 'on_auth_user_created'
      and n.nspname = 'auth'
      and c.relname = 'users'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end $$;

-- 5) Política de DELETE para admins em social_registrations
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='social_registrations' and policyname='Admins can delete registrations'
  ) then
    create policy "Admins can delete registrations"
      on public.social_registrations
      for delete
      using (public.get_current_user_role() = 'admin');
  end if;
end $$;

-- 6) RPC para admin editar dados de perfis (sem alterar role)
create or replace function public.admin_update_profile(
  p_user_id uuid,
  p_full_name text default null,
  p_email text default null,
  p_cress text default null,
  p_cpf text default null,
  p_functional_code text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not (public.get_current_user_role() = 'admin' or public.is_super_admin(auth.uid())) then
    raise exception 'Not authorized';
  end if;

  update public.profiles
    set full_name = coalesce(p_full_name, full_name),
        email = coalesce(p_email, email),
        cress = coalesce(p_cress, cress),
        cpf = coalesce(p_cpf, cpf),
        functional_code = coalesce(p_functional_code, functional_code),
        updated_at = now()
  where user_id = p_user_id;
end;
$$;

-- 7) RPC para admin excluir cadastro social e dados relacionados
create or replace function public.admin_delete_registration(p_registration_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if public.get_current_user_role() <> 'admin' and not public.is_super_admin(auth.uid()) then
    raise exception 'Not authorized';
  end if;

  delete from public.documents where social_registration_id = p_registration_id;
  delete from public.messages where social_registration_id = p_registration_id;
  delete from public.family_compositions where social_registration_id = p_registration_id;
  delete from public.registration_tracking where social_registration_id = p_registration_id;
  delete from public.social_registrations where id = p_registration_id;
end;
$$;

-- 8) Ativar triggers auxiliares que estavam faltando
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_auto_track_registration') then
    create trigger trg_auto_track_registration
      after insert or update on public.social_registrations
      for each row execute function public.auto_track_registration_changes();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_auto_create_responsible') then
    create trigger trg_auto_create_responsible
      after insert on public.social_registrations
      for each row execute function public.auto_create_responsible_on_registration();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_auto_track_document_changes') then
    create trigger trg_auto_track_document_changes
      after insert or update or delete on public.documents
      for each row execute function public.auto_track_document_changes();
  end if;
end $$;
