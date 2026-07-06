import { BarChart3, Dumbbell, Gift, Mail, MessageCircle, RefreshCw, Settings, Target, Upload, Users } from 'lucide-react';
import type { PageKey } from '../../app/App';

export const navItems: Array<{ key: PageKey; label: string; icon: typeof BarChart3 }> = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'campaigns', label: 'Campanhas', icon: Target },
  { key: 'rewards', label: 'Brindes', icon: Gift },
  { key: 'students', label: 'Alunos', icon: Users },
  { key: 'imports', label: 'Importações', icon: Upload },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { key: 'workouts', label: 'Treino do dia', icon: Dumbbell },
  { key: 'email', label: 'E-mail', icon: Mail },
  { key: 'automation', label: 'Automação', icon: RefreshCw },
  { key: 'reports', label: 'Relatórios', icon: Dumbbell },
  { key: 'settings', label: 'Configurações', icon: Settings },
];
