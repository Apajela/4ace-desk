import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const caPath = path.join(currentDir, 'ca.pem');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing from .env');
}

if (!fs.existsSync(caPath)) {
  throw new Error('Aiven CA certificate ca.pem was not found.');
}

const databaseUrl = new URL(process.env.DATABASE_URL);

// Use the CA certificate explicitly for verified TLS.
databaseUrl.searchParams.delete('sslmode');
databaseUrl.searchParams.delete('sslrootcert');

export const pool = new Pool({
  connectionString: databaseUrl.toString(),
  ssl: {
    ca: fs.readFileSync(caPath, 'utf8'),
    rejectUnauthorized: true,
  },
  connectionTimeoutMillis: 10000,
  max: 5,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});