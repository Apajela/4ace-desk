
import { pool } from './db.ts';

const tables = [
  'projects',
  'workers',
  'attendance',
  'expenses',
  'cash_advances',
  'priorities',
];

async function main() {
  try {
    for (const table of tables) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${table} (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      console.log(`TABLE READY: ${table}`);
    }

    console.log('SUCCESS: All ERP tables are ready.');
  } catch (error) {
    console.error(
      'DATABASE SETUP FAILED:',
      error instanceof Error ? error.message : error
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
