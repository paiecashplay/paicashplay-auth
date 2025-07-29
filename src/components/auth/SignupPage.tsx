'use client';

import { useState } from 'react';
import { UserType } from '@/types/auth';
import { getUserTypeLabel } from '@/lib/auth';
import PhoneInput from '@/components/ui/PhoneInput';
import DatePicker from '@/components/ui/DatePicker';
import { useToast } from '@/components/ui/Toast';

const personas = [
  { id: 'player' as UserType, icon: 'fas fa-user', label: 'Licencié', desc: 'Joueur individuel', color: 'text-emerald-500' },
  { id: 'club' as UserType, icon: 'fas fa-users', label: 'Club', desc: 'Équipe sportive', color: 'text-emerald-500' },
  { id: 'federation' as UserType, icon: 'fas fa-building', label: 'Fédération', desc: 'Organisation', color: 'text-emerald-500' },
  { id: 'company' as UserType, icon: 'fas fa-briefcase', label: 'Société', desc: 'Entreprise', color: 'text-blue-500' },
  { id: 'donor' as UserType, icon: 'fas fa-heart', label: 'Donateur', desc: 'Sponsor individuel', color: 'text-red-500' }
];

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [selectedPersona, setSelectedPersona] = useState<UserType>('player');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    password: '',
    // Player specific
    clubName: '',
    licenseNumber: '',
    // Club specific
    organizationName: '',
    federationName: '',
    // Donor specific
    company: '',
    // Company specific
    companyName: '',
    siret: '',
    isPartner: false
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const metadata: any = {};
      
      // Add specific metadata based on user type
      if (selectedPersona === 'player') {
        metadata.clubName = formData.clubName;
        metadata.licenseNumber = formData.licenseNumber;
      } else if (selectedPersona === 'club') {
        metadata.organizationName = formData.organizationName;
        metadata.federationName = formData.federationName;
      } else if (selectedPersona === 'federation') {
        metadata.organizationName = formData.organizationName;
      } else if (selectedPersona === 'company') {
        metadata.companyName = formData.companyName;
        metadata.siret = formData.siret;
      } else if (selectedPersona === 'donor') {
        metadata.company = formData.company;
      }
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          userType: selectedPersona,
          phone: formData.phone,
          country: 'FR', // Default to France
          isPartner: selectedPersona === 'company' ? formData.isPartner : false,
          metadata
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Success - redirect to verification page
        const redirectUrl = data.redirectUrl || `/verify-email?email=${encodeURIComponent(formData.email)}`;
        window.location.href = redirectUrl;
      } else {
        toast.error('Erreur d\'inscription', data.error || 'Une erreur est survenue lors de la création du compte');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Erreur de connexion', 'Une erreur est survenue lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    return (
      <form onSubmit={handleSubmit}>
        {/* Common fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom</label>
            <div className="relative">
              <i className="fas fa-user absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500"></i>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 text-gray-900 placeholder-gray-400"
                placeholder="Mamadou"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
            <div className="relative">
              <i className="fas fa-user absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500"></i>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 text-gray-900 placeholder-gray-400"
                placeholder="Diallo"
                required
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
          <div className="relative">
            <i className="fas fa-envelope absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500"></i>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 text-gray-900 placeholder-gray-400"
              placeholder="mamadou.diallo@email.com"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone (optionnel)</label>
            <PhoneInput
              value={formData.phone}
              onChange={(phone) => setFormData({...formData, phone})}
              placeholder="Numéro de téléphone"
              className="w-full"
            />
          </div>
          <div>
            <DatePicker
              value={formData.dateOfBirth}
              onChange={(date) => setFormData({...formData, dateOfBirth: date})}
              label="Date de naissance (optionnel)"
              placeholder="Sélectionner votre date de naissance"
              className="w-full"
            />
          </div>
        </div>

        {/* Specific fields based on persona */}
        {selectedPersona === 'player' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Club (optionnel)</label>
                <div className="relative">
                  <i className="fas fa-users absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500"></i>
                  <input
                    type="text"
                    value={formData.clubName}
                    onChange={(e) => setFormData({...formData, clubName: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 text-gray-900 placeholder-gray-400"
                    placeholder="Nom de votre club"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Numéro de licence (optionnel)</label>
                <div className="relative">
                  <i className="fas fa-id-card absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500"></i>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 text-gray-900 placeholder-gray-400"
                    placeholder="Votre numéro de licence"
                  />
                </div>
              </div>
            </div>
            <div className="mb-6">
              <DatePicker
                value={formData.dateOfBirth}
                onChange={(date) => setFormData({...formData, dateOfBirth: date})}
                label="Date de naissance (optionnel)"
                placeholder="Sélectionner votre date de naissance"
                className="w-full"
              />
            </div>
          </>
        )}

        {selectedPersona === 'club' && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du club</label>
              <div className="relative">
                <i className="fas fa-users absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500"></i>
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 text-gray-900 placeholder-gray-400"
                  placeholder="Nom officiel du club"
                  required
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fédération (optionnel)</label>
              <div className="relative">
                <i className="fas fa-building absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500"></i>
                <input
                  type="text"
                  value={formData.federationName}
                  onChange={(e) => setFormData({...formData, federationName: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 text-gray-900 placeholder-gray-400"
                  placeholder="Fédération de rattachement"
                />
              </div>
            </div>
          </>
        )}

        {selectedPersona === 'federation' && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de la fédération</label>
            <div className="relative">
              <i className="fas fa-building absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500"></i>
              <input
                type="text"
                value={formData.organizationName}
                onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 text-gray-900 placeholder-gray-400"
                placeholder="Nom officiel de la fédération"
                required
              />
            </div>
          </div>
        )}

        {selectedPersona === 'company' && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de la société</label>
              <div className="relative">
                <i className="fas fa-briefcase absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500"></i>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 text-gray-900 placeholder-gray-400"
                  placeholder="Nom officiel de la société"
                  required
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">SIRET (optionnel)</label>
              <div className="relative">
                <i className="fas fa-id-card absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500"></i>
                <input
                  type="text"
                  value={formData.siret}
                  onChange={(e) => setFormData({...formData, siret: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 text-gray-900 placeholder-gray-400"
                  placeholder="Numéro SIRET"
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPartner}
                  onChange={(e) => setFormData({...formData, isPartner: e.target.checked})}
                  className="w-5 h-5 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Cette société est partenaire de PaieCashPlay
                </span>
              </label>
              <p className="text-xs text-gray-600 mt-2 ml-8">Cochez cette case si votre société a un partenariat officiel avec PaieCashPlay</p>
            </div>
          </>
        )}

        {selectedPersona === 'donor' && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Entreprise (optionnel)</label>
            <div className="relative">
              <i className="fas fa-briefcase absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500"></i>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 text-gray-900 placeholder-gray-400"
                placeholder="Nom de votre entreprise"
              />
            </div>
          </div>
        )}

        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
          <div className="relative">
            <i className="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500"></i>
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full pl-12 pr-12 py-3 bg-white border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 text-gray-900 placeholder-gray-400"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2 font-medium">8 caractères minimum, avec chiffres et lettres</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-emerald-600 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl mb-6"
        >
          {loading ? 'Création...' : `Créer mon compte ${getUserTypeLabel(selectedPersona)}`}
        </button>

        {/* Social Login */}
        <div className="relative flex items-center py-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-500 font-medium">ou</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <button type="button" className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 rounded-xl py-3 px-4 text-gray-700 hover:border-red-300 hover:bg-red-50 transition-all duration-200">
            <i className="fab fa-google text-red-500 text-lg"></i>
            <span className="text-sm font-medium">Google</span>
          </button>
          <button type="button" className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 rounded-xl py-3 px-4 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
            <i className="fab fa-facebook-f text-blue-600 text-lg"></i>
            <span className="text-sm font-medium text-blue-600">Facebook</span>
          </button>
          <button type="button" className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 rounded-xl py-3 px-4 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200">
            <i className="fab fa-linkedin-in text-blue-700 text-lg"></i>
            <span className="text-sm font-medium text-blue-700">LinkedIn</span>
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-emerald-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/img/logo.png" alt="PaieCashPlay Logo" className="h-10 mr-3" />
            <h1 className="text-xl font-bold text-emerald-700">PaieCashPlay Fondation</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-lg border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 transition-colors">🇫🇷</button>
            <button className="p-2 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors">🇬🇧</button>
            <button className="p-2 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors">🇪🇸</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <img src="/img/logo.png" alt="PaieCashPlay Logo" className="h-24 mx-auto mb-6" />
          <h2 className="text-5xl font-bold text-emerald-700 mb-4">Sport Solidaire</h2>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">Transformez la vie d'enfants africains grâce au micro-sponsoring personnalisé et traçable</p>
          <div className="bg-emerald-100 rounded-2xl p-8 mb-8 border border-emerald-200">
            <h3 className="text-3xl font-bold text-emerald-700 mb-4">Rejoignez la Communauté</h3>
            <p className="text-gray-700 mb-6 text-lg">Choisissez votre profil pour commencer votre parcours sur PaieCashPlay</p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">Progression</span>
            <span className="text-sm font-semibold text-emerald-600">{step}/2</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500" style={{width: `${(step/2)*100}%`}}></div>
          </div>
        </div>

        {step === 1 && (
          /* Step 1: Persona Selection */
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100 p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">Sélectionnez votre profil</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
              {personas.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => setSelectedPersona(persona.id)}
                  className={`relative p-8 rounded-2xl border-2 text-center transition-all duration-200 hover:scale-105 ${
                    selectedPersona === persona.id 
                      ? 'border-emerald-500 bg-emerald-50 shadow-lg' 
                      : 'border-gray-200 hover:border-emerald-300 bg-white hover:shadow-md'
                  }`}
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center shadow-sm">
                    <i className={`${persona.icon} text-2xl ${selectedPersona === persona.id ? 'text-emerald-600' : persona.color}`}></i>
                  </div>
                  <div className="text-base font-bold text-gray-800 mb-2">{persona.label}</div>
                  <div className="text-sm text-gray-600 leading-tight">{persona.desc}</div>
                  {selectedPersona === persona.id && (
                    <i className="fas fa-check-circle text-emerald-500 absolute top-3 right-3 text-lg"></i>
                  )}
                </button>
              ))
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full bg-emerald-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Continuer avec {getUserTypeLabel(selectedPersona)}
            </button>
          </div>
        )}

        {step === 2 && (
          /* Step 2: Form Section */
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="bg-emerald-500 text-white rounded-2xl h-12 w-12 flex items-center justify-center mr-4">
                  <i className="fas fa-user text-lg"></i>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    Profil : {getUserTypeLabel(selectedPersona)}
                  </h3>
                  <p className="text-sm text-gray-600 font-medium">Complétez vos informations</p>
                </div>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
              >
                ← Changer de profil
              </button>
            </div>

            {renderForm()}
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            <i className="fas fa-map-marker-alt text-red-500 mr-1"></i>
            <span>Paris, France</span>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              <span className="font-medium">Étape {step}/2:</span> {step === 1 ? 'Sélection du profil' : 'Informations personnelles'}
            </div>
            <div className="text-sm text-gray-500">
              © 2025 PaieCashPlay Fondation
            </div>
          </div>
        </div>
      </footer>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 flex items-center shadow-2xl">
            <i className="fas fa-spinner fa-spin text-emerald-500 text-2xl mr-4"></i>
            <span className="text-gray-700 font-medium">Création de votre compte...</span>
          </div>
        </div>
      )}
    </div>
  );
}