import { Play, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { api } from '../../features/api/endpoints';
import type { AutomationRun, AutomationSchedule } from '../../features/api/types';

const weekDays = [
  { value: '1', label: 'Seg' },
  { value: '2', label: 'Ter' },
  { value: '3', label: 'Qua' },
  { value: '4', label: 'Qui' },
  { value: '5', label: 'Sex' },
  { value: '6', label: 'Sab' },
  { value: '0', label: 'Dom' },
];

const modeLabels: Record<AutomationSchedule['mode'], string> = {
  full_daily: 'Recalcular e enviar tudo',
  recalculate_only: 'Somente recalcular',
  send_almost_there: 'Enviar falta pouco',
  send_achieved: 'Enviar meta atingida',
  send_inactive: 'Enviar alunos em risco',
};

const defaultForm = {
  name: '',
  mode: 'full_daily' as AutomationSchedule['mode'],
  run_time: '08:00',
  timezone: 'America/Sao_Paulo',
  days_of_week: '1,2,3,4,5',
  allow_resend: false,
  enabled: true,
};

export function AutomationPage() {
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [schedules, setSchedules] = useState<AutomationSchedule[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [runningScheduleId, setRunningScheduleId] = useState('');
  const [section, setSection] = useState<'routines' | 'history'>('routines');
  const [showCreate, setShowCreate] = useState(false);

  function load() {
    setLoading(true);
    setError('');
    Promise.all([api.automationSchedules(), api.automationRuns()])
      .then(([schedules, runs]) => {
        setSchedules(schedules);
        setRuns(runs);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar automação'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function createSchedule(event: FormEvent) {
    event.preventDefault();
    setError('');
    setStatus('');
    try {
      await api.createAutomationSchedule(form);
      setForm(defaultForm);
      setStatus('Rotina criada.');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar rotina');
    }
  }

  async function toggleSchedule(schedule: AutomationSchedule) {
    setError('');
    try {
      await api.updateAutomationSchedule(schedule.id, { ...schedule, enabled: !schedule.enabled });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar rotina');
    }
  }

  async function deleteSchedule(scheduleId: string) {
    if (!window.confirm('Remover esta rotina automática?')) return;
    setError('');
    try {
      await api.deleteAutomationSchedule(scheduleId);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover rotina');
    }
  }

  async function runNow(scheduleId: string) {
    setError('');
    setStatus('');
    setRunningScheduleId(scheduleId);
    try {
      const run = await api.runAutomationScheduleNow(scheduleId);
      setStatus(`Execução finalizada: ${statusLabel(run.status)}. Mensagens enviadas: ${run.sent_messages}. Falhas: ${run.failed_messages}.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao executar rotina');
    } finally {
      setRunningScheduleId('');
    }
  }

  function toggleDay(day: string) {
    const current = new Set(form.days_of_week.split(',').filter(Boolean));
    if (current.has(day)) current.delete(day); else current.add(day);
    setForm((value) => ({ ...value, days_of_week: Array.from(current).sort().join(',') }));
  }

  if (loading) return <LoadingState label="Carregando automação" />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Automação"
        eyebrow="Rotina diária"
        description="Agende recálculo, disparos e acompanhe cada execução operacional."
        actions={<Button type="button" variant="secondary" onClick={load}><RefreshCw className="h-4 w-4" />Atualizar</Button>}
      />
      {error && <ErrorState message={error} />}
      {status && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{status}</div>}

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-panel" role="tablist" aria-label="Seções da automação">
        <button type="button" role="tab" aria-selected={section === 'routines'} className={`min-h-10 rounded-lg px-4 text-sm font-bold ${section === 'routines' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => setSection('routines')}>Rotinas ({schedules.length})</button>
        <button type="button" role="tab" aria-selected={section === 'history'} className={`min-h-10 rounded-lg px-4 text-sm font-bold ${section === 'history' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => setSection('history')}>Histórico ({runs.length})</button>
      </div>

      {section === 'routines' && <div className={`grid gap-5 ${showCreate ? 'xl:grid-cols-[420px_1fr]' : ''}`}>
        {showCreate &&
        <Card>
          <CardHeader><div className="flex items-center justify-between gap-3"><h2 className="text-base font-bold text-slate-950">Nova rotina</h2><Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button></div></CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={createSchedule}>
              <Input placeholder="Nome da rotina" value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} required />
              <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={form.mode} onChange={(event) => setForm((value) => ({ ...value, mode: event.target.value as AutomationSchedule['mode'] }))}>
                {Object.entries(modeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input type="time" value={form.run_time} onChange={(event) => setForm((value) => ({ ...value, run_time: event.target.value }))} required />
                <Input value={form.timezone} onChange={(event) => setForm((value) => ({ ...value, timezone: event.target.value }))} required />
              </div>
              <div className="flex flex-wrap gap-2">
                {weekDays.map((day) => {
                  const active = form.days_of_week.split(',').includes(day.value);
                  return <button key={day.value} type="button" className={`h-8 rounded-md border px-3 text-xs font-bold ${active ? 'border-accent bg-accent-soft text-accent-dark' : 'border-slate-200 bg-white text-slate-500'}`} onClick={() => toggleDay(day.value)}>{day.label}</button>;
                })}
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600"><input type="checkbox" checked={form.allow_resend} onChange={(event) => setForm((value) => ({ ...value, allow_resend: event.target.checked }))} />Reenviar campanhas já enviadas</label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600"><input type="checkbox" checked={form.enabled} onChange={(event) => setForm((value) => ({ ...value, enabled: event.target.checked }))} />Rotina ativa</label>
              <Button><Plus className="h-4 w-4" />Criar rotina</Button>
            </form>
          </CardContent>
        </Card>}

        <Card>
          <CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-base font-bold text-slate-950">Rotinas automáticas</h2><p className="mt-1 text-sm text-slate-500">Configure horários e acompanhe a última execução.</p></div>{!showCreate && <Button type="button" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" />Nova rotina</Button>}</div></CardHeader>
          <CardContent className="space-y-3">
            {schedules.length === 0 ? <EmptyState message="Nenhuma rotina configurada" /> : schedules.map((schedule) => (
              <div key={schedule.id} className="rounded-md border border-slate-100 p-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{schedule.name}</p>
                    <p className="text-sm text-slate-500">{modeLabels[schedule.mode]} · {schedule.run_time} · {daysLabel(schedule.days_of_week)}</p>
                    <p className="text-xs font-semibold text-slate-400">{schedule.last_run_at ? `Última execução: ${formatDateTime(schedule.last_run_at)}` : 'Ainda não executada'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge value={schedule.enabled ? 'active' : 'inactive'} label={schedule.enabled ? 'Ativa' : 'Pausada'} />
                    <Button type="button" variant="secondary" onClick={() => runNow(schedule.id)} disabled={runningScheduleId === schedule.id}><Play className="h-4 w-4" />{runningScheduleId === schedule.id ? 'Rodando' : 'Executar'}</Button>
                    <Button type="button" variant="secondary" onClick={() => toggleSchedule(schedule)}>{schedule.enabled ? 'Pausar' : 'Ativar'}</Button>
                    <Button type="button" variant="ghost" className="text-rose-700 hover:bg-rose-50" aria-label={`Remover rotina ${schedule.name}`} title="Remover rotina" onClick={() => deleteSchedule(schedule.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>}

      {section === 'history' && <Card>
        <CardHeader><h2 className="text-base font-bold text-slate-950">Execuções recentes</h2><p className="mt-1 text-sm text-slate-500">Resultados resumidos; abra uma execução para ver todos os detalhes.</p></CardHeader>
        <CardContent className="divide-y divide-slate-100 p-0">
          {runs.length === 0 ? <EmptyState message="Nenhuma automação registrada" /> : runs.map((run) => (
            <details key={run.id} className="group p-4">
              <summary className="flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">{formatDateTime(run.started_at)}</p>
                  <p className="text-sm text-slate-500">{run.recalculated_campaigns} campanhas · {run.sent_messages} mensagens · {run.failed_messages} falhas</p>
                </div>
                <StatusBadge value={run.status === 'success' ? 'active' : run.status === 'failed' ? 'warning' : 'inactive'} label={statusLabel(run.status)} />
              </summary>
              <dl className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-3"><div><dt className="text-xs text-slate-500">Importação</dt><dd className="font-bold text-slate-800">{run.imported ? `Sim${run.filename ? ` · ${run.filename}` : ''}` : 'Não'}</dd></div><div><dt className="text-xs text-slate-500">Mensagens ignoradas</dt><dd className="font-bold text-slate-800">{run.skipped_message_campaigns}</dd></div><div><dt className="text-xs text-slate-500">Finalização</dt><dd className="font-bold text-slate-800">{run.finished_at ? formatDateTime(run.finished_at) : 'Em andamento'}</dd></div></dl>
              {run.error_message && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{run.error_message}</p>}
            </details>
          ))}
        </CardContent>
      </Card>}
    </div>
  );
}

function statusLabel(status: AutomationRun['status']) {
  if (status === 'success') return 'Sucesso';
  if (status === 'failed') return 'Falhou';
  return 'Executando';
}

function daysLabel(days: string) {
  const selected = days.split(',').filter(Boolean);
  if (selected.length === 7) return 'Todos os dias';
  return weekDays.filter((day) => selected.includes(day.value)).map((day) => day.label).join(', ');
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
