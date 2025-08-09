
-- 1) Tabela de solicitações de função
create table if not exists public.role_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null,
  requested_role text not null,
  status text not null default 'pending', -- pending | approved | rejected
  notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.role_requests enable row level security;

-- Evitar múltiplas pendências por usuário
do $$
begin
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'i'
      and c.relname = 'role_requests_one_pending_per_user'
      and n.nspname = 'public'
  ) then
    create unique index role_requests_one_pending_per_user
      on public.role_requests (requester_user_id)
      where (status = 'pending');
  end if;
end
$$;

-- Trigger para updated_at
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_role_requests'
  ) then
    create trigger set_updated_at_role_requests
      before update on public.role_requests
      for each row
      execute function public.update_updated_at_column();
  end if;
end
$$;

-- 2) Funções para super admin
create or replace function public.get_super_admin_user_id()
returns uuid
language sql
stable
security definer
set search_path to 'public'
as $$
  select user_id
  from public.profiles
  where role = 'admin'
  order by created_at asc
  limit 1
$$;

create or replace function public.is_super_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(_user_id = public.get_super_admin_user_id(), false)
$$;

-- 3) Políticas RLS para role_requests
-- Quem pediu pode ver suas solicitações
drop policy if exists "Requester can view own requests" on public.role_requests;
create policy "Requester can view own requests"
  on public.role_requests
  for select
  using (auth.uid() = requester_user_id);

-- Admins podem ver todas
drop policy if exists "Admins can view all requests" on public.role_requests;
create policy "Admins can view all requests"
  on public.role_requests
  for select
  using (public.get_current_user_role() = 'admin');

-- Usuário pode solicitar papel para si (admin/social_worker)
drop policy if exists "User can create own role request" on public.role_requests;
create policy "User can create own role request"
  on public.role_requests
  for insert
  with check (
    auth.uid() = requester_user_id
    and requested_role in ('admin','social_worker')
  );

-- Somente super admin pode atualizar (aprovar/reprovar)
drop policy if exists "Only super admin can update requests" on public.role_requests;
create policy "Only super admin can update requests"
  on public.role_requests
  for update
  using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

-- 4) Função para aprovar/reprovar solicitações e promover usuário
create or replace function public.approve_role_request(p_request_id uuid, p_approve boolean, p_notes text default null)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_req record;
begin
  if not public.is_super_admin(auth.uid()) then
    raise exception 'Not authorized';
  end if;

  select *
  into v_req
  from public.role_requests
  where id = p_request_id;

  if not found then
    raise exception 'Request not found';
  end if;

  if v_req.status <> 'pending' then
    raise exception 'Request already processed';
  end if;

  if p_approve then
    -- Promove perfil ao papel solicitado
    update public.profiles
      set role = v_req.requested_role,
          updated_at = now()
      where user_id = v_req.requester_user_id;

    update public.role_requests
      set status = 'approved',
          reviewed_by = auth.uid(),
          reviewed_at = now(),
          notes = coalesce(p_notes, notes)
      where id = p_request_id;
  else
    update public.role_requests
      set status = 'rejected',
          reviewed_by = auth.uid(),
          reviewed_at = now(),
          notes = coalesce(p_notes, notes)
      where id = p_request_id;
  end if;
end;
$$;

grant execute on function public.approve_role_request(uuid, boolean, text) to authenticated;
grant execute on function public.get_super_admin_user_id() to authenticated;
grant execute on function public.is_super_admin(uuid) to authenticated;

-- 5) Restringir alteração direta de papel a somente super admin
create or replace function public.admin_set_user_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_super_admin(auth.uid()) then
    raise exception 'Not authorized';
  end if;

  if p_role not in ('admin','social_worker','citizen') then
    raise exception 'Invalid role value: %', p_role;
  end if;

  update public.profiles
  set role = p_role,
      updated_at = now()
  where user_id = p_user_id;
end;
$function$;

grant execute on function public.admin_set_user_role(uuid, text) to authenticated;

-- 6) Handle new user: define citizen por padrão e gera solicitação quando pedir cargo
--    Se for o 1º admin do sistema (ainda não existe admin) e pediu admin, promove direto
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  requested_role text;
  admin_count int;
begin
  requested_role := coalesce(nullif(NEW.raw_user_meta_data ->> 'role', ''), 'citizen');
  select count(*) into admin_count from public.profiles where role = 'admin';

  if requested_role = 'admin' and admin_count = 0 then
    -- bootstrap do primeiro administrador
    insert into public.profiles (user_id, email, full_name, role)
    values (
      NEW.id,
      NEW.email,
      coalesce(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
      'admin'
    );
    return NEW;
  end if;

  -- padrão: citizen
  insert into public.profiles (user_id, email, full_name, role)
  values (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    'citizen'
  );

  if requested_role in ('admin','social_worker') then
    insert into public.role_requests (requester_user_id, requested_role, status, notes)
    values (NEW.id, requested_role, 'pending', 'Solicitado no cadastro');
  end if;

  return NEW;
end;
$function$;

-- 7) Garantir trigger de criação de perfil ao criar auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 8) Criar responsável automaticamente no cadastro social
create or replace function public.auto_create_responsible_on_registration()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not exists (
    select 1 from public.family_compositions
    where social_registration_id = NEW.id
      and relationship = 'Responsável'
  ) then
    insert into public.family_compositions (
      user_id,
      social_registration_id,
      member_name,
      relationship,
      cpf
    ) values (
      NEW.user_id,
      NEW.id,
      NEW.name,
      'Responsável',
      NEW.cpf
    );
  end if;

  return NEW;
end;
$function$;

drop trigger if exists trg_auto_create_responsible on public.social_registrations;
create trigger trg_auto_create_responsible
  after insert on public.social_registrations
  for each row execute function public.auto_create_responsible_on_registration();

-- 9) Garantir apenas 1 responsável por cadastro (índice único parcial)
do $$
begin
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'i'
      and c.relname = 'family_compositions_unique_responsavel'
      and n.nspname = 'public'
  ) then
    create unique index family_compositions_unique_responsavel
      on public.family_compositions (social_registration_id)
      where relationship = 'Responsável';
  end if;
end
$$;
