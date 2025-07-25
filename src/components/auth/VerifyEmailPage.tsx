'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Implement verification logic
    setTimeout(() => setLoading(false), 2000);
  };

  const resendCode = () => {
    // TODO: Implement resend logic
    console.log('Resending verification code...');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-blue-500 rounded mr-3"></div>
            <h1 className="text-xl font-bold text-gray-800">PaieCashPlay Fondation</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-envelope text-blue-500 text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Vérifiez votre email</h2>
            <p className="text-gray-600">
              Nous avons envoyé un code de vérification à<br />
              <span className="font-medium">votre@email.com</span>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Entrez le code de vérification
              </label>
              <div className="flex justify-center space-x-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || code.some(digit => !digit)}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Vérification...' : 'Vérifier'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Vous n'avez pas reçu le code ?
            </p>
            <button
              onClick={resendCode}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Renvoyer le code
            </button>
          </div>

          <div className="mt-8 text-center">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-500">
              ← Retour à la connexion
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}