import { AlertTriangle, BarChart3, BookOpen, CalendarDays, CheckCircle2, Clock3, HeartPulse, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { ProductGuide } from '../../components/help/ProductGuide';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { api } from '../../features/api/endpoints';
import { retentionGuide } from '../../features/help/guides/retentionGuide';
import type { EngagementLevel, OnboardingJourneyItem, RetentionIntervention, RetentionRadarItem, RetentionReason, RetentionSummary, RetentionWorkflowStatus, TeamMember } from '../../features/api/types';
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
  const [section, setSection] = useState<'radar' | 'onboarding' | 'results'>('radar');
  const [summary, setSummary] = useState<RetentionSummary>();
  const [onboarding, setOnboarding] = useState<OnboardingJourneyItem[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [periodStart, setPeriodStart] = useState(defaultPeriodStart());
  const [periodEnd, setPeriodEnd] = useState(todayDate());
  const [guideOpen, setGuideOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [radar, results, journey, members] = await Promise.all([api.retentionRadar(), api.retentionSummary(periodStart, periodEnd), api.onboardingJourney(), api.teamMembers()]);
      setItems(radar);
      setSummary(results);
      setOnboarding(journey);
      setTeam(members);
    }
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
      <PageHeader
        title="Retenção"
        eyebrow="Quem merece atenção hoje"
        description="Sinais de mudança de frequência baseados nos check-ins. O radar apoia a decisão da equipe; não prevê cancelamentos."
        actions={<Button variant="secondary" onClick={() => setGuideOpen(true)}><BookOpen className="h-4 w-4" />Como usar</Button>}
      />
      {error && <ErrorState message={error} />}

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-panel" role="tablist" aria-label="Seções de retenção">
        <button type="button" role="tab" aria-selected={section === 'radar'} className={`min-h-10 rounded-lg px-4 text-sm font-bold ${section === 'radar' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => setSection('radar')}>Radar e ações</button>
        <button type="button" role="tab" aria-selected={section === 'onboarding'} className={`min-h-10 rounded-lg px-4 text-sm font-bold ${section === 'onboarding' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => setSection('onboarding')}>Primeiros 30 dias ({onboarding.length})</button>
        <button type="button" role="tab" aria-selected={section === 'results'} className={`min-h-10 rounded-lg px-4 text-sm font-bold ${section === 'results' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => setSection('results')}>Resultados</button>
      </div>

      {section === 'results' ? (
        <ResultsPanel summary={summary} loading={loading} start={periodStart} end={periodEnd} onStart={setPeriodStart} onEnd={setPeriodEnd} onLoad={() => void load()} />
      ) : section === 'onboarding' ? (
        <OnboardingPanel items={onboarding} loading={loading} onReload={load} onFrequency={(item) => setAttendanceStudent({ student_id: item.student_id, student_name: item.student_name, student_phone: item.student_phone, source: item.source } as RetentionRadarItem)} onAction={(item) => setSelected(items.find((radarItem) => radarItem.student_id === item.student_id))} />
      ) : <>
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
      </>}

      {selected && <InterventionModal item={selected} team={team} onClose={() => setSelected(undefined)} onSaved={async () => { setSelected(undefined); await load(); }} />}
      {attendanceStudent && <StudentAttendancePanel student={{ id: attendanceStudent.student_id, name: attendanceStudent.student_name, phone: attendanceStudent.student_phone, source: attendanceStudent.source }} onClose={() => setAttendanceStudent(undefined)} />}
      <ProductGuide open={guideOpen} title="Como usar a Retenção" description="Um guia prático para organizar a rotina, interpretar os sinais e registrar acompanhamentos com consistência." sections={retentionGuide} onClose={() => setGuideOpen(false)} />
    </div>
  );
}

function RadarRow({ item, onAction, onFrequency }: { item: RetentionRadarItem; onAction: () => void; onFrequency: () => void }) {
  const info = levelInfo[item.level];
  const workflow = workflowInfo(item.workflow_status);
  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[minmax(200px,1.1fr)_minmax(260px,1.5fr)_170px_auto] lg:items-center lg:px-5">
      <div><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-slate-950">{item.student_name}</p><span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${info.className}`}>{info.label}</span></div><p className="mt-1 text-xs text-slate-500">{item.source === 'wellhub' ? 'Wellhub' : 'TotalPass'} · {item.student_phone || 'Sem telefone'}</p></div>
      <div>{item.signals.length ? item.signals.map((signal) => <p key={signal.code} className="text-sm text-slate-600">{signal.message}</p>) : <p className="text-sm text-slate-500">Nenhuma mudança relevante observada.</p>}<p className={`mt-2 text-xs font-bold ${workflow.tone}`}>{workflow.label}{lastActionSummary(item)}</p><p className="mt-1 text-xs text-slate-500"><strong className="text-slate-700">{item.recommendation.title}:</strong> {item.recommendation.message}</p>{item.contact_status === 'opted_out' && <p className="mt-1 text-xs font-semibold text-red-600">Contato eletrônico não autorizado</p>}</div>
      <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500"><p><strong className="text-slate-800">{item.recent_checkins}</strong> check-ins recentes</p><p className="mt-1">{item.previous_checkins} nas 4 semanas anteriores</p>{item.days_since_checkin !== undefined && <p className="mt-1">{item.days_since_checkin} dias desde a última presença</p>}</div>
      <div className="grid gap-2"><Button variant="secondary" onClick={onFrequency}><CalendarDays className="h-4 w-4" />Ver frequência</Button><Button variant="secondary" onClick={onAction}>{item.last_intervention_id ? 'Atualizar acompanhamento' : 'Registrar ação'}</Button></div>
    </div>
  );
}

function InterventionModal({ item, team, onClose, onSaved }: { item: RetentionRadarItem; team: TeamMember[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [channel, setChannel] = useState<'whatsapp' | 'phone' | 'in_person' | 'other'>('in_person');
  const [outcome, setOutcome] = useState<'contacted' | 'no_response' | 'follow_up' | 'paused' | 'not_interested' | 'other'>('contacted');
  const [reasonCode, setReasonCode] = useState<RetentionReason>('unknown');
  const [assignedToUserId, setAssignedToUserId] = useState(item.last_intervention_assignee_id || '');
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
      await api.createRetentionIntervention(item.student_id, { channel, status: 'completed', outcome, reason_code: reasonCode, assigned_to_user_id: assignedToUserId || undefined, notes, planned_for: reviewDate ? new Date(`${reviewDate}T12:00:00`).toISOString() : undefined });
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
          <label className="block space-y-1 text-xs font-semibold text-slate-500">Motivo percebido<select className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={reasonCode} onChange={(event) => setReasonCode(event.target.value as RetentionReason)}><option value="unknown">Não identificado</option><option value="travel">Viagem</option><option value="schedule">Incompatibilidade de horário</option><option value="financial">Dificuldade financeira</option><option value="motivation">Desmotivação</option><option value="service">Atendimento/experiência</option><option value="health">Saúde ou limitação física</option><option value="moved">Mudança de academia ou cidade</option><option value="other">Outro</option></select><span className="block font-normal text-slate-400">Registre apenas a categoria, sem detalhes médicos ou financeiros.</span></label>
          <label className="block space-y-1 text-xs font-semibold text-slate-500">Responsável pelo acompanhamento<select className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={assignedToUserId} onChange={(event) => setAssignedToUserId(event.target.value)}><option value="">Sem responsável definido</option>{team.filter((member) => member.active || member.id === assignedToUserId).map((member) => <option key={member.id} value={member.id} disabled={!member.active}>{member.name} · {member.role === 'OWNER' ? 'Proprietário' : 'Coach'}{member.active ? '' : ' (desativado)'}</option>)}</select></label>
          {outcome !== 'not_interested' && <label className="block space-y-1 text-xs font-semibold text-slate-500">Revisar acompanhamento em<Input className="mt-1" type="date" value={reviewDate} onChange={(event) => setReviewDate(event.target.value)} /><span className="block font-normal text-slate-400">Até essa data o aluno ficará em acompanhamento, sem voltar para a fila principal.</span></label>}
          <label className="block space-y-1 text-xs font-semibold text-slate-500">Observação opcional<textarea className="mt-1 min-h-24 w-full rounded-md border border-slate-200 p-3 text-sm" maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Registre somente o contexto necessário, sem informações médicas ou financeiras detalhadas." /></label>
          {history.length > 0 && <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Acompanhamentos recentes</p><div className="mt-2 space-y-2">{history.slice(0, 3).map((entry) => <div key={entry.id} className="border-t border-slate-200 pt-2 first:border-0 first:pt-0"><p className="text-xs font-semibold text-slate-700">{channelLabel(entry.channel)} · {new Date(entry.completed_at || entry.created_at).toLocaleDateString('pt-BR')}</p><p className="mt-0.5 text-xs text-slate-500">{outcomeLabel(entry.outcome)}{entry.reason_code ? ` · ${reasonLabel(entry.reason_code)}` : ''}{entry.notes ? ` — ${entry.notes}` : ''}</p></div>)}</div></div>}
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

function reasonLabel(value: RetentionReason | string) {
  return {
    travel: 'Viagem',
    schedule: 'Horário',
    financial: 'Financeiro',
    motivation: 'Desmotivação',
    service: 'Atendimento/experiência',
    health: 'Saúde ou limitação',
    moved: 'Mudança',
    unknown: 'Não identificado',
    other: 'Outro',
  }[value] || value;
}

function OnboardingPanel({ items, loading, onReload, onFrequency, onAction }: {
  items: OnboardingJourneyItem[];
  loading: boolean;
  onReload: () => Promise<void>;
  onFrequency: (item: OnboardingJourneyItem) => void;
  onAction: (item: OnboardingJourneyItem) => void;
}) {
  if (loading && items.length === 0) return <LoadingState />;
  if (items.length === 0) return <Card><CardContent className="p-5"><EmptyState message="Nenhum aluno com início registrado nos últimos 30 dias" /></CardContent></Card>;
  return (
    <Card>
      <CardHeader><h2 className="font-bold text-slate-950">Formação da rotina</h2><p className="text-sm text-slate-500">Acompanha primeira e segunda presenças e os marcos dos primeiros 7, 14 e 30 dias.</p></CardHeader>
      <CardContent className="divide-y divide-slate-100 p-0">
        {items.map((item) => <OnboardingRow key={item.student_id} item={item} onReload={onReload} onFrequency={() => onFrequency(item)} onAction={() => onAction(item)} />)}
      </CardContent>
    </Card>
  );
}

function OnboardingRow({ item, onReload, onFrequency, onAction }: {
  item: OnboardingJourneyItem;
  onReload: () => Promise<void>;
  onFrequency: () => void;
  onAction: () => void;
}) {
  const [startedAt, setStartedAt] = useState(item.membership_started_at);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function saveStart() {
    setSaving(true); setError('');
    try {
      await api.updateMembershipStart(item.student_id, startedAt);
      await onReload();
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível atualizar a data de início.'); }
    finally { setSaving(false); }
  }
  const status = onboardingStatusInfo(item.status);
  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[minmax(190px,1fr)_minmax(250px,1.4fr)_minmax(230px,1fr)_auto] lg:items-center lg:px-5">
      <div><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-slate-950">{item.student_name}</p><span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${status.className}`}>{status.label}</span></div><p className="mt-1 text-xs text-slate-500">Dia {item.day} · {item.source === 'wellhub' ? 'Wellhub' : 'TotalPass'}</p></div>
      <div><p className="text-sm text-slate-600">{item.status_message}</p><p className="mt-1 text-xs text-slate-500"><strong className="text-slate-700">{item.recommendation.title}:</strong> {item.recommendation.message}</p></div>
      <div>
        <div className="grid grid-cols-3 gap-2 text-center"><SmallMetric label="7 dias" value={item.checkins_first_7_days} /><SmallMetric label="14 dias" value={item.checkins_first_14_days} /><SmallMetric label="30 dias" value={item.checkins_first_30_days} /></div>
        <div className="mt-2 flex items-end gap-2"><label className="flex-1 text-xs font-semibold text-slate-500">Início<Input className="mt-1" type="date" value={startedAt} max={todayDate()} onChange={(event) => setStartedAt(event.target.value)} /></label><Button variant="ghost" disabled={saving || startedAt === item.membership_started_at} onClick={() => void saveStart()}>{saving ? 'Salvando' : 'Confirmar'}</Button></div>
        <p className="mt-1 text-[11px] text-slate-400">{item.membership_started_source === 'first_checkin_inferred' ? 'Data inferida pela primeira presença; confirme quando souber a data real.' : 'Data confirmada pela operação.'}</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <div className="grid gap-2"><Button variant="secondary" onClick={onFrequency}><CalendarDays className="h-4 w-4" />Ver frequência</Button><Button variant="secondary" onClick={onAction}>Registrar ação</Button></div>
    </div>
  );
}

function onboardingStatusInfo(status: OnboardingJourneyItem['status']) {
  return {
    no_first_visit: { label: 'Sem primeira presença', className: 'bg-red-50 text-red-700 ring-red-200' },
    interrupted: { label: 'Rotina interrompida', className: 'bg-orange-50 text-orange-700 ring-orange-200' },
    needs_second_visit: { label: 'Aguardando 2ª presença', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
    building_habit: { label: 'Início recente', className: 'bg-sky-50 text-sky-700 ring-sky-200' },
    on_track: { label: 'Em formação de hábito', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  }[status];
}

function ResultsPanel({ summary, loading, start, end, onStart, onEnd, onLoad }: {
  summary?: RetentionSummary;
  loading: boolean;
  start: string;
  end: string;
  onStart: (value: string) => void;
  onEnd: (value: string) => void;
  onLoad: () => void;
}) {
  if (loading && !summary) return <LoadingState />;
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-end md:justify-between">
          <div><h2 className="font-bold text-slate-950">Período analisado</h2><p className="text-sm text-slate-500">Retornos são associações temporais e não provam que o contato causou a presença.</p></div>
          <div className="grid gap-2 sm:grid-cols-[150px_150px_auto]">
            <label className="text-xs font-semibold text-slate-500">Início<Input className="mt-1" type="date" value={start} max={end} onChange={(event) => onStart(event.target.value)} /></label>
            <label className="text-xs font-semibold text-slate-500">Fim<Input className="mt-1" type="date" value={end} min={start} onChange={(event) => onEnd(event.target.value)} /></label>
            <Button variant="secondary" disabled={loading || !start || !end || start > end} onClick={onLoad}><BarChart3 className="h-4 w-4" />Atualizar</Button>
          </div>
        </CardContent>
      </Card>
      {summary && <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Ações concluídas" value={summary.completed_interventions} icon={CheckCircle2} tone="text-slate-600" />
          <Metric label="Retorno em até 3 dias" value={summary.return_within_3_days} icon={HeartPulse} tone="text-emerald-600" />
          <Metric label="Retorno em até 7 dias" value={summary.return_within_7_days} icon={HeartPulse} tone="text-emerald-600" />
          <Metric label="Retorno em até 14 dias" value={summary.return_within_14_days} icon={HeartPulse} tone="text-emerald-600" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card><CardHeader><h2 className="font-bold text-slate-950">Fila atual</h2><p className="text-sm text-slate-500">Retrato de hoje, independente do período selecionado.</p></CardHeader><CardContent className="grid grid-cols-2 gap-3"><SmallMetric label="Precisam de ação" value={summary.needs_action} /><SmallMetric label="Revisões vencidas" value={summary.follow_up_due} /><SmallMetric label="Em acompanhamento" value={summary.waiting_return} /><SmallMetric label="Retornos destacados" value={summary.recovered} /></CardContent></Card>
          <Card><CardHeader><h2 className="font-bold text-slate-950">Tempo de retorno</h2><p className="text-sm text-slate-500">Mediana entre a ação concluída e a primeira presença observada em até 14 dias.</p></CardHeader><CardContent><p className="text-3xl font-bold text-slate-950">{summary.median_days_to_return == null ? '—' : `${formatDecimal(summary.median_days_to_return)} dias`}</p><p className="mt-2 text-xs text-slate-500">Casos sem retorno no período não entram na mediana.</p></CardContent></Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Breakdown title="Motivos percebidos" values={summary.reasons} label={reasonLabel} empty="Nenhum motivo registrado no período." />
          <Breakdown title="Canais utilizados" values={summary.channels} label={(value) => channelLabel(value as RetentionIntervention['channel'])} empty="Nenhuma ação concluída no período." />
          <Breakdown title="Resultados registrados" values={summary.outcomes} label={(value) => outcomeLabel(value as RetentionIntervention['outcome'])} empty="Nenhum resultado registrado no período." />
        </div>
      </>}
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-950">{value}</p></div>;
}

function Breakdown({ title, values, label, empty }: { title: string; values: { code: string; count: number }[]; label: (value: string) => string; empty: string }) {
  return <Card><CardHeader><h2 className="font-bold text-slate-950">{title}</h2></CardHeader><CardContent>{values.length === 0 ? <p className="text-sm text-slate-500">{empty}</p> : <div className="space-y-2">{values.map((item) => <div key={item.code} className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-600">{label(item.code)}</span><strong className="text-slate-950">{item.count}</strong></div>)}</div>}</CardContent></Card>;
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value);
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
  const assignee = item.last_intervention_assignee_name ? ` · responsável: ${item.last_intervention_assignee_name}` : '';
  return ` · ${channel} em ${date}${review}${assignee}`;
}

function defaultReviewDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function defaultPeriodStart() {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return date.toISOString().slice(0, 10);
}
