'use client';

console.log('LAYOUT COMPRAS CARREGADO');

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { Sidebar } from '@/components/layout/sidebar';
import { LembretesProvider } from '@/components/lembretes/LembretesContext';
import { LembretesNotification } from '@/components/lembretes/LembretesNotification';

export default function ComprasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const user = localStorage.getItem('pcp_user');

    console.log('====================');
    console.log('Usuário atual:', user);
    console.log('Path atual:', pathname);

    const admins = [
      'pedro.queiroz',
      'debora.mota',
      'francisco.edson',
    ];

    const isAdmin = admins.includes(user || '');

    console.log('É admin?', isAdmin);

    if (!isAdmin) {
      const allowedRoutes = [
        '/compras/cronograma',
        '/compras/formularios',
      ];

      const hasAccess = allowedRoutes.some((route) =>
        pathname.startsWith(route)
      );

      console.log('Tem acesso?', hasAccess);

      if (!hasAccess) {
        console.log('REDIRECIONANDO...');
        router.push('/compras/cronograma');
      }
    }
  }, [pathname, router]);

  return (
    <LembretesProvider>
      <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-50/50">
          {children}
        </main>
      </div>
      <LembretesNotification />
    </LembretesProvider>
  );
}
