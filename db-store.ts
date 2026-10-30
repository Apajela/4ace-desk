
import { pool } from './db.ts';

export async function getRecords<T = any>(table: string): Promise<T[]> {
  const result = await pool.query(
    `SELECT data FROM ${table} ORDER BY updated_at DESC`
  );

  return result.rows.map((row) => row.data as T);
}

export async function saveRecord<T extends { id: string }>(
  table: string,
  record: T
): Promise<T> {
  await pool.query(
    `INSERT INTO ${table} (id, data, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (id)
     DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [record.id, JSON.stringify(record)]
  );

  return record;
}

export async function deleteRecord(
  table: string,
  id: string
): Promise<void> {
  await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
}

