'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/components/ui/Toast';

interface User {
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
  };
  sessions: Array<{
    id: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
  }>;
  _count: {
    sessions: number;
    emailVerifications: number;
    passwordResets: number;
  };
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    country: '',
    userType: '',
    isVerified: false,
    isActive: true
  });
  
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        setFormData({
          email: data.user.email,
          firstName: data.user.profile?.firstName || '',
          lastName: data.user.profile?.lastName || '',
          phone: data.user.profile?.phone || '',
          country: data.user.profile?.country || '',
          userType: data.user.userType,
          isVerified: data.user.isVerified,
          isActive: data.user.isActive
        });
      } else {
        toast.error('Erreur', data.error || 'Impossible de charger l\'utilisateur');
        router.push('/admin/users');
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de charger l\'utilisateur');
      router.push('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Succès', 'Utilisateur mis à jour avec succès');
        setUser(data.user);
      } else {
        toast.error('Erreur', data.error || 'Impossible de mettre à jour l\'utilisateur');
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
      <AdminLayout>
        <div className="animate-pulse">
          <div className="card mb-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-2xl text-red-600"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Utilisateur non trouvé</h3>
          <p className="text-gray-500 mb-6">L'utilisateur demandé n'existe pas ou a été supprimé</p>
          <button
            onClick={() => router.push('/admin/users')}
            className="btn-primary"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Retour à la liste
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => router.push('/admin/users')}
            className="btn-secondary mr-4"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Retour
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Détails de l'utilisateur</h1>
            <p className="text-gray-600">Gérer les informations et paramètres du compte</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getUserTypeColor(user.userType)}`}>
            <i className={`${getUserTypeIcon(user.userType)} mr-2`}></i>
            {user.userType}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2">
          <div className="card-elevated">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Informations personnelles</h2>
              <p className="text-sm text-gray-600">Modifier les données de base de l'utilisateur</p>
            </div>

            <div className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-envelope mr-2 text-paiecash"></i>
                  Adresse email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input-field"
                  placeholder="email@exemple.com"
                />
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
                    placeholder="Prénom"
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
                    placeholder="Nom"
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

              {/* Type d'utilisateur */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-tag mr-2 text-paiecash"></i>
                  Type d'utilisateur
                </label>
                <select
                  value={formData.userType}
                  onChange={(e) => setFormData({...formData, userType: e.target.value})}
                  className="input-field"
                >
                  <option value="donor">Donateur</option>
                  <option value="player">Joueur</option>
                  <option value="club">Club</option>
                  <option value="federation">Fédération</option>
                  <option value="company">Société</option>
                </select>
              </div>

              {/* Switches */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      <i className="fas fa-check-circle mr-2 text-green-600"></i>
                      Email vérifié
                    </label>
                    <p className="text-xs text-gray-500">L'utilisateur a confirmé son adresse email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isVerified}
                      onChange={(e) => setFormData({...formData, isVerified: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-paiecash/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-paiecash"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      <i className="fas fa-user-check mr-2 text-blue-600"></i>
                      Compte actif
                    </label>
                    <p className="text-xs text-gray-500">L'utilisateur peut se connecter et utiliser la plateforme</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-paiecash/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-paiecash"></div>
                  </label>
                </div>
              </div>

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

        {/* Statistiques et sessions */}
        <div className="space-y-6">
          {/* Statistiques */}
          <div className="card-elevated">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sessions actives</span>
                <span className="font-semibold text-paiecash">{user._count.sessions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Vérifications email</span>
                <span className="font-semibold text-gray-900">{user._count.emailVerifications}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Réinitialisations mot de passe</span>
                <span className="font-semibold text-gray-900">{user._count.passwordResets}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-600">Membre depuis</span>
                <span className="font-semibold text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>

          {/* Sessions récentes */}
          <div className="card-elevated">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sessions récentes</h3>
            <div className="space-y-3">
              {user.sessions.length > 0 ? (
                user.sessions.map((session) => (
                  <div key={session.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-green-600">
                        <i className="fas fa-circle mr-1 text-xs"></i>
                        Active
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(session.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      <div className="flex items-center mb-1">
                        <i className="fas fa-map-marker-alt mr-2 w-3"></i>
                        {session.ipAddress || 'IP inconnue'}
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-desktop mr-2 w-3"></i>
                        <span className="truncate">
                          {session.userAgent?.split(' ')[0] || 'Navigateur inconnu'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-history text-2xl text-gray-400 mb-2"></i>
                  <p className="text-sm text-gray-500">Aucune session active</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}