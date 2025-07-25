import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ensurePrismaReady } from '@/lib/prisma';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PaieCashPlay Auth',
  description: 'Système d\'authentification SSO pour PaieCashPlay Fondation',
};

// Initialize database on app start
ensurePrismaReady();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}