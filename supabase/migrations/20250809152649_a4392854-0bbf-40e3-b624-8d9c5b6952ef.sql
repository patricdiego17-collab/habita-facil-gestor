
-- 1) Criar bucket privado para documentos (se ainda não existir)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- 2) Políticas de acesso no storage.objects para o bucket 'documents'
-- Observação: não criamos nada fora do schema storage; apenas políticas.

-- Leitura: dono do objeto OU admin/assistente social
create policy "documents: read by owner or staff"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and (
    owner = auth.uid()
    or public.get_current_user_role() = any (array['admin','social_worker'])
  )
);

-- Inserção: dono (auth.uid) OU staff (admin/assistente social).
-- O owner é definido automaticamente pelo Storage como o usuário autenticado.
create policy "documents: insert by owner or staff"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (
    owner = auth.uid()
    or public.get_current_user_role() = any (array['admin','social_worker'])
  )
);

-- Atualização: dono OU staff
create policy "documents: update by owner or staff"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and (
    owner = auth.uid()
    or public.get_current_user_role() = any (array['admin','social_worker'])
  )
)
with check (
  bucket_id = 'documents'
  and (
    owner = auth.uid()
    or public.get_current_user_role() = any (array['admin','social_worker'])
  )
);

-- Exclusão: dono OU staff
create policy "documents: delete by owner or staff"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and (
    owner = auth.uid()
    or public.get_current_user_role() = any (array['admin','social_worker'])
  )
);
