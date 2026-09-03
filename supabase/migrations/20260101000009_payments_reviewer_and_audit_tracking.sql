-- ============================================================================
-- 1) Pagamentos: registra quem aprovou/revisou (reviewed_by).
-- 2) Balanço de estoque: cada item de auditoria passa a rastrear se já foi
--    aplicado ao estoque (applied_at), permitindo "zerar" divergências uma a
--    uma direto na lista resumida, sem precisar aplicar o balanço inteiro.
-- ============================================================================

alter table payments add column reviewed_by uuid references profiles(id);

create or replace function public.review_payment(
  p_payment_id uuid,
  p_admin_typed_amount numeric,
  p_decision text,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment payments%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem revisar pagamentos';
  end if;

  if p_decision not in ('approved', 'rejected_divergent', 'rejected_unpaid') then
    raise exception 'Decisão inválida';
  end if;

  select * into v_payment from payments where id = p_payment_id for update;
  if not found or v_payment.status <> 'pending' then
    raise exception 'Pagamento não encontrado ou já revisado';
  end if;

  update payments
    set status = p_decision,
        admin_typed_amount = p_admin_typed_amount,
        divergence_notes = p_notes,
        reviewed_by = auth.uid(),
        reviewed_at = now()
    where id = p_payment_id;

  if p_decision = 'approved' then
    perform public.notify(v_payment.user_id, 'Pagamento aprovado', 'Seu pagamento foi conferido e aprovado.');
  else
    update withdrawals set payment_id = null where payment_id = p_payment_id;
    perform public.notify(v_payment.user_id, 'Divergência no pagamento', 'Foi identificada uma divergência no seu pagamento. Acesse os detalhes para mais informações.');
  end if;

  perform public.log_action(v_payment.user_id, 'payment_reviewed', jsonb_build_object('payment_id', p_payment_id, 'decision', p_decision, 'admin_typed_amount', p_admin_typed_amount));
end;
$$;

alter table stock_audit_items add column applied_at timestamptz;

-- Aplica o balanço inteiro (todos os itens ainda não aplicados) — usado na
-- página de detalhe de um balanço específico.
create or replace function public.apply_stock_audit(p_audit_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_location_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem aplicar balanços de estoque';
  end if;

  select location_id into v_location_id from stock_audits where id = p_audit_id;
  if not found then
    raise exception 'Balanço não encontrado';
  end if;

  update inventory i
    set quantity = sai.physical_quantity
    from stock_audit_items sai
    where sai.audit_id = p_audit_id
      and sai.applied_at is null
      and i.location_id = v_location_id
      and i.product_id = sai.product_id;

  update stock_audit_items set applied_at = now() where audit_id = p_audit_id and applied_at is null;

  perform public.log_action(null, 'stock_audit_applied', jsonb_build_object('audit_id', p_audit_id));
end;
$$;

-- Aplica um único item de balanço (usado na lista resumida de divergências).
create or replace function public.apply_stock_audit_item(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item stock_audit_items%rowtype;
  v_location_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem aplicar balanços de estoque';
  end if;

  select * into v_item from stock_audit_items where id = p_item_id for update;
  if not found then
    raise exception 'Item de balanço não encontrado';
  end if;
  if v_item.applied_at is not null then
    raise exception 'Este ajuste já foi aplicado';
  end if;

  select location_id into v_location_id from stock_audits where id = v_item.audit_id;

  update inventory
    set quantity = v_item.physical_quantity
    where location_id = v_location_id and product_id = v_item.product_id;

  update stock_audit_items set applied_at = now() where id = p_item_id;

  perform public.log_action(null, 'stock_audit_item_applied', jsonb_build_object('item_id', p_item_id));
end;
$$;
