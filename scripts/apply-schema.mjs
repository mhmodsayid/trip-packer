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

function createClient() {
  if (process.env.PGHOST) {
    return new pg.Client({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT ?? 5432),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE ?? "postgres",
      ssl: { rejectUnauthorized: false },
    });
  }

  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.error("Set DATABASE_URL or PGHOST/PGUSER/PGPASSWORD.");
    process.exit(1);
  }

  return new pg.Client({
    connectionString: directUrl(raw),
    ssl: { rejectUnauthorized: false },
  });
}

async function run() {
  const sql = readFileSync(join(__dirname, "..", "supabase", "schema.sql"), "utf8");
  const statements = splitStatements(sql).filter(isAllowed);

  if (statements.length === 0) {
    console.error("No allowed tp_ statements found in schema.sql.");
    process.exit(1);
  }

  const client = createClient();

  await client.connect();
  const target = process.env.PGHOST ?? "pooler";
  console.log(`Connected (${target}). Applying ${statements.length} tp_ statements...`);

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
      and table_name not like 'tp_%'
    order by table_name
    limit 10
  `);

  console.log("tp_ tables:", tables.rows.map((r) => r.table_name).join(", ") || "(none)");
  console.log("realtime:", realtime.rows.map((r) => r.tablename).join(", ") || "(none)");
  console.log("other public tables:", m3almTables.rows.map((r) => r.table_name).join(", ") || "(none)");

  const ok = tables.rows.length === 3;
  await client.end();
  process.exit(ok ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
