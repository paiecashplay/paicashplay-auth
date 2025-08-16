'use client';

import Logo from '@/components/ui/Logo';

const USER_TYPES = [
  { value: 'donor', label: 'Donateur', icon: 'fas fa-heart', color: 'text-red-600', bg: 'bg-red-100', desc: 'Soutenir les projets' },
  { value: 'player', label: 'Licencié', icon: 'fas fa-running', color: 'text-blue-600', bg: 'bg-blue-100', desc: 'Profil sportif' },
  { value: 'club', label: 'Club', icon: 'fas fa-users', color: 'text-green-600', bg: 'bg-green-100', desc: 'Gestion d\'équipe' },
  { value: 'federation', label: 'Fédération', icon: 'fas fa-flag', color: 'text-purple-600', bg: 'bg-purple-100', desc: 'Administration' },
  { value: 'company', label: 'Société', icon: 'fas fa-briefcase', color: 'text-indigo-600', bg: 'bg-indigo-100', desc: 'Partenariats' },
  { value: 'affiliate', label: 'Ambassadeur', icon: 'fas fa-star', color: 'text-yellow-600', bg: 'bg-yellow-100', desc: 'Promotion' },
  { value: 'academy', label: 'Académie', icon: 'fas fa-graduation-cap', color: 'text-emerald-600', bg: 'bg-emerald-100', desc: 'Formation' },
  { value: 'school', label: 'École', icon: 'fas fa-school', color: 'text-teal-600', bg: 'bg-teal-100', desc: 'Éducation' },
  { value: 'association', label: 'Association', icon: 'fas fa-handshake', color: 'text-orange-600', bg: 'bg-orange-100', desc: 'Organisation' }
];

export default function SignupLinksPage() {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="min-h-screen gradient-bg py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Logo size="lg" className="justify-center mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Liens d'inscription directs</h1>
          <p className="text-gray-600 text-lg">
            Utilisez ces liens pour diriger vos utilisateurs vers l'inscription avec un type de compte pré-sélectionné
          </p>
        </div>

        {/* Links Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {USER_TYPES.map((type) => (
            <div key={type.value} className="card-elevated">
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${type.bg} shadow-sm`}>
                  <i className={`${type.icon} text-lg ${type.color}`}></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{type.label}</h3>
                  <p className="text-sm text-gray-500">{type.desc}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Lien d'inscription :</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <code className="text-xs text-gray-800 break-all">
                      {baseUrl}/signup?type={type.value}
                    </code>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${baseUrl}/signup?type=${type.value}`);
                    }}
                    className="flex-1 btn-secondary text-sm py-2"
                  >
                    <i className="fas fa-copy mr-2"></i>
                    Copier
                  </button>
                  
                  <a
                    href={`/signup?type=${type.value}`}
                    target="_blank"
                    className="flex-1 btn-primary text-sm py-2 text-center"
                  >
                    <i className="fas fa-external-link-alt mr-2"></i>
                    Tester
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <a href="/signup" className="text-paiecash hover:text-paiecash-dark font-medium">
            ← Retour à l'inscription normale
          </a>
        </div>
      </div>
    </div>
  );
}