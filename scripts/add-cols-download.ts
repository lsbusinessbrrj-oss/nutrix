import "dotenv/config";
import { getDb } from "../server/db";
import { sql } from "drizzle-orm";
const db = await getDb(); if(!db){process.exit(1);}
for (const q of [
  "ALTER TABLE users ADD COLUMN pdfDownloads INT DEFAULT 0",
  "ALTER TABLE users ADD COLUMN pdfUltimoDownloadEm TIMESTAMP NULL",
]) {
  try { await db.execute(sql.raw(q)); console.log("OK:", q.slice(0,45)); }
  catch (e) { console.log("(skip):", (e as Error).message.slice(0,70)); }
}
process.exit(0);
