# Migração do NutriX para fora do Manus

O app é full-stack: **Vite + React 19 + tRPC + Express + Drizzle (MySQL/TiDB)**.
O banco e a Stripe são portáveis. O que está preso ao Manus e precisa ser
substituído: **login (OAuth Manus)**, **IA (Forge)**, **armazenamento** e análise.

## Fases

- [x] **Fase 1 — Corrigir a dieta (feito, validar no 1º build).**
  Substituída a geração por IA (que "chutava" calorias e ignorava proteína) por
  cálculo determinístico em `server/lib/diet/` (Mifflin-St Jeor + proteína g/kg).
  `server/routers/diet.ts` agora usa `gerarPlano()`. Remove dependência da IA do Manus.

- [ ] **Fase 2 — Autenticação própria.** Substituir `server/_core/oauth.ts`,
  `sdk.authenticateRequest` e o cookie de sessão por: login Google próprio +
  e-mail/senha (bcrypt) + sessão JWT. Reaproveita as telas Login/Signup/RecoverPassword
  e a tabela `users` (trocar chave `openId` por id próprio).

- [ ] **Fase 3 — Remover demais dependências Manus.** Chat com IA (`AIChatBox`/Forge),
  storage (`storageProxy`), geração de imagem, voz, analytics. Manter só o necessário.

- [ ] **Fase 4 — Pagamento com Pix.** Adicionar `pix` ao Stripe Checkout (ou migrar
  para Mercado Pago). Ajustar webhook.

- [ ] **Fase 5 — Entrega da dieta.** Gerar PDF, enviar por e-mail (Resend) e
  WhatsApp (Cloud API) após pagamento aprovado.

- [ ] **Fase 6 — Deploy.** Hospedar o servidor Node (Render/Railway/Fly) apontando
  para o TiDB, com as variáveis do `.env.example`.

## Pré-requisito para desenvolver/testar

Instalar Node 20+ e pnpm na máquina (hoje não há Node instalado), para rodar
`pnpm install`, `pnpm dev` e `pnpm check` (typecheck) e validar cada fase.
