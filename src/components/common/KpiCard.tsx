import type { LucideIcon } from 'lucide-react';

const tones = {
  neutral: 'bg-slate-100 text-slate-600',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-sky-50 text-sky-700',
  brand: 'bg-accent-soft text-accent-dark',
};

export function KpiCard({ label, value, icon: Icon, tone = 'neutral' }: { label: string; value: number | string; icon: LucideIcon; tone?: keyof typeof tones }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-panel">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-normal text-slate-950">{value}</p>
    </div>
  );
}
