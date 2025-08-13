import { getDatabaseUrl } from './database-config';

// Configurer DATABASE_URL au runtime si elle n'existe pas
export function setupEnvironment() {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = getDatabaseUrl();
    console.log('✅ DATABASE_URL configurée dynamiquement');
  }
}