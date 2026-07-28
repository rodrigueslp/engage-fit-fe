import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, HeartPulse, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { api } from '../../features/api/endpoints';
import type { EngagementLevel, RetentionIntervention, RetentionRadarItem, RetentionWorkflowStatus } from '../../features/api/types';
import { StudentAttendancePanel } from '../../components/checkins/StudentAttendancePanel';

const levelInfo: Record<EngagementLevel, { label: string; className: string }> = {
  critical: { label: 'Atenção imediata', className: 'bg-red-50 text-red-700 ring-red-200' },
  at_risk: { label: 'Em queda', className: 'bg-orange-50 text-orange-700 ring-orange-200' },
  attention: { label: 'Observar', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  history_insufficient: { label: 'Pouco histórico', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
  recovered: { label: 'Retorno observado', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  healthy: { label: 'Frequência estável', className: 'bg-sky-50 text-sky-700 ring-sky-200' },
};

export function RetentionPage() {
  const [items, setItems] = useState<RetentionRadarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<'all' | EngagementLevel>('all');
  const [queue, setQueue] = useState<'action' | 'waiting' | 'recovered' | 'paused' | 'all'>('action');
  const [selected, setSelected] = useState<RetentionRadarItem>();
  const [attendanceStudent, setAttendanceStudent] = useState<RetentionRadarItem>();

  async function load() {
    setLoading(true);
    setError('');
    try { setItems(await api.retentionRadar()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível carregar o radar.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) =>
      (level === 'all' || item.level === level)
      && matchesQueue(item.workflow_status, queue)
      && (!query || `${item.student_name} ${item.student_phone}`.toLowerCase().includes(query)));
  }, [items, level, queue, search]);

  const actionTotal = items.filter((item) => item.workflow_status === 'needs_action' || item.workflow_status === 'follow_up_due').length;
  const waitingTotal = items.filter((item) => item.workflow_status === 'waiting_return').length;
  const recoveredTotal = items.filter((item) => item.workflow_status === 'recovered').length;

  return (
    <div className="space-y-5">
      <PageHeader title="Retenção" eyebrow="Quem merece atenção hoje" description="Sinais de mudança de frequência baseados nos check-ins. O radar apoia a decisão da equipe; não prevê cancelamentos." />
      {error && <ErrorState message={error} />}

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Precisam de ação" value={actionTotal} icon={AlertTriangle} tone="text-orange-600" />
        <Metric label="Aguardando retorno" value={waitingTotal} icon={Clock3} tone="text-sky-600" />
        <Metric label="Retornos observados" value={recoveredTotal} icon={CheckCircle2} tone="text-emerald-600" />
      </div>

      <Card>
        <CardHeader>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            <QueueTab active={queue === 'action'} label={`Precisa de ação (${actionTotal})`} onClick={() => setQueue('action')} />
            <QueueTab active={queue === 'waiting'} label={`Em acompanhamento (${waitingTotal})`} onClick={() => setQueue('waiting')} />
            <QueueTab active={queue === 'recovered'} label={`Retornos (${recoveredTotal})`} onClick={() => setQueue('recovered')} />
            <QueueTab active={queue === 'paused'} label="Pausados/encerrados" onClick={() => setQueue('paused')} />
            <QueueTab active={queue === 'all'} label="Todos" onClick={() => setQueue('all')} />
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div><h2 className="font-bold text-slate-950">Radar de frequência</h2><p className="text-sm text-slate-500">Compara os últimos 28 dias com as quatro semanas anteriores.</p></div>
            <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_180px]">
              <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" placeholder="Buscar aluno" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
              <select className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm sm:h-10" value={level} onChange={(event) => setLevel(event.target.value as 'all' | EngagementLevel)}>
                <option value="all">Todas as situações</option>
                <option value="critical">Atenção imediata</option><option value="at_risk">Em queda</option><option value="attention">Observar</option>
                <option value="recovered">Retorno observado</option><option value="healthy">Frequência estável</option><option value="history_insufficient">Pouco histórico</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="p-5"><LoadingState /></div> : filtered.length === 0 ? <div className="p-5"><EmptyState message="Nenhum aluno encontrado para este filtro" /></div> : (
            <div className="divide-y divide-slate-100">
              {filtered.map((item) => <RadarRow key={item.student_id} item={item} onAction={() => setSelected(item)} onFrequency={() => setAttendanceStudent(item)} />)}
            </div>
          )}
        </CardContent>
      </Card>

      {selected && <InterventionModal item={selected} onClose={() => setSelected(undefined)} onSaved={async () => { setSelected(undefined); await load(); }} />}
      {attendanceStudent && <StudentAttendancePanel student={{ id: attendanceStudent.student_id, name: attendanceStudent.student_name, phone: attendanceStudent.student_phone, source: attendanceStudent.source }} onClose={() => setAttendanceStudent(undefined)} />}
    </div>
  );
}

