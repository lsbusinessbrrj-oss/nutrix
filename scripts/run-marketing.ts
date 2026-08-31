// Roda a automação de marketing manualmente. Use --dry pra só simular (não envia).
// Uso: tsx scripts/run-marketing.ts [--dry]
import "dotenv/config";
import { enviarMarketing } from "../server/lib/marketing";

const dry = process.argv.includes("--dry");
const r = await enviarMarketing({ dryRun: dry });
console.log(`\n${dry ? "[DRY RUN] " : ""}avaliados=${r.avaliados} enviados=${r.enviados}`);
for (const d of r.detalhes) console.log("  " + d);
process.exit(0);
