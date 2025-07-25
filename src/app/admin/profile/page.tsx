'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/components/ui/Toast';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminProfilePage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const toast = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/admin/profile');
      if (response.ok) {
        const data = await response.json();
        setAdmin(data.admin);
        setFormData({
          username: data.admin.username,
          email: data.admin.email,
          fullName: data.admin.fullName
        });
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Profil mis à jour', 'Vos informations ont été sauvegardées');
        setEditing(false);
        fetchProfile();
      } else {
        const errorData = await response.json();
        toast.error('Erreur', errorData.error || 'Impossible de mettre à jour le profil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erreur', 'Erreur de connexion');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        toast.success('Mot de passe modifié', 'Votre mot de passe a été mis à jour');
        setChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const errorData = await response.json();
        toast.error('Erreur', errorData.error || 'Impossible de changer le mot de passe');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Erreur', 'Erreur de connexion');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
          <p className="text-gray-500 mt-2">Chargement du profil...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Profile Card */}
        <div className="card-elevated">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-paiecash/10 rounded-xl flex items-center justify-center mr-4">
                <i className="fas fa-user-shield text-paiecash text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profil Administrateur</h1>
                <p className="text-gray-600">Gérez vos informations personnelles</p>
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
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={!editing}
                  className={`input-field ${!editing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={!editing}
                  className={`input-field ${!editing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!editing}
                  className={`input-field ${!editing ? 'bg-gray-50' : ''}`}
                />
              </div>
            </div>

            {/* Account Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">Informations du compte</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    admin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {admin.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dernière connexion
                </label>
                <input
                  type="text"
                  value={admin.lastLogin ? new Date(admin.lastLogin).toLocaleString('fr-FR') : 'Jamais'}
                  disabled
                  className="input-field bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Membre depuis
                </label>
                <input
                  type="text"
                  value={new Date(admin.createdAt).toLocaleDateString('fr-FR')}
                  disabled
                  className="input-field bg-gray-50"
                />
              </div>
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

        {/* Security Card */}
        <div className="card-elevated">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Sécurité</h2>
              <p className="text-gray-600">Gérez votre mot de passe</p>
            </div>
            <button
              onClick={() => setChangingPassword(!changingPassword)}
              className={`btn-${changingPassword ? 'secondary' : 'primary'}`}
            >
              <i className={`fas fa-${changingPassword ? 'times' : 'key'} mr-2`}></i>
              {changingPassword ? 'Annuler' : 'Changer le mot de passe'}
            </button>
          </div>

          {changingPassword && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="input-field"
                  placeholder="Entrez votre mot de passe actuel"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="input-field"
                    placeholder="Minimum 8 caractères"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="input-field"
                    placeholder="Répétez le nouveau mot de passe"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setChangingPassword(false)}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={handlePasswordChange}
                  className="btn-primary"
                >
                  <i className="fas fa-key mr-2"></i>
                  Changer le mot de passe
                </button>
              </div>
            </div>
          )}

          {!changingPassword && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <i className="fas fa-shield-alt text-green-500 mr-3"></i>
                <div>
                  <p className="font-medium text-gray-900">Mot de passe sécurisé</p>
                  <p className="text-sm text-gray-600">
                    Dernière modification : {new Date(admin.updatedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}