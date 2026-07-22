import { CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastImport, setLastImport] = useState<ImportHistory>();

  function load() {
    setLoading(true);
    api
      .imports()
      .then(setImports)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar importações'))
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
    setLastImport(undefined);
    setSubmitting(true);
    try {
      const result = await api.uploadImport(data);
      setLastImport(result);
      setFile(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar arquivo');
    } finally { setSubmitting(false); }
  }

  function selectFile(nextFile?: File) {
    if (!nextFile) return;
    if (!/\.(csv|xlsx)$/i.test(nextFile.name)) {
      setError('Escolha um arquivo CSV ou XLSX.');
      return;
    }
    setError('');
    setFile(nextFile);
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Importações" eyebrow="Entrada de check-ins" description="Envie a planilha da plataforma e acompanhe o que foi processado em cada importação." />
      {error && <ErrorState message={error} />}
      {lastImport && <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">Importação concluída</p><p className="mt-1 text-sm text-emerald-800">{lastImport.students ?? 0} alunos e {lastImport.checkins ?? lastImport.total_records} check-ins processados.</p></div></div>}
      <div className="grid items-start gap-5 xl:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <h2 className="text-base font-bold text-slate-950">Nova importação</h2>
          <p className="mt-1 text-sm text-slate-500">Selecione a origem antes de enviar o arquivo.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Plataforma de origem">
              {(['wellhub', 'totalpass'] as Source[]).map((option) => <button key={option} type="button" role="radio" aria-checked={source === option} className={`min-h-11 rounded-lg border px-3 text-sm font-bold transition ${source === option ? 'border-accent bg-accent-soft text-accent-dark ring-1 ring-accent/20' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`} onClick={() => setSource(option)}>{option === 'wellhub' ? 'Wellhub' : 'TotalPass'}</button>)}
            </div>
            <label
              className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-accent hover:bg-accent-soft"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files[0]); }}
            >
              <input className="sr-only" type="file" accept=".csv,.xlsx" onChange={(event) => selectFile(event.target.files?.[0])} />
              <span className="rounded-xl bg-white p-3 text-accent shadow-sm"><FileSpreadsheet className="h-6 w-6" /></span>
              <span className="mt-3 text-sm font-bold text-slate-900">{file ? file.name : 'Escolha ou arraste a planilha'}</span>
              <span className="mt-1 text-xs text-slate-500">Arquivos CSV ou XLSX</span>
            </label>
            <Button className="w-full" disabled={!file || submitting}>
              <Upload className="h-4 w-4" />
              {submitting ? 'Processando arquivo' : 'Importar check-ins'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-bold text-slate-950">Histórico</h2>
          <p className="mt-1 text-sm text-slate-500">Importações mais recentes da academia.</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState />
          ) : imports.length === 0 ? (
            <EmptyState message="Nenhuma importação realizada" />
          ) : (
            <div className="divide-y divide-slate-100">
              {imports.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-950">{item.filename}</p>
                    <p className="text-sm text-slate-500">{item.total_records} registros · {formatDateTime(item.imported_at)}</p>
                  </div>
                  <div className="flex items-center gap-2"><StatusBadge value="achieved" label="Concluída" /><StatusBadge value={item.source} label={item.source} /></div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

function formatDateTime(value: string) {
  if (!value) return 'Data não informada';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
