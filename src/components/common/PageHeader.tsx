import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-wide text-accent-dark">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-normal text-slate-950">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function InlineNotice({
  tone = 'success',
  children,
}: {
  tone?: 'success' | 'warning' | 'info';
  children: ReactNode;
}) {
  const tones = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
  };

  return <div className={`rounded-md border px-3 py-2 text-sm font-semibold ${tones[tone]}`}>{children}</div>;
}
