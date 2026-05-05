import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("Database connection established successfully.");
    client.release();
  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
}

export { pool, testConnection };