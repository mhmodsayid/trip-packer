import pg from "pg";

const client = new pg.Client({
  host: "aws-1-ap-southeast-1.pooler.supabase.com",
  port: 5432,
  user: "postgres.edoynetfzkiwqqiiohqy",
  password: process.env.PGPASSWORD,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
});

try {
  await client.connect();
  const cols = await client.query(`
    select column_name, data_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tp_people'
      and column_name in ('active_session_id', 'last_active_at')
    order by column_name
  `);
  for (const row of cols.rows) {
    console.log(`${row.column_name}: ${row.data_type}`);
  }
  const ok = cols.rows.length === 2;
  if (!ok) console.error("MISSING columns");
  process.exit(ok ? 0 : 1);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await client.end();
}
