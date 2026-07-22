import { MessageCircle, RefreshCw, Trash2, WandSparkles } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { api } from '../../features/api/endpoints';
import type { Student, Workout, WorkoutDraft, WorkoutRecipient } from '../../features/api/types';

const today = new Date().toISOString().slice(0, 10);

export function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [draftsByWorkout, setDraftsByWorkout] = useState<Record<string, WorkoutDraft[]>>({});
  const [draftsLoaded, setDraftsLoaded] = useState(false);
  const [recipientsByDraft, setRecipientsByDraft] = useState<Record<string, WorkoutRecipient[]>>({});
  const [workoutDate, setWorkoutDate] = useState(today);
  const [workoutText, setWorkoutText] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [removingWorkoutId, setRemovingWorkoutId] = useState('');
  const [loadingRecipientsDraftId, setLoadingRecipientsDraftId] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [section, setSection] = useState<'compose' | 'history'>('compose');

  const selectedStudents = useMemo(
    () => students.filter((student) => selectedStudentIds.includes(student.id)),
    [selectedStudentIds, students],
  );

  const filteredStudents = useMemo(() => {
    const query = studentSearch.toLowerCase().trim();
    const withPhone = students.filter((student) => student.phone.trim() !== '' && student.contact_status !== 'opted_out' && !student.anonymized_at);
    if (!query) return withPhone.slice(0, 12);
    return withPhone
      .filter((student) => [student.name, student.email, student.phone].join(' ').toLowerCase().includes(query))
      .slice(0, 12);
  }, [studentSearch, students]);

  const workoutsWithDrafts = useMemo(
    () => workouts.filter((workout) => (draftsByWorkout[workout.id]?.length ?? 0) > 0),
    [draftsByWorkout, workouts],
  );

  function load() {
    setLoading(true);
    setError('');
    Promise.all([api.workouts(), api.students()])
      .then(([workouts, students]) => {
        setWorkouts(workouts);
        setStudents(students);
        setDraftsLoaded(false);
        Promise.all(workouts.map((workout) => loadDrafts(workout.id))).finally(() => setDraftsLoaded(true));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar treinos'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function loadDrafts(workoutId: string) {
    try {
      const drafts = await api.workoutDrafts(workoutId);
      setDraftsByWorkout((current) => ({ ...current, [workoutId]: drafts }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar mensagens geradas');
    }
  }

  async function loadRecipients(draftId: string) {
    setLoadingRecipientsDraftId(draftId);
    try {
      const recipients = await api.workoutRecipients(draftId);
      setRecipientsByDraft((current) => ({ ...current, [draftId]: latestRecipientBatch(recipients) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar auditoria');
    } finally {
      setLoadingRecipientsDraftId('');
    }
  }

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((current) => (
      current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId]
    ));
  }

  async function generateAndSend(event: FormEvent) {
    event.preventDefault();
    setError('');
    setStatus('');
    if (selectedStudentIds.length === 0) {
      setError('Selecione pelo menos um aluno na whitelist.');
      return;
    }
    setProcessing(true);
    try {
      const title = titleFromWorkoutText(workoutText);
      const workout = await api.createWorkout({
        workout_date: workoutDate,
        title,
        goal: '',
        movements: workoutText,
        coach_notes: '',
        status: 'draft',
      });
      const draft = await api.generateWorkoutDraft(workout.id, {
        audience: 'all',
        campaign_id: '',
        student_ids: selectedStudentIds,
      });
      const approved = await api.approveWorkoutDraft(draft.id, { approved_body: draft.approved_body || draft.generated_body });
      const result = await api.sendWorkoutDraft(approved.id);
      setStatus(`Mensagem gerada e enviada: ${result.sent}/${result.total} enviadas, ${result.failed} falhas.`);
      setWorkoutText('');
      setSelectedStudentIds([]);
      await Promise.all([loadDrafts(workout.id), loadRecipients(approved.id)]);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar e enviar treino');
    } finally {
      setProcessing(false);
    }
  }

  async function removeWorkout(workoutId: string) {
    if (!window.confirm('Remover este treino e seu histórico de mensagens?')) return;
    setError('');
    setRemovingWorkoutId(workoutId);
    try {
      await api.deleteWorkout(workoutId);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover treino');
    } finally {
      setRemovingWorkoutId('');
    }
  }

  if (loading) return <LoadingState label="Carregando treinos" />;

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        title="Treino do dia"
        eyebrow="Mensagens inteligentes"
        description="Cole o treino completo, escolha a whitelist e envie a mensagem gerada por IA pelo WhatsApp."
        actions={<Button type="button" variant="secondary" onClick={load}><RefreshCw className="h-4 w-4" />Atualizar</Button>}
      />
      {error && <ErrorState message={error} />}
      {status && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{status}</div>}

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-panel" role="tablist" aria-label="Seções de treino">
        <button type="button" role="tab" aria-selected={section === 'compose'} className={`min-h-10 rounded-lg px-4 text-sm font-bold ${section === 'compose' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => setSection('compose')}>Preparar envio</button>
        <button type="button" role="tab" aria-selected={section === 'history'} className={`min-h-10 rounded-lg px-4 text-sm font-bold ${section === 'history' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => setSection('history')}>Histórico ({workoutsWithDrafts.length})</button>
      </div>

      {section === 'compose' && <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader><h2 className="text-base font-bold text-slate-950">Gerar e enviar treino</h2></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={generateAndSend}>
              <Input type="date" value={workoutDate} onChange={(event) => setWorkoutDate(event.target.value)} required />
              <Textarea
                className="min-h-72"
                placeholder="Cole aqui o treino completo do dia. Ex.: aquecimento, skill, WOD, cargas, observações e qualquer contexto que a IA deve interpretar."
                value={workoutText}
                onChange={(event) => setWorkoutText(event.target.value)}
                required
              />
              <Button disabled={processing || selectedStudentIds.length === 0 || workoutText.trim() === ''}>
                <WandSparkles className="h-4 w-4" />
                {processing ? 'Gerando e enviando' : `Gerar e enviar para ${selectedStudentIds.length} alunos`}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <h2 className="text-base font-bold text-slate-950">Whitelist</h2>
              <p className="text-sm text-slate-500">{selectedStudentIds.length} alunos selecionados</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Buscar aluno" value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} />
            {selectedStudents.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedStudents.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    className="rounded-md border border-accent/30 bg-accent-soft px-2 py-1 text-xs font-semibold text-accent-dark"
                    onClick={() => toggleStudent(student.id)}
                  >
                    {student.name}
                  </button>
                ))}
              </div>
            )}
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {filteredStudents.length === 0 ? <EmptyState message="Nenhum aluno com telefone encontrado" /> : filteredStudents.map((student) => {
                const checked = selectedStudentIds.includes(student.id);
                return (
                  <label key={student.id} className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition ${checked ? 'border-accent bg-accent-soft' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                    <input type="checkbox" className="mt-1 h-4 w-4 accent-orange-600" checked={checked} onChange={() => toggleStudent(student.id)} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-950">{student.name}</span>
                      <span className="block truncate text-xs text-slate-500">{student.phone}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>}

      {section === 'history' && <Card>
        <CardHeader><h2 className="text-base font-bold text-slate-950">Histórico de treinos enviados</h2></CardHeader>
        <CardContent className="space-y-3">
          {!draftsLoaded ? <LoadingState /> : workoutsWithDrafts.length === 0 ? <EmptyState message="Nenhuma mensagem gerada ainda" /> : workoutsWithDrafts.map((workout) => {
            const drafts = draftsByWorkout[workout.id] ?? [];
            return (
              <div key={workout.id} className="space-y-3 rounded-md border border-slate-100 p-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-950">{workout.title}</p>
                    <p className="text-sm text-slate-500">{formatDate(workout.workout_date)}</p>
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-slate-600">{workout.movements}</p>
                  </div>
                  <Button type="button" variant="secondary" onClick={() => removeWorkout(workout.id)} disabled={removingWorkoutId === workout.id}>
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </Button>
                </div>
                {drafts.map((draft) => (
                  <div key={draft.id} className="space-y-3 rounded-md bg-slate-50 p-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <p className="text-sm font-semibold text-slate-700">{draft.total_recipients} destinatários · {formatDateTime(draft.generated_at)}</p>
                      <StatusBadge value={draft.status === 'sent' ? 'success' : draft.status === 'approved' ? 'active' : 'inactive'} label={draftStatusLabel(draft.status)} />
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-slate-700">{draft.approved_body || draft.generated_body}</p>
                    <Button type="button" variant="secondary" onClick={() => loadRecipients(draft.id)} disabled={loadingRecipientsDraftId === draft.id}>
                      <MessageCircle className="h-4 w-4" />
                      {loadingRecipientsDraftId === draft.id ? 'Carregando' : 'Auditoria'}
                    </Button>
                    {(recipientsByDraft[draft.id]?.length ?? 0) > 0 && (
                      <div className="space-y-2">
                        {recipientsByDraft[draft.id].map((recipient) => (
                          <div key={recipient.id} className="rounded-md border border-slate-200 bg-white p-2 text-xs">
                            <p className="font-semibold text-slate-800">{recipient.phone} · {recipient.status}</p>
                            {recipient.error_message && <p className="mt-1 break-words text-red-600">{recipient.error_message}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </CardContent>
      </Card>}
    </div>
  );
}

function latestRecipientBatch(recipients: WorkoutRecipient[]) {
  const latestCreatedAt = recipients.reduce((latest, recipient) => (recipient.created_at > latest ? recipient.created_at : latest), '');
  return recipients.filter((recipient) => recipient.created_at === latestCreatedAt);
}

function titleFromWorkoutText(value: string) {
  const firstLine = value.split('\n').map((line) => line.trim()).find(Boolean);
  return firstLine ? firstLine.slice(0, 120) : 'Treino do dia';
}

function draftStatusLabel(status: WorkoutDraft['status']) {
  if (status === 'sent') return 'Enviada';
  if (status === 'approved') return 'Aprovada';
  return 'Rascunho';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
