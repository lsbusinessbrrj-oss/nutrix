import "dotenv/config";
import { getDb } from "../server/db";
import { marketingEmails, adminMessages } from "../drizzle/schema";
import { sql } from "drizzle-orm";
const db = await getDb(); if(!db){process.exit(1);}
await db.delete(marketingEmails).where(sql`1=1`);
await db.delete(adminMessages).where(sql`1=1`);
console.log("OK: marketing_emails e admin_messages limpos");
process.exit(0);
