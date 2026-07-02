import pg from "pg";

const client = new pg.Client({
  host: "aws-1-ap-southeast-1.pooler.supabase.com",
  port: 5432,
  user: "postgres.edoynetfzkiwqqiiohqy",
  password: process.env.PGPASSWORD,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

const sql = `
SELECT trip_id, lower(trim(name)) AS norm, count(*)::int AS cnt
FROM tp_items
GROUP BY trip_id, lower(trim(name))
HAVING count(*) > 1
LIMIT 20;
`;

const indexSql = `
CREATE UNIQUE INDEX IF NOT EXISTS tp_items_trip_id_name_lower_unique
ON tp_items (trip_id, lower(trim(name)));
`;

try {
  await client.connect();
  const dupes = await client.query(sql);
  console.log("DUPLICATE_GROUPS:", dupes.rowCount);
  if (dupes.rows.length > 0) {
    console.log(JSON.stringify(dupes.rows, null, 2));
    console.log("SKIP_INDEX: pre-existing duplicates found");
  } else {
    await client.query(indexSql);
    console.log("INDEX_CREATED: tp_items_trip_id_name_lower_unique");
  }
} catch (err) {
  console.error("ERROR:", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await client.end();
}
