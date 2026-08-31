import "dotenv/config";
import { assinarTokenLogin } from "../server/auth/magic";
const uid = Number(process.argv[2] ?? "90002");
console.log(await assinarTokenLogin(uid));
process.exit(0);
