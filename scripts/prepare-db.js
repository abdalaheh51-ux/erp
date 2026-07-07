const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const envPath = path.join(rootDir, '.env');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

const fileEnv = loadEnvFile(envPath);
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || fileEnv.DIRECT_URL || fileEnv.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL or DIRECT_URL for database initialization.');
  process.exit(1);
}

const env = {
  ...process.env,
  ...fileEnv,
  DATABASE_URL: databaseUrl,
  DIRECT_URL: process.env.DIRECT_URL || fileEnv.DIRECT_URL || databaseUrl,
};

console.log('Initializing database using Prisma...');
execSync('npx prisma db push --skip-generate', {
  cwd: rootDir,
  stdio: 'inherit',
  env,
});

execSync('node scripts/init-db.js', {
  cwd: rootDir,
  stdio: 'inherit',
  env,
});
