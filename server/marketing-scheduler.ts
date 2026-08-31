// Agendador interno: roda a automação de e-mail marketing periodicamente,
// enquanto o serviço está no ar. Não depende de cron externo. (Em produção;
// o endpoint /api/cron/marketing continua existindo para um ping externo opcional.)
import { enviarMarketing } from "./lib/marketing";

export function startMarketingScheduler() {
  if (process.env.NODE_ENV !== "production") return; // não dispara e-mail em dev
  const rodar = () =>
    enviarMarketing()
      .then((r) => { if (r.enviados) console.log(`[marketing] enviados=${r.enviados}/${r.avaliados}`); })
      .catch((e) => console.error("[marketing] erro:", (e as Error).message));

  // Logo após subir (pega quem já está com e-mail pendente) e depois a cada 15 min.
  setTimeout(rodar, 45_000);
  setInterval(rodar, 15 * 60_000);
}
