import "dotenv/config";
import { writeFileSync } from "node:fs";
import * as db from "../server/db";
import { entregarDieta } from "../server/lib/delivery";
import { corpoEmail, assuntoEmail } from "../server/lib/delivery/email";
import { mensagemWhatsapp } from "../server/lib/delivery/whatsapp";
import { criarPix } from "../server/lib/payments/mercadopago";

const user = await db.getUserByEmail("matheus-teste@nutrix.com");
if (!user) throw new Error("usuário de teste não encontrado");

// 1) Pix
const pix = await criarPix(user.email!, user.name ?? "Matheus");
console.log("PIX:", pix.simulado ? "(simulado)" : "(real)", "| paymentId:", pix.paymentId);

// 2) Entrega (após aprovação)
const res = await entregarDieta(user.id);
console.log("ENTREGA:", JSON.stringify(res, null, 2));

// 3) Salva pré-visualizações do que o cliente recebe
const nome = user.name ?? "Matheus";
writeFileSync("/tmp/email-preview.html", `<h3 style="font-family:Arial">Assunto: ${assuntoEmail(nome)}</h3>` + corpoEmail(nome));
writeFileSync("/tmp/whatsapp-preview.txt", mensagemWhatsapp(nome));
console.log("Previews salvos em /tmp/email-preview.html e /tmp/whatsapp-preview.txt");
process.exit(0);
