
-- Remove documentos inválidos (sem arquivo real no Storage) do cadastro informado
delete from public.documents
where social_registration_id = 'c0209977-7751-4d0b-a152-81cdc9414d24'
  and (file_path is null or file_path = '' or file_path like '#uploaded-%');
