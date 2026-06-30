const styles: Record<string, string> = {
  wellhub: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  totalpass: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-500/15',
  warning: 'bg-orange-50 text-orange-700 ring-orange-600/15',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  achieved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  near: 'bg-orange-50 text-orange-700 ring-orange-600/15',
  open: 'bg-slate-100 text-slate-600 ring-slate-500/15',
  failed: 'bg-red-50 text-red-700 ring-red-600/15',
  running: 'bg-sky-50 text-sky-700 ring-sky-600/15',
};

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${styles[value] ?? styles.inactive}`}>
      {label ?? value}
    </span>
  );
}
