import { useState, useEffect } from 'react';

export interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode?: string;
}

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

export interface UseCountriesOptions {
  withDialCode?: boolean; // Filtrer seulement les pays avec indicatif téléphonique
}

export function useCountries(options: UseCountriesOptions = {}) {
  const [countries, setCountries] = useState<Country[]>(FALLBACK_COUNTRIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCountries = async (searchTerm?: string): Promise<Country[]> => {
    try {
      const url = new URL('/api/countries', window.location.origin);
      if (searchTerm) {
        url.searchParams.set('search', searchTerm);
      }
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }
      
      const data = await response.json();
      let fetchedCountries = data.countries || FALLBACK_COUNTRIES;
      
      // Filtrer les pays avec indicatif téléphonique si demandé
      if (options.withDialCode) {
        fetchedCountries = fetchedCountries.filter((country: Country) => country.dialCode);
      }
      
      return fetchedCountries;
    } catch (error) {
      console.warn('Failed to fetch countries from API, using fallback:', error);
      let fallback = FALLBACK_COUNTRIES;
      
      if (options.withDialCode) {
        fallback = fallback.filter(country => country.dialCode);
      }
      
      return fallback;
    }
  };

  const loadCountries = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedCountries = await fetchCountries();
      setCountries(fetchedCountries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load countries');
      setCountries(options.withDialCode ? FALLBACK_COUNTRIES.filter(c => c.dialCode) : FALLBACK_COUNTRIES);
    } finally {
      setLoading(false);
    }
  };

  const searchCountries = async (searchTerm: string): Promise<Country[]> => {
    try {
      return await fetchCountries(searchTerm);
    } catch (err) {
      console.error('Error searching countries:', err);
      return countries.filter(country =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (country.dialCode && country.dialCode.includes(searchTerm))
      );
    }
  };

  const findCountry = (identifier: string): Country | undefined => {
    return countries.find(c => 
      c.name === identifier || 
      c.code === identifier ||
      (c.dialCode && identifier.startsWith(c.dialCode))
    );
  };

  const getCountryByCode = (code: string): Country | undefined => {
    return countries.find(c => c.code === code);
  };

  const getCountryByDialCode = (dialCode: string): Country | undefined => {
    return countries.find(c => c.dialCode === dialCode);
  };

  useEffect(() => {
    loadCountries();
  }, []);

  return {
    countries,
    loading,
    error,
    searchCountries,
    findCountry,
    getCountryByCode,
    getCountryByDialCode,
    refetch: loadCountries
  };
}