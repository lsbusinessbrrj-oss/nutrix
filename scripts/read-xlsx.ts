import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";

const path = process.argv[2] ?? "/Users/andreanenogueira/Downloads/NUTRIX - BASE - REV 1.xlsx";
const wb = XLSX.read(readFileSync(path), { type: "buffer" });
console.log("ABAS:", wb.SheetNames.join(" | "));
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "", blankrows: false });
  console.log(`\n===== ${name} — ${rows.length} linhas =====`);
  rows.slice(0, 45).forEach((r, i) => {
    const cells = (r as any[]).map((c) => (c === "" ? "" : String(c))).slice(0, 12);
    if (cells.some((c) => c !== "")) console.log(`${i}: ${cells.join(" | ")}`);
  });
}
process.exit(0);
