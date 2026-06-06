import { Sidebar } from '@/components/layout/sidebar';
import { LembretesProvider } from '@/components/lembretes/LembretesContext';
import { LembretesNotification } from '@/components/lembretes/LembretesNotification';

export default function ComprasLayout({ children }: { children: React.ReactNode }) {
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
