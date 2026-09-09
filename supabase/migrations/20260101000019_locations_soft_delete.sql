-- ============================================================================
-- Locais ganham "is_active": até agora, excluir um local com retiradas
-- registradas falhava (violação de FK, de propósito — perderia o nome no
-- histórico) e o único jeito de "esconder" um local era renomeá-lo. Isso
-- gerou 4 locais renomeados pra variações de "Inativo" — restaura os nomes
-- reais deles aqui e marca como inativos de verdade.
--
-- A restrição de nome único passa a valer só entre locais ativos (índice
-- parcial), pra um local inativo poder manter/reaproveitar o nome sem
-- travar a criação de um novo local ativo com o mesmo nome.
-- ============================================================================

alter table locations add column is_active boolean not null default true;

alter table locations drop constraint if exists locations_name_key;
create unique index locations_name_active_unique on locations (name) where is_active = true;

-- restaura os nomes originais (foram renomeados como workaround manual)
update locations set name = 'Alojamento Masculino', is_active = false
  where id = 'cce368e7-4437-42ef-a5cc-87aed4cc417f';
update locations set name = 'Antessala', is_active = false
  where id = '1c3d3bb0-ed15-432a-a5ed-4d2605a4d9b0';
update locations set name = 'Rancho', is_active = false
  where id = 'cf31bad3-15f4-4101-b59a-87f903403705';
update locations set name = 'Doce', is_active = false
  where id = '14b1776f-4318-4246-86ff-d6305414ba38';
