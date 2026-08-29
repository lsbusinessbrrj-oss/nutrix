# NutriX — Guia de Deploy (colocar no ar)

O código está 100% pronto e o build passa. Faltam só os passos que dependem das
**suas contas** (eu não posso logar nelas). Siga na ordem.

---

## 1. Subir o código no GitHub
1. Em https://github.com/new → nome `nutrix` → **Private** → **não** marque "Add README" → **Create repository**.
2. No terminal, dentro da pasta do projeto:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/nutrix.git
   git push -u origin main
   ```
   (Login: usuário do GitHub + um *Personal Access Token* como senha — github.com/settings/tokens.)

---

## 2. Deploy no Render
1. https://render.com → **New +** → **Blueprint**.
2. Conecte o **GitHub** e selecione o repo **nutrix**. O Render lê o `render.yaml` sozinho.
3. Ele vai pedir os **segredos** (marcados `sync: false`). Copie do seu arquivo **`.env`**:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `RESEND_API_KEY`
   - `WHATSAPP_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `MP_ACCESS_TOKEN`  ← **use o token de PRODUÇÃO** (`APP_USR-…`) para cobrar de verdade
   - `VITE_WHATSAPP_NEGOCIO`  (número do WhatsApp do negócio, só dígitos, com DDI)
   - `APP_URL`  → deixe em branco por enquanto
4. **Apply / Create** → o build leva ~3-5 min. No fim, copie a **URL pública** (ex.: `https://nutrix.onrender.com`).
5. Volte em **Environment**, defina `APP_URL = https://nutrix.onrender.com` → **Save** (redeploya).

---

## 3. Mercado Pago (pagamento real)
No painel do Mercado Pago (developers → sua aplicação):
1. **Credenciais de produção** → copie o **Access Token** (`APP_USR-…`) e coloque em `MP_ACCESS_TOKEN` no Render.
2. **Webhooks / Notificações** → cadastre a URL:
   ```
   https://nutrix.onrender.com/api/mp/webhook
   ```
   e assine os eventos **Pagamentos** e **Assinaturas (preapproval)**.

Assim que um Pix/cartão for aprovado, o webhook libera o plano e **envia a dieta por e-mail sozinho**.

---

## 4. E-mail (deliverability — evitar spam)
No **registro.br**, adicione (além do que já está):
- **Tipo:** TXT · **Nome:** `_dmarc` · **Dados:** `v=DMARC1; p=none;`

SPF + DKIM já estão verificados; o DMARC completa o trio e melhora a entrega.

---

## 5. WhatsApp (opcional — caminho B)
No painel da Meta (WhatsApp → Configuration → Webhook):
- **Callback URL:** `https://nutrix.onrender.com/api/whatsapp/webhook`
- **Verify token:** `nutrix`
- Assine o campo **messages**.

O cliente toca "Receber no WhatsApp", manda a mensagem, e o webhook responde com o PDF.

---

## 6. Manter acordado (plano free do Render dorme após ~15 min)
Crie um monitor gratuito que faz um GET a cada ~10 min em:
```
https://nutrix.onrender.com/health
```
Use https://uptimerobot.com ou https://cron-job.org (grátis). Reduz o cold start e evita perder webhook.
*(Ou assine o plano pago do Render — US$7/mês — que não dorme.)*

---

## 7. Domínio próprio no site (opcional, recomendado)
Para o site abrir em `usenutrix.com.br` (em vez de `onrender.com`):
1. No Render → serviço → **Settings → Custom Domains** → adicione `usenutrix.com.br` (e `www`).
2. No **registro.br**, crie os registros que o Render indicar (geralmente um CNAME/ALIAS).
3. Atualize `APP_URL` para `https://usenutrix.com.br`.

---

## Teste final (ponta a ponta)
1. Acesse a URL → **cadastre** um cliente (e-mail + WhatsApp reais).
2. Faça o **quiz** → vá ao **pagamento** → pague (Pix/cartão de verdade, R$ 9,99).
3. Confirme que a **dieta chega no e-mail** automaticamente.
4. (Opcional) Teste o botão **Receber no WhatsApp**.

Pronto — está no ar. 🚀
