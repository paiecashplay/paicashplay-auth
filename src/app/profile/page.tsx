'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import { useToast } from '@/components/ui/Toast';

interface UserProfile {
  id: string;
  email: string;
  userType: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string;
    country?: string;
    language: string;
    avatarUrl?: string;
    isPartner: boolean;
    metadata?: {
      organizationName?: string;
      companyName?: string;
      position?: string;
      dateOfBirth?: string;
      siret?: string;
      [key: string]: any;
    };
  };
}

function ProfileContent() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    country: '',
    language: 'fr'
  });
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        setFormData({
          firstName: data.user.profile?.firstName || '',
          lastName: data.user.profile?.lastName || '',
          phone: data.user.profile?.phone || '',
          country: data.user.profile?.country || '',
          language: data.user.profile?.language || 'fr'
        });
      } else {
        toast.error('Erreur', 'Impossible de charger le profil');
        router.push('/login');
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de charger le profil');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/auth/profile/internal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Succès', 'Profil mis à jour avec succès');
        fetchProfile(); // Recharger le profil
      } else {
        toast.error('Erreur', data.error || 'Impossible de mettre à jour le profil');
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de sauvegarder les modifications');
    } finally {
      setSaving(false);
    }
  };

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'donor': return 'fas fa-heart';
      case 'player': return 'fas fa-running';
      case 'club': return 'fas fa-users';
      case 'federation': return 'fas fa-flag';
      case 'company': return 'fas fa-briefcase';
      default: return 'fas fa-user';
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'donor': return 'text-red-600 bg-red-100 border-red-200';
      case 'player': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'club': return 'text-green-600 bg-green-100 border-green-200';
      case 'federation': return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'company': return 'text-indigo-600 bg-indigo-100 border-indigo-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="card-elevated w-full max-w-md">
          <div className="text-center py-8">
            <i className="fas fa-spinner fa-spin text-paiecash text-2xl mb-4"></i>
            <p className="text-gray-600">Chargement du profil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="card-elevated w-full max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Accès refusé</h3>
            <p className="text-gray-500 mb-6">Vous devez être connecté pour accéder à cette page</p>
            <button
              onClick={() => router.push('/login')}
              className="btn-primary"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Se connecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-paiecash/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getUserTypeColor(user.userType)}`}>
              <i className={`${getUserTypeIcon(user.userType)} mr-2`}></i>
              {user.userType}
            </span>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-secondary"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Retour
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2">
            <div className="card-elevated">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Mon profil</h2>
                <p className="text-sm text-gray-600">Gérer vos informations personnelles</p>
              </div>

              <div className="space-y-6">
                {/* Email (lecture seule) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="fas fa-envelope mr-2 text-paiecash"></i>
                    Adresse email
                  </label>
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-600">
                    {user.email}
                    {user.isVerified ? (
                      <span className="ml-2 text-green-600">
                        <i className="fas fa-check-circle"></i> Vérifié
                      </span>
                    ) : (
                      <span className="ml-2 text-orange-600">
                        <i className="fas fa-clock"></i> En attente de vérification
                      </span>
                    )}
                  </div>
                </div>

                {/* Nom et prénom */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <i className="fas fa-user mr-2 text-paiecash"></i>
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="input-field"
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <i className="fas fa-user mr-2 text-paiecash"></i>
                      Nom
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="input-field"
                      placeholder="Votre nom"
                    />
                  </div>
                </div>

                {/* Téléphone et pays */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <i className="fas fa-phone mr-2 text-paiecash"></i>
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="input-field"
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <i className="fas fa-globe mr-2 text-paiecash"></i>
                      Pays
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="input-field"
                    >
                      <option value="">Sélectionner un pays</option>
                      <option value="FR">France</option>
                      <option value="BE">Belgique</option>
                      <option value="CH">Suisse</option>
                      <option value="CA">Canada</option>
                      <option value="MA">Maroc</option>
                      <option value="SN">Sénégal</option>
                      <option value="CI">Côte d'Ivoire</option>
                    </select>
                  </div>
                </div>

                {/* Langue */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="fas fa-language mr-2 text-paiecash"></i>
                    Langue préférée
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({...formData, language: e.target.value})}
                    className="input-field"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>

                {/* Informations spécifiques par type d'utilisateur */}
                {user.profile?.metadata && (
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {user.userType === 'federation' && 'Informations Fédération'}
                      {user.userType === 'club' && 'Informations Club'}
                      {user.userType === 'player' && 'Informations Licencié'}
                      {user.userType === 'company' && 'Informations Société'}
                    </h3>
                    <div className="space-y-4">
                      {/* Fédération */}
                      {user.userType === 'federation' && user.profile.metadata.organizationName && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <i className="fas fa-flag mr-2 text-paiecash"></i>
                            Nom de la fédération
                          </label>
                          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-600">
                            {user.profile.metadata.organizationName}
                          </div>
                        </div>
                      )}
                      {user.userType === 'federation' && user.profile.metadata.position && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <i className="fas fa-briefcase mr-2 text-paiecash"></i>
                            Fonction
                          </label>
                          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-600">
                            {user.profile.metadata.position}
                          </div>
                        </div>
                      )}
                      
                      {/* Club */}
                      {user.userType === 'club' && user.profile.metadata.organizationName && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <i className="fas fa-users mr-2 text-paiecash"></i>
                            Nom du club
                          </label>
                          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-600">
                            {user.profile.metadata.organizationName}
                          </div>
                        </div>
                      )}
                      
                      {/* Licencié */}
                      {user.userType === 'player' && user.profile.metadata.position && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <i className="fas fa-running mr-2 text-paiecash"></i>
                            Position
                          </label>
                          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-600">
                            {user.profile.metadata.position === 'goalkeeper' && 'Gardien'}
                            {user.profile.metadata.position === 'defender' && 'Défenseur'}
                            {user.profile.metadata.position === 'midfielder' && 'Milieu'}
                            {user.profile.metadata.position === 'forward' && 'Attaquant'}
                          </div>
                        </div>
                      )}
                      {user.userType === 'player' && user.profile.metadata.dateOfBirth && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <i className="fas fa-calendar mr-2 text-paiecash"></i>
                            Date de naissance
                          </label>
                          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-600">
                            {new Date(user.profile.metadata.dateOfBirth).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      )}
                      
                      {/* Société */}
                      {user.userType === 'company' && user.profile.metadata.companyName && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <i className="fas fa-briefcase mr-2 text-paiecash"></i>
                            Nom de la société
                          </label>
                          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-600">
                            {user.profile.metadata.companyName}
                          </div>
                        </div>
                      )}
                      {user.userType === 'company' && user.profile.metadata.siret && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <i className="fas fa-id-card mr-2 text-paiecash"></i>
                            SIRET
                          </label>
                          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-600">
                            {user.profile.metadata.siret}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bouton de sauvegarde */}
                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>
                        Sauvegarder les modifications
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Informations du compte */}
          <div className="space-y-6">
            {/* Statut du compte */}
            <div className="card-elevated">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut du compte</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Statut</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Actif' : 'Suspendu'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email vérifié</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.isVerified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {user.isVerified ? 'Vérifié' : 'En attente'}
                  </span>
                </div>
                {user.profile?.isPartner && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Partenaire</span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Officiel
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Membre depuis</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card-elevated">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button className="w-full btn-secondary text-left">
                  <i className="fas fa-key mr-3"></i>
                  Changer le mot de passe
                </button>
                <button className="w-full btn-secondary text-left">
                  <i className="fas fa-shield-alt mr-3"></i>
                  Sécurité du compte
                </button>
                <button className="w-full btn-secondary text-left">
                  <i className="fas fa-download mr-3"></i>
                  Télécharger mes données
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="card-elevated w-full max-w-md">
          <div className="text-center py-8">
            <i className="fas fa-spinner fa-spin text-paiecash text-2xl mb-4"></i>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}