export function getClientIP(request: any): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

// Fonctions déplacées vers auth.ts pour éviter la duplication

export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Mapping des codes pays vers les noms complets
const COUNTRY_MAPPING: { [key: string]: string[] } = {
  'CM': ['Cameroun', 'Cameroon', 'CM'],
  'FR': ['France', 'FR'],
  'DE': ['Allemagne', 'Germany', 'Deutschland', 'DE'],
  'ES': ['Espagne', 'Spain', 'ES'],
  'IT': ['Italie', 'Italy', 'IT'],
  'UK': ['Royaume-Uni', 'United Kingdom', 'UK', 'GB'],
  'US': ['États-Unis', 'United States', 'USA', 'US'],
  'SN': ['Sénégal', 'Senegal', 'SN'],
  'CI': ['Côte d\'Ivoire', 'Ivory Coast', 'CI'],
  'MA': ['Maroc', 'Morocco', 'MA'],
  'DZ': ['Algérie', 'Algeria', 'DZ'],
  'TN': ['Tunisie', 'Tunisia', 'TN']
};

export function getCountryVariants(country: string): string[] {
  const upperCountry = country.toUpperCase();
  
  // Si c'est un code pays, retourner les variantes
  if (COUNTRY_MAPPING[upperCountry]) {
    return COUNTRY_MAPPING[upperCountry];
  }
  
  // Si c'est un nom complet, chercher dans les valeurs
  for (const [code, variants] of Object.entries(COUNTRY_MAPPING)) {
    if (variants.some(variant => variant.toUpperCase() === upperCountry)) {
      return variants;
    }
  }
  
  // Si aucune correspondance, retourner le pays tel quel
  return [country];
}