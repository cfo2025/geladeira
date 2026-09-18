-- ============================================================================
-- Ajuste manual do estoque atual de um produto numa geladeira (admin),
-- direto pelo modal de editar produto em /admin/estoque. Define a nova
-- quantidade total (não é reposição incremental). Motivo obrigatório; grava
-- log de auditoria dedicado com antes/depois/diferença.
-- ============================================================================

create or replace function public.adjust_inventory_manual(
  p_location_id uuid,
  p_product_id uuid,
  p_new_quantity int,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before int;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem ajustar o estoque manualmente';
  end if;

  if p_new_quantity is null or p_new_quantity < 0 then
    raise exception 'Quantidade inválida';
  end if;

  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'Informe o motivo do ajuste';
  end if;

  if not exists (select 1 from locations where id = p_location_id) then
    raise exception 'Local não encontrado';
  end if;

  if not exists (select 1 from products where id = p_product_id) then
    raise exception 'Produto não encontrado';
  end if;

  select quantity into v_before
  from inventory
  where location_id = p_location_id and product_id = p_product_id
  for update;

  v_before := coalesce(v_before, 0);

  insert into inventory (location_id, product_id, quantity)
  values (p_location_id, p_product_id, p_new_quantity)
  on conflict (location_id, product_id) do update set quantity = p_new_quantity;

  perform public.log_action(null, 'stock_manual_adjustment', jsonb_build_object(
    'location_id', p_location_id,
    'product_id', p_product_id,
    'before', v_before,
    'after', p_new_quantity,
    'difference', p_new_quantity - v_before,
    'reason', btrim(p_reason)
  ));
end;
$$;
