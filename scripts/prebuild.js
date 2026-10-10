const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- InterviewAI Pre-Build Task ---');

// Load .env locally if present and not already in process.env
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[key]) {
          process.env[key] = value.trim();
        }
      }
    }
  }
} catch (_) {}

// 1. Always generate Prisma client
try {
  console.log('Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (err) {
  console.warn('Prisma generate warning:', err.message);
}

// 2. If a PostgreSQL connection string is configured in production, sync schema
const dbUrl = process.env.DATABASE_URL || '';
if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
  console.log('PostgreSQL detected in DATABASE_URL. Synchronizing database tables...');
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('Prisma schema pushed successfully to PostgreSQL database.');
  } catch (err) {
    console.warn('Prisma db push warning:', err.message);
  }
} else {
  console.log('No PostgreSQL DATABASE_URL detected during build step.');
}
