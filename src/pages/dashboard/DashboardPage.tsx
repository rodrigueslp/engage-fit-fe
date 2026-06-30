import { Activity, AlertTriangle, CheckCircle2, Gift, MessageCircle, RefreshCw, Target, Users } from 'lucide-react';
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard label="Alunos" value={summary?.total_students ?? 0} icon={Users} />
        <KpiCard label="Check-ins" value={summary?.total_checkins ?? 0} icon={Activity} />
        <KpiCard label="Elegíveis" value={summary?.eligible_students ?? 0} icon={CheckCircle2} />
        <KpiCard label="Próximos" value={summary?.near_goal_students ?? 0} icon={Target} />
        <KpiCard label="Em risco" value={summary?.at_risk_students ?? 0} icon={AlertTriangle} />
        <KpiCard label="Brindes" value={summary?.pending_rewards ?? 0} icon={Gift} />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <ShortcutButton label="Brindes" description="Baixar entregas pendentes" icon={Gift} page="rewards" />
        <ShortcutButton label="Relatórios" description="Exportar recortes operacionais" icon={CheckCircle2} page="reports" />
        <ShortcutButton label="WhatsApp" description="Disparos e falhas recentes" icon={MessageCircle} page="whatsapp" />
        <ShortcutButton label="Automação" description="Histórico da rotina diária" icon={RefreshCw} page="automation" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
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
          title="Próximos da meta"
          items={nearGoal}
          emptyMessage="Nenhum aluno próximo da meta"
          renderItem={(student) => <StudentRow key={student.id} student={student} />}
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

function ShortcutButton({ label, description, icon: Icon, page }: { label: string; description: string; icon: React.ElementType; page: string }) {
  return (
    <button
      type="button"
      className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3 text-left transition hover:border-accent hover:bg-accent-soft"
      onClick={() => { window.location.hash = page; }}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700"><Icon className="h-4 w-4" /></span>
      <span>
        <span className="block text-sm font-bold text-slate-950">{label}</span>
        <span className="block text-xs font-semibold text-slate-500">{description}</span>
      </span>
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

function StudentRow({ student, warning = false }: { student: Student; warning?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
      <div>
        <p className="font-semibold text-slate-950">{student.name}</p>
        <p className="text-sm text-slate-500">{student.phone || student.email || student.external_id}</p>
      </div>
      <StatusBadge value={warning ? 'warning' : student.source} label={warning ? 'Risco' : student.source} />
    </div>
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
