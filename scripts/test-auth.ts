import "dotenv/config";
import * as db from "../server/db";
import { hashSenha, conferirSenha } from "../server/auth/password";
import { assinarSessao, verificarSessao } from "../server/auth/session";

const email = `teste+${Date.now()}@nutrix.dev`;
const senha = "senha123";

const hash = await hashSenha(senha);
const user = await db.createLocalUser({ email, passwordHash: hash, name: "Teste" });
console.log("1) conta criada:      ", user.id ? "OK" : "FALHA", `(id ${user.id})`);

const found = await db.getUserByEmail(email);
console.log("2) achar por e-mail:  ", found?.id === user.id ? "OK" : "FALHA");

console.log("3) senha certa:       ", (await conferirSenha(senha, found!.passwordHash!)) ? "OK" : "FALHA");
console.log("4) senha errada nega: ", !(await conferirSenha("errada", found!.passwordHash!)) ? "OK" : "FALHA");

const token = await assinarSessao(user.id);
const uid = await verificarSessao(token);
console.log("5) sessão JWT:        ", uid === user.id ? "OK" : "FALHA");

const bySession = await db.getUserById(uid!);
console.log("6) carrega da sessão: ", bySession?.email === email ? "OK" : "FALHA");

process.exit(0);
