-- ============================================================================
-- Remove a trava que impedia lançar saída de caixa quando o valor superasse
-- o saldo em caixa disponível. O caixa pode ficar negativo e a operação
-- continua sendo registrada normalmente ("operando no prejuízo") — o card
-- "Saldo em Caixa Disponível" já mostra o número negativo sem problema,
-- só a validação de escrita que ainda bloqueava.
-- ============================================================================

create or replace function public.create_expense_outflow(
  p_valor numeric,
  p_local_destinado text,
  p_responsavel_retirada text,
  p_tag text,
  p_observacoes text default null
)
returns expense_outflows
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row expense_outflows%rowtype;
begin
  if not public.is_expense_orderer() then
    raise exception 'Apenas administradores ou ordenadores de despesa podem lançar saídas de caixa';
  end if;

  if p_valor is null or p_valor <= 0 then
    raise exception 'Valor inválido';
  end if;

  if p_local_destinado is null or btrim(p_local_destinado) = '' then
    raise exception 'Informe o local/finalidade da despesa';
  end if;

  if p_responsavel_retirada is null or btrim(p_responsavel_retirada) = '' then
    raise exception 'Informe o responsável pela retirada';
  end if;

  if p_tag not in ('empenho', 'bonus', 'descaminho') then
    raise exception 'Tag inválida';
  end if;

  insert into expense_outflows (valor, local_destinado, responsavel_retirada, tag, criado_por_id, observacoes)
  values (p_valor, btrim(p_local_destinado), btrim(p_responsavel_retirada), p_tag, auth.uid(), nullif(btrim(coalesce(p_observacoes, '')), ''))
  returning * into v_row;

  perform public.log_action(null, 'expense_created', jsonb_build_object(
    'expense_id', v_row.id,
    'valor', p_valor,
    'local_destinado', v_row.local_destinado,
    'responsavel_retirada', v_row.responsavel_retirada,
    'tag', p_tag
  ));

  return v_row;
end;
$$;

create or replace function public.update_expense_outflow(
  p_id uuid,
  p_valor numeric,
  p_local_destinado text,
  p_responsavel_retirada text,
  p_tag text,
  p_observacoes text default null
)
returns expense_outflows
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old expense_outflows%rowtype;
  v_new expense_outflows%rowtype;
begin
  if not public.is_expense_orderer() then
    raise exception 'Apenas administradores ou ordenadores de despesa podem editar saídas de caixa';
  end if;

  select * into v_old from expense_outflows where id = p_id for update;
  if not found then
    raise exception 'Saída não encontrada';
  end if;

  if p_valor is null or p_valor <= 0 then
    raise exception 'Valor inválido';
  end if;

  if p_local_destinado is null or btrim(p_local_destinado) = '' then
    raise exception 'Informe o local/finalidade da despesa';
  end if;

  if p_responsavel_retirada is null or btrim(p_responsavel_retirada) = '' then
    raise exception 'Informe o responsável pela retirada';
  end if;

  if p_tag not in ('empenho', 'bonus', 'descaminho') then
    raise exception 'Tag inválida';
  end if;

  update expense_outflows
    set valor = p_valor,
        local_destinado = btrim(p_local_destinado),
        responsavel_retirada = btrim(p_responsavel_retirada),
        tag = p_tag,
        observacoes = nullif(btrim(coalesce(p_observacoes, '')), '')
    where id = p_id
    returning * into v_new;

  perform public.log_action(null, 'expense_updated', jsonb_build_object(
    'expense_id', p_id,
    'before', jsonb_build_object(
      'valor', v_old.valor,
      'local_destinado', v_old.local_destinado,
      'responsavel_retirada', v_old.responsavel_retirada,
      'tag', v_old.tag,
      'observacoes', v_old.observacoes
    ),
    'after', jsonb_build_object(
      'valor', v_new.valor,
      'local_destinado', v_new.local_destinado,
      'responsavel_retirada', v_new.responsavel_retirada,
      'tag', v_new.tag,
      'observacoes', v_new.observacoes
    )
  ));

  return v_new;
end;
$$;
