/**
 * Run a SQL migration file against the trip-packer Supabase pooler.
 * Usage: PGPASSWORD=... node scripts/run-migration.mjs [path-to.sql]
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = "edoynetfzkiwqqiiohqy";

const PASSWORD = process.env.PGPASSWORD;
if (!PASSWORD) {
  console.error("Set PGPASSWORD (not stored in repo).");
  process.exit(1);
}

const sqlPath =
  process.argv[2] ?? join(__dirname, "..", "supabase", "migrations", "001_add_added_by_person_id.sql");

const POOLER_HOST = "aws-1-ap-southeast-1.pooler.supabase.com";

const client = new pg.Client({
  host: POOLER_HOST,
  port: 5432,
  user: `postgres.${PROJECT_REF}`,
  password: PASSWORD,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
});

const sql = readFileSync(sqlPath, "utf8");

try {
  await client.connect();
  console.log(`Connected. Running ${sqlPath}...`);
  await client.query(sql);

  const col = await client.query(`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tp_items'
      and column_name = 'added_by_person_id'
  `);

  console.log(
    col.rows.length ? "Verified: added_by_person_id column exists." : "Column not found!"
  );
  await client.end();
  process.exit(col.rows.length ? 0 : 1);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  await client.end().catch(() => {});
  process.exit(1);
}
