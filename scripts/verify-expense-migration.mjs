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
  const priceCol = await client.query(`
    select column_name, data_type
    from information_schema.columns
    where table_schema = 'public' and table_name = 'tp_items' and column_name = 'price'
  `);
  const paymentsTable = await client.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_name = 'tp_payments'
  `);
  console.log("price_column:", priceCol.rows[0] ?? "MISSING");
  console.log("tp_payments:", paymentsTable.rows.length ? "exists" : "MISSING");
  process.exit(priceCol.rows.length && paymentsTable.rows.length ? 0 : 1);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await client.end();
}
