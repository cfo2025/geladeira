-- ============================================================================
-- Cadastro de usuário passa a usar os campos da turma: Nome de Guerra
-- (full_name), Nº de Curso (renomeia "document" para "course_number") e
-- Pelotão (novo). Atualiza a única conta já cadastrada com os dados reais.
-- ============================================================================

alter table profiles rename column document to course_number;

alter table profiles add column platoon text;

update profiles
  set full_name = 'Cott', course_number = '03', platoon = '1º'
  where id = (select id from auth.users where email = 'felippespe@gmail.com');

-- Rede de segurança: qualquer outro perfil já existente sem pelotão recebe um
-- placeholder para permitir travar a coluna como obrigatória.
update profiles set platoon = '—' where platoon is null;

alter table profiles alter column platoon set not null;
