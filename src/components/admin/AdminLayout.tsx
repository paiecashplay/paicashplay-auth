'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const MENU_ITEMS = [
  { href: '/admin/dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard', description: 'Vue d\'ensemble' },
  { href: '/admin/users', icon: 'fas fa-users', label: 'Utilisateurs', description: 'Gestion des comptes' },
  { href: '/admin/clients', icon: 'fas fa-key', label: 'Clients OAuth', description: 'Applications tierces' },
  { href: '/admin/scopes', icon: 'fas fa-shield-alt', label: 'Scopes OAuth', description: 'Permissions disponibles' },
  { href: '/admin/social-providers', icon: 'fas fa-plug', label: 'Providers Sociaux', description: 'Connexions sociales' },
  { href: '/admin/logs', icon: 'fas fa-clipboard-list', label: 'Logs', description: 'Historique système' },
  { href: '/admin/profile', icon: 'fas fa-user-cog', label: 'Mon Profil', description: 'Profil administrateur' },
  { href: '/admin/settings', icon: 'fas fa-cog', label: 'Configuration', description: 'Paramètres système' }
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const currentPage = MENU_ITEMS.find(item => item.href === pathname);

  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');
      const item = MENU_ITEMS.find(item => item.href === href);
      return {
        href,
        label: item?.label || segment.charAt(0).toUpperCase() + segment.slice(1),
        isLast: index === segments.length - 1
      };
    });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Logo size="sm" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {MENU_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-paiecash text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i className={`${item.icon} w-5 mr-3`}></i>
                <div>
                  <div>{item.label}</div>
                  <div className={`text-xs ${pathname === item.href ? 'text-white/80' : 'text-gray-500'}`}>
                    {item.description}
                  </div>
                </div>
              </a>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-200">
            <a href="/admin/profile" className="flex items-center mb-4 hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-paiecash/10 rounded-full flex items-center justify-center mr-3">
                <i className="fas fa-user-shield text-paiecash text-sm"></i>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Administrateur</div>
                <div className="text-xs text-gray-500">admin@paiecashplay.com</div>
              </div>
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <i className="fas fa-sign-out-alt mr-3"></i>
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Top Bar */}
        <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"
              >
                <i className="fas fa-bars text-xl"></i>
              </button>
              
              {/* Breadcrumbs */}
              <nav className="flex items-center space-x-2 text-sm">
                {getBreadcrumbs().map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center">
                    {index > 0 && <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>}
                    {crumb.isLast ? (
                      <span className="text-paiecash font-medium">{crumb.label}</span>
                    ) : (
                      <a href={crumb.href} className="text-gray-500 hover:text-gray-700">
                        {crumb.label}
                      </a>
                    )}
                  </div>
                ))}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="inline-flex items-center px-3 py-1 bg-green-100 rounded-full text-green-800 text-sm">
                <i className="fas fa-circle text-green-500 mr-2 text-xs"></i>
                Système actif
              </div>
              <a href="/" className="text-gray-500 hover:text-gray-700">
                <i className="fas fa-external-link-alt"></i>
              </a>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {/* Page Header */}
          {currentPage && (
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 primary-gradient rounded-xl flex items-center justify-center mr-4">
                  <i className={`${currentPage.icon} text-white text-xl`}></i>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{currentPage.label}</h1>
                  <p className="text-gray-600">{currentPage.description}</p>
                </div>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}