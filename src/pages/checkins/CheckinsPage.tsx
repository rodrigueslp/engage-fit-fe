import { Activity, CalendarDays, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { api } from '../../features/api/endpoints';
import type { MonthlyFrequencyReport, Source } from '../../features/api/types';

const pageSize = 10;

type SortKey = 'checkins_desc' | 'name_asc' | 'recent_desc';

export function CheckinsPage() {
  const initialPeriod = currentMonthPeriod();
  const [startDate, setStartDate] = useState(initialPeriod.start);
  const [endDate, setEndDate] = useState(initialPeriod.end);
  const [appliedPeriod, setAppliedPeriod] = useState(initialPeriod);
  const [rows, setRows] = useState<MonthlyFrequencyReport[]>([]);
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<'all' | Source>('all');
  const [sort, setSort] = useState<SortKey>('checkins_desc');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    if (!startDate || !endDate || endDate < startDate) {
      setError('Informe um período válido.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      setRows(await api.checkinSummary(startDate, endDate));
      setAppliedPeriod({ start: startDate, end: endDate });
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar check-ins');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = rows.filter((row) => {
      const matchesSearch = !query || `${row.student_name} ${row.student_phone}`.toLowerCase().includes(query);
      return matchesSearch && (source === 'all' || row.source === source);
    });
    return [...result].sort((left, right) => {
      if (sort === 'name_asc') return left.student_name.localeCompare(right.student_name, 'pt-BR');
      if (sort === 'recent_desc') return right.last_checkin.localeCompare(left.last_checkin);
      return right.checkins - left.checkins || left.student_name.localeCompare(right.student_name, 'pt-BR');
    });
  }, [rows, search, source, sort]);

  useEffect(() => setPage(1), [search, source, sort]);

  const totalCheckins = rows.reduce((total, row) => total + row.checkins, 0);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Check-ins"
        eyebrow="Frequência dos alunos"
        description="Consulte a quantidade e o período de frequência de cada aluno."
      />

      {error && <ErrorState message={error} />}

      <Card>
        <CardHeader>
          <h2 className="text-base font-bold text-slate-950">Período da consulta</h2>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="space-y-1 text-xs font-semibold text-slate-500">
              Data inicial
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-500">
              Data final
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </label>
            <Button type="button" disabled={loading || !startDate || !endDate || endDate < startDate} onClick={() => void load()}>
              Aplicar período
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Check-ins no período" value={totalCheckins} icon={Activity} />
        <Metric label="Alunos com presença" value={rows.length} icon={Users} />
        <Metric label="Dias consultados" value={daysInclusive(appliedPeriod.start, appliedPeriod.end)} icon={CalendarDays} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950">Frequência por aluno</h2>
              <p className="text-sm text-slate-500">{filtered.length} alunos encontrados</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Input placeholder="Buscar nome ou telefone" value={search} onChange={(event) => setSearch(event.target.value)} />
              <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={source} onChange={(event) => setSource(event.target.value as 'all' | Source)}>
                <option value="all">Todas as plataformas</option>
                <option value="wellhub">Wellhub</option>
                <option value="totalpass">TotalPass</option>
              </select>
              <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
                <option value="checkins_desc">Mais check-ins</option>
                <option value="name_asc">Nome</option>
                <option value="recent_desc">Presença mais recente</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5"><LoadingState /></div>
          ) : filtered.length === 0 ? (
            <div className="p-5"><EmptyState message="Nenhum check-in encontrado para os filtros informados" /></div>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid min-w-[760px] grid-cols-[1.5fr_130px_110px_140px_140px] border-b border-slate-100 px-5 py-3 text-xs font-bold uppercase text-slate-500">
                <span>Aluno</span>
                <span>Plataforma</span>
                <span>Check-ins</span>
                <span>Primeiro</span>
                <span>Último</span>
              </div>
              {visibleRows.map((row) => (
                <div key={row.student_id} className="grid min-w-[760px] grid-cols-[1.5fr_130px_110px_140px_140px] items-center border-b border-slate-100 px-5 py-4 last:border-b-0">
                  <div>
                    <p className="font-semibold text-slate-950">{row.student_name}</p>
                    <p className="mt-1 text-xs text-slate-400">{row.student_phone || 'Sem telefone'}</p>
                  </div>
                  <div><StatusBadge value={row.source} label={row.source} /></div>
                  <span className="text-sm font-bold text-slate-700">{row.checkins}</span>
                  <span className="text-sm text-slate-600">{formatDate(row.first_checkin)}</span>
                  <span className="text-sm text-slate-600">{formatDate(row.last_checkin)}</span>
                </div>
              ))}
              <div className="flex min-w-[760px] items-center justify-between gap-3 px-5 py-3">
                <span className="text-xs font-semibold text-slate-500">
                  {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} de {filtered.length} alunos
                </span>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="secondary" className="h-8 px-2 text-xs" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</Button>
                  <span className="text-xs font-semibold text-slate-500">Página {currentPage} de {totalPages}</span>
                  <Button type="button" variant="secondary" className="h-8 px-2 text-xs" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Próxima</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Activity }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <div className="rounded-md bg-accent-soft p-3 text-accent-dark"><Icon className="h-5 w-5" /></div>
      </CardContent>
    </Card>
  );
}

function currentMonthPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return {
    start: localDate(new Date(year, month, 1)),
    end: localDate(new Date(year, month + 1, 0)),
  };
}

function localDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysInclusive(start: string, end: string) {
  if (!start || !end || end < start) return 0;
  const startTime = new Date(`${start}T00:00:00Z`).getTime();
  const endTime = new Date(`${end}T00:00:00Z`).getTime();
  return Math.round((endTime - startTime) / 86_400_000) + 1;
}

function formatDate(value: string) {
  if (!value) return '—';
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}
