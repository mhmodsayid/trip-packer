/**
 * Remove trip-packer tp_* objects from a shared Supabase database.
 * Usage: DATABASE_URL="postgresql://..." node scripts/drop-tp-tables.mjs
 */
import pg from "pg";

function directUrl(poolerUrl) {
  const url = new URL(poolerUrl);
  url.port = "5432";
  url.searchParams.delete("pgbouncer");
  return url.toString();
}

const statements = [
  "alter publication supabase_realtime drop table tp_items",
  "alter publication supabase_realtime drop table tp_people",
  "drop table if exists tp_items, tp_people, tp_trips cascade",
];

const benign = ["does not exist", "not found in publication"];

async function run() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: directUrl(raw),
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  const port = new URL(directUrl(raw)).port || "5432";
  console.log(`Connected (port ${port}). Removing tp_ objects...`);

  for (const sql of statements) {
    try {
      await client.query(sql);
      console.log("OK:", sql.slice(0, 60));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (benign.some((b) => message.toLowerCase().includes(b))) {
        console.log("Skipped:", message);
        continue;
      }
      console.error("Failed:", message);
      await client.end();
      process.exit(1);
    }
  }

  const tp = await client.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_name like 'tp_%'
    order by table_name
  `);

  const m3alm = await client.query(`
    select table_name from information_schema.tables
    where table_schema = 'public'
      and table_name in ('categories', 'contact_messages', 'landmarks', 'users')
    order by table_name
  `);

  console.log("Remaining tp_ tables:", tp.rows.length ? tp.rows.map((r) => r.table_name).join(", ") : "(none)");
  console.log("m3alm tables:", m3alm.rows.map((r) => r.table_name).join(", "));

  await client.end();
  process.exit(tp.rows.length === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
