import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";
import process from "node:process";

try {
  const schemaUrl = new URL("../schema.sql", import.meta.url);
  const schema = await readFile(fileURLToPath(schemaUrl), "utf8");
  await pool.query(schema);
  console.log("Database schema is ready.");
} catch (error) {
  console.error("Database migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
