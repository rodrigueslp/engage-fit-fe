import { AlertCircle, Loader2 } from 'lucide-react';

export function LoadingState({ label = 'Carregando' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <AlertCircle className="h-4 w-4" />
      {message}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="rounded-md border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">{message}</div>;
}
