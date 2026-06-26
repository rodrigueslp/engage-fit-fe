import { LogOut, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import type { Box, CurrentUser } from '../../features/api/types';

export function Header({ box, user, onImport, onLogout }: { box?: Box; user?: CurrentUser; onImport: () => void; onLogout: () => void }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div>
        <p className="text-sm font-semibold text-slate-950">{box?.name ?? 'EngageFit'}</p>
        <p className="text-xs text-slate-500">{user?.email ?? 'owner'}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onImport}>
          <Upload className="h-4 w-4" />
          Importar
        </Button>
        <Button variant="ghost" onClick={onLogout} aria-label="Sair">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
