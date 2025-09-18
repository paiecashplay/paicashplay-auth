'use client';

import { useState, useRef, useEffect } from 'react';

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode?: string;
}

// Pays de fallback pour PhoneInput (avec dialCode obligatoire)
const FALLBACK_COUNTRIES: Country[] = [
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲', dialCode: '+237' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', dialCode: '+221' },
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', dialCode: '+225' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦', dialCode: '+212' },
  { code: 'US', name: 'États-Unis', flag: '🇺🇸', dialCode: '+1' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧', dialCode: '+44' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪', dialCode: '+49' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹', dialCode: '+39' }
];

// Fonction pour récupérer les pays avec indicatifs téléphoniques
const fetchCountriesWithDialCodes = async (): Promise<Country[]> => {
  try {
    const response = await fetch('/api/countries');
    if (!response.ok) {
      throw new Error('Failed to fetch countries');
    }
    
    const data = await response.json();
    // Filtrer seulement les pays avec indicatifs téléphoniques
    return data.countries.filter((country: Country) => country.dialCode) || FALLBACK_COUNTRIES;
  } catch (error) {
    console.warn('Failed to fetch countries, using fallback:', error);
    return FALLBACK_COUNTRIES;
  }
};

interface PhoneInputProps {
  value: string;
  onChange: (phone: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function PhoneInput({ value, onChange, placeholder = "Numéro de téléphone", className = '', required = false }: PhoneInputProps) {
  const [countries, setCountries] = useState<Country[]>(FALLBACK_COUNTRIES);
  const [selectedCountry, setSelectedCountry] = useState<Country>(FALLBACK_COUNTRIES[0]); // France par défaut
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(search.toLowerCase()) ||
    (country.dialCode && country.dialCode.includes(search)) ||
    country.code.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const loadCountries = async () => {
      setLoading(true);
      try {
        const fetchedCountries = await fetchCountriesWithDialCodes();
        setCountries(fetchedCountries);
        // Garder la France par défaut si disponible
        const france = fetchedCountries.find(c => c.code === 'FR');
        if (france) {
          setSelectedCountry(france);
        }
      } catch (error) {
        console.error('Error loading countries:', error);
        setCountries(FALLBACK_COUNTRIES);
      } finally {
        setLoading(false);
      }
    };
    
    loadCountries();
  }, []);

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

  useEffect(() => {
    // Parse existing value
    if (value && !phoneNumber && countries.length > 0) {
      const country = countries.find(c => c.dialCode && value.startsWith(c.dialCode));
      if (country && country.dialCode) {
        setSelectedCountry(country);
        setPhoneNumber(value.substring(country.dialCode.length).trim());
      }
    }
  }, [value, phoneNumber, countries]);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch('');
    const fullPhone = phoneNumber ? `${country.dialCode} ${phoneNumber}` : '';
    onChange(fullPhone);
  };

  const handlePhoneChange = (phone: string) => {
    setPhoneNumber(phone);
    const fullPhone = phone && selectedCountry.dialCode ? `${selectedCountry.dialCode} ${phone}` : '';
    onChange(fullPhone);
  };

  return (
    <div className={`relative w-full ${className}`} style={{ zIndex: isOpen ? 70 : 'auto' }}>
      <div className="flex w-full">
        {/* Country Code Selector */}
        <div className="relative flex-shrink-0" ref={dropdownRef} style={{ zIndex: isOpen ? 70 : 'auto' }}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center px-2 sm:px-3 py-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-paiecash focus:border-transparent transition-colors min-w-0"
          >
            <span className="text-base sm:text-lg mr-1 sm:mr-2">{selectedCountry.flag}</span>
            <span className="text-xs sm:text-sm font-medium hidden xs:inline">{selectedCountry.dialCode || ''}</span>
            <span className="text-xs sm:text-sm font-medium xs:hidden">{selectedCountry.dialCode?.replace('+', '') || ''}</span>
            <i className={`fas fa-chevron-down ml-1 sm:ml-2 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
          </button>

          {isOpen && (
            <div className="absolute z-[70] left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl min-w-full w-80 max-h-60 overflow-hidden">
              <div className="p-2 sm:p-3 border-b border-gray-200">
                <div className="relative">
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs"></i>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-paiecash focus:border-transparent"
                  />
                </div>
              </div>
              <div className="overflow-y-auto max-h-48">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 text-left hover:bg-gray-50 flex items-center transition-colors"
                  >
                    <span className="text-base sm:text-lg mr-2 sm:mr-3">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base truncate">{country.name}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{country.dialCode || 'N/A'}</div>
                    </div>
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <div className="px-3 py-2 sm:px-4 sm:py-3 text-gray-500 text-center text-sm">
                    Aucun pays trouvé
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="flex-1 min-w-0 px-3 sm:px-4 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-paiecash focus:border-transparent transition-all duration-200 bg-white text-sm sm:text-base"
        />
      </div>
    </div>
  );
}