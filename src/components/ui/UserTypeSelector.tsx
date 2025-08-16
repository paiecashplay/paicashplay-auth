'use client';

import { useMemo } from 'react';

export interface UserTypeOption {
  value: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  desc: string;
}

export const USER_TYPES: UserTypeOption[] = [
  { value: 'donor', label: 'Donateur', icon: 'fas fa-heart', color: 'text-red-600', bg: 'bg-red-100', desc: 'Soutenir les projets' },
  { value: 'player', label: 'Licencié', icon: 'fas fa-running', color: 'text-blue-600', bg: 'bg-blue-100', desc: 'Profil sportif' },
  { value: 'club', label: 'Club', icon: 'fas fa-users', color: 'text-green-600', bg: 'bg-green-100', desc: 'Gestion d\'équipe' },
  { value: 'federation', label: 'Fédération', icon: 'fas fa-flag', color: 'text-purple-600', bg: 'bg-purple-100', desc: 'Administration' },
  { value: 'company', label: 'Société', icon: 'fas fa-briefcase', color: 'text-indigo-600', bg: 'bg-indigo-100', desc: 'Partenariats' },
  { value: 'affiliate', label: 'Ambassadeur', icon: 'fas fa-star', color: 'text-yellow-600', bg: 'bg-yellow-100', desc: 'Promotion' },
  { value: 'academy', label: 'Académie', icon: 'fas fa-graduation-cap', color: 'text-emerald-600', bg: 'bg-emerald-100', desc: 'Formation' },
  { value: 'school', label: 'École', icon: 'fas fa-school', color: 'text-teal-600', bg: 'bg-teal-100', desc: 'Éducation' },
  { value: 'association', label: 'Association', icon: 'fas fa-handshake', color: 'text-orange-600', bg: 'bg-orange-100', desc: 'Organisation' },
  { value: 'ecode', label: 'Ecode', icon: 'fas fa-code', color: 'text-cyan-600', bg: 'bg-cyan-100', desc: 'Développement tech' }
];

interface UserTypeSelectorProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
}

export default function UserTypeSelector({ selectedType, onTypeChange }: UserTypeSelectorProps) {
  const selectedTypeInfo = useMemo(() => 
    USER_TYPES.find(type => type.value === selectedType), 
    [selectedType]
  );

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-4">
        <i className="fas fa-user-tag mr-2 text-paiecash"></i>
        Type de compte
      </label>
      
      {/* Desktop version */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-4">
        {USER_TYPES.map((type) => (
          <label
            key={type.value}
            className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg group ${
              selectedType === type.value
                ? 'border-paiecash bg-paiecash/5 shadow-lg ring-2 ring-paiecash/20'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="userType"
              value={type.value}
              checked={selectedType === type.value}
              onChange={(e) => onTypeChange(e.target.value)}
              className="sr-only"
            />
            <div className="flex items-center mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-3 ${type.bg} shadow-sm group-hover:shadow-md transition-shadow`}>
                <i className={`${type.icon} text-lg ${type.color}`}></i>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-sm">{type.label}</div>
                <div className="text-xs text-gray-500 mt-1">{type.desc}</div>
              </div>
            </div>
            {selectedType === type.value && (
              <div className="absolute top-3 right-3">
                <div className="w-6 h-6 bg-paiecash rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-white text-xs"></i>
                </div>
              </div>
            )}
          </label>
        ))}
      </div>
      
      {/* Mobile version - Cards */}
      <div className="sm:hidden space-y-3">
        {USER_TYPES.map((type) => (
          <label
            key={type.value}
            className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
              selectedType === type.value
                ? 'border-paiecash bg-paiecash/5 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="userType"
              value={type.value}
              checked={selectedType === type.value}
              onChange={(e) => onTypeChange(e.target.value)}
              className="sr-only"
            />
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${type.bg} shadow-sm`}>
              <i className={`${type.icon} text-lg ${type.color}`}></i>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{type.label}</div>
              <div className="text-sm text-gray-500 mt-1">{type.desc}</div>
            </div>
            {selectedType === type.value && (
              <div className="w-6 h-6 bg-paiecash rounded-full flex items-center justify-center ml-3">
                <i className="fas fa-check text-white text-xs"></i>
              </div>
            )}
          </label>
        ))}
      </div>

      {/* Info by User Type */}
      {selectedTypeInfo && (
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mt-6 border border-gray-200">
          <div className="flex items-center mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${selectedTypeInfo.bg} shadow-sm`}>
              <i className={`${selectedTypeInfo.icon} ${selectedTypeInfo.color}`}></i>
            </div>
            <h3 className="font-semibold text-gray-900">
              Compte {selectedTypeInfo.label}
            </h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {getTypeDescription(selectedType)}
          </p>
        </div>
      )}
    </div>
  );
}

function getTypeDescription(userType: string): string {
  const descriptions: Record<string, string> = {
    donor: 'Accès aux fonctionnalités de donation et suivi des contributions pour soutenir les projets sportifs.',
    player: 'Profil licencié avec statistiques personnelles, historique des matchs et gestion de carrière sportive.',
    club: 'Gestion complète des joueurs, équipes, compétitions et administration du club sportif.',
    federation: 'Administration des clubs affiliés, organisation des compétitions et gestion de la réglementation.',
    company: 'Accès aux fonctionnalités de sponsoring d\'entreprise, partenariats et visibilité commerciale.',
    affiliate: 'Vente de billets d\'événements sportifs, commissions sur les ventes et outils de promotion avancés.',
    academy: 'Gestion des programmes de formation, suivi des élèves et organisation des cours sportifs.',
    school: 'Intégration du sport scolaire, gestion des équipes étudiantes et organisation d\'événements.',
    association: 'Coordination des activités associatives, gestion des membres et organisation d\'événements communautaires.',
    ecode: 'Plateforme dédiée aux développeurs et professionnels tech, projets collaboratifs et solutions innovantes pour le sport.'
  };
  
  return descriptions[userType] || 'Accès aux fonctionnalités de base de PaieCashPlay.';
}