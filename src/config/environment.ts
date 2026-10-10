import fs from 'node:fs';
import path from 'node:path';

// Deployment variables take precedence over the local file.
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) process.loadEnvFile(envPath);

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function port(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65535) throw new Error(`Invalid port in ${name}`);
  return value;
}

function boolean(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  if (value !== 'true' && value !== 'false') throw new Error(`Invalid boolean in ${name}`);
  return value === 'true';
}

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');

export const environment = {
  port: port('PORT', 3000),
  production: process.env.NODE_ENV === 'production',
  jwtSecret,
  allowedOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',').map(origin => origin.trim()).filter(Boolean),
  uploadsDirectory: path.resolve(process.cwd(), process.env.UPLOADS_DIR ?? 'src/uploads'),
  database: {
    host: required('DB_HOST'),
    port: port('DB_PORT', 1433),
    username: required('DB_USER'),
    password: required('DB_PASSWORD'),
    name: required('DB_NAME'),
    encrypt: boolean('DB_ENCRYPT', true),
    trustServerCertificate: boolean('DB_TRUST_SERVER_CERTIFICATE', false),
  },
};
