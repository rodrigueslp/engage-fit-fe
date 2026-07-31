import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Gift, HeartPulse, Sparkles, Target, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { PageKey } from '../../app/App';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { KpiCard } from '../../components/common/KpiCard';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { api } from '../../features/api/endpoints';
import type { Campaign, DashboardSummary, OnboardingJourneyItem, RetentionRadarItem, RewardDelivery, Student } from '../../features/api/types';

const dashboardPageSize = 5;

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [nearGoal, setNearGoal] = useState<Student[]>([]);
  const [pendingRewards, setPendingRewards] = useState<RewardDelivery[]>([]);
  const [retention, setRetention] = useState<RetentionRadarItem[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingJourneyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.dashboardSummary(),
      api.activeCampaigns(),
      api.nearGoalStudents(),
      api.pendingRewards(),
      api.retentionRadar(),
      api.onboardingJourney(),
    ])
      .then(([nextSummary, nextCampaigns, nextNearGoal, nextPendingRewards, nextRetention, nextOnboarding]) => {
        setSummary(nextSummary);
        setCampaigns(nextCampaigns);
        setNearGoal(nextNearGoal);
        setPendingRewards(nextPendingRewards);
        setRetention(nextRetention);
        setOnboarding(nextOnboarding);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const retentionPriorities = useMemo(
    () => retention.filter((item) => item.workflow_status === 'needs_action' || item.workflow_status === 'follow_up_due'),
    [retention],
  );
  const orderedOnboarding = useMemo(
    () => [...onboarding].sort((left, right) => onboardingPriority(right.status) - onboardingPriority(left.status)),
    [onboarding],
  );

  if (loading) return <LoadingState label="Carregando dashboard" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-5">
      <PageHeader title="Dashboard" eyebrow="Operação do dia" description="Uma visão direta de frequência, retenção, metas e pendências da academia." />

      <Card className="overflow-hidden border-slate-300">
        <CardHeader className="bg-slate-950 text-white">
          <h2 className="text-base font-bold">Prioridades de hoje</h2>
          <p className="mt-1 text-sm text-slate-300">Atalhos para as ações que movimentam retenção e campanhas.</p>
        </CardHeader>
        <CardContent className="grid gap-3 p-3 md:grid-cols-3">
          <AttentionItem label="Ações de retenção" value={retentionPriorities.length} description="Contatos ou retornos para acompanhar" icon={HeartPulse} tone="danger" page="retention" />
          <AttentionItem label="Quase lá" value={nearGoal.length} description="Alunos próximos de atingir a meta" icon={Target} tone="info" page="whatsapp" />
          <AttentionItem label="Brindes pendentes" value={pendingRewards.length} description="Recompensas aguardando entrega" icon={Gift} tone="warning" page="rewards" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard label="Alunos cadastrados" value={summary?.total_students ?? 0} icon={Users} tone="neutral" />
        <KpiCard label="Check-ins no mês" value={summary?.total_checkins ?? 0} icon={Activity} tone="info" />
        <KpiCard label="Metas atingidas" value={summary?.eligible_students ?? 0} icon={CheckCircle2} tone="success" />
        <KpiCard label="Campanhas ativas" value={campaigns.length} icon={Target} tone="brand" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <PaginatedDashboardList
          title="Retenção prioritária"
          total={retentionPriorities.length}
          items={retentionPriorities}
          emptyMessage="Nenhuma ação de retenção pendente"
          action={{ label: 'Abrir retenção', page: 'retention' }}
          renderItem={(item) => <RetentionPriorityRow key={item.student_id} item={item} />}
        />
        <PaginatedDashboardList
          title="Primeiros 30 dias"
          total={orderedOnboarding.length}
          items={orderedOnboarding}
          emptyMessage="Nenhum aluno nos primeiros 30 dias"
          action={{ label: 'Ver jornada', page: 'retention' }}
          renderItem={(item) => <OnboardingPriorityRow key={item.student_id} item={item} />}
        />
        <PaginatedDashboardList
          title="Brindes pendentes"
          total={pendingRewards.length}
          items={pendingRewards}
          emptyMessage="Nenhum brinde pendente"
          action={{ label: 'Gerenciar brindes', page: 'rewards' }}
          renderItem={(delivery) => (
            <div key={delivery.id} className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
              <div className="min-w-0"><p className="truncate font-semibold text-slate-950">{delivery.student_name ?? delivery.student_id}</p><p className="truncate text-sm text-slate-500">{delivery.reward_name ?? delivery.reward_id}</p></div>
              <StatusBadge value="warning" label="Pendente" />
            </div>
          )}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div><h2 className="text-sm font-bold text-slate-950">Campanhas em andamento</h2><p className="mt-1 text-xs text-slate-500">Períodos ativos que alimentam metas, mensagens e brindes.</p></div>
          <Button type="button" variant="secondary" onClick={() => navigate('campaigns')}>Ver campanhas<ArrowRight className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? <EmptyState message="Nenhuma campanha ativa" /> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-950">{campaign.name}</p><p className="mt-1 text-xs text-slate-500">{formatDate(campaign.start_date)} até {formatDate(campaign.end_date)}</p></div><StatusBadge value="active" label="Ativa" /></div>
            </div>
          ))}</div>}
        </CardContent>
      </Card>
    </div>
  );
}

