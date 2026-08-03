import { AlertTriangle, Ban, BarChart3, BookOpen, CalendarDays, CheckCircle2, Clock3, HeartPulse, Info, Search, UserRoundCheck, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { ProductGuide } from '../../components/help/ProductGuide';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { api } from '../../features/api/endpoints';
import { retentionGuide } from '../../features/help/guides/retentionGuide';
import type { EngagementLevel, OnboardingJourneyItem, RetentionExclusionReason, RetentionIntervention, RetentionRadarItem, RetentionReason, RetentionRules, RetentionSummary, RetentionWorkflowStatus, TeamMember } from '../../features/api/types';
import { StudentAttendancePanel } from '../../components/checkins/StudentAttendancePanel';
import { sourceLabel } from '../../features/students/source';

const levelInfo: Record<EngagementLevel, { label: string; className: string }> = {
  critical: { label: 'Atenção imediata', className: 'bg-red-50 text-red-700 ring-red-200' },
  at_risk: { label: 'Em queda', className: 'bg-orange-50 text-orange-700 ring-orange-200' },
  attention: { label: 'Observar', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  history_insufficient: { label: 'Pouco histórico', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
  recovered: { label: 'Retorno observado', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  healthy: { label: 'Frequência estável', className: 'bg-sky-50 text-sky-700 ring-sky-200' },
};

type RetentionQueue = 'action' | 'waiting' | 'recovered' | 'historical' | 'excluded' | 'paused' | 'all';

export function RetentionPage() {
  const [items, setItems] = useState<RetentionRadarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<'all' | EngagementLevel>('all');
  const [queue, setQueue] = useState<RetentionQueue>('action');
  const [selected, setSelected] = useState<RetentionRadarItem>();
  const [monitoringStudent, setMonitoringStudent] = useState<RetentionRadarItem>();
  const [attendanceStudent, setAttendanceStudent] = useState<RetentionRadarItem>();
  const [section, setSection] = useState<'radar' | 'onboarding' | 'results'>('radar');
  const [summary, setSummary] = useState<RetentionSummary>();
  const [rules, setRules] = useState<RetentionRules>();
  const [onboarding, setOnboarding] = useState<OnboardingJourneyItem[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [periodStart, setPeriodStart] = useState(defaultPeriodStart());
  const [periodEnd, setPeriodEnd] = useState(todayDate());
  const [guideOpen, setGuideOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [radar, results, journey, members, calculationRules] = await Promise.all([api.retentionRadar(), api.retentionSummary(periodStart, periodEnd), api.onboardingJourney(), api.teamMembers(), api.retentionRules().catch(() => undefined)]);
      setItems(radar);
      setSummary(results);
      setOnboarding(journey);
      setTeam(members);
      if (calculationRules) setRules(calculationRules);
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
  const historicalTotal = items.filter((item) => item.workflow_status === 'historical').length;
  const excludedTotal = items.filter((item) => item.workflow_status === 'excluded').length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Retenção"
        eyebrow="Quem merece atenção hoje"
        description="Sinais de mudança de frequência baseados nos check-ins. O radar apoia a decisão da equipe; não prevê cancelamentos."
        actions={<div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={!rules} onClick={() => setRulesOpen(true)}><Info className="h-4 w-4" />Entenda os cálculos</Button><Button variant="secondary" onClick={() => setGuideOpen(true)}><BookOpen className="h-4 w-4" />Como usar</Button></div>}
      />
      {error && <ErrorState message={error} />}

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-panel" role="tablist" aria-label="Seções de retenção">
        <button type="button" role="tab" aria-selected={section === 'radar'} className={`min-h-10 rounded-lg px-4 text-sm font-bold ${section === 'radar' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => setSection('radar')}>Radar e ações</button>
        <button type="button" role="tab" aria-selected={section === 'onboarding'} className={`min-h-10 rounded-lg px-4 text-sm font-bold ${section === 'onboarding' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => setSection('onboarding')}>Primeiros 30 dias confiáveis ({onboarding.length})</button>
        <button type="button" role="tab" aria-selected={section === 'results'} className={`min-h-10 rounded-lg px-4 text-sm font-bold ${section === 'results' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => setSection('results')}>Resultados</button>
      </div>

      {section === 'results' ? (
        <ResultsPanel summary={summary} loading={loading} start={periodStart} end={periodEnd} onStart={setPeriodStart} onEnd={setPeriodEnd} onLoad={() => void load()} />
      ) : section === 'onboarding' ? (
        <OnboardingPanel items={onboarding} loading={loading} onReload={load} onFrequency={(item) => setAttendanceStudent({ student_id: item.student_id, student_name: item.student_name, student_phone: item.student_phone, source: item.source } as RetentionRadarItem)} onAction={(item) => setSelected(items.find((radarItem) => radarItem.student_id === item.student_id))} onMonitoring={(item) => setMonitoringStudent(items.find((radarItem) => radarItem.student_id === item.student_id))} />
      ) : <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Precisam de ação" value={actionTotal} icon={AlertTriangle} tone="text-orange-600" />
        <Metric label="Aguardando retorno" value={waitingTotal} icon={Clock3} tone="text-sky-600" />
        <Metric label="Inativos históricos" value={historicalTotal} icon={Clock3} tone="text-slate-500" />
        <Metric label="Retornos observados" value={recoveredTotal} icon={CheckCircle2} tone="text-emerald-600" />
      </div>

      <Card>
        <CardHeader>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            <QueueTab active={queue === 'action'} label={`Precisa de ação (${actionTotal})`} onClick={() => setQueue('action')} />
            <QueueTab active={queue === 'waiting'} label={`Em acompanhamento (${waitingTotal})`} onClick={() => setQueue('waiting')} />
            <QueueTab active={queue === 'recovered'} label={`Retornos (${recoveredTotal})`} onClick={() => setQueue('recovered')} />
            <QueueTab active={queue === 'historical'} label={`Inativos históricos (${historicalTotal})`} onClick={() => setQueue('historical')} />
            <QueueTab active={queue === 'excluded'} label={`Não acompanhados (${excludedTotal})`} onClick={() => setQueue('excluded')} />
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
              {filtered.map((item) => <RadarRow key={item.student_id} item={item} onAction={() => setSelected(item)} onFrequency={() => setAttendanceStudent(item)} onMonitoring={() => setMonitoringStudent(item)} />)}
            </div>
          )}
        </CardContent>
      </Card>
      </>}

      {selected && <InterventionModal item={selected} team={team} onClose={() => setSelected(undefined)} onSaved={async () => { setSelected(undefined); await load(); }} />}
      {monitoringStudent && <MonitoringModal item={monitoringStudent} onClose={() => setMonitoringStudent(undefined)} onSaved={async () => { setMonitoringStudent(undefined); await load(); }} />}
      {attendanceStudent && <StudentAttendancePanel student={{ id: attendanceStudent.student_id, name: attendanceStudent.student_name, phone: attendanceStudent.student_phone, source: attendanceStudent.source }} onClose={() => setAttendanceStudent(undefined)} />}
      {rulesOpen && rules && <RetentionRulesPanel rules={rules} items={items} onClose={() => setRulesOpen(false)} />}
      <ProductGuide open={guideOpen} title="Como usar a Retenção" description="Um guia prático para organizar a rotina, interpretar os sinais e registrar acompanhamentos com consistência." sections={retentionGuide} onClose={() => setGuideOpen(false)} />
    </div>
  );
}

function RadarRow({ item, onAction, onFrequency, onMonitoring }: { item: RetentionRadarItem; onAction: () => void; onFrequency: () => void; onMonitoring: () => void }) {
  const info = levelInfo[item.level];
  const workflow = workflowInfo(item.workflow_status);
  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[minmax(200px,1.1fr)_minmax(260px,1.5fr)_170px_auto] lg:items-center lg:px-5">
      <div><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-slate-950">{item.student_name}</p><span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${info.className}`}>{info.label}</span></div><p className="mt-1 text-xs text-slate-500">{sourceLabel(item.source)} · {item.student_phone || 'Sem telefone'}</p></div>
      <div>{item.signals.length ? item.signals.map((signal) => <p key={signal.code} className="text-sm text-slate-600">{signal.message}</p>) : <p className="text-sm text-slate-500">Nenhuma mudança relevante observada.</p>}<p className={`mt-2 text-xs font-bold ${workflow.tone}`}>{workflow.label}{lastActionSummary(item)}</p>{item.workflow_status === 'excluded' && <p className="mt-1 text-xs text-slate-500">Motivo: {exclusionReasonLabel(item.retention_exclusion_reason)}{item.retention_excluded_until ? ` · até ${formatRuleDate(item.retention_excluded_until)}` : ' · sem prazo'}</p>}<p className="mt-1 text-xs text-slate-500"><strong className="text-slate-700">{item.recommendation.title}:</strong> {item.recommendation.message}</p>{item.contact_status === 'opted_out' && <p className="mt-1 text-xs font-semibold text-red-600">Contato eletrônico não autorizado</p>}</div>
      <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500"><p><strong className="text-slate-800">{item.recent_checkins}</strong> check-ins recentes</p><p className="mt-1">{item.previous_checkins} nas 4 semanas anteriores</p>{item.days_since_checkin !== undefined && <p className="mt-1">{item.days_since_checkin} dias desde a última presença</p>}</div>
      <div className="grid gap-2"><Button variant="secondary" onClick={onFrequency}><CalendarDays className="h-4 w-4" />Ver frequência</Button>{item.workflow_status !== 'excluded' && <Button variant="secondary" onClick={onAction}>{item.last_intervention_id ? 'Atualizar acompanhamento' : item.workflow_status === 'historical' ? 'Registrar reativação' : 'Registrar ação'}</Button>}<Button variant="ghost" onClick={onMonitoring}>{item.workflow_status === 'excluded' ? <><UserRoundCheck className="h-4 w-4" />Voltar a acompanhar</> : <><Ban className="h-4 w-4" />Não acompanhar</>}</Button></div>
    </div>
  );
}

function RetentionRulesPanel({ rules, items, onClose }: { rules: RetentionRules; items: RetentionRadarItem[]; onClose: () => void }) {
  const examples = selectRuleExamples(items);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" role="dialog" aria-modal="true" aria-label="Como os sinais de retenção são calculados">
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-slate-50 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div><p className="text-xs font-bold uppercase tracking-wide text-accent">Leitura transparente</p><h2 className="mt-1 text-xl font-bold text-slate-950">Como os sinais são calculados</h2><p className="mt-1 text-sm text-slate-500">As regras abaixo são aplicadas diretamente aos check-ins da academia.</p></div>
          <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Fechar"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          <Card>
            <CardHeader><h3 className="font-bold text-slate-950">Períodos comparados hoje</h3></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <RuleValue label="Período recente" value={`${formatRuleDate(rules.recent_start)} a ${formatRuleDate(rules.recent_end)}`} detail="Últimos 28 dias" />
              <RuleValue label="Período anterior" value={`${formatRuleDate(rules.previous_start)} a ${formatRuleDate(rules.previous_end)}`} detail="As quatro semanas anteriores" />
              <RuleValue label="Histórico necessário" value={`Primeira presença até ${formatRuleDate(rules.history_required_before)}`} detail={`${rules.history_days / 7} semanas para comparação`} />
              <RuleValue label="Rotina mínima" value={`${rules.minimum_total_checkins} presenças no histórico`} detail="Visitas isoladas não viram alerta de retenção" />
              <RuleValue label="Fila operacional" value={`Até ${rules.operational_inactive_days} dias sem presença`} detail="Ausências maiores ficam separadas como reativação histórica" />
              <RuleValue label="Linha de base" value={rules.baseline_at ? formatRuleDate(rules.baseline_at) : 'Aguardando primeira importação'} detail="Marca o início do acompanhamento deste box" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h3 className="font-bold text-slate-950">Quando cada sinal aparece</h3><p className="text-sm text-slate-500">Basta atingir o limite de ausência ou o limite de queda.</p></CardHeader>
            <CardContent className="space-y-3">
              <RuleLevel level="attention" inactiveDays={rules.attention_inactive_days} drop={rules.attention_drop_percentage} />
              <RuleLevel level="at_risk" inactiveDays={rules.at_risk_inactive_days} drop={rules.at_risk_drop_percentage} />
              <RuleLevel level="critical" inactiveDays={rules.critical_inactive_days} drop={rules.critical_drop_percentage} />
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">A porcentagem de queda só é calculada quando o aluno teve pelo menos <strong>{rules.minimum_previous_checkins} check-ins</strong> nas quatro semanas anteriores.</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h3 className="font-bold text-slate-950">Como ler os primeiros 30 dias</h3><p className="text-sm text-slate-500">A seção combina a confiança da data de início com o estágio observado da rotina.</p></CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Confiança da data</p>
                <div className="space-y-2">
                  <OnboardingRuleTag info={membershipConfidenceInfo('confirmed')} description="A data foi confirmada pelo box ou recebida de uma integração." />
                  <OnboardingRuleTag info={membershipConfidenceInfo('probable')} description={`É a primeira presença depois de pelo menos ${rules.history_days / 7} semanas cobertas pela plataforma sem outro check-in. Pode ser um novo aluno ou um retorno após longa ausência.`} />
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Formação da rotina</p>
                <div className="space-y-2">
                  <OnboardingRuleTag info={onboardingStatusInfo('no_first_visit')} description="Existe uma data de início confirmada, mas ainda não há presença registrada desde essa data." />
                  <OnboardingRuleTag info={onboardingStatusInfo('building_habit')} description="Só houve a primeira presença e ainda não se passaram três dias desde o início." />
                  <OnboardingRuleTag info={onboardingStatusInfo('needs_second_visit')} description="Houve uma primeira presença, já se passaram pelo menos três dias e a segunda ainda não aconteceu." />
                  <OnboardingRuleTag info={onboardingStatusInfo('on_track')} description={`Há pelo menos duas presenças e o aluno não atingiu o limite atual de ${rules.at_risk_inactive_days} dias sem check-in.`} />
                  <OnboardingRuleTag info={onboardingStatusInfo('interrupted')} description={`Depois de formar uma rotina com pelo menos duas presenças, o aluno chegou a ${rules.at_risk_inactive_days} dias ou mais sem check-in.`} />
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">Datas com pouca cobertura anterior não entram nesta seção. Uma importação de 90 dias permite reconhecer inícios prováveis sem descartar o histórico usado no cálculo.</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h3 className="font-bold text-slate-950">Exemplos da sua base</h3><p className="text-sm text-slate-500">Exemplos reais, escolhidos automaticamente a partir do radar atual — sem uso de IA.</p></CardHeader>
            <CardContent>
              {examples.length === 0 ? <p className="text-sm text-slate-500">Ainda não há exemplos classificados nestas faixas.</p> : <div className="space-y-3">{examples.map((item) => {
                const info = levelInfo[item.level];
                return <div key={item.student_id} className="rounded-lg border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-slate-950">{item.student_name}</strong><span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${info.className}`}>{info.label}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{retentionExample(item)}</p></div>;
              })}</div>}
            </CardContent>
          </Card>

          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900"><strong>Importante:</strong> o radar identifica mudanças de frequência. Ele ajuda a priorizar uma conversa, mas não afirma que o aluno irá cancelar.</div>
        </div>
      </div>
    </div>
  );
}

function RuleValue({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 font-bold text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
}

function RuleLevel({ level, inactiveDays, drop }: { level: EngagementLevel; inactiveDays: number; drop: number }) {
  const info = levelInfo[level];
  return <div className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"><span className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ring-1 ${info.className}`}>{info.label}</span><p className="text-sm text-slate-600"><strong>{inactiveDays} dias</strong> sem presença ou queda mínima de <strong>{drop}%</strong></p></div>;
}

function OnboardingRuleTag({ info, description }: { info: { label: string; className: string }; description: string }) {
  return <div className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-start"><span className={`w-fit shrink-0 rounded-full px-2 py-1 text-xs font-semibold ring-1 ${info.className}`}>{info.label}</span><p className="text-sm leading-5 text-slate-600">{description}</p></div>;
}

function selectRuleExamples(items: RetentionRadarItem[]) {
  return (['critical', 'at_risk', 'attention'] as EngagementLevel[]).flatMap((level) => {
    const candidates = items.filter((item) => item.level === level).sort((left, right) => {
      const score = (item: RetentionRadarItem) => (item.signals.some((signal) => signal.code === 'frequency_drop') ? 10 : 0) + (item.signals.some((signal) => signal.code === 'inactive_days') ? 0 : 5);
      const difference = score(right) - score(left);
      if (difference !== 0) return difference;
      return (right.last_checkin || '').localeCompare(left.last_checkin || '');
    });
    return candidates.slice(0, 1);
  });
}

function retentionExample(item: RetentionRadarItem) {
  const details: string[] = [];
  if (item.drop_percentage !== undefined) {
    details.push(`fez ${item.recent_checkins} check-ins no período recente, contra ${item.previous_checkins} no anterior — queda de ${formatDecimal(item.drop_percentage)}%`);
  }
  if (item.signals.some((signal) => signal.code === 'inactive_days') && item.days_since_checkin !== undefined) {
    details.push(`está há ${item.days_since_checkin} dias sem registrar presença`);
  } else if (item.last_checkin) {
    details.push(`a última presença foi em ${formatRuleDate(item.last_checkin)}`);
  }
  return `${details.join('; ')}. Por isso aparece como “${levelInfo[item.level].label}”.`;
}

function formatRuleDate(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR');
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

function MonitoringModal({ item, onClose, onSaved }: { item: RetentionRadarItem; onClose: () => void; onSaved: () => Promise<void> }) {
  const restoring = item.workflow_status === 'excluded';
  const [reason, setReason] = useState<RetentionExclusionReason>(item.retention_exclusion_reason || 'visitor');
  const [temporary, setTemporary] = useState(Boolean(item.retention_excluded_until));
  const [excludedUntil, setExcludedUntil] = useState(item.retention_excluded_until || defaultExclusionDate());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    setSaving(true); setError('');
    try {
      await api.updateRetentionMonitoring(item.student_id, restoring
        ? { status: 'monitored' }
        : { status: 'excluded', reason, excluded_until: temporary ? excludedUntil : undefined });
      await onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível atualizar o monitoramento.'); }
    finally { setSaving(false); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <Card className="w-full rounded-b-none sm:max-w-lg sm:rounded-xl">
        <CardHeader><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-accent">Monitoramento de retenção</p><h2 className="mt-1 text-lg font-bold text-slate-950">{item.student_name}</h2></div><button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Fechar"><X className="h-5 w-5" /></button></div></CardHeader>
        <CardContent className="space-y-4">
          {error && <ErrorState message={error} />}
          {restoring ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><strong>Voltar a acompanhar?</strong><p className="mt-1">O aluno voltará ao radar e aos Primeiros 30 dias quando atender às regras. Check-ins e histórico já permanecem preservados.</p></div> : <>
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900"><strong>Os dados não serão apagados.</strong><p className="mt-1">A exclusão vale somente para Retenção, Dashboard e Primeiros 30 dias. Campanhas, brindes e frequência não são alterados.</p></div>
            <label className="block space-y-1 text-xs font-semibold text-slate-500">Motivo<select className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={reason} onChange={(event) => setReason(event.target.value as RetentionExclusionReason)}><option value="visitor">Visitante ou drop-in</option><option value="former_member">Ex-aluno ou cancelado</option><option value="long_pause">Pausa longa</option><option value="outside_retention">Fora do público de retenção</option><option value="other">Outro</option></select></label>
            <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700"><input className="mt-1" type="checkbox" checked={temporary} onChange={(event) => setTemporary(event.target.checked)} /><span><strong>Exclusão temporária</strong><span className="mt-0.5 block text-xs font-normal text-slate-500">Ao vencer, o aluno volta automaticamente ao radar.</span></span></label>
            {temporary && <label className="block space-y-1 text-xs font-semibold text-slate-500">Não acompanhar até<Input className="mt-1" type="date" min={todayDate()} value={excludedUntil} onChange={(event) => setExcludedUntil(event.target.value)} /></label>}
          </>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button disabled={saving || (!restoring && temporary && !excludedUntil)} onClick={() => void save()}>{saving ? 'Salvando...' : restoring ? 'Voltar a acompanhar' : 'Confirmar exclusão'}</Button></div>
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

function exclusionReasonLabel(value?: RetentionExclusionReason) {
  if (!value) return 'Não informado';
  return {
    visitor: 'Visitante ou drop-in',
    former_member: 'Ex-aluno ou cancelado',
    long_pause: 'Pausa longa',
    outside_retention: 'Fora do público de retenção',
    other: 'Outro',
  }[value];
}

function OnboardingPanel({ items, loading, onReload, onFrequency, onAction, onMonitoring }: {
  items: OnboardingJourneyItem[];
  loading: boolean;
  onReload: () => Promise<void>;
  onFrequency: (item: OnboardingJourneyItem) => void;
  onAction: (item: OnboardingJourneyItem) => void;
  onMonitoring: (item: OnboardingJourneyItem) => void;
}) {
  if (loading && items.length === 0) return <LoadingState />;
  if (items.length === 0) return <Card><CardContent className="p-5"><EmptyState message="Nenhum início confirmado ou provável nos últimos 30 dias" /></CardContent></Card>;
  return (
    <Card>
      <CardHeader><h2 className="font-bold text-slate-950">Formação da rotina</h2><p className="text-sm text-slate-500">Inclui datas confirmadas e primeiras presenças com pelo menos oito semanas anteriores de cobertura sem outro check-in.</p></CardHeader>
      <CardContent className="divide-y divide-slate-100 p-0">
        {items.map((item) => <OnboardingRow key={item.student_id} item={item} onReload={onReload} onFrequency={() => onFrequency(item)} onAction={() => onAction(item)} onMonitoring={() => onMonitoring(item)} />)}
      </CardContent>
    </Card>
  );
}

function OnboardingRow({ item, onReload, onFrequency, onAction, onMonitoring }: {
  item: OnboardingJourneyItem;
  onReload: () => Promise<void>;
  onFrequency: () => void;
  onAction: () => void;
  onMonitoring: () => void;
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
  const confidence = membershipConfidenceInfo(item.membership_start_confidence);
  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[minmax(190px,1fr)_minmax(250px,1.4fr)_minmax(230px,1fr)_auto] lg:items-center lg:px-5">
      <div><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-slate-950">{item.student_name}</p><span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${status.className}`}>{status.label}</span><span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${confidence.className}`}>{confidence.label}</span></div><p className="mt-1 text-xs text-slate-500">Dia {item.day} · {sourceLabel(item.source)}</p></div>
      <div><p className="text-sm text-slate-600">{item.status_message}</p><p className="mt-1 text-xs text-slate-500"><strong className="text-slate-700">{item.recommendation.title}:</strong> {item.recommendation.message}</p></div>
      <div>
        <div className="grid grid-cols-3 gap-2 text-center"><SmallMetric label="7 dias" value={item.checkins_first_7_days} /><SmallMetric label="14 dias" value={item.checkins_first_14_days} /><SmallMetric label="30 dias" value={item.checkins_first_30_days} /></div>
        <div className="mt-2 flex items-end gap-2"><label className="flex-1 text-xs font-semibold text-slate-500">Início<Input className="mt-1" type="date" value={startedAt} max={todayDate()} onChange={(event) => setStartedAt(event.target.value)} /></label><Button variant="ghost" disabled={saving || (startedAt === item.membership_started_at && item.membership_start_confidence === 'confirmed')} onClick={() => void saveStart()}>{saving ? 'Salvando' : 'Confirmar data'}</Button></div>
        <p className="mt-1 text-[11px] text-slate-400">{item.membership_start_confidence === 'probable' ? `Início provável: havia ${item.observation_days_before_start} dias cobertos sem presença anterior. Confirme a data se souber.` : 'Data confirmada pela operação.'}</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <div className="grid gap-2"><Button variant="secondary" onClick={onFrequency}><CalendarDays className="h-4 w-4" />Ver frequência</Button><Button variant="secondary" onClick={onAction}>Registrar ação</Button><Button variant="ghost" onClick={onMonitoring}><Ban className="h-4 w-4" />Não acompanhar</Button></div>
    </div>
  );
}

function membershipConfidenceInfo(confidence: OnboardingJourneyItem['membership_start_confidence']) {
  return confidence === 'confirmed'
    ? { label: 'Início confirmado', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' }
    : { label: 'Início provável', className: 'bg-violet-50 text-violet-700 ring-violet-200' };
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
          <Card><CardHeader><h2 className="font-bold text-slate-950">Fila atual</h2><p className="text-sm text-slate-500">Retrato de hoje, independente do período selecionado.</p></CardHeader><CardContent className="grid grid-cols-2 gap-3"><SmallMetric label="Precisam de ação" value={summary.needs_action} /><SmallMetric label="Revisões vencidas" value={summary.follow_up_due} /><SmallMetric label="Em acompanhamento" value={summary.waiting_return} /><SmallMetric label="Retornos destacados" value={summary.recovered} /><SmallMetric label="Inativos históricos" value={summary.historical_inactive} /><SmallMetric label="Não acompanhados" value={summary.excluded} /></CardContent></Card>
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

function matchesQueue(status: RetentionWorkflowStatus, queue: RetentionQueue) {
  if (queue === 'all') return true;
  if (queue === 'action') return status === 'needs_action' || status === 'follow_up_due';
  if (queue === 'waiting') return status === 'waiting_return';
  if (queue === 'recovered') return status === 'recovered';
  if (queue === 'historical') return status === 'historical';
  if (queue === 'excluded') return status === 'excluded';
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
    historical: { label: 'Inativo histórico · revisar para reativação', tone: 'text-slate-600' },
    excluded: { label: 'Não acompanhado pelo radar', tone: 'text-slate-500' },
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

function defaultExclusionDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
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
