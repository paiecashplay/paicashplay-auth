'use client';

import { useState, useRef, useEffect } from 'react';

interface Club {
  id: string;
  name: string;
  country: string;
}

interface ClubSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  country?: string;
  className?: string;
}

export default function ClubSelect({ value, onChange, placeholder = "Sélectionnez un club", country, className = '' }: ClubSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchClubs();
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

  const fetchClubs = async () => {
    try {
      const response = await fetch('/api/organizations/clubs');
      if (response.ok) {
        const data = await response.json();
        setAllClubs(data.clubs || []);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClubs = allClubs.filter(club => {
    const matchesCountry = !country || club.country === country;
    const matchesSearch = !search.trim() || club.name.toLowerCase().includes(search.toLowerCase());
    return matchesCountry && matchesSearch;
  });

  const selectedClub = allClubs.find(c => c.name === value);

  const handleSelect = (club: Club) => {
    onChange(club.name);
    setIsOpen(false);
    setSearch('');
    setShowCustomInput(false);
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onChange(customValue.trim());
      setShowCustomInput(false);
      setIsOpen(false);
      setCustomValue('');
    }
  };

  if (showCustomInput) {
    return (
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-users text-gray-400 text-sm"></i>
          </div>
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
            className="input-field pl-10 pr-4"
            placeholder="Nom de votre club"
            autoFocus
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCustomSubmit}
            className="btn-primary text-sm px-3 py-1"
          >
            <i className="fas fa-check mr-1"></i>
            Valider
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCustomInput(false);
              setCustomValue('');
            }}
            className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1"
          >
            <i className="fas fa-arrow-left mr-1"></i>
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef} style={{ zIndex: isOpen ? 60 : 'auto' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input-field flex items-center justify-between w-full text-left"
        disabled={loading}
      >
        <div className="flex items-center">
          <i className="fas fa-users text-gray-400 text-sm mr-3"></i>
          {loading ? (
            <span className="text-gray-500">Chargement des clubs...</span>
          ) : selectedClub ? (
            <span>{selectedClub.name}</span>
          ) : value ? (
            <span>{value}</span>
          ) : (
            <span className="text-gray-500">
              {country ? `${placeholder} pour ${country}` : placeholder}
            </span>
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
                placeholder="Rechercher un club..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-paiecash focus:border-transparent"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredClubs.map((club) => (
              <button
                key={club.id}
                type="button"
                onClick={() => handleSelect(club)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center transition-colors"
              >
                <i className="fas fa-users text-gray-400 mr-3"></i>
                <span className="flex-1">{club.name}</span>
                <span className="text-sm text-gray-500">{club.country}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setShowCustomInput(true);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center transition-colors text-paiecash border-t border-gray-200"
            >
              <i className="fas fa-plus text-paiecash mr-3"></i>
              <span className="font-medium">Saisir manuellement</span>
            </button>
            {filteredClubs.length === 0 && (
              <div className="px-4 py-3 text-gray-500 text-center">
                <i className="fas fa-search mr-2"></i>
                {search.trim() ? `Aucun club trouvé pour "${search}"` : 
                 country ? `Aucun club trouvé pour ${country}` : 'Aucun club disponible'}
              </div>
            )}
          </div>
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
            <i className="fas fa-users mr-1"></i>
            {filteredClubs.length} club{filteredClubs.length > 1 ? 's' : ''} {country ? `pour ${country}` : 'disponibles'}
          </div>
        </div>
      )}
    </div>
  );
}