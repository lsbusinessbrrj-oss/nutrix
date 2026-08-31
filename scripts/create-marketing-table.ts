import "dotenv/config";
import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

const db = await getDb();
if (!db) { console.error("sem db"); process.exit(1); }
await db.execute(sql`
  CREATE TABLE IF NOT EXISTS marketing_emails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    type VARCHAR(40) NOT NULL,
    sentAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mkt_user (userId)
  )
`);
console.log("OK: tabela marketing_emails criada/ok");
process.exit(0);
