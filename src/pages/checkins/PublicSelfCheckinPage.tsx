import { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, MapPin } from 'lucide-react';
import { api } from '../../features/api/endpoints';
import type { AttendanceCheckin, SelfCheckinSession } from '../../features/api/types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ErrorState, LoadingState } from '../../components/common/State';

export function PublicSelfCheckinPage({ token }: { token: string }) {
  const [session, setSession] = useState<SelfCheckinSession>();
  const [result, setResult] = useState<AttendanceCheckin>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.publicSelfCheckinSession(token)
      .then(setSession)
      .catch((err) => setError(err instanceof Error ? err.message : 'Este QR Code não está mais disponível.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      setResult(await api.selfCheckin(token, { name: name.trim(), phone }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível registrar seu check-in.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><LoadingState label="Abrindo check-in" /></main>;

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-slate-100 px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <img src="/engagefit-logo-cropped.png" alt="EngageFit" className="mx-auto h-auto w-48" />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Check-in — plano da academia</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-950">{session?.box_name || 'Academia'}</h1>
        </div>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="h-1.5 bg-gradient-to-r from-orange-600 to-slate-900" />
          <div className="p-6">
            {error && <div className="mb-4"><ErrorState message={error} /></div>}
            {result ? <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-9 w-9" /></div>
              <h2 className="text-xl font-bold text-slate-950">{result.already_recorded ? 'Seu check-in de hoje já estava registrado' : 'Check-in registrado!'}</h2>
              <p className="text-sm leading-6 text-slate-600">{result.student_name ? `${result.student_name}, sua presença` : 'Sua presença'} conta para frequência, campanhas e brindes do box.</p>
            </div> : session ? <form className="space-y-5" onSubmit={submit}>
              <div className="rounded-xl bg-orange-50 p-4 text-sm leading-6 text-orange-900"><MapPin className="mr-2 inline h-4 w-4" />Use este formulário somente enquanto estiver na academia.</div>
              <label className="block text-sm font-semibold text-slate-700">Nome completo<Input className="mt-1.5" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required minLength={3} /></label>
              <label className="block text-sm font-semibold text-slate-700">WhatsApp cadastrado<Input className="mt-1.5" value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="(11) 99999-9999" required /></label>
              <Button className="w-full" disabled={submitting}>{submitting ? 'Registrando…' : 'Confirmar presença'}</Button>
              <p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" />O QR Code expira em poucos minutos e aceita somente alunos do plano da academia já ativados no WhatsApp.</p>
            </form> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
