/**
 * Apply supabase/schema.sql using DATABASE_URL from the environment.
 * Only runs statements that create/alter tp_* objects (no drops, no other tables).
 * Usage: DATABASE_URL="postgresql://..." node scripts/apply-schema.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ALLOWED_PREFIXES = [
  "create table if not exists tp_",
  "create index if not exists tp_",
  "alter table tp_",
  "alter publication supabase_realtime add table tp_",
  "create policy \"tp ",
];

function directUrl(poolerUrl) {
  const url = new URL(poolerUrl);
  url.port = "5432";
  url.searchParams.delete("pgbouncer");
  return url.toString();
}

function splitStatements(sql) {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAllowed(statement) {
  const lower = statement.toLowerCase();
  if (lower.includes("drop ") || lower.includes("truncate ") || lower.includes("delete from")) {
    return false;
  }
  return ALLOWED_PREFIXES.some((p) => lower.startsWith(p));
}

const benign = [
  "already member of publication",
  "already exists",
];

async function run() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const sql = readFileSync(join(__dirname, "..", "supabase", "schema.sql"), "utf8");
  const statements = splitStatements(sql).filter(isAllowed);

  if (statements.length === 0) {
    console.error("No allowed tp_ statements found in schema.sql.");
    process.exit(1);
  }

  const connectionString = directUrl(raw);
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  const usedPort = new URL(connectionString).port || "5432";
  console.log(`Connected via pooler host port ${usedPort}. Applying ${statements.length} tp_ statements...`);

  for (const statement of statements) {
    try {
      await client.query(statement);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (benign.some((b) => message.toLowerCase().includes(b))) {
        console.log(`Skipped (already applied): ${statement.slice(0, 70)}...`);
        continue;
      }
      console.error("Failed:", message);
      await client.end();
      process.exit(1);
    }
  }

  const tables = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('tp_trips', 'tp_people', 'tp_items')
    order by table_name
  `);

  const realtime = await client.query(`
    select tablename
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename in ('tp_items', 'tp_people')
    order by tablename
  `);

  const m3almTables = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('categories', 'landmarks', 'users', 'contact_messages')
    order by table_name
  `);

  console.log("tp_ tables:", tables.rows.map((r) => r.table_name).join(", ") || "(none)");
  console.log("realtime:", realtime.rows.map((r) => r.tablename).join(", ") || "(none)");
  console.log("m3alm tables still present:", m3almTables.rows.map((r) => r.table_name).join(", ") || "(check names)");

  const ok = tables.rows.length === 3;
  await client.end();
  process.exit(ok ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
