-- ============================================================================
-- Editar e excluir saída de caixa (admin/ordenador de despesa), com log de
-- auditoria completo — como mexe no saldo/balanço da loja, o antes/depois
-- (edição) e o snapshot inteiro (exclusão) ficam gravados em audit_logs,
-- mesmo que a linha original seja apagada da tabela.
-- ============================================================================

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
  v_available_without_this numeric;
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

  -- Saldo disponível "sem essa saída" (soma o valor antigo de volta antes
  -- de validar o novo valor, senão editar sempre pareceria estourar o
  -- saldo pelo valor que a própria saída já ocupava).
  select
    coalesce((select sum(admin_typed_amount) from payments where status = 'approved'), 0)
    - coalesce((select sum(valor) from expense_outflows where id <> p_id), 0)
  into v_available_without_this;

  if p_valor > v_available_without_this then
    raise exception 'Valor maior que o saldo em caixa disponível (R$ %)', to_char(v_available_without_this, 'FM999999990.00');
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

create or replace function public.delete_expense_outflow(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row expense_outflows%rowtype;
begin
  if not public.is_expense_orderer() then
    raise exception 'Apenas administradores ou ordenadores de despesa podem excluir saídas de caixa';
  end if;

  select * into v_row from expense_outflows where id = p_id for update;
  if not found then
    raise exception 'Saída não encontrada';
  end if;

  delete from expense_outflows where id = p_id;

  perform public.log_action(null, 'expense_deleted', jsonb_build_object(
    'expense_id', v_row.id,
    'valor', v_row.valor,
    'local_destinado', v_row.local_destinado,
    'responsavel_retirada', v_row.responsavel_retirada,
    'tag', v_row.tag,
    'observacoes', v_row.observacoes,
    'data_hora', v_row.data_hora
  ));
end;
$$;
