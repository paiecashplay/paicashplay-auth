/**
 * Utilitaires pour gérer les URLs avec proxy
 */

export function getBaseUrl(): string {
  // Priorité à NEXTAUTH_URL pour les environnements avec proxy
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  // Fallback pour développement local
  return process.env.NODE_ENV === 'production' 
    ? 'https://auth.paiecashplay.com' 
    : 'http://localhost:3000';
}

export function createRedirectUrl(path: string): string {
  const baseUrl = getBaseUrl();
  return new URL(path, baseUrl).toString();
}

export function createAbsoluteUrl(path: string): URL {
  const baseUrl = getBaseUrl();
  return new URL(path, baseUrl);
}