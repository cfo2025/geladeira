-- ============================================================================
-- Loja Honesta — schema inicial, RLS e funções de negócio
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- TABELAS
-- ============================================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  document text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  is_active boolean default true,
  deactivation_reason text check (deactivation_reason is null or deactivation_reason in ('desligamento', 'pedido de baixa', 'a pedido', 'dever')),
  must_change_password boolean default true,
  created_at timestamptz default now()
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table inventory (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references locations(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  price numeric(10,2) not null check (price >= 0),
  quantity int not null default 0 check (quantity >= 0),
  unique(location_id, product_id)
);

create table withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  product_id uuid references products(id),
  location_id uuid references locations(id),
  unit_price_at_withdrawal numeric(10,2) not null,
  quantity int default 1 check (quantity > 0),
  status text default 'completed' check (status in ('completed', 'deletion_requested', 'cancelled')),
  payment_id uuid,
  created_at timestamptz default now()
);

create table withdrawal_cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  withdrawal_id uuid references withdrawals(id),
  user_id uuid references profiles(id),
  reason text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  expected_amount numeric(10,2) not null,
  user_declared_amount numeric(10,2) not null,
  is_partial boolean default false,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected_divergent', 'rejected_unpaid')),
  admin_typed_amount numeric(10,2),
  divergence_notes text,
  divergence_notified_at timestamptz,
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

alter table withdrawals
  add constraint withdrawals_payment_id_fkey foreign key (payment_id) references payments(id);

create table stock_audits (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references locations(id),
  admin_id uuid references profiles(id),
  notes text,
  created_at timestamptz default now()
);

create table stock_audit_items (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid references stock_audits(id),
  product_id uuid references products(id),
  expected_quantity int not null,
  physical_quantity int not null,
  difference int not null
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  target_user_id uuid references profiles(id),
  action text not null,
  details jsonb,
  created_at timestamptz default now()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

create index idx_withdrawals_user on withdrawals(user_id);
create index idx_withdrawals_payment on withdrawals(payment_id);
create index idx_withdrawals_status on withdrawals(status);
create index idx_inventory_location on inventory(location_id);
create index idx_payments_user on payments(user_id);
create index idx_payments_status on payments(status);
create index idx_notifications_user on notifications(user_id, is_read);
create index idx_audit_logs_actor on audit_logs(actor_id);
create index idx_cancellation_requests_status on withdrawal_cancellation_requests(status);

-- ============================================================================
-- SEED: locais iniciais
-- ============================================================================

insert into locations (name) values
  ('Rancho'),
  ('Alojamento Masculino'),
  ('Antessala');

-- ============================================================================
-- FUNÇÕES AUXILIARES
-- ============================================================================

-- is_admin(): usada dentro de policies de RLS. security definer evita recursão
-- de RLS ao consultar a própria tabela profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and is_active = true
  );
$$;

