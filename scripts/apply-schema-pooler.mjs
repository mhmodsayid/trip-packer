/**
 * Discover pooler host and apply schema.sql with fail-fast timeouts.
 * Usage: node scripts/apply-schema-pooler.mjs
 * Credentials via env: PGUSER suffix ref, PGPASSWORD (not committed).
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT_REF = "edoynetfzkiwqqiiohqy";
const PASSWORD = process.env.PGPASSWORD;
if (!PASSWORD) {
  console.error("Set PGPASSWORD for the database password (not stored in repo).");
  process.exit(1);
}
const USER = `postgres.${PROJECT_REF}`;
const TIMEOUT_MS = 10_000;

const REGIONS = [
  "eu-north-1",
  "eu-central-1",
  "eu-central-2",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-south-1",
  "ca-central-1",
  "sa-east-1",
];

const PREFIXES = ["aws-0", "aws-1"];
const PORTS = [5432, 6543];

function splitStatements(sql) {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

const ALLOWED_PREFIXES = [
  "create table if not exists tp_",
  "create index if not exists tp_",
  "alter table tp_",
  "alter publication supabase_realtime add table tp_",
  "create policy \"tp ",
];

function isAllowed(statement) {
  const lower = statement.toLowerCase();
  if (lower.includes("drop ") || lower.includes("truncate ")) return false;
  return ALLOWED_PREFIXES.some((p) => lower.startsWith(p));
}

async function tryConnect(host, port) {
  const client = new pg.Client({
    host,
    port,
    user: USER,
    password: PASSWORD,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: TIMEOUT_MS,
    query_timeout: TIMEOUT_MS,
  });

  try {
    await client.connect();
    await client.query("select 1 as ok");
    return client;
  } catch {
    await client.end().catch(() => {});
    return null;
  }
}

async function findConnection() {
  for (const prefix of PREFIXES) {
    for (const region of REGIONS) {
      for (const port of PORTS) {
        const host = `${prefix}-${region}.pooler.supabase.com`;
        process.stdout.write(`Trying ${host}:${port}... `);
        const client = await tryConnect(host, port);
        if (client) {
          console.log("OK");
          return { client, host, port };
        }
        console.log("fail");
      }
    }
  }
  return null;
}

async function verify(client) {
  const tables = await client.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_name in ('tp_trips','tp_people','tp_items')
    order by table_name
  `);
  const realtime = await client.query(`
    select tablename from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename like 'tp_%'
    order by tablename
  `);
  return { tables: tables.rows, realtime: realtime.rows };
}

async function run() {
  const sql = readFileSync(join(__dirname, "..", "supabase", "schema.sql"), "utf8");
  const statements = splitStatements(sql).filter(isAllowed);
  const benign = ["already member of publication", "already exists"];

  const found = await findConnection();
  if (!found) {
    console.error("No pooler connection succeeded within timeout.");
    process.exit(1);
  }

  const { client, host, port } = found;
  console.log(`Applying ${statements.length} statements via ${host}:${port}...`);

  for (const statement of statements) {
    try {
      await client.query(statement);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (benign.some((b) => message.toLowerCase().includes(b))) continue;
      console.error("Failed:", message);
      await client.end();
      process.exit(1);
    }
  }

  const result = await verify(client);
  console.log("Tables:", result.tables.map((r) => r.table_name).join(", ") || "(none)");
  console.log("Realtime:", result.realtime.map((r) => r.tablename).join(", ") || "(none)");
  await client.end();

  if (result.tables.length < 3) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
