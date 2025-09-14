import { sql } from '@vercel/postgres';
import { promises as fs } from 'fs';
import path from 'path';

async function main() {
  const filePath = path.join(process.cwd(), 'migrations', '20250914_news.sql');
  const sqlCommands = await fs.readFile(filePath, 'utf-8');

  try {
    await sql.query(sqlCommands);
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

main();
