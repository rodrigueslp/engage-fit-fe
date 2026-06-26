import type { LucideIcon } from 'lucide-react';

export function KpiCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: LucideIcon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-soft text-accent-dark">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-normal text-slate-950">{value}</p>
    </div>
  );
}
