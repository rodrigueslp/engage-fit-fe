import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Gift, Target, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { KpiCard } from '../../components/common/KpiCard';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { api } from '../../features/api/endpoints';
import type { Campaign, DashboardSummary, RewardDelivery, Student } from '../../features/api/types';

const dashboardPageSize = 5;
const riskStatusLabels: Record<NonNullable<Student['risk_status']>, string> = {
  active: 'Ativo',
  observing: 'Em observação',
  paused: 'Pausado',
  not_interested: 'Não quer continuar',
};

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [nearGoal, setNearGoal] = useState<Student[]>([]);
  const [atRisk, setAtRisk] = useState<Student[]>([]);
  const [pendingRewards, setPendingRewards] = useState<RewardDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function updateRiskStatus(studentId: string, riskStatus: NonNullable<Student['risk_status']>) {
    setError('');
    try {
      await api.updateStudentRiskStatus(studentId, riskStatus);
      setAtRisk((students) => students.map((student) => (student.id === studentId ? { ...student, risk_status: riskStatus } : student)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar acompanhamento');
    }
  }

  useEffect(() => {
    Promise.all([api.dashboardSummary(), api.activeCampaigns(), api.nearGoalStudents(), api.atRiskStudents(), api.pendingRewards()])
      .then(([summary, campaigns, nearGoal, atRisk, pendingRewards]) => {
        setSummary(summary);
        setCampaigns(campaigns);
        setNearGoal(nearGoal);
        setAtRisk(atRisk);
        setPendingRewards(pendingRewards);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Carregando dashboard" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-5">
      <PageHeader title="Dashboard" eyebrow="Operação do dia" description="Acompanhe metas, alunos em risco, brindes pendentes e os próximos passos da campanha." />

      <Card className="overflow-hidden border-slate-300">
        <CardHeader className="bg-slate-950 text-white">
          <h2 className="text-base font-bold">Hoje precisa de atenção</h2>
          <p className="mt-1 text-sm text-slate-300">Prioridades operacionais para manter alunos e campanhas em dia.</p>
        </CardHeader>
        <CardContent className="grid gap-3 p-3 md:grid-cols-3">
          <AttentionItem label="Alunos em risco" value={atRisk.length} description="Precisam de acompanhamento" icon={AlertTriangle} tone="danger" page="dashboard" />
          <AttentionItem label="Brindes pendentes" value={pendingRewards.length} description="Aguardando entrega" icon={Gift} tone="warning" page="rewards" />
          <AttentionItem label="Próximos da meta" value={nearGoal.length} description="Uma boa hora para incentivar" icon={Target} tone="info" page="dashboard" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard label="Alunos ativos" value={summary?.total_students ?? 0} icon={Users} tone="neutral" />
        <KpiCard label="Check-ins registrados" value={summary?.total_checkins ?? 0} icon={Activity} tone="info" />
        <KpiCard label="Metas atingidas" value={summary?.eligible_students ?? 0} icon={CheckCircle2} tone="success" />
        <KpiCard label="Campanhas ativas" value={campaigns.length} icon={Target} tone="brand" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <PaginatedDashboardList
          title="Campanhas ativas"
          items={campaigns}
          emptyMessage="Nenhuma campanha ativa"
          renderItem={(campaign) => (
            <div key={campaign.id} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
              <div>
                <p className="font-semibold text-slate-950">{campaign.name}</p>
                <p className="text-sm text-slate-500">{campaign.start_date} até {campaign.end_date}</p>
              </div>
              <StatusBadge value="active" label="Ativa" />
            </div>
          )}
        />
        <PaginatedDashboardList
          title="Alunos em risco"
          items={atRisk}
          emptyMessage="Nenhum aluno em risco"
          renderItem={(student) => <RiskStudentRow key={student.id} student={student} onRiskStatusChange={updateRiskStatus} />}
        />
        <PaginatedDashboardList
          title="Brindes pendentes"
          items={pendingRewards}
          emptyMessage="Nenhum brinde pendente"
          renderItem={(delivery) => (
            <div key={delivery.id} className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
              <div>
                <p className="font-semibold text-slate-950">{delivery.student_name ?? delivery.student_id}</p>
                <p className="text-sm text-slate-500">{delivery.reward_name ?? delivery.reward_id}</p>
                {delivery.student_phone && <p className="text-xs text-slate-400">{delivery.student_phone}</p>}
              </div>
              <StatusBadge value="warning" label="Pendente" />
            </div>
          )}
        />
      </div>
    </div>
  );
}

function AttentionItem({ label, value, description, icon: Icon, tone, page }: { label: string; value: number; description: string; icon: React.ElementType; tone: 'danger' | 'warning' | 'info'; page: string }) {
  const tones = { danger: 'bg-rose-50 text-rose-700', warning: 'bg-amber-50 text-amber-700', info: 'bg-sky-50 text-sky-700' };
  return (
    <button
      type="button"
      className="group flex items-center gap-3 rounded-lg p-3 text-left transition hover:bg-slate-50"
      onClick={() => { window.location.hash = page; }}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}><Icon className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><span className="block text-2xl font-bold text-slate-950">{value}</span><span className="block text-sm font-bold text-slate-800">{label}</span><span className="block text-xs text-slate-500">{description}</span></span>
      <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
    </button>
  );
}

function PaginatedDashboardList<T>({ title, items, emptyMessage, renderItem }: { title: string; items: T[]; emptyMessage: string; renderItem: (item: T) => React.ReactNode }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / dashboardPageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * dashboardPageSize;
  const visibleItems = items.slice(start, start + dashboardPageSize);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-sm font-bold text-slate-950">{title}</h2>
        {items.length > 0 && <span className="text-xs font-semibold text-slate-400">{items.length} total</span>}
      </CardHeader>
      <CardContent className="py-2">
        {items.length === 0 ? <EmptyState message={emptyMessage} /> : visibleItems.map(renderItem)}
        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-400">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="h-8 px-2 text-xs" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                Anterior
              </Button>
              <Button type="button" variant="secondary" className="h-8 px-2 text-xs" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                Próxima
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RiskStudentRow({ student, onRiskStatusChange }: { student: Student; onRiskStatusChange: (studentId: string, riskStatus: NonNullable<Student['risk_status']>) => void }) {
  const riskStatus = student.risk_status ?? 'active';
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
      <div>
        <p className="font-semibold text-slate-950">{student.name}</p>
        <p className="text-sm text-slate-500">{student.phone || student.email || student.external_id}</p>
        <p className="mt-1 text-xs text-slate-400">
          {student.risk_last_message_at ? `Última mensagem: ${formatDateTime(student.risk_last_message_at)}` : 'Sem mensagem de risco registrada'}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <StatusBadge value="warning" label={riskStatusLabels[riskStatus]} />
        <select
          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600"
          value={riskStatus}
          onChange={(event) => onRiskStatusChange(student.id, event.target.value as NonNullable<Student['risk_status']>)}
        >
          {Object.entries(riskStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