function AttentionItem({ label, value, description, icon: Icon, tone, page }: { label: string; value: number; description: string; icon: React.ElementType; tone: 'danger' | 'warning' | 'info'; page: PageKey }) {
  const tones = { danger: 'bg-rose-50 text-rose-700', warning: 'bg-amber-50 text-amber-700', info: 'bg-sky-50 text-sky-700' };
  return <button type="button" className="group flex items-center gap-3 rounded-lg p-3 text-left transition hover:bg-slate-50" onClick={() => navigate(page)}>
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}><Icon className="h-5 w-5" /></span>
    <span className="min-w-0 flex-1"><span className="block text-2xl font-bold text-slate-950">{value}</span><span className="block text-sm font-bold text-slate-800">{label}</span><span className="block text-xs text-slate-500">{description}</span></span>
    <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
  </button>;
}

function PaginatedDashboardList<T>({ title, total, items, emptyMessage, action, renderItem }: { title: string; total: number; items: T[]; emptyMessage: string; action: { label: string; page: PageKey }; renderItem: (item: T) => React.ReactNode }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / dashboardPageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = items.slice((currentPage - 1) * dashboardPageSize, currentPage * dashboardPageSize);

  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  return <Card>
    <CardHeader className="flex flex-row items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-slate-950">{title}</h2>{total > 0 && <p className="mt-1 text-xs font-semibold text-slate-400">{total} no total</p>}</div><Button type="button" variant="ghost" className="h-8 px-2 text-xs" onClick={() => navigate(action.page)}>{action.label}</Button></CardHeader>
    <CardContent className="py-2">
      {items.length === 0 ? <EmptyState message={emptyMessage} /> : visibleItems.map(renderItem)}
      {totalPages > 1 && <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><p className="text-xs font-semibold text-slate-400">Página {currentPage} de {totalPages}</p><div className="flex gap-2"><Button type="button" variant="secondary" className="h-8 px-2 text-xs" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</Button><Button type="button" variant="secondary" className="h-8 px-2 text-xs" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Próxima</Button></div></div>}
    </CardContent>
  </Card>;
}

function RetentionPriorityRow({ item }: { item: RetentionRadarItem }) {
  return <div className="flex items-start gap-3 border-b border-slate-100 py-3 last:border-0"><span className="rounded-lg bg-orange-50 p-2 text-orange-700"><AlertTriangle className="h-4 w-4" /></span><div className="min-w-0"><p className="font-semibold text-slate-950">{item.student_name}</p><p className="mt-1 text-sm text-slate-600">{item.recommendation.title}</p><p className="mt-1 text-xs text-slate-400">{item.workflow_status === 'follow_up_due' ? 'Retorno de acompanhamento vencido' : item.recommendation.message}</p></div></div>;
}

function OnboardingPriorityRow({ item }: { item: OnboardingJourneyItem }) {
  const labels: Record<OnboardingJourneyItem['status'], string> = { no_first_visit: 'Ainda sem primeira presença', needs_second_visit: 'Precisa consolidar a segunda visita', interrupted: 'Jornada interrompida', building_habit: 'Construindo hábito', on_track: 'No caminho certo' };
  return <div className="flex items-start gap-3 border-b border-slate-100 py-3 last:border-0"><span className="rounded-lg bg-sky-50 p-2 text-sky-700"><Sparkles className="h-4 w-4" /></span><div className="min-w-0"><p className="font-semibold text-slate-950">{item.student_name}</p><p className="mt-1 text-sm text-slate-600">{labels[item.status]}</p><p className="mt-1 text-xs text-slate-400">Dia {item.day} · {item.status_message}</p></div></div>;
}

function onboardingPriority(status: OnboardingJourneyItem['status']) {
  return { interrupted: 5, no_first_visit: 4, needs_second_visit: 3, building_habit: 2, on_track: 1 }[status];
}

function navigate(page: PageKey) { window.location.hash = page; }

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}
