
-- 1) Storage (bucket 'documents'): políticas para upload/leitura

-- Garantir que a RLS está ligada (normalmente já vem habilitada)
alter table storage.objects enable row level security;

-- Upload apenas para usuários autenticados no bucket 'documents' (o owner será o auth.uid())
create policy "documents_bucket_insert_owners"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and owner = auth.uid()
);

-- Leitura dos próprios arquivos (cidadão)
create policy "documents_bucket_select_owners"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and owner = auth.uid()
);

-- Leitura para Admins e Assistentes Sociais (qualquer arquivo do bucket)
create policy "documents_bucket_select_admin_sw"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and public.get_current_user_role() in ('admin','social_worker')
);

-- Opcional: permitir que o dono atualize/exclua seus próprios arquivos
create policy "documents_bucket_update_owners"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and owner = auth.uid()
);

create policy "documents_bucket_delete_owners"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and owner = auth.uid()
);

-- 2) Políticas adicionais para permitir que o assistente social DESIGNADO ao caso visualize dados relacionados,
-- mesmo que o papel do perfil ainda não esteja definido como 'social_worker'.
-- Observação: estas políticas complementam as já existentes (não as substituem).

-- family_compositions: permitir SELECT para o assistente social designado
create policy "Assigned SW can view family"
on public.family_compositions
for select
using (
  exists (
    select 1
    from public.social_registrations sr
    where sr.id = family_compositions.social_registration_id
      and sr.assigned_social_worker_id = auth.uid()
  )
);

-- documents: permitir SELECT para o assistente social designado
create policy "Assigned SW can view documents"
on public.documents
for select
using (
  exists (
    select 1
    from public.social_registrations sr
    where sr.id = documents.social_registration_id
      and sr.assigned_social_worker_id = auth.uid()
  )
);

-- messages: permitir SELECT para o assistente social designado
create policy "Assigned SW can view messages"
on public.messages
for select
using (
  exists (
    select 1
    from public.social_registrations sr
    where sr.id = messages.social_registration_id
      and sr.assigned_social_worker_id = auth.uid()
  )
);

-- registration_tracking: permitir SELECT para o assistente social designado
create policy "Assigned SW can view tracking"
on public.registration_tracking
for select
using (
  exists (
    select 1
    from public.social_registrations sr
    where sr.id = registration_tracking.social_registration_id
      and sr.assigned_social_worker_id = auth.uid()
  )
);
