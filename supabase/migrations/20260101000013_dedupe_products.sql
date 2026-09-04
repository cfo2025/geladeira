-- ============================================================================
-- Remove produtos duplicados pelo mesmo nome (aconteceu porque a migration
-- 12 foi rodada duas vezes — o delete dela só apagava o produto genérico
-- antigo, que na segunda execução já não existia mais, então só inseriu de
-- novo). Mantém sempre a linha de menor id por nome e apaga as demais.
-- Seguro: nenhuma linha de inventory/withdrawals referenciava esses
-- produtos no momento em que isso foi escrito.
-- ============================================================================

delete from products a
using products b
where a.name = b.name
  and a.id > b.id;