create or replace function public.notify(p_user_id uuid, p_title text, p_message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notifications (user_id, title, message)
  values (p_user_id, p_title, p_message);
end;
$$;

create or replace function public.log_action(p_target_user_id uuid, p_action text, p_details jsonb default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_logs (actor_id, target_user_id, action, details)
  values (auth.uid(), p_target_user_id, p_action, p_details);
end;
$$;

-- Impede que um usuário comum altere role/is_active/deactivation_reason/must_change_password
-- do próprio perfil (só admin pode, via policy de UPDATE separada).
create or replace function public.guard_profile_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role
      or new.is_active is distinct from old.is_active
      or new.deactivation_reason is distinct from old.deactivation_reason then
      raise exception 'Apenas administradores podem alterar estes campos do perfil';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_guard_profile_self_update
  before update on profiles
  for each row execute function public.guard_profile_self_update();

-- ============================================================================
-- FUNÇÕES DE NEGÓCIO (SECURITY DEFINER — validam auth.uid() internamente)
-- ============================================================================

-- Retorna o saldo devedor atual do usuário autenticado (retiradas concluídas
-- ainda não vinculadas a um pagamento aprovado/pendente).
create or replace function public.get_my_balance()
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(unit_price_at_withdrawal * quantity), 0)
  from withdrawals
  where user_id = auth.uid()
    and status = 'completed'
    and payment_id is null;
$$;

-- Registra uma retirada: valida estoque, tira snapshot do preço e decrementa
-- o inventário de forma atômica (lock de linha).
create or replace function public.create_withdrawal(
  p_product_id uuid,
  p_location_id uuid,
  p_quantity int default 1
)
returns withdrawals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inventory inventory%rowtype;
  v_withdrawal withdrawals%rowtype;
begin
  if not public.is_active_user() then
    raise exception 'Usuário inativo';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantidade inválida';
  end if;

  select * into v_inventory
  from inventory
  where product_id = p_product_id and location_id = p_location_id
  for update;

  if not found then
    raise exception 'Produto não disponível neste local';
  end if;

  if v_inventory.quantity < p_quantity then
    raise exception 'Estoque insuficiente';
  end if;

  update inventory set quantity = quantity - p_quantity where id = v_inventory.id;

  insert into withdrawals (user_id, product_id, location_id, unit_price_at_withdrawal, quantity, status)
  values (auth.uid(), p_product_id, p_location_id, v_inventory.price, p_quantity, 'completed')
  returning * into v_withdrawal;

  return v_withdrawal;
end;
$$;

-- Usuário solicita cancelamento de uma retirada não paga.
create or replace function public.request_withdrawal_cancellation(
  p_withdrawal_id uuid,
  p_reason text
)
returns withdrawal_cancellation_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_withdrawal withdrawals%rowtype;
  v_request withdrawal_cancellation_requests%rowtype;
begin
  select * into v_withdrawal from withdrawals where id = p_withdrawal_id;

  if not found or v_withdrawal.user_id <> auth.uid() then
    raise exception 'Retirada não encontrada';
  end if;

  if v_withdrawal.status <> 'completed' then
    raise exception 'Esta retirada não pode ser cancelada (status atual: %)', v_withdrawal.status;
  end if;

  if v_withdrawal.payment_id is not null then
    raise exception 'Esta retirada já está vinculada a um pagamento e não pode ser cancelada diretamente';
  end if;

  update withdrawals set status = 'deletion_requested' where id = p_withdrawal_id;

  insert into withdrawal_cancellation_requests (withdrawal_id, user_id, reason)
  values (p_withdrawal_id, auth.uid(), p_reason)
  returning * into v_request;

  perform public.log_action(auth.uid(), 'cancellation_requested', jsonb_build_object('withdrawal_id', p_withdrawal_id));

  return v_request;
end;
$$;

-- Admin aprova/rejeita uma solicitação de cancelamento.
create or replace function public.review_cancellation_request(
  p_request_id uuid,
  p_approve boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request withdrawal_cancellation_requests%rowtype;
  v_withdrawal withdrawals%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem revisar cancelamentos';
  end if;

  select * into v_request from withdrawal_cancellation_requests where id = p_request_id;
  if not found or v_request.status <> 'pending' then
    raise exception 'Solicitação não encontrada ou já revisada';
  end if;

  select * into v_withdrawal from withdrawals where id = v_request.withdrawal_id for update;

  if p_approve then
    update withdrawals set status = 'cancelled' where id = v_withdrawal.id;
    update inventory set quantity = quantity + v_withdrawal.quantity
      where product_id = v_withdrawal.product_id and location_id = v_withdrawal.location_id;
    update withdrawal_cancellation_requests
      set status = 'approved', reviewed_by = auth.uid() where id = p_request_id;
    perform public.notify(v_withdrawal.user_id, 'Cancelamento aprovado', 'Sua solicitação de cancelamento de retirada foi aprovada e o valor foi removido do seu saldo.');
  else
    update withdrawals set status = 'completed' where id = v_withdrawal.id;
    update withdrawal_cancellation_requests
      set status = 'rejected', reviewed_by = auth.uid() where id = p_request_id;
    perform public.notify(v_withdrawal.user_id, 'Cancelamento rejeitado', 'Sua solicitação de cancelamento de retirada foi rejeitada.');
  end if;

  perform public.log_action(v_withdrawal.user_id, 'cancellation_reviewed', jsonb_build_object('request_id', p_request_id, 'approved', p_approve));
end;
$$;

-- Usuário declara um pagamento (Pix estático). Vincula todas as retiradas
-- "em aberto" (payment_id is null) a este pagamento, travando o valor esperado.
create or replace function public.declare_payment(
  p_user_declared_amount numeric,
  p_is_partial boolean default false
)
returns payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected numeric;
  v_payment payments%rowtype;
begin
  if not public.is_active_user() then
    raise exception 'Usuário inativo';
  end if;

  select coalesce(sum(unit_price_at_withdrawal * quantity), 0) into v_expected
  from withdrawals
  where user_id = auth.uid() and status = 'completed' and payment_id is null;

  if v_expected <= 0 then
    raise exception 'Não há saldo em aberto para declarar pagamento';
  end if;

  insert into payments (user_id, expected_amount, user_declared_amount, is_partial, status)
  values (auth.uid(), v_expected, p_user_declared_amount, p_is_partial, 'pending')
  returning * into v_payment;

  update withdrawals
    set payment_id = v_payment.id
    where user_id = auth.uid() and status = 'completed' and payment_id is null;

  return v_payment;
end;
$$;

-- Admin confere e decide um pagamento pendente.
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
        reviewed_at = now()
    where id = p_payment_id;

  if p_decision = 'approved' then
    perform public.notify(v_payment.user_id, 'Pagamento aprovado', 'Seu pagamento foi conferido e aprovado.');
  else
    -- libera as retiradas para poderem entrar em uma nova declaração de pagamento
    update withdrawals set payment_id = null where payment_id = p_payment_id;
    perform public.notify(v_payment.user_id, 'Divergência no pagamento', 'Foi identificada uma divergência no seu pagamento. Acesse os detalhes para mais informações.');
  end if;

  perform public.log_action(v_payment.user_id, 'payment_reviewed', jsonb_build_object('payment_id', p_payment_id, 'decision', p_decision, 'admin_typed_amount', p_admin_typed_amount));
end;
$$;

-- Marca o início da janela de 5 dias: chamado pelo cliente na primeira vez
-- que o usuário visualiza uma divergência.
create or replace function public.mark_divergence_seen(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update payments
    set divergence_notified_at = now()
    where id = p_payment_id
      and user_id = auth.uid()
      and status in ('rejected_divergent', 'rejected_unpaid')
      and divergence_notified_at is null;
end;
$$;

-- Admin cria um balanço de estoque físico para um local, em lote.
-- p_items: [{ "product_id": "...", "physical_quantity": 10 }, ...]
create or replace function public.create_stock_audit(
  p_location_id uuid,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_audit_id uuid;
  v_item jsonb;
  v_expected int;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem realizar balanços de estoque';
  end if;

  insert into stock_audits (location_id, admin_id, notes)
  values (p_location_id, auth.uid(), p_notes)
  returning id into v_audit_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select quantity into v_expected
    from inventory
    where location_id = p_location_id and product_id = (v_item->>'product_id')::uuid;

    v_expected := coalesce(v_expected, 0);

    insert into stock_audit_items (audit_id, product_id, expected_quantity, physical_quantity, difference)
    values (
      v_audit_id,
      (v_item->>'product_id')::uuid,
      v_expected,
      (v_item->>'physical_quantity')::int,
      (v_item->>'physical_quantity')::int - v_expected
    );
  end loop;

  perform public.log_action(null, 'stock_audit_created', jsonb_build_object('audit_id', v_audit_id, 'location_id', p_location_id));

  return v_audit_id;
end;
$$;

-- Aplica a contagem física de um balanço ao estoque (ajusta inventory.quantity).
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
      and i.location_id = v_location_id
      and i.product_id = sai.product_id;

  perform public.log_action(null, 'stock_audit_applied', jsonb_build_object('audit_id', p_audit_id));
end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table profiles enable row level security;
alter table locations enable row level security;
alter table products enable row level security;
alter table inventory enable row level security;
alter table withdrawals enable row level security;
alter table withdrawal_cancellation_requests enable row level security;
alter table payments enable row level security;
alter table stock_audits enable row level security;
alter table stock_audit_items enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

-- profiles
create policy "profiles_select_own_or_admin" on profiles for select
  using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own_or_admin" on profiles for update
  using (id = auth.uid() or public.is_admin());
-- Sem policy de INSERT/DELETE: criação/remoção de perfis só via service role (Admin API).

-- locations
create policy "locations_select_active_users" on locations for select
  using (public.is_active_user());
create policy "locations_admin_write" on locations for all
  using (public.is_admin()) with check (public.is_admin());

-- products
create policy "products_select_active_users" on products for select
  using (public.is_active_user());
create policy "products_admin_write" on products for all
  using (public.is_admin()) with check (public.is_admin());

-- inventory
create policy "inventory_select_active_users" on inventory for select
  using (public.is_active_user());
create policy "inventory_admin_write" on inventory for all
  using (public.is_admin()) with check (public.is_admin());

-- withdrawals (escritas somente via funções SECURITY DEFINER)
create policy "withdrawals_select_own_or_admin" on withdrawals for select
  using (user_id = auth.uid() or public.is_admin());
create policy "withdrawals_admin_write" on withdrawals for all
  using (public.is_admin()) with check (public.is_admin());

-- withdrawal_cancellation_requests
create policy "cancellation_requests_select_own_or_admin" on withdrawal_cancellation_requests for select
  using (user_id = auth.uid() or public.is_admin());
create policy "cancellation_requests_admin_write" on withdrawal_cancellation_requests for all
  using (public.is_admin()) with check (public.is_admin());

-- payments
create policy "payments_select_own_or_admin" on payments for select
  using (user_id = auth.uid() or public.is_admin());
create policy "payments_admin_write" on payments for all
  using (public.is_admin()) with check (public.is_admin());

-- stock_audits / stock_audit_items (somente admin)
create policy "stock_audits_admin_only" on stock_audits for all
  using (public.is_admin()) with check (public.is_admin());
create policy "stock_audit_items_admin_only" on stock_audit_items for all
  using (public.is_admin()) with check (public.is_admin());

-- notifications
create policy "notifications_select_own" on notifications for select
  using (user_id = auth.uid());
create policy "notifications_update_own" on notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications_admin_write" on notifications for insert
  with check (public.is_admin());

-- audit_logs (somente admin lê; escrita só via log_action, que é security definer)
create policy "audit_logs_admin_select" on audit_logs for select
  using (public.is_admin());
