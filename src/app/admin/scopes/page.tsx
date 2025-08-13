'use client';

import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminScopes() {
  const scopes = [
    {
      category: 'Authentification de base',
      items: [
        { id: 'openid', name: 'OpenID Connect', description: 'Authentification de base selon le standard OpenID Connect', required: true },
        { id: 'profile', name: 'Profil utilisateur', description: 'Accès aux informations de profil (nom, prénom, etc.)', required: false },
        { id: 'email', name: 'Adresse email', description: 'Accès à l\'adresse email de l\'utilisateur', required: false }
      ]
    },
    {
      category: 'Gestion des utilisateurs',
      items: [
        { id: 'users:read', name: 'Lecture utilisateurs', description: 'Lister et consulter les utilisateurs du système', required: false },
        { id: 'users:write', name: 'Écriture utilisateurs', description: 'Créer, modifier et supprimer des utilisateurs', required: false }
      ]
    },
    {
      category: 'Gestion des clubs',
      items: [
        { id: 'clubs:read', name: 'Lecture clubs', description: 'Lister et consulter les clubs enregistrés', required: false },
        { id: 'clubs:write', name: 'Écriture clubs', description: 'Créer, modifier et supprimer des clubs', required: false },
        { id: 'clubs:members', name: 'Membres des clubs', description: 'Accès aux listes de membres des clubs', required: false }
      ]
    },
    {
      category: 'Gestion des joueurs',
      items: [
        { id: 'players:read', name: 'Lecture joueurs', description: 'Lister et consulter les joueurs licenciés', required: false },
        { id: 'players:write', name: 'Écriture joueurs', description: 'Créer, modifier et supprimer des joueurs', required: false }
      ]
    },
    {
      category: 'Gestion des fédérations',
      items: [
        { id: 'federations:read', name: 'Lecture fédérations', description: 'Lister et consulter les fédérations nationales', required: false }
      ]
    },
    {
      category: 'Gestion des ambassadeurs',
      items: [
        { id: 'ambassadors:read', name: 'Lecture ambassadeurs', description: 'Lister et consulter les ambassadeurs de la plateforme', required: false },
        { id: 'ambassadors:write', name: 'Écriture ambassadeurs', description: 'Créer, modifier et supprimer des ambassadeurs', required: false }
      ]
    }
  ];

  const useCases = [
    {
      title: 'Application de gestion de club',
      description: 'Une application permettant à un club de gérer ses licenciés',
      scopes: ['openid', 'profile', 'email', 'clubs:read', 'clubs:members', 'players:read', 'players:write'],
      example: 'Un club peut lister ses joueurs et en ajouter de nouveaux'
    },
    {
      title: 'Plateforme fédérale',
      description: 'Une plateforme nationale pour gérer tous les clubs et joueurs',
      scopes: ['openid', 'profile', 'email', 'users:read', 'clubs:read', 'clubs:write', 'players:read', 'federations:read'],
      example: 'Une fédération peut voir tous les clubs de son pays et leurs statistiques'
    },
    {
      title: 'Application mobile joueur',
      description: 'Une app mobile pour que les joueurs consultent leurs informations',
      scopes: ['openid', 'profile', 'email', 'players:read'],
      example: 'Un joueur peut voir ses informations personnelles et son club'
    },
    {
      title: 'Système de statistiques',
      description: 'Une plateforme d\'analyse des données de football',
      scopes: ['openid', 'clubs:read', 'players:read', 'federations:read'],
      example: 'Analyse des tendances et statistiques par pays/région'
    },
    {
      title: 'Plateforme d\'ambassadeurs',
      description: 'Une application pour gérer et consulter les ambassadeurs',
      scopes: ['openid', 'profile', 'email', 'ambassadors:read'],
      example: 'Consultation de la liste des ambassadeurs actifs et leurs informations'
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scopes OAuth</h1>
            <p className="text-gray-600 mt-1">
              Documentation des permissions disponibles pour les applications OAuth
            </p>
          </div>
          <div className="inline-flex items-center px-3 py-1 bg-blue-100 rounded-full text-blue-800 text-sm">
            <i className="fas fa-shield-alt mr-2"></i>
            OAuth 2.0 Scopes
          </div>
        </div>

        {/* Scopes Documentation */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="card-elevated">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  <i className="fas fa-key mr-2 text-paiecash"></i>
                  Scopes disponibles
                </h2>
                
                <div className="space-y-6">
                  {scopes.map((category, categoryIndex) => (
                    <div key={categoryIndex}>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                        {category.category}
                      </h3>
                      <div className="space-y-3">
                        {category.items.map((scope) => (
                          <div key={scope.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center">
                                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                                  {scope.id}
                                </code>
                                {scope.required && (
                                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Requis
                                  </span>
                                )}
                              </div>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">{scope.name}</h4>
                            <p className="text-sm text-gray-600">{scope.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-elevated">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  <i className="fas fa-lightbulb mr-2 text-yellow-500"></i>
                  Cas d'usage
                </h2>
                
                <div className="space-y-6">
                  {useCases.map((useCase, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{useCase.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{useCase.description}</p>
                      
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-500 mb-2">SCOPES REQUIS :</div>
                        <div className="flex flex-wrap gap-1">
                          {useCase.scopes.map((scope) => (
                            <span key={scope} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-paiecash/10 text-paiecash border border-paiecash/20">
                              {scope}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-xs font-medium text-gray-500 mb-1">EXEMPLE :</div>
                        <div className="text-sm text-gray-700">{useCase.example}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card-elevated">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  <i className="fas fa-info-circle mr-2 text-blue-500"></i>
                  Bonnes pratiques
                </h2>
                
                <div className="space-y-4 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-gray-900">Principe du moindre privilège</div>
                      <div className="text-gray-600">Ne demandez que les scopes strictement nécessaires à votre application</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-gray-900">Scopes de base</div>
                      <div className="text-gray-600">Toujours inclure <code className="bg-gray-100 px-1 rounded">openid</code> pour l'authentification OAuth</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-gray-900">Scopes sensibles</div>
                      <div className="text-gray-600">Les scopes <code className="bg-gray-100 px-1 rounded">:write</code> permettent la modification des données</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-gray-900">Validation</div>
                      <div className="text-gray-600">Tous les scopes sont validés côté serveur lors de l'autorisation</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}