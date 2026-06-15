import pg from "pg";
import fs from "fs";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const sql = fs.readFileSync("./drizzle/0000_supreme_whiplash.sql", "utf8");

  await pool.query(sql);

  console.log("✅ TABLES CREATED SUCCESSFULLY!");
} catch (e) {
  console.error("❌ ERROR:");
  console.error(e);
}

await pool.end();