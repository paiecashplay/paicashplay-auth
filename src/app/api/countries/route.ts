import { NextResponse } from 'next/server';

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode?: string;
}

// Cache pour éviter les appels répétés à l'API
let countriesCache: Country[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures

// Traductions des noms de pays en français
const COUNTRY_TRANSLATIONS: Record<string, string> = {
  'Afghanistan': 'Afghanistan',
  'Albania': 'Albanie',
  'Algeria': 'Algérie',
  'Argentina': 'Argentine',
  'Australia': 'Australie',
  'Austria': 'Autriche',
  'Belgium': 'Belgique',
  'Brazil': 'Brésil',
  'Cameroon': 'Cameroun',
  'Canada': 'Canada',
  'China': 'Chine',
  'Côte d\'Ivoire': 'Côte d\'Ivoire',
  'Egypt': 'Égypte',
  'France': 'France',
  'Germany': 'Allemagne',
  'Ghana': 'Ghana',
  'Italy': 'Italie',
  'Japan': 'Japon',
  'Kenya': 'Kenya',
  'Morocco': 'Maroc',
  'Nigeria': 'Nigeria',
  'Portugal': 'Portugal',
  'Senegal': 'Sénégal',
  'South Africa': 'Afrique du Sud',
  'Spain': 'Espagne',
  'Switzerland': 'Suisse',
  'Tunisia': 'Tunisie',
  'United Kingdom': 'Royaume-Uni',
  'United States': 'États-Unis'
};

// Pays de fallback
const FALLBACK_COUNTRIES: Country[] = [
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲', dialCode: '+237' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', dialCode: '+221' },
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', dialCode: '+225' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦', dialCode: '+212' },
  { code: 'DZ', name: 'Algérie', flag: '🇩🇿', dialCode: '+213' },
  { code: 'TN', name: 'Tunisie', flag: '🇹🇳', dialCode: '+216' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233' },
  { code: 'US', name: 'États-Unis', flag: '🇺🇸', dialCode: '+1' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧', dialCode: '+44' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪', dialCode: '+49' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹', dialCode: '+39' },
  { code: 'ES', name: 'Espagne', flag: '🇪🇸', dialCode: '+34' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪', dialCode: '+32' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭', dialCode: '+41' },
  { code: 'BR', name: 'Brésil', flag: '🇧🇷', dialCode: '+55' }
];

// Fonction pour obtenir le drapeau emoji à partir du code pays
const getFlagEmoji = (countryCode: string): string => {
  return countryCode
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();

    // Vérifier le cache
    if (countriesCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
      let countries = countriesCache;
      
      // Filtrer si recherche
      if (search) {
        countries = countries.filter(country =>
          country.name.toLowerCase().includes(search) ||
          country.code.toLowerCase().includes(search)
        );
      }
      
      return NextResponse.json({ countries });
    }

    // Récupérer depuis l'API REST Countries
    let countries: Country[];
    
    try {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,idd', {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }
      
      const data = await response.json();
      
      countries = data
        .map((country: any) => ({
          code: country.cca2,
          name: COUNTRY_TRANSLATIONS[country.name.common] || country.name.common,
          flag: getFlagEmoji(country.cca2),
          dialCode: country.idd?.root ? `${country.idd.root}${country.idd.suffixes?.[0] || ''}` : undefined
        }))
        .sort((a: Country, b: Country) => a.name.localeCompare(b.name, 'fr'));
      
      // Mettre en cache
      countriesCache = countries;
      cacheTimestamp = Date.now();
      
    } catch (error) {
      console.warn('Failed to fetch countries from API, using fallback:', error);
      countries = FALLBACK_COUNTRIES;
    }

    // Filtrer si recherche
    if (search) {
      countries = countries.filter(country =>
        country.name.toLowerCase().includes(search) ||
        country.code.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ countries });
    
  } catch (error) {
    console.error('Error in countries API:', error);
    return NextResponse.json({ countries: FALLBACK_COUNTRIES }, { status: 500 });
  }
}