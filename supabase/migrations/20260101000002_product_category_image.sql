-- ============================================================================
-- Categoria e imagem de produto (exibidos na grade da loja)
-- ============================================================================

alter table products
  add column category text,
  add column image_url text;
