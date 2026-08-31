// Templates dos e-mails de marketing (funil). Cada função recebe o primeiro nome
// e o link (mágico) do botão, e devolve { assunto, html }.
// Tom limpo e sem "cara de spam" para preservar a entrega no inbox.

function primeiroNome(nome: string | null): string {
  const p = (nome ?? "").trim().split(" ")[0];
  return p || "";
}

// Layout base: cabeçalho NutriX + corpo + botão + rodapé.
function layout(titulo: string, corpoHtml: string, botaoTexto: string, botaoLink: string): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;color:#0f172a">
    <div style="background:#166534;padding:20px;border-radius:12px 12px 0 0;text-align:center">
      <span style="color:#fff;font-size:22px;font-weight:800">Nutri<span style="color:#E53935">X</span></span>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      <h2 style="color:#166534;margin:0 0 12px">${titulo}</h2>
      ${corpoHtml}
      <p style="text-align:center;margin:24px 0">
        <a href="${botaoLink}" style="background:#166534;color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:10px;display:inline-block">${botaoTexto}</a>
      </p>
      <p style="color:#94a3b8;font-size:12px;margin-top:20px">Equipe NutriX · Saúde que Alimenta. Treino que Transforma.<br>Se não quiser mais receber estes lembretes, é só responder este e-mail.</p>
    </div>
  </div>`;
}

export interface EmailPronto { assunto: string; html: string }

// 1 — Boas-vindas
export function emailBoasVindas(nome: string | null, link: string): EmailPronto {
  const p = primeiroNome(nome);
  return {
    assunto: `Bem-vindo(a) à NutriX${p ? `, ${p}` : ""} 🌱`,
    html: layout(
      `Que bom ter você aqui${p ? `, ${p}` : ""}!`,
      `<p>A NutriX monta uma <strong>dieta personalizada</strong> pra você — com as calorias e a proteína calculadas pro seu objetivo, opções pra cada refeição e substituições pra nunca enjoar.</p>
       <p>O próximo passo é rápido: responda algumas perguntas (peso, altura, idade e objetivo) e sua dieta é gerada na hora.</p>`,
      "Montar minha dieta", link,
    ),
  };
}

// 2 — Cadastro incompleto (não preencheu o quiz)
export function emailCadastroIncompleto(nome: string | null, link: string): EmailPronto {
  const p = primeiroNome(nome);
  return {
    assunto: `${p ? `${p}, ` : ""}faltou só terminar sua dieta`,
    html: layout(
      "Faltou pouco!",
      `<p>Vi que você criou sua conta na NutriX, mas ainda não preencheu o questionário — e é ele que gera a sua dieta.</p>
       <p>Leva menos de <strong>3 minutos</strong>: é só informar peso, altura, idade, sexo e seu objetivo. Assim que terminar, sua dieta personalizada fica pronta na hora.</p>`,
      "Completar e ver minha dieta", link,
    ),
  };
}

// 3 — Dieta pronta, ainda não liberou
export function emailDietaPronta(nome: string | null, link: string): EmailPronto {
  const p = primeiroNome(nome);
  return {
    assunto: `Sua dieta personalizada está pronta${p ? `, ${p}` : ""}`,
    html: layout(
      "Sua dieta já está montada!",
      `<p>Com base nas suas respostas, sua dieta personalizada <strong>já está pronta</strong> — calorias e proteína no ponto certo pro seu objetivo.</p>
       <p>Falta só liberar o acesso pra receber o plano completo, com opções por refeição e substituições, no app e por e-mail.</p>
       <p style="color:#475569">Por apenas <strong>R$ 9,99/mês</strong>. Cancele quando quiser.</p>`,
      "Ver minha dieta", link,
    ),
  };
}

// 4 — Checkout abandonado (quase liberou)
export function emailCheckout(nome: string | null, link: string): EmailPronto {
  const p = primeiroNome(nome);
  return {
    assunto: `${p ? `${p}, ` : ""}sua dieta ficou te esperando 🥗`,
    html: layout(
      "Você estava quase lá",
      `<p>Notamos que você chegou até a liberação da sua dieta, mas não concluiu. Ela continua guardada, prontinha pra você:</p>
       <ul style="color:#475569;font-size:14px;line-height:1.7">
         <li>Calorias e proteína calculadas pro seu objetivo</li>
         <li>3 opções por refeição</li>
         <li>Substituições pra cada alimento</li>
         <li>Recebe em PDF, no app e no e-mail</li>
       </ul>
       <p style="color:#475569">Tudo por <strong>R$ 9,99/mês</strong> — cancele quando quiser.</p>`,
      "Liberar minha dieta", link,
    ),
  };
}

// 5 — Última chamada
export function emailUltimaChamada(nome: string | null, link: string): EmailPronto {
  const p = primeiroNome(nome);
  return {
    assunto: `Última chamada pra sua dieta${p ? `, ${p}` : ""}`,
    html: layout(
      "Seu plano ainda está disponível",
      `<p>Este é nosso último lembrete 🙂</p>
       <p>Sua dieta personalizada está pronta e ainda disponível por <strong>R$ 9,99</strong>. É comer melhor sem complicação, com um plano feito só pra você.</p>
       <p style="color:#475569">Se não for o momento, tudo bem — estaremos aqui quando você quiser recomeçar.</p>`,
      "Quero minha dieta", link,
    ),
  };
}
