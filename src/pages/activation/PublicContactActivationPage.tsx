import { useEffect, useState } from 'react';
import { CheckCircle2, MessageCircle, ShieldCheck } from 'lucide-react';
import { api } from '../../features/api/endpoints';
import type { ContactActivationConfig, ContactActivationStart, Source } from '../../features/api/types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ErrorState, LoadingState } from '../../components/common/State';

export function PublicContactActivationPage({ code }: { code: string }) {
  const [config, setConfig] = useState<ContactActivationConfig>();
  const [result, setResult] = useState<ContactActivationStart>();
  const [name, setName] = useState('');
  const [source, setSource] = useState<Source>('wellhub');
  const [checkinDate, setCheckinDate] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.publicContactActivation(code)
      .then(setConfig)
      .catch((err) => setError(err instanceof Error ? err.message : 'Não foi possível abrir esta ativação.'))
      .finally(() => setLoading(false));
  }, [code]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const activation = await api.startPublicContactActivation(code, {
        name: name.trim(), source, recent_checkin_date: checkinDate, consent_accepted: accepted,
      });
      setResult(activation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar a ativação.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-50 via-white to-slate-100 p-6"><LoadingState label="Abrindo sua ativação" /></main>;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-orange-50 via-white to-slate-100 px-4 py-8 sm:py-14">
      <div aria-hidden="true" className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-slate-300/30 blur-3xl" />
      <div className="relative mx-auto max-w-lg">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 w-fit rounded-2xl border border-slate-200/80 bg-white px-5 py-3 shadow-lg shadow-slate-900/5">
            <img src="/engagefit-logo-cropped.png" alt="EngageFit" className="h-auto w-48 sm:w-56" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-700">EngageFit para</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">{config?.box_name || 'Ativação no WhatsApp'}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Acompanhe seus check-ins, metas e brindes diretamente pelo WhatsApp.</p>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="h-1.5 bg-gradient-to-r from-orange-600 via-orange-500 to-slate-900" />
          <div className="p-5 sm:p-7">
          {error && <div className="mb-4"><ErrorState message={error} /></div>}
          {result ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-700">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-950">Falta só confirmar no WhatsApp</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Toque no botão abaixo e envie a mensagem que já está pronta. O telefone só será vinculado depois desse envio.</p>
              </div>
              <a className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 font-bold text-white shadow-sm hover:bg-[#1fb85a]" href={result.whatsapp_url}>
                <MessageCircle className="h-5 w-5" />Confirmar pelo WhatsApp
              </a>
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">Se necessário, a academia conferirá o vínculo antes de concluir.</p>
              <p className="text-xs text-slate-500">Este link de confirmação expira em 30 minutos.</p>
            </div>
          ) : config ? (
            <form className="space-y-5" onSubmit={submit}>
              <div>
                <h2 className="text-lg font-bold text-slate-950">Encontre seu histórico</h2>
                <p className="mt-1 text-sm text-slate-500">Use os mesmos dados que aparecem na plataforma de benefícios.</p>
              </div>
              <label className="block text-sm font-semibold text-slate-700">Nome completo
                <Input className="mt-1.5" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Como aparece no Wellhub ou TotalPass" required minLength={3} />
              </label>
              <fieldset>
                <legend className="text-sm font-semibold text-slate-700">Sua plataforma</legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(['wellhub', 'totalpass'] as Source[]).map((item) => (
                    <label key={item} className={`cursor-pointer rounded-lg border p-3 text-center text-sm font-bold transition ${source === item ? 'border-orange-500 bg-orange-50 text-orange-800 shadow-sm' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                      <input className="sr-only" type="radio" name="source" value={item} checked={source === item} onChange={() => setSource(item)} />
                      {item === 'wellhub' ? 'Wellhub' : 'TotalPass'}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block text-sm font-semibold text-slate-700">Data de um check-in recente
                <Input className="mt-1.5" type="date" value={checkinDate} onChange={(event) => setCheckinDate(event.target.value)} required max={new Date().toISOString().slice(0, 10)} />
                <span className="mt-1.5 block text-xs font-normal leading-5 text-slate-500">Pode ser a presença de hoje ou outra data que você consulte no aplicativo.</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <input className="mt-1 h-4 w-4 accent-orange-600" type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} required />
                <span className="text-xs leading-5 text-slate-700">{config.consent_text}</span>
              </label>
              <Button className="w-full" type="submit" disabled={submitting || !accepted}>{submitting ? 'Preparando…' : 'Continuar para o WhatsApp'}</Button>
              <div className="flex items-start gap-2 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-700" />Seu telefone não vem do Wellhub ou TotalPass. Ele será recebido somente quando você enviar a confirmação pelo WhatsApp.</div>
            </form>
          ) : null}
          </div>
        </section>
        <p className="mt-5 text-center text-xs font-medium text-slate-500">Tecnologia EngageFit para fortalecer a frequência e o relacionamento da academia.</p>
      </div>
    </main>
  );
}
