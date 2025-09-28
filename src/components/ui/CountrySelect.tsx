'use client';

import { useState, useRef, useEffect } from 'react';

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

// Pays de fallback en cas d'échec de l'API
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

// Fonction pour récupérer les pays depuis notre API locale
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
    return data.countries || FALLBACK_COUNTRIES;
  } catch (error) {
    console.warn('Failed to fetch countries from API, using fallback:', error);
    return FALLBACK_COUNTRIES;
  }
};

interface CountrySelectProps {
  value: string;
  onChange: (country: string) => void;
  onCountryCodeChange?: (countryCode: string) => void; // Callback pour notifier le code pays
  placeholder?: string;
  className?: string;
}

export default function CountrySelect({ value, onChange, onCountryCodeChange, placeholder = "Sélectionnez un pays", className = '' }: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [countries, setCountries] = useState<Country[]>(FALLBACK_COUNTRIES);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadCountries = async () => {
      setLoading(true);
      try {
        const fetchedCountries = await fetchCountries();
        setCountries(fetchedCountries);
      } catch (error) {
        console.error('Error loading countries:', error);
        setCountries(FALLBACK_COUNTRIES);
      } finally {
        setLoading(false);
      }
    };
    
    loadCountries();
  }, []);

  // Recherche avec debounce
  useEffect(() => {
    if (!search.trim()) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const searchResults = await fetchCountries(search);
        setCountries(searchResults);
      } catch (error) {
        console.error('Error searching countries:', error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const selectedCountry = countries.find(c => c.name === value || c.code === value);
  const filteredCountries = search.trim() 
    ? countries // Les résultats sont déjà filtrés par l'API
    : countries.filter(country =>
        country.name.toLowerCase().includes(search.toLowerCase()) ||
        country.code.toLowerCase().includes(search.toLowerCase())
      );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (country: Country) => {
    onChange(country.name);
    setIsOpen(false);
    setSearch('');
    // Notifier le changement de code pays
    if (onCountryCodeChange) {
      onCountryCodeChange(country.code);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef} style={{ zIndex: isOpen ? 60 : 'auto' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input-field flex items-center justify-between w-full text-left"
        disabled={loading}
      >
        <div className="flex items-center">
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2 text-gray-400"></i>
              <span className="text-gray-500">Chargement des pays...</span>
            </>
          ) : selectedCountry ? (
            <>
              <span className="text-lg mr-2">{selectedCountry.flag}</span>
              <span>{selectedCountry.name}</span>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <i className={`fas fa-chevron-down transition-transform ${isOpen ? 'rotate-180' : ''} ${loading ? 'opacity-50' : ''}`}></i>
      </button>

      {isOpen && (
        <div className="absolute z-[60] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un pays..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-paiecash focus:border-transparent"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleSelect(country)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center transition-colors"
              >
                <span className="text-lg mr-3">{country.flag}</span>
                <span className="flex-1">{country.name}</span>
                <div className="flex flex-col items-end">
                  <span className="text-sm text-gray-500">{country.code}</span>
                  {country.dialCode && (
                    <span className="text-xs text-gray-400">{country.dialCode}</span>
                  )}
                </div>
              </button>
            ))}
            {filteredCountries.length === 0 && (
              <div className="px-4 py-3 text-gray-500 text-center">
                <i className="fas fa-search mr-2"></i>
                Aucun pays trouvé pour "{search}"
              </div>
            )}
          </div>
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
            <i className="fas fa-globe mr-1"></i>
            {countries.length} pays disponibles
          </div>
        </div>
      )}
    </div>
  );
}