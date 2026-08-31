import "dotenv/config";
import { getDb } from "../server/db";
import { sql } from "drizzle-orm";
const db = await getDb(); if(!db){console.error("sem db");process.exit(1);}
try {
  await db.execute(sql`ALTER TABLE marketing_emails ADD UNIQUE KEY uniq_user_type (userId, type)`);
  console.log("OK: índice único (userId,type) criado");
} catch (e) { console.log("(já existe ou erro):", (e as Error).message.slice(0,120)); }
process.exit(0);
