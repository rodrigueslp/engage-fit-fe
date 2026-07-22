import { LogOut, Menu, Upload, X } from 'lucide-react';
import { useState } from 'react';
import type { PageKey } from '../../app/App';
import type { Box, Capabilities, CurrentUser } from '../../features/api/types';
import { Button } from '../ui/button';
import { navItemsForRole } from './navItems';

export function Header({
  currentPage,
  box,
  user,
  onNavigate,
  onImport,
  onLogout,
  capabilities,
}: {
  currentPage: PageKey;
  box?: Box;
  user?: CurrentUser;
  onNavigate: (page: PageKey) => void;
  onImport: () => void;
  onLogout: () => void;
  capabilities: Capabilities;
}) {
  const [open, setOpen] = useState(false);
  const navItems = navItemsForRole(user?.role, capabilities);
  const groups = Array.from(new Set(navItems.map((item) => item.group)));

  function navigate(page: PageKey) {
    onNavigate(page);
    setOpen(false);
  }

  return (
    <>
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" className="px-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">{box?.name ?? 'EngageFit'}</p>
            <p className="truncate text-xs text-slate-500">{user?.email ?? 'owner'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user?.role !== 'PLATFORM_ADMIN' && (
            <Button variant="secondary" onClick={onImport}>
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Importar</span>
            </Button>
          )}
          <Button variant="ghost" onClick={onLogout} aria-label="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
      {open && <div className="fixed inset-0 z-50 lg:hidden">
        <button type="button" className="absolute inset-0 bg-slate-950/35" aria-label="Fechar menu" onClick={() => setOpen(false)} />
        <div className="absolute inset-y-0 left-0 flex w-[min(88vw,320px)] flex-col bg-white shadow-2xl">
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
            <img src="/engagefit-logo-cropped.png" alt="EngageFit" className="h-10 w-auto" />
            <Button variant="ghost" className="px-2" onClick={() => setOpen(false)} aria-label="Fechar menu"><X className="h-5 w-5" /></Button>
          </div>
          <nav className="flex-1 space-y-5 overflow-y-auto p-3" aria-label="Navegação principal">
          {groups.map((group) => <div key={group}>
            <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">{group}</p>
            <div className="space-y-1">{navItems.filter((item) => item.group === group).map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.key;
            return (
              <button
                key={item.key}
                type="button"
                className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold ${
                  active ? 'bg-accent-soft text-accent-dark' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
                onClick={() => navigate(item.key)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}</div>
          </div>)}
          </nav>
          <div className="border-t border-slate-200 p-3">
            <Button variant="ghost" className="w-full justify-start text-slate-700" onClick={onLogout}><LogOut className="h-4 w-4" />Sair da conta</Button>
          </div>
        </div>
      </div>}
    </>
  );
}
