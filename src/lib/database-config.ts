// Configuration de la base de données
export function getDatabaseUrl(): string {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  return process.env.DATABASE_URL;
}

// Fonction pour valider la configuration de la base de données
export function validateDatabaseConfig(): boolean {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is missing');
    return false;
  }

  console.log('✅ Configuration de base de données validée');
  return true;
}