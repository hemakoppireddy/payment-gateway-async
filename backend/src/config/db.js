import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function checkDatabase() {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (err) {
    console.error("DB check failed:", err.message);
    return false;
  }
}
