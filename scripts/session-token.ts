import "dotenv/config";
import { assinarSessao } from "../server/auth/session";
const uid = Number(process.argv[2] ?? "90002");
console.log(await assinarSessao(uid));
process.exit(0);
