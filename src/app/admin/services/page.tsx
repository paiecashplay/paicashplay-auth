'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AVAILABLE_SERVICES } from '@/lib/service-admin';

export default function AdminServices() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleServiceRedirect = async (serviceKey: string) => {
    setLoading(serviceKey);
    
    try {
      const response = await fetch('/api/admin/service-redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceKey })
      });

      const data = await response.json();

      if (response.ok) {
        window.open(data.redirectUrl, '_blank');
      } else {
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      alert('Erreur de connexion au service');
    } finally {
      setLoading(null);
    }
  };

  const getServiceIcon = (serviceKey: string) => {
    switch (serviceKey) {
      case 'paiecash-main': return 'fas fa-home';
      case 'paiecash-api': return 'fas fa-code';
      case 'paiecash-analytics': return 'fas fa-chart-bar';
      default: return 'fas fa-external-link-alt';
    }
  };

  const getServiceColor = (serviceKey: string) => {
    switch (serviceKey) {
      case 'paiecash-main': return 'text-blue-600 bg-blue-100';
      case 'paiecash-api': return 'text-green-600 bg-green-100';
      case 'paiecash-analytics': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
            <i className="fas fa-external-link-alt text-indigo-600 text-xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Services Externes</h1>
            <p className="text-gray-600">Administrer les services PaieCashPlay</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(AVAILABLE_SERVICES).map(([serviceKey, service]) => (
          <div key={serviceKey} className="card-elevated">
            <div className="flex items-center mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${getServiceColor(serviceKey)}`}>
                <i className={`${getServiceIcon(serviceKey)} text-xl`}></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                <p className="text-sm text-gray-500">{service.url}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-shield-alt mr-2"></i>
                <span>Authentification requise</span>
              </div>
              
              <button
                onClick={() => handleServiceRedirect(serviceKey)}
                disabled={loading === serviceKey}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading === serviceKey ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Connexion...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt mr-2"></i>
                    Administrer
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 card-elevated">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
            <i className="fas fa-info-circle text-yellow-600"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Comment ça fonctionne</h2>
        </div>
        <div className="space-y-3 text-gray-600">
          <p>• Cliquez sur "Administrer" pour générer un token d'authentification sécurisé</p>
          <p>• Vous serez redirigé vers l'interface d'administration du service</p>
          <p>• Le token expire automatiquement après 1 heure pour la sécurité</p>
          <p>• Vos actions sont enregistrées dans les logs d'audit</p>
        </div>
      </div>
    </AdminLayout>
  );
}