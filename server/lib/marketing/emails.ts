// Templates dos e-mails de marketing (funil) — design da marca (banner verde +
// botão + rodapé), com versão em texto puro junto (ajuda na entrega).

function primeiroNome(nome: string | null): string {
  const p = (nome ?? "").trim().split(" ")[0];
  return p || "";
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

export interface EmailPronto { assunto: string; html: string; text: string }

// Layout da marca: cabeçalho NutriX + título + parágrafos + botão + rodapé.
function montar(assunto: string, titulo: string, paras: string[], ctaTexto: string, link: string): EmailPronto {
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;color:#0f172a">
    <div style="background:#166534;padding:20px;border-radius:12px 12px 0 0;text-align:center">
      <span style="color:#fff;font-size:22px;font-weight:800">Nutri<span style="color:#E53935">X</span></span>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      <h2 style="color:#166534;margin:0 0 12px">${titulo}</h2>
      ${paras.map((p) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.55">${p}</p>`).join("")}
      <p style="text-align:center;margin:24px 0">
        <a href="${link}" style="background:#166534;color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:10px;display:inline-block">${ctaTexto}</a>
      </p>
      <p style="color:#94a3b8;font-size:12px;margin-top:20px">Equipe NutriX · Saúde que Alimenta. Treino que Transforma.<br>Se não quiser mais receber estes lembretes, é só responder este e-mail.</p>
    </div>
  </div>`;
  const text =
    `${titulo}\n\n` + paras.map(stripTags).join("\n\n") +
    `\n\n${ctaTexto}: ${link}\n\nEquipe NutriX · Saúde que Alimenta. Treino que Transforma.`;
  return { assunto, html, text };
}

// 1 — Boas-vindas
export function emailBoasVindas(nome: string | null, link: string): EmailPronto {
  const p = primeiroNome(nome);
  return montar(
    `Bem-vindo(a) à NutriX${p ? `, ${p}` : ""}`,
    `Que bom ter você aqui${p ? `, ${p}` : ""}!`,
    [
      "A NutriX monta uma <strong>dieta personalizada</strong> pra você — com as calorias e a proteína calculadas pro seu objetivo, opções pra cada refeição e substituições pra nunca enjoar.",
      "O próximo passo é rápido: responda algumas perguntas (peso, altura, idade e objetivo) e sua dieta é gerada na hora.",
    ],
    "Montar minha dieta", link,
  );
}

// 2 — Cadastro incompleto (não preencheu o quiz)
export function emailCadastroIncompleto(nome: string | null, link: string): EmailPronto {
  const p = primeiroNome(nome);
  return montar(
    `${p ? `${p}, ` : ""}faltou só terminar sua dieta`,
    "Faltou pouco!",
    [
      "Vi que você criou sua conta na NutriX, mas ainda não preencheu o questionário — e é ele que gera a sua dieta.",
      "Leva menos de <strong>3 minutos</strong>: é só informar peso, altura, idade, sexo e seu objetivo. Assim que terminar, sua dieta personalizada fica pronta na hora.",
    ],
    "Completar e ver minha dieta", link,
  );
}

// 3 — Dieta pronta, ainda não liberou
export function emailDietaPronta(nome: string | null, link: string): EmailPronto {
  const p = primeiroNome(nome);
  return montar(
    `Sua dieta personalizada está pronta${p ? `, ${p}` : ""}`,
    "Sua dieta já está montada!",
    [
      "Com base nas suas respostas, sua dieta personalizada <strong>já está pronta</strong> — calorias e proteína no ponto certo pro seu objetivo.",
      "Falta só liberar o acesso pra receber o plano completo, com opções por refeição e substituições, no app e por e-mail.",
      "Por apenas <strong>R$ 9,99/mês</strong>. Cancele quando quiser.",
    ],
    "Ver minha dieta", link,
  );
}

// 4 — Checkout abandonado (quase liberou)
export function emailCheckout(nome: string | null, link: string): EmailPronto {
  const p = primeiroNome(nome);
  return montar(
    `${p ? `${p}, ` : ""}sua dieta ficou te esperando`,
    "Você estava quase lá",
    [
      "Notamos que você chegou até a liberação da sua dieta, mas não concluiu. Ela continua guardada, prontinha pra você:",
      "• Calorias e proteína calculadas pro seu objetivo<br>• 3 opções por refeição<br>• Substituições pra cada alimento<br>• Disponível no app e por e-mail",
      "Tudo por <strong>R$ 9,99/mês</strong> — cancele quando quiser.",
    ],
    "Liberar minha dieta", link,
  );
}

// 5 — Última chamada
export function emailUltimaChamada(nome: string | null, link: string): EmailPronto {
  const p = primeiroNome(nome);
  return montar(
    `Última chamada pra sua dieta${p ? `, ${p}` : ""}`,
    "Seu plano ainda está disponível",
    [
      "Este é nosso último lembrete 🙂",
      "Sua dieta personalizada está pronta e ainda disponível por <strong>R$ 9,99</strong>. É comer melhor sem complicação, com um plano feito só pra você.",
      "Se não for o momento, tudo bem — estaremos aqui quando você quiser recomeçar.",
    ],
    "Quero minha dieta", link,
  );
}
