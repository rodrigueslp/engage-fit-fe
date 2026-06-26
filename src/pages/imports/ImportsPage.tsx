import { Upload } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { api } from '../../features/api/endpoints';
import type { ImportHistory, Source } from '../../features/api/types';

export function ImportsPage() {
  const [imports, setImports] = useState<ImportHistory[]>([]);
  const [source, setSource] = useState<Source>('wellhub');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api
      .imports()
      .then(setImports)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar importacoes'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    const data = new FormData();
    data.append('source', source);
    data.append('file', file);
    setError('');
    try {
      await api.uploadImport(data);
      setFile(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar arquivo');
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <Card>
        <CardHeader>
          <h1 className="text-base font-bold text-slate-950">Importar check-ins</h1>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={submit}>
            {error && <ErrorState message={error} />}
            <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={source} onChange={(event) => setSource(event.target.value as Source)}>
              <option value="wellhub">Wellhub</option>
              <option value="totalpass">TotalPass</option>
            </select>
            <input className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:text-sm file:font-semibold file:text-accent-dark" type="file" accept=".csv,.xlsx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <Button disabled={!file}>
              <Upload className="h-4 w-4" />
              Enviar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-bold text-slate-950">Historico</h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState />
          ) : imports.length === 0 ? (
            <EmptyState message="Nenhuma importacao realizada" />
          ) : (
            <div className="divide-y divide-slate-100">
              {imports.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold text-slate-950">{item.filename}</p>
                    <p className="text-sm text-slate-500">{item.total_records} registros</p>
                  </div>
                  <StatusBadge value={item.source} label={item.source} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