function RadarRow({ item, onAction, onFrequency }: { item: RetentionRadarItem; onAction: () => void; onFrequency: () => void }) {
  const info = levelInfo[item.level];
  const workflow = workflowInfo(item.workflow_status);
  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[minmax(200px,1.1fr)_minmax(260px,1.5fr)_170px_auto] lg:items-center lg:px-5">
      <div><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-slate-950">{item.student_name}</p><span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${info.className}`}>{info.label}</span></div><p className="mt-1 text-xs text-slate-500">{item.source === 'wellhub' ? 'Wellhub' : 'TotalPass'} · {item.student_phone || 'Sem telefone'}</p></div>
      <div>{item.signals.length ? item.signals.map((signal) => <p key={signal.code} className="text-sm text-slate-600">{signal.message}</p>) : <p className="text-sm text-slate-500">Nenhuma mudança relevante observada.</p>}<p className={`mt-2 text-xs font-bold ${workflow.tone}`}>{workflow.label}{lastActionSummary(item)}</p>{item.contact_status === 'opted_out' && <p className="mt-1 text-xs font-semibold text-red-600">Contato eletrônico não autorizado</p>}</div>
      <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500"><p><strong className="text-slate-800">{item.recent_checkins}</strong> check-ins recentes</p><p className="mt-1">{item.previous_checkins} nas 4 semanas anteriores</p>{item.days_since_checkin !== undefined && <p className="mt-1">{item.days_since_checkin} dias desde a última presença</p>}</div>
      <div className="grid gap-2"><Button variant="secondary" onClick={onFrequency}><CalendarDays className="h-4 w-4" />Ver frequência</Button><Button variant="secondary" onClick={onAction}>{item.last_intervention_id ? 'Atualizar acompanhamento' : 'Registrar ação'}</Button></div>
    </div>
  );
}

