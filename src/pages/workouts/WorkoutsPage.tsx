import { RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { api } from '../../features/api/endpoints';
import type { Workout, WorkoutSectionType } from '../../features/api/types';

const today = new Date().toISOString().slice(0, 10);

export function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutDate, setWorkoutDate] = useState(today);
  const [workoutText, setWorkoutText] = useState('');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [removingWorkoutId, setRemovingWorkoutId] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [section, setSection] = useState<'publish' | 'history'>('publish');

  function load() {
    setLoading(true);
    setError('');
    api.workouts()
      .then(setWorkouts)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar treinos'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function publishWorkout(event: FormEvent) {
    event.preventDefault();
    setError('');
    setStatus('');
    setPublishing(true);
    try {
      const workout = await api.createWorkout({
        workout_date: workoutDate,
        title: '',
        goal: '',
        movements: '',
        coach_notes: '',
        raw_text: workoutText,
        status: 'published',
      });
      setWorkouts((current) => [workout, ...current.filter((item) => item.id !== workout.id)]);
      setWorkoutText('');
      setStatus('Treino publicado e organizado automaticamente. Nenhuma aprovação adicional é necessária.');
      setSection('history');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar treino');
    } finally {
      setPublishing(false);
    }
  }

  async function removeWorkout(workoutId: string) {
    if (!window.confirm('Remover este treino?')) return;
    setError('');
    setRemovingWorkoutId(workoutId);
    try {
      await api.deleteWorkout(workoutId);
      setWorkouts((current) => current.filter((workout) => workout.id !== workoutId));
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
        eyebrow="Publicação simples"
        description="Cole o treino como você já envia no grupo. O EngageFit identifica os blocos e prepara a experiência dos alunos automaticamente."
        actions={<Button type="button" variant="secondary" onClick={load}><RefreshCw className="h-4 w-4" />Atualizar</Button>}
      />
      {error && <ErrorState message={error} />}
      {status && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{status}</div>}

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-panel" role="tablist" aria-label="Seções de treino">
        <button type="button" role="tab" aria-selected={section === 'publish'} className={`min-h-10 rounded-lg px-4 text-sm font-bold ${section === 'publish' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => setSection('publish')}>Publicar treino</button>
        <button type="button" role="tab" aria-selected={section === 'history'} className={`min-h-10 rounded-lg px-4 text-sm font-bold ${section === 'history' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => setSection('history')}>Histórico ({workouts.length})</button>
      </div>

      {section === 'publish' && (
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-base font-bold text-slate-950">Novo treino</h2>
              <p className="text-sm text-slate-500">Data, texto e publicar. Não há formulário técnico nem etapa de aprovação.</p>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={publishWorkout}>
              <div className="max-w-xs">
                <Input type="date" value={workoutDate} onChange={(event) => setWorkoutDate(event.target.value)} required />
              </div>
              <Textarea
                className="min-h-96 font-mono text-sm leading-6"
                placeholder={'Cole exatamente como o treino é enviado no grupo:\n\nWARM UP\n...\n\nSKILL\n...\n\nWORKOUT OF THE DAY\n...'}
                value={workoutText}
                onChange={(event) => setWorkoutText(event.target.value)}
                maxLength={20000}
                required
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">{workoutText.length.toLocaleString('pt-BR')} de 20.000 caracteres</p>
                <Button disabled={publishing || workoutText.trim() === ''}>
                  <Sparkles className="h-4 w-4" />
                  {publishing ? 'Publicando' : 'Publicar treino'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {section === 'history' && (
        <Card>
          <CardHeader><h2 className="text-base font-bold text-slate-950">Treinos publicados</h2></CardHeader>
          <CardContent className="space-y-4">
            {workouts.length === 0 ? <EmptyState message="Nenhum treino publicado ainda" /> : workouts.map((workout) => (
              <article key={workout.id} className="space-y-4 rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-950">{workout.title}</h3>
                      <StatusBadge value={workout.status === 'published' ? 'success' : 'inactive'} label={workout.status === 'published' ? 'Publicado' : 'Rascunho'} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{formatDate(workout.workout_date)}</p>
                  </div>
                  <Button type="button" variant="secondary" onClick={() => removeWorkout(workout.id)} disabled={removingWorkoutId === workout.id}>
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </Button>
                </div>

                {(workout.classification?.formats ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(workout.classification?.formats ?? []).map((format) => <span key={format} className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-dark">{formatLabel(format)}</span>)}
                    {workout.classification?.duration_seconds ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{workout.classification.duration_seconds / 60} min</span> : null}
                  </div>
                )}

                <div className="grid gap-3 lg:grid-cols-3">
                  {(workout.classification?.sections ?? []).map((item, index) => (
                    <section key={`${item.type}-${index}`} className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{sectionLabel(item.type)}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.content || item.title}</p>
                    </section>
                  ))}
                </div>

                {(workout.classification?.sections ?? []).length === 0 && <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{workout.raw_text || workout.movements}</p>}
              </article>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function sectionLabel(type: WorkoutSectionType) {
  const labels: Record<WorkoutSectionType, string> = {
    warmup: 'Aquecimento',
    skill: 'Técnica',
    strength: 'Força',
    wod: 'Workout of the day',
    accessory: 'Acessório',
    cooldown: 'Volta à calma',
    other: 'Treino',
  };
  return labels[type];
}

function formatLabel(value: string) {
  const labels: Record<string, string> = {
    amrap: 'AMRAP',
    emom: 'EMOM',
    for_time: 'For time',
    tabata: 'Tabata',
    interval: 'Intervalado',
    max_effort: 'Carga máxima',
  };
  return labels[value] ?? value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}
