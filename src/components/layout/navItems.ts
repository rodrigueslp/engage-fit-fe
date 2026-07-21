import { BarChart3, Dumbbell, Gift, MessageCircle, RefreshCw, Settings, ShieldCheck, Target, Upload, Users } from 'lucide-react';
import type { PageKey } from '../../app/App';
import type { Capabilities } from '../../features/api/types';

export const navItems: Array<{ key: PageKey; label: string; icon: typeof BarChart3 }> = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'campaigns', label: 'Campanhas', icon: Target },
  { key: 'rewards', label: 'Brindes', icon: Gift },
  { key: 'students', label: 'Alunos', icon: Users },
  { key: 'imports', label: 'Importações', icon: Upload },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { key: 'automation', label: 'Automação', icon: RefreshCw },
  { key: 'reports', label: 'Relatórios', icon: Dumbbell },
  { key: 'settings', label: 'Configurações', icon: Settings },
];

export const adminNavItems: Array<{ key: PageKey; label: string; icon: typeof BarChart3 }> = [
  { key: 'admin-messaging', label: 'Administração', icon: ShieldCheck },
];

export function navItemsForRole(role: string | undefined, capabilities: Capabilities) {
  const items = role === 'PLATFORM_ADMIN' ? adminNavItems : navItems;
  return items.filter((item) => {
    if (item.key === 'whatsapp') return capabilities.whatsapp;
    if (item.key === 'automation') return capabilities.automation;
    if (item.key === 'email') return capabilities.email;
    if (item.key === 'workouts') return capabilities.workouts;
    return true;
  });
}
