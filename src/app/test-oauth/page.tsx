'use client';

export default function TestOAuthPage() {
  const testOAuth = () => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: 'client_1754642620743_6rcavl83k', // Client ID réel
      redirect_uri: 'http://localhost:3000/dashboard', // URL autorisée
      scope: 'openid profile email',
      state: 'test_state_123'
    });
    
    console.log('🔍 Testing OAuth with params:', params.toString());
    window.location.href = `/api/auth/authorize?${params.toString()}`;
  };
  
  const testOAuthLoggedOut = async () => {
    // D'abord se déconnecter
    await fetch('/api/auth/logout', { method: 'POST' });
    
    // Puis tester OAuth
    setTimeout(() => {
      testOAuth();
    }, 500);
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <div className="card-elevated w-full max-w-md">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Test OAuth Flow</h1>
          <div className="space-y-4">
            <button 
              onClick={testOAuth}
              className="btn-primary w-full"
            >
              🔍 Test OAuth (Utilisateur connecté)
            </button>
            
            <button 
              onClick={testOAuthLoggedOut}
              className="btn-secondary w-full"
            >
              🔍 Test OAuth (Utilisateur déconnecté)
            </button>
            
            <button 
              onClick={() => window.location.href = '/login'}
              className="btn-outline w-full"
            >
              🔑 Aller au Login Normal
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-4 space-y-1">
            <p><strong>Client:</strong> client_1754642620743_6rcavl83k</p>
            <p><strong>Redirect:</strong> http://localhost:3000/dashboard</p>
            <p><strong>Test 1:</strong> Utilisateur connecté → Redirection directe</p>
            <p><strong>Test 2:</strong> Utilisateur déconnecté → Login + OAuth</p>
          </div>
        </div>
      </div>
    </div>
  );
}