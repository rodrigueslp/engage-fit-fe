import { Download, Gift, Medal, CalendarDays } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { api } from '../../features/api/endpoints';
import type { EligibleStudentReport, MonthlyFrequencyReport, RewardDelivery } from '../../features/api/types';

type ReportKey = 'eligible' | 'pending_rewards' | 'monthly_frequency';

const reports = [
  { key: 'eligible', title: 'Elegíveis', description: 'Alunos que bateram a meta da campanha.', icon: Medal },
  { key: 'pending_rewards', title: 'Brindes pendentes', description: 'Entregas de brinde ainda em aberto.', icon: Gift },
  { key: 'monthly_frequency', title: 'Frequência mensal', description: 'Ranking de check-ins por aluno no mês.', icon: CalendarDays },
] as const;

export function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportKey>('eligible');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [eligibleRows, setEligibleRows] = useState<EligibleStudentReport[]>([]);
  const [pendingRewardRows, setPendingRewardRows] = useState<RewardDelivery[]>([]);
  const [frequencyRows, setFrequencyRows] = useState<MonthlyFrequencyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const selectedReportConfig = reports.find((report) => report.key === selectedReport) ?? reports[0];
  const filteredEligibleRows = useMemo(
    () => eligibleRows.filter((row) => matchesSearch([
      row.campaign_name,
      row.student_name,
      row.student_phone,
      row.source,
      row.reward_name,
    ], search) && matchesSelect(row.source, sourceFilter) && matchesSelect(row.campaign_id, campaignFilter)),
    [campaignFilter, eligibleRows, search, sourceFilter],
  );
  const filteredPendingRewardRows = useMemo(
    () => pendingRewardRows.filter((row) => matchesSearch([
      row.campaign_name,
      row.student_name,
      row.student_phone,
      row.reward_name,
    ], search) && matchesSelect(row.campaign_id, campaignFilter)),
    [campaignFilter, pendingRewardRows, search],
  );
  const filteredFrequencyRows = useMemo(
    () => frequencyRows.filter((row) => matchesSearch([
      row.student_name,
      row.student_phone,
      row.source,
    ], search) && matchesSelect(row.source, sourceFilter)),
    [frequencyRows, search, sourceFilter],
  );
  const campaignOptions = useMemo(() => {
    const rows = selectedReport === 'eligible' ? filteredCampaignSource(eligibleRows) : filteredCampaignSource(pendingRewardRows);
    return Array.from(rows).sort((a, b) => a.label.localeCompare(b.label));
  }, [eligibleRows, pendingRewardRows, selectedReport]);
  const rowCount = useMemo(() => {
    if (selectedReport === 'eligible') return filteredEligibleRows.length;
    if (selectedReport === 'pending_rewards') return filteredPendingRewardRows.length;
    return filteredFrequencyRows.length;
  }, [filteredEligibleRows.length, filteredFrequencyRows.length, filteredPendingRewardRows.length, selectedReport]);

  useEffect(() => {
    loadReport();
  }, [selectedReport, month]);

  useEffect(() => {
    setSearch('');
    setSourceFilter('all');
    setCampaignFilter('all');
  }, [selectedReport]);

  async function loadReport() {
    setError('');
    setLoading(true);
    try {
      if (selectedReport === 'eligible') {
        setEligibleRows(await api.eligibleStudentsReport());
      } else if (selectedReport === 'pending_rewards') {
        setPendingRewardRows(await api.pendingRewardsReport());
      } else {
        setFrequencyRows(await api.monthlyFrequencyReport(month));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  }

  async function exportCSV() {
    setError('');
    setExporting(true);
    try {
      const { filename, headers, rows } = reportExportData(selectedReport, month, filteredEligibleRows, filteredPendingRewardRows, filteredFrequencyRows);
      downloadCSV(filename, headers, rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar relatório');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Relatórios" eyebrow="Exportação e auditoria" description="Acompanhe elegíveis, brindes pendentes e frequência mensal com filtros prontos para exportar." />

      {error && <ErrorState message={error} />}

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-panel" role="tablist" aria-label="Tipo de relatório">
        {reports.map((report) => {
          const Icon = report.icon;
          const active = selectedReport === report.key;
          return (
            <button
              key={report.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-4 text-left text-sm font-bold transition ${active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setSelectedReport(report.key)}
            >
              <Icon className="h-4 w-4" />{report.title}
            </button>
          );
        })}
      </div>
      <p className="-mt-3 text-sm text-slate-500">{selectedReportConfig.description}</p>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950">{selectedReportConfig.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{rowCount} registro(s) encontrados.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {selectedReport === 'monthly_frequency' && (
                <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
              )}
              <Button type="button" variant="secondary" disabled={loading || exporting} onClick={exportCSV}>
                <Download className="h-4 w-4" />
                {exporting ? 'Exportando' : 'Exportar CSV'}
              </Button>
            </div>
          </div>
          <div className="mt-4 grid gap-2 lg:grid-cols-4">
            <Input
              className={selectedReport === 'pending_rewards' ? 'lg:col-span-2' : ''}
              placeholder={filterPlaceholder(selectedReport)}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {selectedReport !== 'monthly_frequency' && (
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm"
                value={campaignFilter}
                onChange={(event) => setCampaignFilter(event.target.value)}
              >
                <option value="all">Todas as campanhas</option>
                {campaignOptions.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>{campaign.label}</option>
                ))}
              </select>
            )}
            {selectedReport !== 'pending_rewards' && (
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm"
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
              >
                <option value="all">Todas as plataformas</option>
                <option value="wellhub">Wellhub</option>
                <option value="totalpass">TotalPass</option>
              </select>
            )}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {loading ? (
            <div className="p-5">
              <LoadingState label="Carregando relatório" />
            </div>
          ) : selectedReport === 'eligible' ? (
            <EligibleStudentsTable rows={filteredEligibleRows} />
          ) : selectedReport === 'pending_rewards' ? (
            <PendingRewardsTable rows={filteredPendingRewardRows} />
          ) : (
            <MonthlyFrequencyTable rows={filteredFrequencyRows} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EligibleStudentsTable({ rows }: { rows: EligibleStudentReport[] }) {
  if (rows.length === 0) return <div className="p-5"><EmptyState message="Nenhum aluno elegível encontrado" /></div>;

  return (
    <div className="divide-y divide-slate-100">
      <div className="hidden grid-cols-[1.2fr_1.2fr_120px_120px_1fr] px-5 py-3 text-xs font-bold uppercase text-slate-500 md:grid">
        <span>Campanha</span>
        <span>Aluno</span>
        <span>Plataforma</span>
        <span>Check-ins</span>
        <span>Brinde</span>
      </div>
      {rows.map((row) => (
        <div key={`${row.campaign_id}-${row.student_id}`} className="space-y-3 px-4 py-4 md:grid md:grid-cols-[1.2fr_1.2fr_120px_120px_1fr] md:items-center md:gap-3 md:space-y-0 md:px-5">
          <p className="text-sm text-slate-500 md:font-semibold md:text-slate-950">{row.campaign_name}</p>
          <div>
            <p className="font-semibold text-slate-950">{row.student_name}</p>
            <p className="mt-1 text-xs text-slate-400">{row.student_phone || 'Sem telefone'}</p>
          </div>
          <div><StatusBadge value={row.source} label={row.source} /></div>
          <span className="text-sm font-bold text-slate-700"><span className="font-normal text-slate-500 md:hidden">Check-ins: </span>{row.current_checkins}/{row.target_checkins}</span>
          <span className="text-sm text-slate-600"><span className="text-slate-500 md:hidden">Brinde: </span>{row.reward_name || '-'}</span>
        </div>
      ))}
    </div>
  );
}

function PendingRewardsTable({ rows }: { rows: RewardDelivery[] }) {
  if (rows.length === 0) return <div className="p-5"><EmptyState message="Nenhum brinde pendente" /></div>;

  return (
    <div className="divide-y divide-slate-100">
      <div className="hidden grid-cols-[1.2fr_1.2fr_1fr_120px] px-5 py-3 text-xs font-bold uppercase text-slate-500 md:grid">
        <span>Campanha</span>
        <span>Aluno</span>
        <span>Brinde</span>
        <span>Status</span>
      </div>
      {rows.map((row) => (
        <div key={row.id} className="space-y-3 px-4 py-4 md:grid md:grid-cols-[1.2fr_1.2fr_1fr_120px] md:items-center md:gap-3 md:space-y-0 md:px-5">
          <p className="text-sm text-slate-500 md:font-semibold md:text-slate-950">{row.campaign_name ?? 'Campanha'}</p>
          <div>
            <p className="font-semibold text-slate-950">{row.student_name ?? row.student_id}</p>
            <p className="mt-1 text-xs text-slate-400">{row.student_phone || 'Sem telefone'}</p>
          </div>
          <span className="text-sm text-slate-600"><span className="text-slate-500 md:hidden">Brinde: </span>{row.reward_name ?? row.reward_id}</span>
          <div><StatusBadge value="warning" label="Pendente" /></div>
        </div>
      ))}
    </div>
  );
}

function MonthlyFrequencyTable({ rows }: { rows: MonthlyFrequencyReport[] }) {
  if (rows.length === 0) return <div className="p-5"><EmptyState message="Nenhum check-in encontrado para o mês" /></div>;

  return (
    <div className="divide-y divide-slate-100">
      <div className="hidden grid-cols-[1.4fr_120px_120px_140px_140px] px-5 py-3 text-xs font-bold uppercase text-slate-500 md:grid">
        <span>Aluno</span>
        <span>Plataforma</span>
        <span>Check-ins</span>
        <span>Primeiro</span>
        <span>Ultimo</span>
      </div>
      {rows.map((row) => (
        <div key={row.student_id} className="space-y-3 px-4 py-4 md:grid md:grid-cols-[1.4fr_120px_120px_140px_140px] md:items-center md:gap-3 md:space-y-0 md:px-5">
          <div>
            <p className="font-semibold text-slate-950">{row.student_name}</p>
            <p className="mt-1 text-xs text-slate-400">{row.student_phone || 'Sem telefone'}</p>
          </div>
          <div><StatusBadge value={row.source} label={row.source} /></div>
          <span className="text-sm font-semibold text-slate-700"><span className="font-normal text-slate-500 md:hidden">Check-ins: </span>{row.checkins}</span>
          <span className="text-sm text-slate-600"><span className="text-slate-500 md:hidden">Primeiro: </span>{formatDate(row.first_checkin)}</span>
          <span className="text-sm text-slate-600"><span className="text-slate-500 md:hidden">Último: </span>{formatDate(row.last_checkin)}</span>
        </div>
      ))}
    </div>
  );
}

function reportExportData(report: ReportKey, month: string, eligibleRows: EligibleStudentReport[], pendingRows: RewardDelivery[], frequencyRows: MonthlyFrequencyReport[]) {
  if (report === 'eligible') {
    return {
      filename: 'relatório-elegíveis.csv',
      headers: ['campanha', 'aluno', 'telefone', 'plataforma', 'checkins', 'meta', 'faltam', 'progresso', 'brinde'],
      rows: eligibleRows.map((row) => [
        row.campaign_name,
        row.student_name,
        row.student_phone,
        row.source,
        String(row.current_checkins),
        String(row.target_checkins),
        String(row.remaining_checkins),
        `${Math.round(row.progress_percentage)}%`,
        row.reward_name,
      ]),
    };
  }
  if (report === 'pending_rewards') {
    return {
      filename: 'relatório-brindes-pendentes.csv',
      headers: ['campanha', 'aluno', 'telefone', 'brinde', 'status'],
      rows: pendingRows.map((row) => [
        row.campaign_name ?? '',
        row.student_name ?? '',
        row.student_phone ?? '',
        row.reward_name ?? '',
        'pendente',
      ]),
    };
  }
  return {
    filename: `relatório-frequência-${month}.csv`,
    headers: ['aluno', 'telefone', 'plataforma', 'checkins', 'primeiro_checkin', 'ultimo_checkin'],
    rows: frequencyRows.map((row) => [
      row.student_name,
      row.student_phone,
      row.source,
      String(row.checkins),
      row.first_checkin,
      row.last_checkin,
    ]),
  };
}

function filteredCampaignSource(rows: Array<EligibleStudentReport | RewardDelivery>) {
  const options = new Map<string, { id: string; label: string }>();
  rows.forEach((row) => {
    if (row.campaign_id && row.campaign_name) {
      options.set(row.campaign_id, { id: row.campaign_id, label: row.campaign_name });
    }
  });
  return options.values();
}

function matchesSearch(values: Array<string | undefined>, search: string) {
  const normalizedSearch = normalize(search);
  if (!normalizedSearch) return true;
  return values.some((value) => normalize(value ?? '').includes(normalizedSearch));
}

function matchesSelect(value: string | undefined, selected: string) {
  return selected === 'all' || value === selected;
}

function filterPlaceholder(report: ReportKey) {
  if (report === 'eligible') return 'Buscar campanha, aluno, telefone ou brinde';
  if (report === 'pending_rewards') return 'Buscar campanha, aluno, telefone ou brinde';
  return 'Buscar aluno, telefone ou plataforma';
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function formatDate(value: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`));
}
