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

  function navigate(page: PageKey) {
    onNavigate(page);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" className="px-2 lg:hidden" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Fechar menu' : 'Abrir menu'}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
      {open && (
        <nav className="grid gap-1 border-t border-slate-100 bg-white p-3 sm:grid-cols-2 lg:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.key;
            return (
              <button
                key={item.key}
                type="button"
                className={`flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm font-semibold ${
                  active ? 'bg-accent-soft text-accent-dark' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
                onClick={() => navigate(item.key)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
