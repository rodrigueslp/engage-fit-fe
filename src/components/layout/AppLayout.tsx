import type { ReactNode } from 'react';
import type { PageKey } from '../../app/App';
import type { Box, CurrentUser } from '../../features/api/types';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function AppLayout({
  children,
  currentPage,
  onNavigate,
  box,
  user,
  onLogout,
}: {
  children: ReactNode;
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  box?: Box;
  user?: CurrentUser;
  onLogout: () => void;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <div className="min-w-0 flex-1">
        <Header currentPage={currentPage} box={box} user={user} onNavigate={onNavigate} onImport={() => onNavigate('imports')} onLogout={onLogout} />
        <main className="px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
