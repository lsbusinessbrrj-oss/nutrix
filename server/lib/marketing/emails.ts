// Templates dos e-mails de marketing (funil).
// Estilo PROPOSITALMENTE minimalista/pessoal (sem banner colorido, sem botão de
// anúncio, sem emoji no assunto, com versão em texto puro) para o Gmail entregar
// na aba PRINCIPAL em vez de Promoções.

function primeiroNome(nome: string | null): string {
  const p = (nome ?? "").trim().split(" ")[0];
  return p || "";
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

export interface EmailPronto { assunto: string; html: string; text: string }

// Monta html (leve) + texto puro a partir de parágrafos simples + 1 link de texto.
function montar(assunto: string, titulo: string, paras: string[], ctaTexto: string, link: string): EmailPronto {
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:460px;margin:0 auto">
    <p style="margin:0 0 14px"><strong style="color:#166534">NutriX</strong></p>
    <p style="margin:0 0 12px"><strong>${titulo}</strong></p>
    ${paras.map((p) => `<p style="margin:0 0 12px">${p}</p>`).join("")}
    <p style="margin:16px 0"><a href="${link}" style="color:#166534;font-weight:700">${ctaTexto}</a></p>
    <p style="margin:18px 0 0;color:#555">Abraço,<br>Equipe NutriX</p>
    <p style="margin:14px 0 0;color:#9aa0a6;font-size:12px">Se não quiser mais estes avisos, responda com "sair".</p>
  </div>`;
  const text =
    `${titulo}\n\n` +
    paras.map(stripTags).join("\n\n") +
    `\n\n${ctaTexto}: ${link}\n\nAbraço,\nEquipe NutriX\n\n` +
    `Se não quiser mais estes avisos, responda com "sair".`;
  return { assunto, html, text };
}

// 1 — Boas-vindas
export function emailBoasVindas(nome: string | null, link: string): EmailPronto {
  const p = primeiroNome(nome);
  return montar(
    `Bem-vindo à NutriX${p ? `, ${p}` : ""}`,
    `Oi${p ? `, ${p}` : ""}! Que bom ter você aqui.`,
    [
      "A NutriX monta uma dieta personalizada pra você, com as calorias e a proteína calculadas pro seu objetivo, opções por refeição e substituições.",
      "O próximo passo é rápido: responda algumas perguntas (peso, altura, idade e objetivo) e sua dieta é gerada na hora.",
    ],
    "Montar minha dieta", link,
  );
}

// 2 — Cadastro incompleto (não preencheu o quiz)
export function emailCadastroIncompleto(nome: string | null, link: string): EmailPronto {
  const p = primeiroNome(nome);
  return montar(
    `${p ? `${p}, ` : ""}faltou terminar sua dieta`,
    `Oi${p ? `, ${p}` : ""}, faltou pouco.`,
    [
      "Vi que você criou sua conta na NutriX, mas ainda não preencheu o questionário — e é ele que gera a sua dieta.",
      "Leva menos de 3 minutos: é só informar peso, altura, idade, sexo e seu objetivo. Assim que terminar, sua dieta fica pronta na hora.",
    ],
    "Completar minha dieta", link,
  );
}

// 3 — Dieta pronta, ainda não liberou
export function emailDietaPronta(nome: string | null, link: string): EmailPronto {
  const p = primeiroNome(nome);
  return montar(
    `Sua dieta está pronta${p ? `, ${p}` : ""}`,
    `Oi${p ? `, ${p}` : ""}, sua dieta já está montada.`,
    [
      "Com base nas suas respostas, calculei sua dieta personalizada — calorias e proteína no ponto certo pro seu objetivo.",
      "Falta só liberar o acesso pra receber o plano completo, com as opções por refeição e as substituições. O acesso é R$ 9,99 por mês e você cancela quando quiser.",
    ],
    "Ver minha dieta", link,
  );
}

// 4 — Checkout abandonado (quase liberou)
export function emailCheckout(nome: string | null, link: string): EmailPronto {
  const p = primeiroNome(nome);
  return montar(
    `${p ? `${p}, ` : ""}sua dieta ficou te esperando`,
    `Oi${p ? `, ${p}` : ""}, você estava quase lá.`,
    [
      "Vi que você chegou até a liberação da sua dieta, mas não concluiu. Ela continua guardada, prontinha pra você — com as calorias e a proteína do seu objetivo, as opções por refeição e as substituições.",
      "É só retomar de onde parou. O acesso é R$ 9,99 por mês e você cancela quando quiser.",
    ],
    "Retomar minha dieta", link,
  );
}

// 5 — Última chamada
export function emailUltimaChamada(nome: string | null, link: string): EmailPronto {
  const p = primeiroNome(nome);
  return montar(
    `Última chamada pra sua dieta${p ? `, ${p}` : ""}`,
    `Oi${p ? `, ${p}` : ""}, este é o último lembrete.`,
    [
      "Sua dieta personalizada continua pronta e disponível. Se ainda quiser começar a comer melhor com um plano feito só pra você, é só liberar o acesso.",
      "Se não for o momento, tudo bem — estarei aqui quando você quiser recomeçar.",
    ],
    "Ver minha dieta", link,
  );
}
