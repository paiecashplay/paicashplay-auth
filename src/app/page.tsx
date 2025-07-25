import Logo from '@/components/ui/Logo';

export default function HomePage() {
  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <Logo size="md" />
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <div className="mb-8">
            <Logo size="xl" showText={false} className="justify-center" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Système d'Authentification
            <span className="text-paiecash block mt-2">PaieCashPlay</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Plateforme SSO sécurisée pour l'écosystème PaieCashPlay Fondation. 
            Connectez-vous une fois, accédez à toutes vos applications.
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-paiecash/10 rounded-full text-paiecash font-medium text-sm">
            <i className="fas fa-shield-alt mr-2"></i>
            OAuth 2.0 / OpenID Connect
          </div>
        </div>
        
        {/* Action Cards */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 mb-20">
          <div className="card-elevated group">
            <div className="text-center">
              <div className="w-24 h-24 primary-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-300">
                <i className="fas fa-sign-in-alt text-3xl text-white"></i>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Connexion</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Accédez à votre compte existant et profitez de l'authentification unique sur tout l'écosystème
              </p>
              <a href="/login" className="btn-primary inline-flex items-center">
                <i className="fas fa-arrow-right mr-2"></i>
                Se connecter
              </a>
            </div>
          </div>
          
          <div className="card-elevated group">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-300">
                <i className="fas fa-user-plus text-3xl text-white"></i>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Inscription</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Créez votre compte et rejoignez la communauté PaieCashPlay avec votre profil personnalisé
              </p>
              <a href="/signup" className="btn-primary inline-flex items-center">
                <i className="fas fa-arrow-right mr-2"></i>
                S'inscrire
              </a>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Fonctionnalités de la plateforme
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Une solution complète d'authentification pour tous vos besoins
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card text-center group hover:bg-white/90 transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-shield-alt text-3xl text-white"></i>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Sécurité Avancée</h4>
              <p className="text-gray-600 leading-relaxed">
                Authentification OAuth 2.0 / OpenID Connect avec chiffrement de bout en bout et protection multi-niveaux
              </p>
            </div>
            
            <div className="glass-card text-center group hover:bg-white/90 transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-users text-3xl text-white"></i>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Multi-Comptes</h4>
              <p className="text-gray-600 leading-relaxed">
                Support complet des comptes Donateur, Fédération, Club et Joueur avec profils personnalisés
              </p>
            </div>
            
            <div className="glass-card text-center group hover:bg-white/90 transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-sync-alt text-3xl text-white"></i>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">SSO Universel</h4>
              <p className="text-gray-600 leading-relaxed">
                Une seule connexion pour accéder à tout l'écosystème PaieCashPlay avec synchronisation temps réel
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-4xl mx-auto mt-20">
          <div className="card-elevated">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-paiecash mb-2">99.9%</div>
                <div className="text-gray-600">Disponibilité</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-paiecash mb-2">&lt;100ms</div>
                <div className="text-gray-600">Temps de réponse</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-paiecash mb-2">256-bit</div>
                <div className="text-gray-600">Chiffrement</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 mt-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <Logo size="sm" className="mb-4" />
              <p className="text-gray-400 max-w-md">
                Système d'authentification sécurisé pour l'écosystème PaieCashPlay Fondation
              </p>
            </div>
            <div className="text-center md:text-right">
              <div className="flex items-center justify-center md:justify-end space-x-4 mb-4">
                <span className="inline-flex items-center px-3 py-1 bg-green-900/50 rounded-full text-green-400 text-sm">
                  <i className="fas fa-check-circle mr-2"></i>
                  Système Opérationnel
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-2">
                OAuth 2.0 / OpenID Connect • Sécurisé • Fiable
              </p>
              <p className="text-gray-500 text-xs">
                © 2024 PaieCashPlay Fondation. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}