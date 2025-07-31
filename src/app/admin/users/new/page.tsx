'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/components/ui/Toast';

export default function NewUserPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    country: 'FR',
    userType: 'donor',
    isVerified: false,
    isActive: true
  });
  
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Succès', 'Utilisateur créé avec succès');
        router.push('/admin/users');
      } else {
        toast.error('Erreur', data.error || 'Impossible de créer l\'utilisateur');
      }
    } catch (error) {
      toast.error('Erreur de connexion', 'Impossible de créer l\'utilisateur');
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-900">Créer un utilisateur</h1>
            <p className="text-gray-600">Ajouter un nouveau compte utilisateur à la plateforme</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl">
        <div className="card-elevated">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type d'utilisateur */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <i className="fas fa-tag mr-2 text-paiecash"></i>
                Type d'utilisateur
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { value: 'donor', label: 'Donateur', icon: 'fas fa-heart', color: 'text-red-600' },
                  { value: 'player', label: 'Joueur', icon: 'fas fa-running', color: 'text-blue-600' },
                  { value: 'club', label: 'Club', icon: 'fas fa-users', color: 'text-green-600' },
                  { value: 'federation', label: 'Fédération', icon: 'fas fa-flag', color: 'text-purple-600' },
                  { value: 'company', label: 'Société', icon: 'fas fa-briefcase', color: 'text-indigo-600' }
                ].map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
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
                      onChange={(e) => setFormData({...formData, userType: e.target.value})}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <i className={`${type.icon} ${type.color} mr-3`}></i>
                      <span className="font-medium text-gray-900">{type.label}</span>
                    </div>
                    {formData.userType === type.value && (
                      <i className="fas fa-check-circle text-paiecash absolute top-2 right-2"></i>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Email et mot de passe */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-envelope mr-2 text-paiecash"></i>
                  Adresse email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input-field"
                  placeholder="email@exemple.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-lock mr-2 text-paiecash"></i>
                  Mot de passe *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="input-field"
                  placeholder="Minimum 8 caractères"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {/* Nom et prénom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-user mr-2 text-paiecash"></i>
                  Prénom *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="input-field"
                  placeholder="Prénom"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-user mr-2 text-paiecash"></i>
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="input-field"
                  placeholder="Nom"
                  required
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

            {/* Options */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    <i className="fas fa-check-circle mr-2 text-green-600"></i>
                    Email vérifié
                  </label>
                  <p className="text-xs text-gray-500">L'utilisateur n'aura pas besoin de vérifier son email</p>
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
                  <p className="text-xs text-gray-500">L'utilisateur peut se connecter immédiatement</p>
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

            {/* Boutons */}
            <div className="flex space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/admin/users')}
                className="flex-1 btn-secondary"
              >
                <i className="fas fa-times mr-2"></i>
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Création...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus mr-2"></i>
                    Créer l'utilisateur
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}