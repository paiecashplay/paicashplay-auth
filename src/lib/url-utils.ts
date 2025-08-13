/**
 * Utilitaires pour gérer les URLs avec proxy
 */

export function getBaseUrl(): string {
  // En production, NEXTAUTH_URL est OBLIGATOIRE
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NEXTAUTH_URL) {
      throw new Error('NEXTAUTH_URL doit être définie en production');
    }
    return process.env.NEXTAUTH_URL;
  }
  
  // En développement, utiliser NEXTAUTH_URL ou localhost
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

export function createRedirectUrl(path: string): string {
  const baseUrl = getBaseUrl();
  return new URL(path, baseUrl).toString();
}

export function createAbsoluteUrl(path: string): URL {
  const baseUrl = getBaseUrl();
  return new URL(path, baseUrl);
}