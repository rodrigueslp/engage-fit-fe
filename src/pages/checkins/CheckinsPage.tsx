import { Activity, CalendarDays, Gauge, QrCode, UserCheck, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { api } from '../../features/api/endpoints';
import type { MonthlyFrequencyReport, SelfCheckinSession, Source, Student } from '../../features/api/types';
import { StudentAttendancePanel } from '../../components/checkins/StudentAttendancePanel';
import { sourceLabel } from '../../features/students/source';

const pageSize = 10;

type SortKey = 'checkins_desc' | 'name_asc' | 'recent_desc';

export function CheckinsPage({ canManage = true }: { canManage?: boolean }) {
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
  const [selectedStudent, setSelectedStudent] = useState<MonthlyFrequencyReport>();
  const [boxMembers, setBoxMembers] = useState<Student[]>([]);
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualDate, setManualDate] = useState(localDate(new Date()));
  const [session, setSession] = useState<SelfCheckinSession>();
  const [operation, setOperation] = useState('');
  const [notice, setNotice] = useState('');
  const selfCheckinURL = session?.token ? `${window.location.origin}${window.location.pathname}#/checkin/${session.token}` : '';

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
    if (canManage) {
      api.students().then((items) => setBoxMembers(items.filter((student) => student.source === 'box_member' && !student.anonymized_at))).catch(() => undefined);
    }
  }, []);

  async function createSession() {
    setOperation('qr');
    setError('');
    setNotice('');
    try {
      setSession(await api.createSelfCheckinSession());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível gerar o QR Code.');
    } finally {
      setOperation('');
    }
  }

  async function createManualCheckin(event: React.FormEvent) {
    event.preventDefault();
    if (!manualStudentId) return;
    setOperation('manual');
    setError('');
    setNotice('');
    try {
      const result = await api.createManualCheckin(manualStudentId, manualDate);
      setNotice(result.already_recorded ? 'Esse mensalista já tinha um check-in nessa data.' : 'Check-in manual registrado e campanhas recalculadas.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível registrar o check-in.');
    } finally {
      setOperation('');
    }
  }

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
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">{notice}</div>}

      {canManage && <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><h2 className="flex items-center gap-2 text-base font-bold text-slate-950"><UserCheck className="h-5 w-5 text-accent" />Check-in manual de mensalista</h2><p className="mt-1 text-sm text-slate-500">Use quando a recepção confirmar a presença. Há limite de um check-in por aluno por dia.</p></CardHeader>
          <CardContent>
            <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px_auto] sm:items-end" onSubmit={createManualCheckin}>
              <label className="space-y-1 text-xs font-semibold text-slate-500">Mensalista<select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={manualStudentId} onChange={(event) => setManualStudentId(event.target.value)} required><option value="">Selecione</option>{boxMembers.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
              <label className="space-y-1 text-xs font-semibold text-slate-500">Data<Input type="date" max={localDate(new Date())} value={manualDate} onChange={(event) => setManualDate(event.target.value)} required /></label>
              <Button disabled={!manualStudentId || operation === 'manual'}>{operation === 'manual' ? 'Registrando…' : 'Registrar'}</Button>
            </form>
            {boxMembers.length === 0 && <p className="mt-3 text-xs text-amber-700">Nenhum mensalista ativado. O aluno deve escolher “Mensalista do box” no QR de entrada e confirmar pelo WhatsApp.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="flex items-center gap-2 text-base font-bold text-slate-950"><QrCode className="h-5 w-5 text-accent" />QR Code de check-in</h2><p className="mt-1 text-sm text-slate-500">Exiba na recepção. Cada código vale por 10 minutos e funciona somente para mensalistas ativados.</p></CardHeader>
          <CardContent>
            {selfCheckinURL ? <div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="w-fit rounded-xl border border-slate-200 bg-white p-3"><QRCodeSVG value={selfCheckinURL} size={160} level="M" /></div><div className="min-w-0 space-y-3"><p className="text-sm font-semibold text-slate-700">Válido até {new Date(session!.expires_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p><Button type="button" variant="secondary" disabled={operation === 'qr'} onClick={() => void createSession()}>Gerar novo QR</Button></div></div> : <Button type="button" className="w-full sm:w-auto" disabled={operation === 'qr'} onClick={() => void createSession()}><QrCode className="h-4 w-4" />{operation === 'qr' ? 'Gerando…' : 'Gerar QR de check-in'}</Button>}
          </CardContent>
        </Card>
      </div>}

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
        <Metric label="Média por aluno" value={rows.length ? Math.round((totalCheckins / rows.length) * 10) / 10 : 0} icon={Gauge} />
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
                <option value="all">Todas as origens</option>
                <option value="wellhub">Wellhub</option>
                <option value="totalpass">TotalPass</option>
                <option value="box_member">Mensalistas do box</option>
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
            <>
              <div className="divide-y divide-slate-100 md:hidden">
                {visibleRows.map((row) => (
                  <div key={row.student_id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="font-bold text-slate-950">{row.student_name}</p><p className="mt-0.5 text-xs text-slate-500">{row.student_phone || 'Sem telefone'}</p></div>
                      <StatusBadge value={row.source} label={sourceLabel(row.source)} />
                    </div>
                    <div className="mt-3 grid grid-cols-[auto_1fr] gap-4 rounded-lg bg-slate-50 p-3">
                      <div><p className="text-xs text-slate-500">Check-ins</p><p className="text-xl font-bold text-slate-950">{row.checkins}</p></div>
                      <div className="text-right text-xs text-slate-500"><p>Primeiro: <strong className="text-slate-700">{formatDate(row.first_checkin)}</strong></p><p className="mt-1">Último: <strong className="text-slate-700">{formatDate(row.last_checkin)}</strong></p></div>
                    </div>
                    <Button type="button" variant="secondary" className="mt-3 w-full" onClick={() => setSelectedStudent(row)}><CalendarDays className="h-4 w-4" />Ver histórico completo</Button>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
              <div className="grid min-w-[900px] grid-cols-[1.5fr_120px_90px_120px_120px_150px] border-b border-slate-100 px-5 py-3 text-xs font-bold uppercase text-slate-500">
                <span>Aluno</span>
                <span>Origem</span>
                <span>Check-ins</span>
                <span>Primeiro</span>
                <span>Último</span>
                <span></span>
              </div>
              {visibleRows.map((row) => (
                <div key={row.student_id} className="grid min-w-[900px] grid-cols-[1.5fr_120px_90px_120px_120px_150px] items-center border-b border-slate-100 px-5 py-4 last:border-b-0">
                  <div>
                    <p className="font-semibold text-slate-950">{row.student_name}</p>
                    <p className="mt-1 text-xs text-slate-400">{row.student_phone || 'Sem telefone'}</p>
                  </div>
                  <div><StatusBadge value={row.source} label={sourceLabel(row.source)} /></div>
                  <span className="text-sm font-bold text-slate-700">{row.checkins}</span>
                  <span className="text-sm text-slate-600">{formatDate(row.first_checkin)}</span>
                  <span className="text-sm text-slate-600">{formatDate(row.last_checkin)}</span>
                  <Button type="button" variant="ghost" className="px-2 text-xs" onClick={() => setSelectedStudent(row)}><CalendarDays className="h-4 w-4" />Ver histórico</Button>
                </div>
              ))}
              </div>
              <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                <span className="text-xs font-semibold text-slate-500">
                  {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} de {filtered.length} alunos
                </span>
                <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
                  <Button type="button" variant="secondary" className="px-2 text-xs" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</Button>
                  <span className="text-xs font-semibold text-slate-500">Página {currentPage} de {totalPages}</span>
                  <Button type="button" variant="secondary" className="px-2 text-xs" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Próxima</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {selectedStudent && <StudentAttendancePanel student={{ id: selectedStudent.student_id, name: selectedStudent.student_name, phone: selectedStudent.student_phone, source: selectedStudent.source }} onClose={() => setSelectedStudent(undefined)} />}
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

function formatDate(value: string) {
  if (!value) return '—';
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}
