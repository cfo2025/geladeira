-- ============================================================================
-- Zera os dados de TESTE (produtos, estoque, retiradas, pagamentos, balanços,
-- notificações e logs) mantendo profiles e locations intactos — são reais.
-- Em seguida recria o catálogo de produtos já detalhado por sabor/variante,
-- conforme o controle físico das geladeiras. O histórico da planilha antiga
-- (retiradas/pagamentos) será importado à parte, depois que a turma toda
-- estiver cadastrada — por isso os placeholders "genérico (histórico)" já
-- ficam prontos aqui, marcados como inativos (não aparecem na loja).
-- ============================================================================

delete from stock_audit_items;
delete from stock_audits;
delete from withdrawal_cancellation_requests;
delete from withdrawals;
delete from payments;
delete from notifications;
delete from audit_logs;
delete from inventory;
delete from products;

-- ============================================================================
-- Catálogo detalhado (produtos ativos, aparecem na loja)
-- ============================================================================

insert into products (name, category, price) values
  ('Monster Ultra (Branco)', 'Bebida', 11.00),
  ('Monster Mango (Sem Açúcar)', 'Bebida', 11.00),
  ('Monster Rio Punch', 'Bebida', 11.00),
  ('Monster Pacific Punch', 'Bebida', 11.00),
  ('Kit Kat Ao Leite', 'Doce', 4.00),
  ('Kit Kat Dark', 'Doce', 4.00),
  ('Kit Kat Branco', 'Doce', 4.00),
  ('Bis Extra', 'Doce', 3.50),
  ('Coca-Cola Zero (Lata)', 'Bebida', 6.00),
  ('Gatorade', 'Bebida', 7.50),
  ('Guaraná Antarctica (Lata)', 'Bebida', 5.50),
  ('Juninho', 'Bebida', 2.50),
  ('Powerade', 'Bebida', 7.00),
  ('Red Bull 250 ml', 'Bebida', 11.00),
  ('Snickers', 'Doce', 3.50),
  ('Toddynho', 'Bebida', 2.50),
  ('Whey Pro', 'Bebida', 7.00);

-- ============================================================================
-- Placeholders "genérico (histórico)" — só para receber a importação da
-- planilha antiga (onde Monster/Kit Kat não tinham sabor discriminado).
-- Inativos: não aparecem na loja nem no lançamento de nova retirada.
-- ============================================================================

insert into products (name, category, price, is_active) values
  ('Monster (genérico — histórico)', 'Histórico', 11.00, false),
  ('Kit Kat (genérico — histórico)', 'Histórico', 4.00, false),
  ('Doce (genérico — histórico)', 'Histórico', 3.00, false);
