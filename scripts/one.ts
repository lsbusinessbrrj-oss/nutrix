import "dotenv/config";
import { getUserByEmail } from "../server/db";
import { assinarTokenLogin } from "../server/auth/magic";
import { enviarEmailSimples } from "../server/lib/delivery/email";
import { emailBoasVindas } from "../server/lib/marketing/emails";

const alvo = process.argv[2] ?? "lsbusinessbrrj@gmail.com";
const APP_URL = "https://usenutrix.com.br";
const u = await getUserByEmail(alvo);
const t = await assinarTokenLogin(u?.id ?? 30001);
const link = `${APP_URL}/api/auth/magic?token=${encodeURIComponent(t)}&next=/home`;
const { assunto, html, text } = emailBoasVindas(u?.name ?? "Matheus", link);
const r = await enviarEmailSimples(alvo, assunto, html, text);
console.log(r.ok ? `ENVIADO: "${assunto}" → ${alvo}` : `FALHOU: ${r.detalhe}`);
process.exit(0);
