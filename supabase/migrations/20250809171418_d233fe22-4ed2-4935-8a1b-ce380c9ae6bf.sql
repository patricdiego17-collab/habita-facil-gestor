
-- STORAGE RLS policies for bucket "documents"
-- Permite que cidadões manipulem SOMENTE a sua própria pasta: "<user_id>/*"
-- E garante que admin e assistentes sociais leem/gerenciam todos os arquivos do bucket "documents"

-- Cidadão: INSERT apenas na própria pasta
create policy "citizen can upload to own folder (documents)"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (name like (auth.uid()::text || '/%'))
);

-- Cidadão: SELECT apenas na própria pasta
create policy "citizen can read own files (documents)"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and (name like (auth.uid()::text || '/%'))
);

-- Cidadão: UPDATE apenas na própria pasta
create policy "citizen can update own files (documents)"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and (name like (auth.uid()::text || '/%'))
)
with check (
  bucket_id = 'documents'
  and (name like (auth.uid()::text || '/%'))
);

-- Cidadão: DELETE apenas na própria pasta
create policy "citizen can delete own files (documents)"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and (name like (auth.uid()::text || '/%'))
);

-- Assistente social/Admin: SELECT em todo o bucket "documents"
create policy "admin and social worker can read all files (documents)"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and public.get_current_user_role() = any (array['admin','social_worker'])
);

-- Assistente social/Admin: UPDATE em todo o bucket "documents"
create policy "admin and social worker can update files (documents)"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and public.get_current_user_role() = any (array['admin','social_worker'])
)
with check (
  bucket_id = 'documents'
  and public.get_current_user_role() = any (array['admin','social_worker'])
);

-- Assistente social/Admin: DELETE em todo o bucket "documents"
create policy "admin and social worker can delete files (documents)"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and public.get_current_user_role() = any (array['admin','social_worker'])
);
