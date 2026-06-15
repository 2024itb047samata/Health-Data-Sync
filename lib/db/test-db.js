import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const result = await pool.query("SELECT NOW()");
  console.log("CONNECTED!");
  console.log(result.rows);
} catch (e) {
  console.error("ERROR:");
  console.error(e);
}

process.exit();