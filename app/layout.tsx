import type {Metadata} from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'PCP Compras',
  description: 'Sistema de gestão de compras.',
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
