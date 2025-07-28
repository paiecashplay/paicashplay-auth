'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import CountrySelect from '@/components/ui/CountrySelect';
import PhoneInput from '@/components/ui/PhoneInput';
import DatePicker from '@/components/ui/DatePicker';
import { useToast } from '@/components/ui/Toast';

interface UserMetadata {
  dateOfBirth?: string;
  position?: string;
  clubName?: string;
  federationName?: string;
  [key: string]: any;
}

interface User {
  id: string;
  email: string;
  userType: string;
  isVerified: boolean;
  createdAt: string;
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string;
    country?: string;
    metadata?: UserMetadata;
  };
  socialAccounts?: Array<{
    provider: string;
    type: string;
    email?: string;
    name?: string;
    avatar?: string;
  }>;
}

export default function ProfileManager() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    country: '',
    metadata: {} as UserMetadata
  });
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        if (data.user.profile) {
          setFormData({
            firstName: data.user.profile.firstName || '',
            lastName: data.user.profile.lastName || '',
            phone: data.user.profile.phone || '',
            country: data.user.profile.country || '',
            metadata: data.user.profile.metadata || {}
          });
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Profil mis à jour', 'Vos informations ont été sauvegardées');
        setEditing(false);
        fetchProfile();
      } else {
        toast.error('Erreur', 'Impossible de mettre à jour le profil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erreur', 'Erreur de connexion');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'donor': return { icon: 'fas fa-heart', color: 'text-red-600', bg: 'bg-red-100' };
      case 'player': return { icon: 'fas fa-running', color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'club': return { icon: 'fas fa-users', color: 'text-green-600', bg: 'bg-green-100' };
      case 'federation': return { icon: 'fas fa-flag', color: 'text-purple-600', bg: 'bg-purple-100' };
      default: return { icon: 'fas fa-user', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'donor': return 'Donateur';
      case 'player': return 'Joueur';
      case 'club': return 'Club';
      case 'federation': return 'Fédération';
      default: return userType;
    }
  };

  const renderTypeSpecificFields = () => {
    if (!user) return null;

    switch (user.userType) {
      case 'player':
        return (
          <>
            <div>
              {editing ? (
                <DatePicker
                  value={formData.metadata?.dateOfBirth || ''}
                  onChange={(date) => setFormData({ 
                    ...formData, 
                    metadata: { ...formData.metadata, dateOfBirth: date }
                  })}
                  label="Date de naissance"
                  placeholder="Sélectionner votre date de naissance"
                />
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de naissance
                  </label>
                  <input
                    type="text"
                    value={formData.metadata?.dateOfBirth ? new Date(formData.metadata.dateOfBirth).toLocaleDateString('fr-FR') : 'Non renseigné'}
                    disabled
                    className="input-field bg-gray-50"
                  />
                </>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <select
                value={formData.metadata?.position || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  metadata: { ...formData.metadata, position: e.target.value }
                })}
                disabled={!editing}
                className={`input-field ${!editing ? 'bg-gray-50' : ''}`}
              >
                <option value="">Sélectionnez une position</option>
                <option value="goalkeeper">Gardien</option>
                <option value="defender">Défenseur</option>
                <option value="midfielder">Milieu</option>
                <option value="forward">Attaquant</option>
              </select>
            </div>
          </>
        );
      case 'club':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du club
            </label>
            <input
              type="text"
              value={formData.metadata?.clubName || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                metadata: { ...formData.metadata, clubName: e.target.value }
              })}
              disabled={!editing}
              className={`input-field ${!editing ? 'bg-gray-50' : ''}`}
            />
          </div>
        );
      case 'federation':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la fédération
              </label>
              <input
                type="text"
                value={formData.metadata?.federationName || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  metadata: { ...formData.metadata, federationName: e.target.value }
                })}
                disabled={!editing}
                className={`input-field ${!editing ? 'bg-gray-50' : ''}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fonction
              </label>
              <input
                type="text"
                value={formData.metadata?.position || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  metadata: { ...formData.metadata, position: e.target.value }
                })}
                disabled={!editing}
                className={`input-field ${!editing ? 'bg-gray-50' : ''}`}
                placeholder="Président, Secrétaire général..."
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-paiecash mb-4"></i>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const typeInfo = getUserTypeIcon(user.userType);

  return (
    <div className="min-h-screen gradient-bg py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Logo size="md" />
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${typeInfo.bg}`}>
                <i className={`${typeInfo.icon} ${typeInfo.color} text-sm`}></i>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {getUserTypeLabel(user.userType)}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Déconnexion
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="card-elevated">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${typeInfo.bg}`}>
                <i className={`${typeInfo.icon} ${typeInfo.color} text-xl`}></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
                <p className="text-gray-600">{getUserTypeLabel(user.userType)}</p>
              </div>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className={`btn-${editing ? 'secondary' : 'primary'}`}
            >
              <i className={`fas fa-${editing ? 'times' : 'edit'} mr-2`}></i>
              {editing ? 'Annuler' : 'Modifier'}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">Informations de base</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                  {user.isVerified && <i className="fas fa-check-circle text-green-500 ml-2"></i>}
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="input-field bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!editing}
                  className={`input-field ${!editing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={!editing}
                  className={`input-field ${!editing ? 'bg-gray-50' : ''}`}
                />
              </div>

              {renderTypeSpecificFields()}
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">Informations de contact</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                {editing ? (
                  <PhoneInput
                    value={formData.phone}
                    onChange={(phone) => setFormData({ ...formData, phone })}
                    placeholder="1 23 45 67 89"
                  />
                ) : (
                  <input
                    type="tel"
                    value={formData.phone}
                    disabled
                    className="input-field bg-gray-50"
                    placeholder="Non renseigné"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pays
                </label>
                {editing ? (
                  <CountrySelect
                    value={formData.country}
                    onChange={(country) => setFormData({ ...formData, country })}
                    placeholder="Sélectionnez un pays"
                  />
                ) : (
                  <input
                    type="text"
                    value={formData.country}
                    disabled
                    className="input-field bg-gray-50"
                    placeholder="Non renseigné"
                  />
                )}
              </div>

              {/* Social Accounts */}
              {user.socialAccounts && user.socialAccounts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Comptes liés
                  </label>
                  <div className="space-y-2">
                    {user.socialAccounts.map((account, index) => (
                      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <i className={`fab fa-${account.type} text-lg mr-3 ${
                          account.type === 'google' ? 'text-red-500' :
                          account.type === 'facebook' ? 'text-blue-600' :
                          account.type === 'linkedin' ? 'text-blue-700' : 'text-gray-500'
                        }`}></i>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{account.provider}</div>
                          <div className="text-xs text-gray-500">{account.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {editing && (
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setEditing(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="btn-primary"
              >
                <i className="fas fa-save mr-2"></i>
                Enregistrer
              </button>
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="card-elevated">
            <h3 className="font-semibold text-gray-900 mb-4">Sécurité</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors">
                <i className="fas fa-key mr-3 text-gray-500"></i>
                Changer le mot de passe
              </button>
              <button className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors">
                <i className="fas fa-shield-alt mr-3 text-gray-500"></i>
                Sessions actives
              </button>
            </div>
          </div>

          <div className="card-elevated">
            <h3 className="font-semibold text-gray-900 mb-4">Informations</h3>
            <div className="space-y-3">
              <div className="px-4 py-3">
                <div className="text-sm text-gray-500">Membre depuis</div>
                <div className="font-medium">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</div>
              </div>
              <div className="px-4 py-3">
                <div className="text-sm text-gray-500">Statut du compte</div>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.isVerified ? 'Vérifié' : 'En attente de vérification'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}