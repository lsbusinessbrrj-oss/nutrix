// Dispara um teste REAL de entrega (e-mail + WhatsApp) para o contato de teste.
// Só envia de verdade se as chaves estiverem no .env (RESEND_*, WHATSAPP_*).
import "dotenv/config";
import * as db from "../server/db";
import { entregarDieta } from "../server/lib/delivery";
import { hashSenha } from "../server/auth/password";

const EMAIL = "thiagonoe100@outlook.com";
const PHONE = "+55 24988242107";

let user = await db.getUserByEmail(EMAIL);
if (!user) {
  user = await db.createLocalUser({ email: EMAIL, passwordHash: await hashSenha("teste123456"), name: "Thiago" });
}
await db.updateUserProfile(user.id, {
  weight: 87, height: 177, age: 30, sex: "male", goal: "weight_loss",
  activityLevel: "moderado", phone: PHONE, hasPaidPlan: true,
});
await db.upsertFoodSelection(user.id, "cafe_manha", ["cm_pao_ovo", "cm_banana"]);
await db.upsertFoodSelection(user.id, "almoco", ["al_arroz", "al_frango_grelhado", "al_salada_alface_tomate"]);

const res = await entregarDieta(user.id);
console.log("Destino e-mail:", EMAIL, "| WhatsApp:", PHONE);
console.log(JSON.stringify(res, null, 2));
process.exit(0);
