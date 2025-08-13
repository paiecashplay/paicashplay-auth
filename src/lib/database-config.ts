// Configuration dynamique de la base de données
export function getDatabaseUrl(): string {
  // Si DATABASE_URL existe, l'utiliser
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Sinon, construire l'URL à partir des variables individuelles
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '3306';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'paiecashplay_auth';

  return `mysql://${user}:${password}@${host}:${port}/${database}?sslaccept=strict`;
}

// Fonction pour valider la configuration de la base de données
export function validateDatabaseConfig(): boolean {
  const url = getDatabaseUrl();
  
  if (!url || url === 'mysql://:@localhost:3306/paiecashplay_auth?sslaccept=strict') {
    console.error('❌ Configuration de base de données invalide');
    return false;
  }

  console.log('✅ Configuration de base de données validée');
  return true;
}