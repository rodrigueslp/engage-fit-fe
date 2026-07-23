import { Activity, BarChart3, CreditCard, Dumbbell, Gift, MessageCircle, RefreshCw, Settings, ShieldCheck, Target, Upload, Users } from 'lucide-react';
import type { PageKey } from '../../app/App';
import type { Capabilities } from '../../features/api/types';

export type NavItem = { key: PageKey; label: string; icon: typeof BarChart3; group: string };

export const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3, group: 'Visão geral' },
  { key: 'campaigns', label: 'Campanhas', icon: Target, group: 'Operação' },
  { key: 'rewards', label: 'Brindes', icon: Gift, group: 'Operação' },
  { key: 'students', label: 'Alunos', icon: Users, group: 'Operação' },
  { key: 'checkins', label: 'Check-ins', icon: Activity, group: 'Operação' },
  { key: 'imports', label: 'Importações', icon: Upload, group: 'Operação' },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, group: 'Engajamento' },
  { key: 'automation', label: 'Automação', icon: RefreshCw, group: 'Engajamento' },
  { key: 'reports', label: 'Relatórios', icon: Dumbbell, group: 'Gestão' },
  { key: 'settings', label: 'Configurações', icon: Settings, group: 'Gestão' },
  { key: 'billing', label: 'Plano e cobranças', icon: CreditCard, group: 'Gestão' },
];

export const adminNavItems: NavItem[] = [
  { key: 'admin-messaging', label: 'Administração', icon: ShieldCheck, group: 'Plataforma' },
  { key: 'admin-billing', label: 'Financeiro', icon: CreditCard, group: 'Plataforma' },
];

export function navItemsForRole(role: string | undefined, capabilities: Capabilities) {
  const items = role === 'PLATFORM_ADMIN' ? adminNavItems : navItems;
  return items.filter((item) => {
    if (item.key === 'whatsapp') return capabilities.whatsapp;
    if (item.key === 'automation') return capabilities.automation;
    if (item.key === 'email') return capabilities.email;
    if (item.key === 'workouts') return capabilities.workouts;
    if (item.key === 'billing' || item.key === 'admin-billing') return capabilities.billing;
    return true;
  });
}
