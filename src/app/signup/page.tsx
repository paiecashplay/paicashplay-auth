'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import { useToast } from '@/components/ui/Toast';
import CountrySelect from '@/components/ui/CountrySelect';
import PhoneInput from '@/components/ui/PhoneInput';
import SocialButtons from '@/components/ui/SocialButtons';

const USER_TYPES = [
  { value: 'donor', label: 'Donateur', icon: 'fas fa-heart', color: 'text-red-600', bg: 'bg-red-100' },
  { value: 'player', label: 'Joueur', icon: 'fas fa-running', color: 'text-blue-600', bg: 'bg-blue-100' },
  { value: 'club', label: 'Club', icon: 'fas fa-users', color: 'text-green-600', bg: 'bg-green-100' },
  { value: 'federation', label: 'Fédération', icon: 'fas fa-flag', color: 'text-purple-600', bg: 'bg-purple-100' }
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
    nationality: '',
    phone: '',
    country: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const [socialData, setSocialData] = useState<any>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const socialToken = urlParams.get('social');
    
    if (socialToken) {
      try {
        const data = JSON.parse(atob(socialToken));
        setSocialData(data);
        
        // Pre-fill form with social data
        setFormData(prev => ({
          ...prev,
          email: data.profile.email || '',
          firstName: data.profile.firstName || data.profile.name?.split(' ')[0] || '',
          lastName: data.profile.lastName || data.profile.name?.split(' ').slice(1).join(' ') || ''
        }));
      } catch (error) {
        console.error('Error parsing social data:', error);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Handle social signup
    if (socialData) {
      try {
        const response = await fetch('/api/auth/social-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            socialToken: new URLSearchParams(window.location.search).get('social'),
            userType: formData.userType,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            country: formData.country,
            clubName: formData.clubName,
            federationName: formData.federationName,
            position: formData.position,
            dateOfBirth: formData.dateOfBirth,
            nationality: formData.nationality
          })
        });

        const data = await response.json();

        if (response.ok) {
          toast.success('Compte créé avec succès', 'Connexion automatique...');
          setTimeout(() => router.push('/dashboard'), 1000);
        } else {
          toast.error('Erreur de création', data.error || 'Impossible de créer le compte');
          setError(data.error || 'Erreur de création du compte');
        }
      } catch (error) {
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

    // Handle social signup
    if (socialData) {
      try {
        const response = await fetch('/api/auth/social-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            socialToken: new URLSearchParams(window.location.search).get('social'),
            userType: formData.userType,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            country: formData.country,
            clubName: formData.clubName,
            federationName: formData.federationName,
            position: formData.position,
            dateOfBirth: formData.dateOfBirth,
            nationality: formData.nationality
          })
        });

        const data = await response.json();

        if (response.ok) {
          toast.success('Compte créé avec succès', 'Connexion automatique...');
          setTimeout(() => router.push('/dashboard'), 1000);
        } else {
          toast.error('Erreur de création', data.error || 'Impossible de créer le compte');
          setError(data.error || 'Erreur de création du compte');
        }
      } catch (error) {
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Inscription réussie', 'Vérifiez votre email pour activer votre compte');
        setTimeout(() => router.push('/verify-email'), 1500);
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
              <div className="grid grid-cols-2 gap-3">
                {USER_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.userType === type.value
                        ? 'border-paiecash bg-paiecash/5'
                        : 'border-gray-200 hover:border-gray-300'
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
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${type.bg}`}>
                      <i className={`${type.icon} ${type.color}`}></i>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{type.label}</div>
                    </div>
                    {formData.userType === type.value && (
                      <i className="fas fa-check-circle text-paiecash absolute top-2 right-2"></i>
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
                        Nom
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
                          placeholder="Prénom du joueur"
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
                          placeholder="Nom du joueur"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Date de naissance <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Nationalité <span className="text-red-500">*</span>
                        </label>
                        <CountrySelect
                          value={formData.nationality}
                          onChange={(country) => setFormData({ ...formData, nationality: country })}
                          placeholder="Sélectionnez votre nationalité"
                        />
                      </div>
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
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <i className="fas fa-envelope mr-2 text-paiecash"></i>
                Adresse email <span className="text-red-500">*</span>
                {socialData && <span className="text-sm text-gray-500 ml-2">(depuis {socialData.provider})</span>}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`input-field ${socialData ? 'bg-gray-50' : ''}`}
                placeholder="votre@email.com"
                disabled={!!socialData}
                required
              />
            </div>

            {/* Password - Only for regular signup */}
            {!socialData && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <i className="fas fa-lock mr-2 text-paiecash"></i>
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field"
                    placeholder="Minimum 8 caractères"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="input-field"
                    placeholder="Répétez le mot de passe"
                    required
                  />
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
              <a href="/login" className="text-paiecash hover:text-paiecash-dark font-medium">
                Se connecter
              </a>
            </div>
          </div>
        </div>

        {/* Terms */}
        {/* Info by User Type */}
        {formData.userType && (
          <div className="bg-gray-50 rounded-lg p-6 mt-8">
            <h3 className="font-semibold text-gray-900 mb-3">
              {formData.userType === 'donor' && 'Compte Donateur'}
              {formData.userType === 'player' && 'Compte Joueur'}
              {formData.userType === 'club' && 'Compte Club'}
              {formData.userType === 'federation' && 'Compte Fédération'}
            </h3>
            <p className="text-sm text-gray-600">
              {formData.userType === 'donor' && 'Accès aux fonctionnalités de donation et suivi des contributions.'}
              {formData.userType === 'player' && 'Profil joueur avec statistiques, historique et gestion de carrière.'}
              {formData.userType === 'club' && 'Gestion des joueurs, équipes et administration du club.'}
              {formData.userType === 'federation' && 'Administration des clubs, compétitions et réglementation.'}
            </p>
          </div>
        )}

        {!socialData && <SocialButtons mode="signup" />}

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