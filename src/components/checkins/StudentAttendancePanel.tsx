import { Activity, CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../features/api/endpoints';
import type { Source, StudentCheckin } from '../../features/api/types';
import { EmptyState, ErrorState, LoadingState } from '../common/State';
import { Button } from '../ui/button';
import { sourceLabel } from '../../features/students/source';

type StudentSummary = {
  id: string;
  name: string;
  phone?: string;
  source: Source;
};

const weekdayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const shortWeekdayLabels = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

export function StudentAttendancePanel({ student, onClose }: { student: StudentSummary; onClose: () => void }) {
  const [checkins, setCheckins] = useState<StudentCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string>();

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    setLoading(true);
    setError('');
    void api.studentCheckins(student.id)
      .then((items) => {
        setCheckins(items);
        if (items[0]?.checkin_date) {
          setMonth(startOfMonth(parseDate(items[0].checkin_date)));
          setSelectedDate(items[0].checkin_date.slice(0, 10));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Não foi possível carregar o histórico.'))
      .finally(() => setLoading(false));
  }, [student.id]);

  const byDate = useMemo(() => {
    const result = new Map<string, StudentCheckin[]>();
    for (const checkin of checkins) {
      const key = checkin.checkin_date.slice(0, 10);
      result.set(key, [...(result.get(key) ?? []), checkin]);
    }
    return result;
  }, [checkins]);

  const weeks = useMemo(() => lastEightWeeks(byDate), [byDate]);
  const calendarDays = useMemo(() => monthGrid(month), [month]);
  const selectedCheckins = selectedDate ? byDate.get(selectedDate) ?? [] : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" role="dialog" aria-modal="true" aria-label={`Histórico de frequência de ${student.name}`}>
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Fechar histórico" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-accent">Histórico de frequência</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{student.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{sourceLabel(student.source)} · {student.phone || 'Sem telefone'}</p>
          </div>
          <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Fechar"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          {error && <ErrorState message={error} />}
          {loading ? <LoadingState label="Carregando frequência" /> : checkins.length === 0 ? <EmptyState message="Este aluno ainda não possui check-ins" /> : (
            <div className="space-y-7">
              <section>
                <div className="flex items-end justify-between gap-3">
                  <div><h3 className="font-bold text-slate-950">Últimas oito semanas</h3><p className="text-sm text-slate-500">Cada marca representa um dia com presença.</p></div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500"><Legend color="bg-emerald-500" label="Wellhub" /><Legend color="bg-sky-500" label="TotalPass" /><Legend color="bg-violet-500" label="Plano da academia" /></div>
                </div>
                <div className="mt-3 overflow-x-auto pb-2">
                  <div className="grid min-w-[620px] grid-cols-8 gap-2">
                    {weeks.map((week) => (
                      <div key={week.start} className="rounded-lg border border-slate-200 p-2">
                        <p className="text-center text-[11px] font-bold text-slate-500">{formatShortDate(week.start)}</p>
                        <div className="mt-2 grid grid-cols-7 gap-1">
                          {week.days.map((day, index) => {
                            const entries = byDate.get(day) ?? [];
                            return <button key={day} type="button" title={`${formatDate(day)}: ${entries.length} check-in(s)`} onClick={() => entries.length && selectDay(day, setMonth, setSelectedDate)} className={`flex aspect-square items-center justify-center rounded-sm text-[9px] ${dayTone(entries)} ${entries.length ? 'cursor-pointer ring-1 ring-inset ring-slate-900/5' : 'cursor-default'}`}>{entries.length ? shortWeekdayLabels[index] : ''}</button>;
                          })}
                        </div>
                        <p className="mt-2 text-center text-xs font-bold text-slate-700">{week.total} check-in{week.total === 1 ? '' : 's'}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 overflow-x-auto lg:hidden"><p className="text-xs text-slate-400">Deslize horizontalmente para comparar todas as semanas.</p></div>
              </section>

              <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_250px]">
                <div className="rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <Button variant="ghost" className="min-h-9 px-2" onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft className="h-4 w-4" /> <span className="sr-only">Mês anterior</span></Button>
                    <div className="flex items-center gap-2 font-bold text-slate-900"><CalendarDays className="h-4 w-4 text-accent" />{capitalizeFirst(month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }))}</div>
                    <Button variant="ghost" className="min-h-9 px-2" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight className="h-4 w-4" /> <span className="sr-only">Próximo mês</span></Button>
                  </div>
                  <div className="grid grid-cols-7 px-3 pt-3 text-center text-[11px] font-bold uppercase text-slate-400">{weekdayLabels.map((label) => <span key={label}>{label}</span>)}</div>
                  <div className="grid grid-cols-7 gap-1 p-3">
                    {calendarDays.map((day) => {
                      const key = localDate(day);
                      const entries = byDate.get(key) ?? [];
                      const inMonth = day.getMonth() === month.getMonth();
                      const selected = selectedDate === key;
                      return (
                        <button key={key} type="button" onClick={() => entries.length && setSelectedDate(key)} className={`relative flex min-h-14 flex-col items-center rounded-lg p-1.5 text-xs transition ${selected ? 'bg-slate-950 text-white' : inMonth ? 'text-slate-700 hover:bg-slate-50' : 'text-slate-300'} ${entries.length ? 'font-bold' : ''}`}>
                          <span>{day.getDate()}</span>
                          {entries.length > 0 && <span className="mt-1 flex items-center gap-1">{sources(entries).map((source) => <span key={source} className={`h-2 w-2 rounded-full ${sourceColor(source)}`} />)}{entries.length > 1 && <span className={`text-[9px] ${selected ? 'text-white' : 'text-slate-500'}`}>{entries.length}</span>}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <h3 className="font-bold text-slate-950">{selectedDate ? formatDate(selectedDate) : 'Selecione um dia'}</h3>
                  <p className="mt-1 text-xs text-slate-500">{selectedDate ? `${selectedCheckins.length} check-in${selectedCheckins.length === 1 ? '' : 's'}` : 'Clique em uma data marcada no calendário.'}</p>
                  <div className="mt-4 space-y-2">
                    {selectedCheckins.map((checkin) => <div key={checkin.id} className="rounded-lg bg-white p-3 ring-1 ring-slate-200"><div className="flex items-center justify-between gap-2"><div><span className="text-sm font-bold text-slate-800">{checkin.checkin_time?.slice(0, 5) || 'Horário não informado'}</span><p className="mt-0.5 text-[10px] text-slate-500">{entryMethodLabel(checkin.entry_method)}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${sourcePill(checkin.source)}`}>{sourceLabel(checkin.source)}</span></div></div>)}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function lastEightWeeks(byDate: Map<string, StudentCheckin[]>) {
  const currentWeek = startOfWeek(new Date());
  return Array.from({ length: 8 }, (_, index) => {
    const start = addDays(currentWeek, (index - 7) * 7);
    const days = Array.from({ length: 7 }, (__, day) => localDate(addDays(start, day)));
    return { start: localDate(start), days, total: days.reduce((total, date) => total + (byDate.get(date)?.length ?? 0), 0) };
  });
}

function monthGrid(month: Date) {
  const first = startOfMonth(month);
  const offset = (first.getDay() + 6) % 7;
  const gridStart = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function sources(entries: StudentCheckin[]) {
  return [...new Set(entries.map((entry) => entry.source))];
}

function dayTone(entries: StudentCheckin[]) {
  const values = sources(entries);
  if (values.length > 1) return 'bg-gradient-to-br from-emerald-400 via-sky-500 to-violet-500 text-white';
  if (values[0] === 'wellhub') return 'bg-emerald-500 text-white';
  if (values[0] === 'totalpass') return 'bg-sky-500 text-white';
  if (values[0] === 'box_member') return 'bg-violet-500 text-white';
  return 'bg-slate-100 text-transparent';
}

function sourceColor(source: Source) {
  return source === 'wellhub' ? 'bg-emerald-500' : source === 'totalpass' ? 'bg-sky-500' : 'bg-violet-500';
}

function sourcePill(source: Source) {
  return source === 'wellhub' ? 'bg-emerald-50 text-emerald-700' : source === 'totalpass' ? 'bg-sky-50 text-sky-700' : 'bg-violet-50 text-violet-700';
}

function entryMethodLabel(method: StudentCheckin['entry_method']) {
  return method === 'manual' ? 'Registrado pela recepção' : method === 'self_service' ? 'QR Code na academia' : 'Importado';
}

function selectDay(value: string, setMonth: (value: Date) => void, setSelectedDate: (value: string) => void) {
  setMonth(startOfMonth(parseDate(value)));
  setSelectedDate(value);
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</span>;
}

function parseDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function startOfMonth(value: Date) { return new Date(value.getFullYear(), value.getMonth(), 1); }
function startOfWeek(value: Date) {
  const result = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}
function addDays(value: Date, days: number) { const result = new Date(value); result.setDate(result.getDate() + days); return result; }
function addMonths(value: Date, months: number) { return new Date(value.getFullYear(), value.getMonth() + months, 1); }
function localDate(value: Date) { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`; }
function formatDate(value: string) { return parseDate(value).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }); }
function formatShortDate(value: string) { return parseDate(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); }
function capitalizeFirst(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }
