'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

interface SystemConfig {
  id: string;
  configKey: string;
  configValue: string;
  configType: string;
  description?: string;
  isEncrypted: boolean;
}

export default function SettingsManager() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('smtp');
  const toast = useToast();
  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: 587,
    user: '',
    password: '',
    secure: false,
    fromEmail: '',
    fromName: ''
  });
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null);

  useEffect(() => {
    loadConfigs();
    loadSmtpConfig();
  }, []);

  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/admin/configs');
      const data = await response.json();
      setConfigs(data.configs);
    } catch (error) {
      console.error('Error loading configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSmtpConfig = async () => {
    try {
      const response = await fetch('/api/admin/configs/smtp');
      const data = await response.json();
      setSmtpConfig(data.smtp);
    } catch (error) {
      console.error('Error loading SMTP config:', error);
    }
  };

  const updateConfig = async (key: string, value: string) => {
    try {
      await fetch('/api/admin/configs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      loadConfigs();
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const [smtpLoading, setSmtpLoading] = useState(false);

  const updateSmtpConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpLoading(true);
    try {
      const response = await fetch('/api/admin/configs/smtp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpConfig)
      });

      if (response.ok) {
        toast.success('Configuration SMTP', 'Configuration mise à jour avec succès');
        loadSmtpConfig();
      } else {
        toast.error('Erreur SMTP', 'Impossible de mettre à jour la configuration');
      }
    } catch (error) {
      console.error('Error updating SMTP config:', error);
    } finally {
      setSmtpLoading(false);
    }
  };

  const [testLoading, setTestLoading] = useState(false);

  const testSmtpConnection = async () => {
    setTestLoading(true);
    setTestEmailResult('Test en cours...');
    try {
      const response = await fetch('/api/admin/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: 'test@example.com' })
      });

      const data = await response.json();
      setTestEmailResult(response.ok ? 'Test réussi ✅' : `Erreur: ${data.error}`);
    } catch (error) {
      setTestEmailResult('Erreur de connexion ❌');
    } finally {
      setTestLoading(false);
    }
  };

  const tabs = [
    { id: 'smtp', label: 'Configuration SMTP', icon: 'fas fa-envelope' },
    { id: 'security', label: 'Sécurité', icon: 'fas fa-shield-alt' },
    { id: 'general', label: 'Général', icon: 'fas fa-cog' }
  ];

  if (loading) {
    return <div className="flex justify-center py-8">
      <i className="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
    </div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuration Système</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className={`${tab.icon} mr-2`}></i>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* SMTP Configuration */}
      {activeTab === 'smtp' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Configuration Email SMTP</h2>
          
          <form onSubmit={updateSmtpConfig} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serveur SMTP</label>
                <input
                  type="text"
                  value={smtpConfig.host}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="smtp.gmail.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                <input
                  type="number"
                  value={smtpConfig.port}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Utilisateur</label>
                <input
                  type="text"
                  value={smtpConfig.user}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="your-email@gmail.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={smtpConfig.password}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Mot de passe d'application"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email expéditeur</label>
                <input
                  type="email"
                  value={smtpConfig.fromEmail}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="noreply@paiecashplay.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom expéditeur</label>
                <input
                  type="text"
                  value={smtpConfig.fromName}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="PaieCashPlay Fondation"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="secure"
                checked={smtpConfig.secure}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, secure: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="secure" className="ml-2 text-sm text-gray-700">
                Connexion sécurisée (SSL/TLS)
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={smtpLoading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {smtpLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Sauvegarde...
                  </>
                ) : (
                  'Sauvegarder'
                )}
              </button>
              
              <button
                type="button"
                onClick={testSmtpConnection}
                disabled={testLoading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Test...
                  </>
                ) : (
                  'Tester la connexion'
                )}
              </button>
            </div>

            {testEmailResult && (
              <div className={`p-3 rounded ${
                testEmailResult.includes('✅') 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {testEmailResult}
              </div>
            )}
          </form>
        </div>
      )}

      {/* Security Configuration */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Configuration Sécurité</h2>
          
          <div className="space-y-4">
            {configs.filter(config => 
              ['jwt_secret', 'session_duration', 'max_login_attempts', 'password_min_length'].includes(config.configKey)
            ).map((config) => (
              <div key={config.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {config.description || config.configKey}
                </label>
                <div className="flex">
                  <input
                    type={config.configKey.includes('password') || config.configKey.includes('secret') ? 'password' : 'text'}
                    defaultValue={config.isEncrypted ? '' : config.configValue}
                    onBlur={(e) => updateConfig(config.configKey, e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-3 py-2"
                    placeholder={config.isEncrypted ? 'Valeur chiffrée' : ''}
                  />
                  {config.isEncrypted && (
                    <span className="ml-2 px-2 py-2 bg-yellow-100 text-yellow-800 text-xs rounded">
                      Chiffré
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Configuration */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Configuration Générale</h2>
          
          <div className="space-y-4">
            {configs.filter(config => 
              !['jwt_secret', 'session_duration', 'max_login_attempts', 'password_min_length', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_secure', 'from_email', 'from_name'].includes(config.configKey)
            ).map((config) => (
              <div key={config.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {config.description || config.configKey}
                </label>
                <input
                  type="text"
                  defaultValue={config.configValue}
                  onBlur={(e) => updateConfig(config.configKey, e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}