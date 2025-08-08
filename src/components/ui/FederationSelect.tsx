'use client';

import { useState, useEffect } from 'react';

interface Federation {
  id: string;
  name: string;
}

interface FederationSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function FederationSelect({ value, onChange, placeholder = "Sélectionnez une fédération" }: FederationSelectProps) {
  const [federations, setFederations] = useState<Federation[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFederations();
  }, []);

  useEffect(() => {
    if (value && !federations.find(federation => federation.name === value)) {
      setShowCustomInput(true);
      setCustomValue(value);
    }
  }, [value, federations]);

  const fetchFederations = async () => {
    try {
      const response = await fetch('/api/organizations/federations');
      if (response.ok) {
        const data = await response.json();
        setFederations(data.federations || []);
      }
    } catch (error) {
      console.error('Error fetching federations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === 'custom') {
      setShowCustomInput(true);
      setCustomValue('');
      onChange('');
    } else {
      setShowCustomInput(false);
      onChange(selectedValue);
    }
  };

  const handleCustomInputChange = (inputValue: string) => {
    setCustomValue(inputValue);
    onChange(inputValue);
  };

  if (showCustomInput) {
    return (
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-flag text-gray-400 text-sm"></i>
          </div>
          <input
            type="text"
            value={customValue}
            onChange={(e) => handleCustomInputChange(e.target.value)}
            className="input-field pl-10 pr-4 transition-all duration-200 focus:ring-2 focus:ring-paiecash/20 focus:border-paiecash"
            placeholder="Nom de la fédération"
            autoFocus
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCustomInput(false);
            setCustomValue('');
            onChange('');
          }}
          className="inline-flex items-center text-sm text-paiecash hover:text-paiecash-dark transition-colors duration-200 font-medium"
        >
          <i className="fas fa-arrow-left mr-2 text-xs"></i>
          Choisir dans la liste
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i className="fas fa-flag text-gray-400 text-sm"></i>
        </div>
        <select
          value={value}
          onChange={(e) => handleSelectChange(e.target.value)}
          className="input-field pl-10 pr-8 appearance-none bg-white transition-all duration-200 focus:ring-2 focus:ring-paiecash/20 focus:border-paiecash cursor-pointer"
          disabled={loading}
        >
          <option value="">
            {loading ? 'Chargement des fédérations...' : placeholder}
          </option>
          {federations.map((federation) => (
            <option key={federation.id} value={federation.name} className="py-2">
              {federation.name}
            </option>
          ))}
          <option value="custom" className="py-2 text-paiecash font-medium">
            + Saisir manuellement
          </option>
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {loading ? (
            <i className="fas fa-spinner fa-spin text-gray-400 text-sm"></i>
          ) : (
            <i className="fas fa-chevron-down text-gray-400 text-sm"></i>
          )}
        </div>
      </div>
      {federations.length > 0 && (
        <div className="text-xs text-gray-500 flex items-center">
          <i className="fas fa-info-circle mr-1"></i>
          {federations.length} fédération{federations.length > 1 ? 's' : ''} disponible{federations.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}