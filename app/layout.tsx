import type {Metadata} from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'PDR - Gestão de Compras',
  description: 'Sistema para centralizar e automatizar a gestão de compras e faturas.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning className="bg-white text-zinc-950 font-sans antialiased h-screen overflow-hidden">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
