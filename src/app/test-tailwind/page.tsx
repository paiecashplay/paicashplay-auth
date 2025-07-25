import Logo from '@/components/ui/Logo';

export default function TestTailwind() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Logo size="xl" className="justify-center mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Test Design PaieCashPlay</h1>
          <p className="text-lg text-gray-600">Vérification de la charte graphique</p>
        </div>

        {/* Color Palette */}
        <div className="card mb-8">
          <h2 className="text-2xl font-semibold mb-6">Palette de Couleurs</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-paiecash rounded-lg mx-auto mb-2"></div>
              <p className="text-sm font-medium">Primary</p>
              <p className="text-xs text-gray-500">rgb(0,106,52)</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-paiecash-light rounded-lg mx-auto mb-2"></div>
              <p className="text-sm font-medium">Light</p>
              <p className="text-xs text-gray-500">rgb(0,126,62)</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-paiecash-dark rounded-lg mx-auto mb-2"></div>
              <p className="text-sm font-medium">Dark</p>
              <p className="text-xs text-gray-500">rgb(0,86,42)</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-lg mx-auto mb-2"></div>
              <p className="text-sm font-medium">Light Tint</p>
              <p className="text-xs text-gray-500">primary-100</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="card mb-8">
          <h2 className="text-2xl font-semibold mb-6">Boutons</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <button className="btn-primary">
                <i className="fas fa-check mr-2"></i>
                Bouton Principal
              </button>
              <button className="btn-secondary">
                <i className="fas fa-times mr-2"></i>
                Bouton Secondaire
              </button>
            </div>
          </div>
        </div>

        {/* Form Elements */}
        <div className="card mb-8">
          <h2 className="text-2xl font-semibold mb-6">Éléments de Formulaire</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Champ de saisie
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Tapez quelque chose..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zone de texte
              </label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Votre message..."
              ></textarea>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="card mb-8">
          <h2 className="text-2xl font-semibold mb-6">Badges</h2>
          <div className="flex flex-wrap gap-3">
            <span className="badge-success">
              <i className="fas fa-check mr-1"></i>
              Succès
            </span>
            <span className="badge-warning">
              <i className="fas fa-exclamation-triangle mr-1"></i>
              Attention
            </span>
            <span className="badge-error">
              <i className="fas fa-times mr-1"></i>
              Erreur
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-xl font-semibold mb-3">Card Example 1</h3>
            <p className="text-gray-600 mb-4">
              Ceci est un exemple de carte avec du contenu et des actions.
            </p>
            <button className="btn-primary">Action</button>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold mb-3">Card Example 2</h3>
            <p className="text-gray-600 mb-4">
              Une autre carte pour montrer la cohérence du design.
            </p>
            <button className="btn-secondary">Action Secondaire</button>
          </div>
        </div>
      </div>
    </div>
  );
}