function InterventionModal({ item, onClose, onSaved }: { item: RetentionRadarItem; onClose: () => void; onSaved: () => Promise<void> }) {
  const [channel, setChannel] = useState<'whatsapp' | 'phone' | 'in_person' | 'other'>('in_person');
  const [outcome, setOutcome] = useState<'contacted' | 'no_response' | 'follow_up' | 'paused' | 'not_interested' | 'other'>('contacted');
  const [notes, setNotes] = useState('');
  const [reviewDate, setReviewDate] = useState(defaultReviewDate());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<RetentionIntervention[]>([]);
  useEffect(() => {
    void api.retentionInterventions(item.student_id).then(setHistory).catch(() => setHistory([]));
  }, [item.student_id]);
  async function save() {
    setSaving(true); setError('');
    try {
      await api.createRetentionIntervention(item.student_id, { channel, status: 'completed', outcome, notes, planned_for: reviewDate ? new Date(`${reviewDate}T12:00:00`).toISOString() : undefined });
      await onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível registrar a ação.'); }
    finally { setSaving(false); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <Card className="max-h-[92vh] w-full overflow-y-auto rounded-b-none sm:max-w-lg sm:rounded-xl">
        <CardHeader><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-accent">Acompanhamento</p><h2 className="mt-1 text-lg font-bold text-slate-950">{item.student_name}</h2></div><button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Fechar"><X className="h-5 w-5" /></button></div></CardHeader>
        <CardContent className="space-y-4">
          {error && <ErrorState message={error} />}
          <label className="block space-y-1 text-xs font-semibold text-slate-500">Como foi o contato?<select className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={channel} onChange={(event) => setChannel(event.target.value as typeof channel)}><option value="in_person">Conversa presencial</option><option value="whatsapp" disabled={item.contact_status === 'opted_out'}>WhatsApp</option><option value="phone" disabled={item.contact_status === 'opted_out'}>Telefone</option><option value="other">Outro</option></select>{item.contact_status === 'opted_out' && <span className="block font-normal text-red-500">Este aluno não autorizou contato eletrônico.</span>}</label>
          <label className="block space-y-1 text-xs font-semibold text-slate-500">Resultado<select className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={outcome} onChange={(event) => setOutcome(event.target.value as typeof outcome)}><option value="contacted">Contato realizado</option><option value="no_response">Sem resposta</option><option value="follow_up">Precisa de retorno</option><option value="paused">Pausa informada</option><option value="not_interested">Não tem interesse</option><option value="other">Outro</option></select></label>
          {outcome !== 'not_interested' && <label className="block space-y-1 text-xs font-semibold text-slate-500">Revisar acompanhamento em<Input className="mt-1" type="date" value={reviewDate} onChange={(event) => setReviewDate(event.target.value)} /><span className="block font-normal text-slate-400">Até essa data o aluno ficará em acompanhamento, sem voltar para a fila principal.</span></label>}
          <label className="block space-y-1 text-xs font-semibold text-slate-500">Observação opcional<textarea className="mt-1 min-h-24 w-full rounded-md border border-slate-200 p-3 text-sm" maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Registre somente o contexto necessário, sem informações médicas ou financeiras detalhadas." /></label>
          {history.length > 0 && <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Acompanhamentos recentes</p><div className="mt-2 space-y-2">{history.slice(0, 3).map((entry) => <div key={entry.id} className="border-t border-slate-200 pt-2 first:border-0 first:pt-0"><p className="text-xs font-semibold text-slate-700">{channelLabel(entry.channel)} · {new Date(entry.completed_at || entry.created_at).toLocaleDateString('pt-BR')}</p><p className="mt-0.5 text-xs text-slate-500">{outcomeLabel(entry.outcome)}{entry.notes ? ` — ${entry.notes}` : ''}</p></div>)}</div></div>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button disabled={saving} onClick={() => void save()}>{saving ? 'Salvando...' : 'Salvar acompanhamento'}</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}

function channelLabel(value: RetentionIntervention['channel']) {
  return { whatsapp: 'WhatsApp', phone: 'Telefone', in_person: 'Presencial', other: 'Outro' }[value];
}

function outcomeLabel(value: RetentionIntervention['outcome']) {
  if (!value) return 'Sem resultado registrado';
  return { contacted: 'Contato realizado', no_response: 'Sem resposta', follow_up: 'Precisa de retorno', paused: 'Pausa informada', not_interested: 'Não tem interesse', other: 'Outro' }[value];
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof HeartPulse; tone: string }) {
  return <Card><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-950">{value}</p></div><Icon className={`h-5 w-5 ${tone}`} /></CardContent></Card>;
}

function QueueTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold transition ${active ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label}</button>;
}

function matchesQueue(status: RetentionWorkflowStatus, queue: 'action' | 'waiting' | 'recovered' | 'paused' | 'all') {
  if (queue === 'all') return true;
  if (queue === 'action') return status === 'needs_action' || status === 'follow_up_due';
  if (queue === 'waiting') return status === 'waiting_return';
  if (queue === 'recovered') return status === 'recovered';
  return status === 'paused' || status === 'closed';
}

function workflowInfo(status: RetentionWorkflowStatus) {
  const values: Record<RetentionWorkflowStatus, { label: string; tone: string }> = {
    needs_action: { label: 'Precisa de ação', tone: 'text-red-600' },
    follow_up_due: { label: 'Revisão vencida', tone: 'text-red-600' },
    waiting_return: { label: 'Em acompanhamento', tone: 'text-sky-600' },
    paused: { label: 'Acompanhamento pausado', tone: 'text-slate-500' },
    closed: { label: 'Acompanhamento encerrado', tone: 'text-slate-500' },
    recovered: { label: 'Retorno observado', tone: 'text-emerald-600' },
    none: { label: 'Sem ação necessária', tone: 'text-slate-400' },
  };
  return values[status];
}

function lastActionSummary(item: RetentionRadarItem) {
  if (!item.last_intervention_created_at) return '';
  const date = new Date(item.last_intervention_created_at).toLocaleDateString('pt-BR');
  const channel = item.last_intervention_channel ? channelLabel(item.last_intervention_channel) : 'Ação';
  const review = item.follow_up_due_at ? ` · revisar em ${new Date(item.follow_up_due_at).toLocaleDateString('pt-BR')}` : '';
  return ` · ${channel} em ${date}${review}`;
}

function defaultReviewDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}
