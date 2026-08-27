'use client';

console.log('LAYOUT COMPRAS CARREGADO');

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUserRole } from '@/lib/roles';

import { Sidebar } from '@/components/layout/sidebar';
import { LembretesProvider } from '@/components/lembretes/LembretesContext';
import { LembretesNotification } from '@/components/lembretes/LembretesNotification';
import { CronogramaNotificationProvider } from '@/components/cronograma/CronogramaNotificationContext';
import { CronogramaNotificationUI } from '@/components/cronograma/CronogramaNotificationUI';
import { PendenciasNotification } from '@/components/PendenciasNotification';

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

    const role = getUserRole(user || '');
    const isLideranca = role === 'LIDERANCA';

    const admins = [
      'pedro.queiroz',
      'debora.mota',
      'francisco.edson',
    ];

    const isAdmin = admins.some(admin => user?.includes(admin));

    console.log('É admin?', isAdmin);

    if (!isAdmin) {
      let allowedRoutes = [
        '/compras/dashboard',
        '/compras/cronograma',
        '/compras/formularios',
        '/compras/insumos',
        '/compras/fornecedores/cronograma',
        '/compras/relatorios'
      ];

      if (isLideranca) {
        allowedRoutes = [
          '/compras/dashboard',
          '/compras/cronograma',
          '/compras/relatorios'
        ];
      } else if (role === 'REPORTS') {
        allowedRoutes = ['/compras/relatorios'];
      }

      const hasAccess = allowedRoutes.some((route) =>
        pathname.startsWith(route)
      );

      console.log('Tem acesso?', hasAccess);

      if (!hasAccess) {
        console.log('REDIRECIONANDO...');
        router.push(isLideranca ? '/compras/dashboard' : '/compras/dashboard');
      }
    }
  }, [pathname, router]);

  return (
    <LembretesProvider>
      <CronogramaNotificationProvider>
        <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-50/50">
            {children}
          </main>
        </div>
        <LembretesNotification />
        <PendenciasNotification />
        <CronogramaNotificationUI />
      </CronogramaNotificationProvider>
    </LembretesProvider>
  );
}
