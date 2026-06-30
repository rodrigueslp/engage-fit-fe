import type { PageKey } from '../../app/App';
import { navItems } from './navItems';

export function Sidebar({ currentPage, onNavigate }: { currentPage: PageKey; onNavigate: (page: PageKey) => void }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-16 items-center border-b border-slate-200 px-5">
        <button type="button" className="rounded-md focus:outline-none focus:ring-2 focus:ring-accent" onClick={() => onNavigate('dashboard')} aria-label="Ir para o dashboard">
          <img src="/engagefit-logo-cropped.png" alt="EngageFit" className="h-11 w-auto" />
        </button>
      </div>
      <nav className="space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.key;
          return (
            <button
              key={item.key}
              className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition ${
                active ? 'bg-accent-soft text-accent-dark' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
              onClick={() => onNavigate(item.key)}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
