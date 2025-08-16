'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import { useToast } from '@/components/ui/Toast';
import CountrySelect from '@/components/ui/CountrySelect';
import PhoneInput from '@/components/ui/PhoneInput';
import DatePicker from '@/components/ui/DatePicker';
import SocialButtons from '@/components/ui/SocialButtons';
import ClubSelect from '@/components/ui/ClubSelect';
import FederationSelect from '@/components/ui/FederationSelect';

const USER_TYPES = [
  { value: 'donor', label: 'Donateur', icon: 'fas fa-heart', color: 'text-red-600', bg: 'bg-red-100', desc: 'Soutenir les projets' },
  { value: 'player', label: 'Licencié', icon: 'fas fa-running', color: 'text-blue-600', bg: 'bg-blue-100', desc: 'Profil sportif' },
  { value: 'club', label: 'Club', icon: 'fas fa-users', color: 'text-green-600', bg: 'bg-green-100', desc: 'Gestion d’équipe' },
  { value: 'federation', label: 'Fédération', icon: 'fas fa-flag', color: 'text-purple-600', bg: 'bg-purple-100', desc: 'Administration' },
  { value: 'company', label: 'Société', icon: 'fas fa-briefcase', color: 'text-indigo-600', bg: 'bg-indigo-100', desc: 'Partenariats' },
  { value: 'affiliate', label: 'Ambassadeur', icon: 'fas fa-star', color: 'text-yellow-600', bg: 'bg-yellow-100', desc: 'Promotion' },
  { value: 'academy', label: 'Académie', icon: 'fas fa-graduation-cap', color: 'text-emerald-600', bg: 'bg-emerald-100', desc: 'Formation' },
  { value: 'school', label: 'École', icon: 'fas fa-school', color: 'text-teal-600', bg: 'bg-teal-100', desc: 'Éducation' },
  { value: 'association', label: 'Association', icon: 'fas fa-handshake', color: 'text-orange-600', bg: 'bg-orange-100', desc: 'Organisation' },

];

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    userType: '',
    firstName: '',
    lastName: '',
    // Champs spécifiques par type
    organizationName: '',
    clubName: '',
    federationName: '',
    position: '',
    dateOfBirth: '',
    phone: '',
    country: '',
    // Company specific
    companyName: '',
    siret: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const [socialData, setSocialData] = useState<any>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const provider = urlParams.get('provider');
    const socialDataParam = urlParams.get('socialData');
    const preselectedType = urlParams.get('type') || urlParams.get('signup_type');
    
    // Pre-select user type if provided in URL
    if (preselectedType) {
      // Map signup_type values to internal values
      const typeMapping: { [key: string]: string } = {
        'ecole': 'school',
        'school': 'school',
        'club': 'club',
        'player': 'player',
        'donor': 'donor',
        'federation': 'federation',
        'company': 'company',
        'affiliate': 'affiliate',
        'academy': 'academy',
        'association': 'association'
      };
      
      const mappedType = typeMapping[preselectedType];
      if (mappedType && USER_TYPES.find(t => t.value === mappedType)) {
        setFormData(prev => ({ ...prev, userType: mappedType }));
      }
    }
    
    if (provider && socialDataParam) {
      try {
        const data = JSON.parse(decodeURIComponent(socialDataParam));
        console.log('Social data received:', data);
        setSocialData({ provider, ...data });
        
        // Pre-fill form with social data
        setFormData(prev => ({
          ...prev,
          email: data.email || '',
          firstName: data.firstName || '',
          lastName: data.lastName || ''
        }));
        
        // Show success message
        toast.success(
          `Authentification ${provider} réussie !`, 
          `Vos informations ont été récupérées. Complétez votre inscription ci-dessous.`
        );
      } catch (error) {
        console.error('Error parsing social data:', error);
        toast.error('Erreur', 'Impossible de récupérer les données sociales');
      }
    }
  }, []); // Retirer toast des dépendances

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Handle social signup
    if (socialData) {
      try {
        // Prepare metadata based on user type
        const metadata: any = {};
        if (formData.userType === 'company') {
          metadata.companyName = formData.organizationName;
          metadata.siret = formData.position;
        } else if (formData.userType === 'club') {
          metadata.organizationName = formData.clubName;
          metadata.federation = formData.federationName;
        } else if (formData.userType === 'federation') {
          metadata.organizationName = formData.federationName;
          metadata.position = formData.position;
        } else if (formData.userType === 'player') {
          metadata.position = formData.position;
          metadata.dateOfBirth = formData.dateOfBirth;
          metadata.club = formData.clubName;
        } else if (formData.userType === 'affiliate') {
          metadata.activityType = formData.position;
          metadata.platform = formData.organizationName;
        }

        // Préparer l'URL avec oauth_session
        const urlParams = new URLSearchParams(window.location.search);
        const apiUrl = new URL('/api/auth/social/complete-signup', window.location.origin);
        
        // Transmettre oauth_session
        const oauthSession = urlParams.get('oauth_session');
        if (oauthSession) {
          apiUrl.searchParams.set('oauth_session', oauthSession);
        }

        const response = await fetch(apiUrl.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            socialData,
            userType: formData.userType,
            additionalData: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
              country: formData.country || 'FR',
              profileData: metadata
            }
          })
        });

        const data = await response.json();

        if (response.ok) {
          toast.success('Compte créé avec succès !', 'Connexion automatique...');
          
          setTimeout(() => {
            if (data.oauthSession) {
              // Flux OAuth - rediriger vers continue avec oauth_session
              window.location.href = `/api/auth/continue?oauth_session=${data.oauthSession}`;
            } else {
              // Connexion directe - rediriger vers le dashboard
              router.push('/dashboard');
            }
          }, 1500);
        } else {
          toast.error('Erreur de création', data.error || 'Impossible de créer le compte');
          setError(data.error || 'Erreur de création du compte');
        }
      } catch (error) {
        console.error('Social signup error:', error);
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Regular signup
    if (formData.password !== formData.confirmPassword) {
      toast.error('Mots de passe différents', 'Veuillez vérifier que les mots de passe correspondent');
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      // Prepare metadata based on user type
      const metadata: any = {};
      if (formData.userType === 'company') {
        metadata.companyName = formData.organizationName;
        metadata.siret = formData.position; // Using position field for SIRET
      } else if (formData.userType === 'club') {
        metadata.organizationName = formData.clubName;
        metadata.federation = formData.federationName;
      } else if (formData.userType === 'federation') {
        metadata.organizationName = formData.federationName;
        metadata.position = formData.position;
      } else if (formData.userType === 'player') {
        metadata.position = formData.position;
        metadata.dateOfBirth = formData.dateOfBirth;
        metadata.club = formData.clubName;
      } else if (formData.userType === 'affiliate') {
        metadata.activityType = formData.position;
        metadata.platform = formData.organizationName;
      }

      // Préparer l'URL avec oauth_session
      const urlParams = new URLSearchParams(window.location.search);
      const apiUrl = new URL('/api/auth/signup', window.location.origin);
      
      // Transmettre oauth_session
      const oauthSession = urlParams.get('oauth_session');
      if (oauthSession) {
        apiUrl.searchParams.set('oauth_session', oauthSession);
      }

      const response = await fetch(apiUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          userType: formData.userType,
          phone: formData.phone,
          country: formData.country,
          isPartner: formData.userType === 'company',
          metadata
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Inscription réussie', 'Vérifiez votre email pour activer votre compte');
        
        // Construire l'URL de vérification avec oauth_session
        const verifyUrl = new URL('/verify-email', window.location.origin);
        verifyUrl.searchParams.set('email', formData.email);
        
        // Ajouter oauth_session s'il existe
        const urlParams = new URLSearchParams(window.location.search);
        const oauthSession = urlParams.get('oauth_session');
        if (oauthSession) {
          verifyUrl.searchParams.set('oauth_session', oauthSession);
        }
        
        setTimeout(() => router.push(verifyUrl.pathname + verifyUrl.search), 1500);
      } else {
        toast.error('Erreur d\'inscription', data.error || 'Impossible de créer le compte');
        setError(data.error || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      setError('Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h1>
          <p className="text-gray-600">Rejoignez la communauté PaieCashPlay</p>
        </div>

        {/* Signup Form */}
        <div className="card-elevated">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Type Selection */}
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
                      formData.userType === type.value
                        ? 'border-paiecash bg-paiecash/5 shadow-lg ring-2 ring-paiecash/20'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="userType"
                      value={type.value}
                      checked={formData.userType === type.value}
                      onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
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
                    {formData.userType === type.value && (
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
                      formData.userType === type.value
                        ? 'border-paiecash bg-paiecash/5 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="userType"
                      value={type.value}
                      checked={formData.userType === type.value}
                      onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                      className="sr-only"
                    />
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${type.bg} shadow-sm`}>
                      <i className={`${type.icon} text-lg ${type.color}`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{type.label}</div>
                      <div className="text-sm text-gray-500 mt-1">{type.desc}</div>
                    </div>
                    {formData.userType === type.value && (
                      <div className="w-6 h-6 bg-paiecash rounded-full flex items-center justify-center ml-3">
                        <i className="fas fa-check text-white text-xs"></i>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Dynamic Fields Based on User Type */}
            {formData.userType && (
              <div className="space-y-6">
                {/* Donor Fields */}
                {formData.userType === 'donor' && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Prénom
                        {socialData && formData.firstName && (
                          <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                            <i className="fas fa-check mr-1"></i>Auto
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className={`input-field ${socialData && formData.firstName ? 'bg-emerald-50 border-emerald-300' : ''}`}
                        placeholder="Votre prénom"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Nom
                        {socialData && formData.lastName && (
                          <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                            <i className="fas fa-check mr-1"></i>Auto
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className={`input-field ${socialData && formData.lastName ? 'bg-emerald-50 border-emerald-300' : ''}`}
                        placeholder="Votre nom"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Player Fields */}
                {formData.userType === 'player' && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Prénom <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="input-field"
                          placeholder="Prénom du licencié"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Nom <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="input-field"
                          placeholder="Nom du licencié"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <DatePicker
                        value={formData.dateOfBirth}
                        onChange={(date) => setFormData({ ...formData, dateOfBirth: date })}
                        label="Date de naissance"
                        placeholder="Sélectionnez votre date de naissance"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Téléphone
                      </label>
                      <PhoneInput
                        value={formData.phone}
                        onChange={(phone) => setFormData({ ...formData, phone })}
                        placeholder="1 23 45 67 89"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Position <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.position}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          className="input-field"
                          required
                        >
                          <option value="">Sélectionnez une position</option>
                          <option value="goalkeeper">Gardien</option>
                          <option value="defender">Défenseur</option>
                          <option value="midfielder">Milieu</option>
                          <option value="forward">Attaquant</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Club (optionnel)
                        </label>
                        <ClubSelect
                          value={formData.clubName}
                          onChange={(club) => setFormData({ ...formData, clubName: club })}
                          placeholder="Sélectionnez votre club"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Club Fields */}
                {formData.userType === 'club' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Nom du club <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.clubName}
                        onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                        className="input-field"
                        placeholder="Nom officiel du club"
                        required
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Prénom du responsable <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="input-field"
                          placeholder="Prénom"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Nom du responsable <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="input-field"
                          placeholder="Nom"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Téléphone <span className="text-red-500">*</span>
                      </label>
                      <PhoneInput
                        value={formData.phone}
                        onChange={(phone) => setFormData({ ...formData, phone })}
                        placeholder="1 23 45 67 89"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Pays <span className="text-red-500">*</span>
                      </label>
                      <CountrySelect
                        value={formData.country}
                        onChange={(country) => setFormData({ ...formData, country })}
                        placeholder="Sélectionnez un pays"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Fédération (optionnel)
                      </label>
                      <FederationSelect
                        value={formData.federationName}
                        onChange={(federation) => setFormData({ ...formData, federationName: federation })}
                        placeholder="Sélectionnez votre fédération"
                      />
                    </div>
                  </div>
                )}

                {/* Federation Fields */}
                {formData.userType === 'federation' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Nom de la fédération <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.federationName}
                        onChange={(e) => setFormData({ ...formData, federationName: e.target.value })}
                        className="input-field"
                        placeholder="Fédération Française de Football"
                        required
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Prénom du représentant <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="input-field"
                          placeholder="Prénom"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Nom du représentant <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="input-field"
                          placeholder="Nom"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Fonction <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.position}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          className="input-field"
                          placeholder="Président, Secrétaire général..."
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Pays <span className="text-red-500">*</span>
                        </label>
                        <CountrySelect
                          value={formData.country}
                          onChange={(country) => setFormData({ ...formData, country })}
                          placeholder="Sélectionnez un pays"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Téléphone officiel <span className="text-red-500">*</span>
                      </label>
                      <PhoneInput
                        value={formData.phone}
                        onChange={(phone) => setFormData({ ...formData, phone })}
                        placeholder="1 23 45 67 89"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Company Fields */}
                {formData.userType === 'company' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Nom de la société <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.organizationName}
                        onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                        className="input-field"
                        placeholder="Nom officiel de la société"
                        required
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Prénom du représentant <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="input-field"
                          placeholder="Prénom"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Nom du représentant <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="input-field"
                          placeholder="Nom"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          SIRET (optionnel)
                        </label>
                        <input
                          type="text"
                          value={formData.position}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          className="input-field"
                          placeholder="Numéro SIRET"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Pays <span className="text-red-500">*</span>
                        </label>
                        <CountrySelect
                          value={formData.country}
                          onChange={(country) => setFormData({ ...formData, country })}
                          placeholder="Sélectionnez un pays"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Téléphone <span className="text-red-500">*</span>
                      </label>
                      <PhoneInput
                        value={formData.phone}
                        onChange={(phone) => setFormData({ ...formData, phone })}
                        placeholder="1 23 45 67 89"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Affiliate Fields */}
                {formData.userType === 'affiliate' && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Prénom <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="input-field"
                          placeholder="Votre prénom"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Nom <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="input-field"
                          placeholder="Votre nom"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Type d'activité <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        className="input-field"
                        required
                      >
                        <option value="">Sélectionnez votre activité</option>
                        <option value="influencer">Influenceur</option>
                        <option value="content_creator">Créateur de contenu</option>
                        <option value="blogger">Blogueur</option>
                        <option value="youtuber">YouTuber</option>
                        <option value="podcaster">Podcaster</option>
                        <option value="community_manager">Community Manager</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Plateforme principale <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.organizationName}
                        onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                        className="input-field"
                        placeholder="Instagram, YouTube, TikTok, Blog..."
                        required
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Téléphone <span className="text-red-500">*</span>
                        </label>
                        <PhoneInput
                          value={formData.phone}
                          onChange={(phone) => setFormData({ ...formData, phone })}
                          placeholder="1 23 45 67 89"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Pays <span className="text-red-500">*</span>
                        </label>
                        <CountrySelect
                          value={formData.country}
                          onChange={(country) => setFormData({ ...formData, country })}
                          placeholder="Sélectionnez un pays"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Academy Fields */}
                {formData.userType === 'academy' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Nom de l'académie <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.organizationName}
                        onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                        className="input-field"
                        placeholder="Académie de Football de Paris"
                        required
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Prénom du directeur <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="input-field"
                          placeholder="Prénom"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Nom du directeur <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="input-field"
                          placeholder="Nom"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Spécialité <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.position}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          className="input-field"
                          required
                        >
                          <option value="">Sélectionnez une spécialité</option>
                          <option value="football">Football</option>
                          <option value="basketball">Basketball</option>
                          <option value="tennis">Tennis</option>
                          <option value="rugby">Rugby</option>
                          <option value="handball">Handball</option>
                          <option value="volleyball">Volleyball</option>
                          <option value="multisport">Multisport</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Pays <span className="text-red-500">*</span>
                        </label>
                        <CountrySelect
                          value={formData.country}
                          onChange={(country) => setFormData({ ...formData, country })}
                          placeholder="Sélectionnez un pays"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Téléphone <span className="text-red-500">*</span>
                      </label>
                      <PhoneInput
                        value={formData.phone}
                        onChange={(phone) => setFormData({ ...formData, phone })}
                        placeholder="1 23 45 67 89"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* School Fields */}
                {formData.userType === 'school' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Nom de l'école <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.organizationName}
                        onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                        className="input-field"
                        placeholder="Lycée Jean Moulin"
                        required
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Prénom du responsable <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="input-field"
                          placeholder="Prénom"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Nom du responsable <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="input-field"
                          placeholder="Nom"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Type d'établissement <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.position}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          className="input-field"
                          required
                        >
                          <option value="">Sélectionnez le type</option>
                          <option value="primaire">Ecole primaire</option>
                          <option value="college">Collège</option>
                          <option value="lycee">Lycée</option>
                          <option value="universite">Université</option>
                          <option value="prive">Etablissement privé</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Pays <span className="text-red-500">*</span>
                        </label>
                        <CountrySelect
                          value={formData.country}
                          onChange={(country) => setFormData({ ...formData, country })}
                          placeholder="Sélectionnez un pays"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Téléphone <span className="text-red-500">*</span>
                      </label>
                      <PhoneInput
                        value={formData.phone}
                        onChange={(phone) => setFormData({ ...formData, phone })}
                        placeholder="1 23 45 67 89"
                        required
                      />
                    </div>
                  </div>
                )}



                {/* Association Fields */}
                {formData.userType === 'association' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Nom de l'association <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.organizationName}
                        onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                        className="input-field"
                        placeholder="Association Sportive de Quartier"
                        required
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Prénom du président <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="input-field"
                          placeholder="Prénom"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Nom du président <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="input-field"
                          placeholder="Nom"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Type d'association <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.position}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          className="input-field"
                          required
                        >
                          <option value="">Sélectionnez le type</option>
                          <option value="sportive">Association sportive</option>
                          <option value="culturelle">Association culturelle</option>
                          <option value="caritative">Association caritative</option>
                          <option value="educative">Association éducative</option>
                          <option value="jeunesse">Association de jeunesse</option>
                          <option value="autre">Autre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Pays <span className="text-red-500">*</span>
                        </label>
                        <CountrySelect
                          value={formData.country}
                          onChange={(country) => setFormData({ ...formData, country })}
                          placeholder="Sélectionnez un pays"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Téléphone <span className="text-red-500">*</span>
                      </label>
                      <PhoneInput
                        value={formData.phone}
                        onChange={(phone) => setFormData({ ...formData, phone })}
                        placeholder="1 23 45 67 89"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <i className="fas fa-envelope mr-2 text-paiecash"></i>
                Adresse email <span className="text-red-500">*</span>
                {socialData && (
                  <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                    <i className="fas fa-check mr-1"></i>Vérifié par {socialData.provider}
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`input-field ${socialData ? 'bg-emerald-50 border-emerald-300' : ''}`}
                  placeholder="votre@email.com"
                  readOnly={!!socialData}
                  required
                />
                {socialData && (
                  <i className="fas fa-lock absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-500"></i>
                )}
              </div>
            </div>

            {/* Password - Only for regular signup */}
            {!socialData && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <i className="fas fa-lock mr-2 text-paiecash"></i>
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input-field pr-12"
                      placeholder="Minimum 8 caractères"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="input-field pr-12"
                      placeholder="Répétez le mot de passe"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <i className="fas fa-exclamation-triangle mr-3 text-red-500"></i>
                <div>
                  <p className="font-medium">Erreur d'inscription</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {!formData.userType && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center">
                <i className="fas fa-info-circle mr-3 text-blue-500"></i>
                <p className="text-sm">
                  Veuillez sélectionner un type de compte pour continuer
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !formData.userType}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-lg py-4"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-3"></i>
                  Création du compte...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus mr-3"></i>
                  Créer mon compte
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <div className="text-gray-600 text-sm">
              Déjà un compte ?{' '}
              <button 
                onClick={() => {
                  const urlParams = new URLSearchParams(window.location.search);
                  const oauthSession = urlParams.get('oauth_session');
                  
                  const loginUrl = oauthSession ? `/login?oauth_session=${oauthSession}` : '/login';
                  window.location.href = loginUrl;
                }}
                className="text-paiecash hover:text-paiecash-dark font-medium bg-transparent border-none cursor-pointer underline"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>

        {/* Info by User Type */}
        {formData.userType && (
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mt-8 border border-gray-200">
            <div className="flex items-center mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${USER_TYPES.find(t => t.value === formData.userType)?.bg} shadow-sm`}>
                <i className={`${USER_TYPES.find(t => t.value === formData.userType)?.icon} ${USER_TYPES.find(t => t.value === formData.userType)?.color}`}></i>
              </div>
              <h3 className="font-semibold text-gray-900">
                {formData.userType === 'donor' && 'Compte Donateur'}
                {formData.userType === 'player' && 'Compte Licencié'}
                {formData.userType === 'club' && 'Compte Club'}
                {formData.userType === 'federation' && 'Compte Fédération'}
                {formData.userType === 'company' && 'Compte Société'}
                {formData.userType === 'affiliate' && 'Compte Ambassadeur'}
                {formData.userType === 'academy' && 'Compte Académie'}
                {formData.userType === 'school' && 'Compte École'}
                {formData.userType === 'association' && 'Compte Association'}

              </h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {formData.userType === 'donor' && 'Accès aux fonctionnalités de donation et suivi des contributions pour soutenir les projets sportifs.'}
              {formData.userType === 'player' && 'Profil licencié avec statistiques personnelles, historique des matchs et gestion de carrière sportive.'}
              {formData.userType === 'club' && 'Gestion complète des joueurs, équipes, compétitions et administration du club sportif.'}
              {formData.userType === 'federation' && 'Administration des clubs affiliés, organisation des compétitions et gestion de la réglementation.'}
              {formData.userType === 'company' && 'Accès aux fonctionnalités de sponsoring d\'entreprise, partenariats et visibilité commerciale.'}
              {formData.userType === 'affiliate' && 'Vente de billets d\'événements sportifs, commissions sur les ventes et outils de promotion avancés.'}
              {formData.userType === 'academy' && 'Gestion des programmes de formation, suivi des élèves et organisation des cours sportifs.'}
              {formData.userType === 'school' && 'Intégration du sport scolaire, gestion des équipes étudiantes et programmes éducatifs.'}
              {formData.userType === 'association' && 'Coordination des activités associatives, gestion des membres et organisation d\'événements communautaires.'}

            </p>
          </div>
        )}

        {!socialData && (
          <div className="mt-8">
            <SocialButtons mode="signup" />
          </div>
        )}
        
        {socialData && (
          <div className="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                <i className={`fab fa-${socialData.provider} text-white text-sm`}></i>
              </div>
              <div>
                <span className="text-sm font-bold text-emerald-700 capitalize">
                  Inscription avec {socialData.provider}
                </span>
                <p className="text-xs text-emerald-600 mt-1">
                  Vos informations ont été récupérées automatiquement
                </p>
              </div>
            </div>
            <div className="flex items-center text-xs text-emerald-600">
              <i className="fas fa-check-circle mr-2"></i>
              <span>Email vérifié • Pas de mot de passe requis • Inscription sécurisée</span>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            En créant un compte, vous acceptez nos{' '}
            <a href="#" className="text-paiecash hover:underline">Conditions d'utilisation</a>
            {' '}et notre{' '}
            <a href="#" className="text-paiecash hover:underline">Politique de confidentialité</a>
          </p>
        </div>
      </div>
    </div>
  );
}