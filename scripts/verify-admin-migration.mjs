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
  const col = await client.query(`
    select column_name, data_type, column_default, is_nullable
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tp_people'
      and column_name = 'is_admin'
  `);
  console.log("is_admin:", col.rows[0] ?? "MISSING");
  process.exit(col.rows.length ? 0 : 1);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await client.end();
}
