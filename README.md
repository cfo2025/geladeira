# Geladeira Solidária

Sistema interno de controle de uso das geladeiras da CFO Tucum XVII: catálogo por
geladeira, retiradas em conta corrente, conferência manual de pagamentos Pix,
cancelamentos, balanço de estoque com PDF e notificações. Next.js (App Router + Server
Actions) + Supabase (Postgres, Auth, RLS) + Resend + Tailwind/shadcn.

Não é uma loja: os itens são repostos pela própria turma e o valor cobrado apenas cobre
o custo, sem fins de lucro.

## 1. Pré-requisitos

- Node.js 20+
- Uma conta [Supabase](https://supabase.com) (gratuita) e um projeto criado
- Uma conta [Resend](https://resend.com) (opcional para começar — sem ela o app funciona,
  só não envia e-mails)
- Uma conta [Vercel](https://vercel.com) para deploy

## 2. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com/dashboard).
2. Em **SQL Editor**, cole e execute o conteúdo de
   [`supabase/migrations/20260101000000_init_schema.sql`](supabase/migrations/20260101000000_init_schema.sql).
   Isso cria as tabelas, políticas de RLS, funções de negócio e já popula os locais
   iniciais (Rancho, Alojamento Masculino, Antessala).
3. Em **Project Settings > API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (fique atento: essa chave nunca deve
     ir para o cliente/navegador — ela só é usada em Server Actions administrativas)
4. Em **Authentication > Providers**, mantenha só e-mail/senha habilitado (não há
   cadastro público: contas só são criadas pelo admin).

### Criar o primeiro administrador (bootstrap)

Não existe tela de cadastro público — a criação normal de usuários é feita pelo próprio
admin logado, em `/admin/usuarios`. Para o *primeiro* admin, crie manualmente:

1. Em **Authentication > Users**, clique em "Add user" (defina e-mail e senha).
2. Em **SQL Editor**, rode (troque o UUID pelo `id` do usuário criado):

   ```sql
   insert into public.profiles (id, full_name, document, role, must_change_password)
   values ('COLE-O-UUID-DO-USUARIO-AQUI', 'Nome do Admin', '000.000.000-00', 'admin', false);
   ```

Depois disso, esse admin pode criar todos os outros usuários (inclusive outros admins)
pela própria interface.

## 3. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

| Variável | Descrição |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | do painel do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | do painel do Supabase — **secreta** |
| `RESEND_API_KEY` | do painel do Resend (opcional — sem ela, e-mails só ficam logados no console) |
| `RESEND_FROM_EMAIL` | remetente verificado no Resend, ex: `Loja Honesta <noreply@seudominio.com>` |
| `NEXT_PUBLIC_PIX_KEY` | chave Pix estática exibida na tela de pagamento |
| `NEXT_PUBLIC_PIX_RECEIVER_NAME` | nome exibido junto à chave Pix |

## 4. Rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## 5. Deploy (Vercel + Cloudflare)

1. Suba o repositório para o GitHub e importe o projeto na Vercel.
2. Configure as mesmas variáveis de ambiente do `.env.local` em **Project Settings >
   Environment Variables** na Vercel.
3. Para domínio próprio via Cloudflare: aponte um registro `CNAME` do seu domínio para
   `cname.vercel-dns.com` (ou siga o passo a passo que a Vercel mostra ao adicionar o
   domínio), e na Vercel adicione o domínio em **Project Settings > Domains**. Deixe o
   proxy da Cloudflare ("nuvem laranja") ativo normalmente; a Vercel já emite o SSL.

## 6. Regras de negócio implementadas (leia antes de usar em produção)

Algumas regras não estavam 100% especificadas e foram implementadas da seguinte forma —
revise se fizer sentido para o seu caso:

- **Conta corrente / pagamento**: o saldo devedor é um razão (ledger) puro —
  `Saldo = SUM(retiradas ativas) - SUM(pagamentos aprovados)`, recalculado a cada
  consulta (`get_my_balance()` / `compute_user_balance()`). Retiradas não ficam mais
  "travadas" a um pagamento específico: um pagamento parcial aprovado abate só o valor
  conferido pelo admin, e o restante continua aparecendo como saldo em aberto.
- **Janela de 5 dias da divergência**: começa a contar no primeiro instante em que o
  usuário *visualiza* a tela de pagamento após a rejeição (`divergence_notified_at`). O
  sistema mostra a contagem regressiva, mas nenhuma ação automática acontece quando o
  prazo expira — isso fica a critério da administração.
- **Cancelamento de retirada**: qualquer retirada com status `completed` pode ter
  cancelamento solicitado, independente de já estar refletida em algum pagamento — o
  razão recalcula o saldo puramente a partir do estado atual. Ao aprovar o cancelamento,
  o item volta ao estoque automaticamente.
- **Balanço de estoque**: "Aplicar contagem ao estoque" é uma ação manual e separada —
  registrar um balanço não altera o estoque sozinho, o admin decide se aplica o ajuste.
- **Login**: por e-mail/senha (Supabase Auth). O campo `document` (CPF) é só um dado de
  cadastro, não é usado para autenticação.
- **Ambiente de desenvolvimento**: se você também guarda este projeto no Google Drive,
  não rode `npm install`/`next dev` diretamente numa pasta sincronizada — o Google Drive
  (assim como OneDrive) não lida bem com as milhares de operações de arquivo pequenas que
  `node_modules`/`.next` geram. Desenvolva numa pasta local e sincronize só o código-fonte.
