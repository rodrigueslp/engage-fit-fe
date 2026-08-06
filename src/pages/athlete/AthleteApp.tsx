import { ArrowLeft, CalendarDays, ChevronRight, Download, Dumbbell, History, Home, LogOut, ShieldCheck, Sparkles, UserRound, Zap } from 'lucide-react';
import { FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { athleteApi } from '../../features/athlete/api';
import type { AthleteInvitation, AthleteProfile, AthleteWorkout } from '../../features/athlete/types';
import type { WorkoutSectionType } from '../../features/api/types';
import { AthleteDashboard } from './AthleteDashboard';

type AthleteRoute = { kind: 'invite'; token: string } | { kind: 'login' } | { kind: 'reset'; token: string } | { kind: 'verify'; token: string } | { kind: 'app' };
type AthleteTab = 'today' | 'history' | 'profile';

export function AthleteApp({ route }: { route: AthleteRoute }) {
  const [profile, setProfile] = useState<AthleteProfile>();
  const [workouts, setWorkouts] = useState<AthleteWorkout[]>([]);
  const [loading, setLoading] = useState(route.kind === 'app');
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'EngageFit — Meu treino';
    const theme = document.querySelector('meta[name="theme-color"]');
    theme?.setAttribute('content', '#071426');
    return () => {
      document.title = 'EngageFit';
      theme?.setAttribute('content', '#ffffff');
    };
  }, []);

  useEffect(() => {
    if (route.kind !== 'app') return;
    setLoading(true);
    Promise.all([athleteApi.me(), athleteApi.workouts()])
      .then(([currentProfile, currentWorkouts]) => {
        setProfile(currentProfile);
        setWorkouts(currentWorkouts);
      })
      .catch(() => navigateAthlete('login'))
      .finally(() => setLoading(false));
  }, [route.kind]);

  async function openApp(currentProfile: AthleteProfile) {
    setProfile(currentProfile);
    setLoading(true);
    try {
      setWorkouts(await athleteApi.workouts());
      navigateAthlete('app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível abrir seus treinos.');
    } finally {
      setLoading(false);
    }
  }

  if (route.kind === 'invite') return <AthleteInvitationPage token={route.token} onClaimed={openApp} />;
  if (route.kind === 'login') return <AthleteLoginPage onLogin={openApp} />;
  if (route.kind === 'reset') return <AthleteResetPasswordPage token={route.token} />;
  if (route.kind === 'verify') return <AthleteVerifyEmailPage token={route.token} />;
  if (loading || !profile) return <AthleteSplash />;
  return <AthleteDashboard profile={profile} initialWorkouts={workouts} />;
}

function AthleteInvitationPage({ token, onClaimed }: { token: string; onClaimed: (profile: AthleteProfile) => Promise<void> }) {
  const [invitation, setInvitation] = useState<AthleteInvitation>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    athleteApi.invitation(token)
      .then((value) => { setInvitation(value); setName(value.student_name); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Convite indisponível.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Informe seu nome para continuar.');
      return;
    }
    if (!email.trim()) {
      setError('Informe seu melhor e-mail para continuar.');
      return;
    }
    if (password.length < 12) {
      const missing = 12 - password.length;
      setError(`Sua senha precisa ter pelo menos 12 caracteres. ${missing === 1 ? 'Falta 1 caractere.' : `Faltam ${missing} caracteres.`}`);
      return;
    }
    setSubmitting(true);
    try {
      await onClaimed(await athleteApi.claim(token, { name, email, password }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar sua conta.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AthleteAuthShell>
      {loading ? <AthleteAuthSkeleton /> : !invitation ? (
        <AuthMessage title="Este convite não está mais disponível" message={error || 'Peça um novo convite ao seu box.'} />
      ) : (
        <div className="athlete-enter space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-cyan-100 backdrop-blur">
            <ShieldCheck className="h-4 w-4" /> Convite verificado
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">{invitation.box_name}</p>
            <h1 className="mt-3 text-4xl font-black leading-[1.05] tracking-[-0.04em] text-white">Seu treino começa antes da aula.</h1>
            <p className="mt-4 max-w-sm text-base leading-7 text-slate-300">Veja o treino do dia, entenda cada bloco e construa seu histórico dentro do seu box.</p>
          </div>
          <form className="space-y-4 rounded-[28px] bg-white p-5 text-slate-950 shadow-2xl shadow-black/30 sm:p-6" onSubmit={submit}>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-orange-600">Ative seu perfil</p>
              <h2 className="mt-1 text-xl font-black">Olá, {firstName(invitation.student_name)}!</h2>
            </div>
            <AthleteField label="Seu nome" type="text" value={name} onChange={setName} autoComplete="name" />
            <AthleteField label="Seu melhor e-mail" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="voce@exemplo.com" />
            <AthleteField label="Crie uma senha" type="password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="Pelo menos 12 caracteres" />
            <p className={`-mt-2 text-xs font-semibold ${password.length >= 12 ? 'text-emerald-600' : 'text-slate-500'}`} aria-live="polite">
              {password.length >= 12 ? 'Senha pronta para uso.' : password.length === 0 ? 'Use pelo menos 12 caracteres.' : `${12 - password.length === 1 ? 'Falta 1 caractere' : `Faltam ${12 - password.length} caracteres`} para completar a senha.`}
            </p>
            {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p>}
            <button className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600 active:scale-[.98] disabled:opacity-60" disabled={submitting}>
              {submitting ? 'Preparando seu perfil...' : 'Criar conta e entrar'} <ChevronRight className="h-5 w-5" />
            </button>
            <p className="text-center text-xs leading-5 text-slate-500">Ao continuar, sua conta será vinculada somente ao cadastro indicado por este convite.</p>
          </form>
          <button type="button" className="mx-auto block text-sm font-bold text-slate-300" onClick={() => navigateAthlete('login')}>Já tenho uma conta</button>
        </div>
      )}
    </AthleteAuthShell>
  );
}

function AthleteLoginPage({ onLogin }: { onLogin: (profile: AthleteProfile) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [forgot, setForgot] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onLogin(await athleteApi.login({ email, password }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'E-mail ou senha inválidos.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AthleteAuthShell>
      <div className="athlete-enter space-y-7">
        <button className="inline-flex items-center gap-2 text-sm font-bold text-slate-300" onClick={() => { window.location.hash = 'dashboard'; }}><ArrowLeft className="h-4 w-4" /> Voltar</button>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">EngageFit Aluno</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white">Bom ter você de volta.</h1>
          <p className="mt-3 text-slate-300">Entre para conferir o treino do seu box.</p>
        </div>
        <form className="space-y-4 rounded-[28px] bg-white p-6 shadow-2xl shadow-black/30" onSubmit={forgot ? (event) => { event.preventDefault(); setError(''); athleteApi.requestPasswordReset(email).then(() => setSent(true)).catch((err) => setError(err instanceof Error ? err.message : 'Não foi possível enviar.')); } : submit}>
          <AthleteField label="E-mail" type="email" value={email} onChange={setEmail} autoComplete="email" />
          {!forgot && <AthleteField label="Senha" type="password" value={password} onChange={setPassword} autoComplete="current-password" />}
          {sent && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">Se a conta existir, o link de recuperação foi enviado.</p>}
          {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p>}
          <button className="min-h-13 w-full rounded-2xl bg-orange-500 px-4 py-3.5 text-sm font-extrabold text-white transition hover:bg-orange-600 active:scale-[.98] disabled:opacity-60" disabled={submitting}>{forgot ? 'Enviar link de recuperação' : submitting ? 'Entrando...' : 'Entrar'}</button>
          <button type="button" className="w-full text-sm font-bold text-orange-600" onClick={() => { setForgot(!forgot); setSent(false); setError(''); }}>{forgot ? 'Voltar para o login' : 'Esqueci minha senha'}</button>
        </form>
      </div>
    </AthleteAuthShell>
  );
}

function AthleteResetPasswordPage({ token }: { token: string }) {
  const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [done, setDone] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); if (password.length < 12) { setError('Use uma senha com pelo menos 12 caracteres.'); return; } try { await athleteApi.resetPassword(token, password); setDone(true); } catch (err) { setError(err instanceof Error ? err.message : 'Link inválido ou expirado.'); } }
  return <AthleteAuthShell><div className="rounded-[28px] bg-white p-6"><p className="text-xs font-black uppercase tracking-wide text-orange-600">Segurança</p><h1 className="mt-1 text-2xl font-black">Crie uma nova senha</h1>{done ? <><p className="mt-4 text-emerald-700">Senha atualizada. Entre novamente em todos os seus dispositivos.</p><button onClick={() => navigateAthlete('login')} className="mt-5 w-full rounded-2xl bg-orange-500 py-3 font-bold text-white">Ir para o login</button></> : <form className="mt-5 space-y-4" onSubmit={submit}><AthleteField label="Nova senha" type="password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="Pelo menos 12 caracteres" />{error && <p className="text-sm font-bold text-rose-700">{error}</p>}<button className="w-full rounded-2xl bg-orange-500 py-3 font-bold text-white">Atualizar senha</button></form>}</div></AthleteAuthShell>;
}

function AthleteVerifyEmailPage({ token }: { token: string }) {
  const [status, setStatus] = useState('Confirmando seu e-mail...');
  useEffect(() => { athleteApi.verifyEmail(token).then(() => setStatus('E-mail confirmado com sucesso.')).catch((err) => setStatus(err instanceof Error ? err.message : 'Link inválido ou expirado.')); }, [token]);
  return <AthleteAuthShell><div className="rounded-[28px] bg-white p-6"><ShieldCheck className="h-10 w-10 text-emerald-600" /><h1 className="mt-4 text-2xl font-black">Verificação da conta</h1><p className="mt-3 text-slate-600">{status}</p><button onClick={() => navigateAthlete('login')} className="mt-5 font-bold text-orange-600">Ir para o app</button></div></AthleteAuthShell>;
}

function AthleteHome({ profile, workouts, globalError }: { profile: AthleteProfile; workouts: AthleteWorkout[]; globalError: string }) {
  const [tab, setTab] = useState<AthleteTab>('today');
  const [installPrompt, setInstallPrompt] = useState<Event & { prompt?: () => Promise<void> }>();
  const featured = useMemo(() => featuredWorkout(workouts), [workouts]);

  useEffect(() => {
    const listener = (event: Event) => { event.preventDefault(); setInstallPrompt(event as Event & { prompt?: () => Promise<void> }); };
    window.addEventListener('beforeinstallprompt', listener);
    return () => window.removeEventListener('beforeinstallprompt', listener);
  }, []);

  async function logout() {
    await athleteApi.logout().catch(() => undefined);
    navigateAthlete('login');
  }

  return (
    <div className="min-h-[100dvh] bg-[#f4f6f9] pb-28 text-slate-950">
      <header className="relative overflow-hidden bg-[#071426] px-5 pb-12 pt-[max(1.25rem,env(safe-area-inset-top))] text-white">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-2xl" />
        <div className="absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="relative mx-auto max-w-xl">
          <div className="flex items-center justify-between">
            <AthleteBrand />
            <button onClick={() => setTab('profile')} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/10 font-black backdrop-blur" aria-label="Abrir perfil">{initials(profile.name)}</button>
          </div>
          <p className="mt-9 text-sm font-semibold text-slate-300">{greeting()}, {firstName(profile.name)}</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.035em]">Pronto para o próximo treino?</h1>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-slate-200 backdrop-blur">
            <Dumbbell className="h-4 w-4 text-orange-400" /> {featured?.box_name ?? profile.memberships[0]?.box_name}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto -mt-7 max-w-xl px-4">
        {globalError && <p className="mb-4 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{globalError}</p>}
        {tab === 'today' && <TodayView workout={featured} />}
        {tab === 'history' && <HistoryView workouts={workouts} />}
        {tab === 'profile' && <ProfileView profile={profile} installPrompt={installPrompt} onInstall={() => void installPrompt?.prompt?.()} onLogout={logout} />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto border-t border-slate-200/80 bg-white/95 px-5 pb-[max(.65rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,.08)] backdrop-blur-xl">
        <div className="mx-auto grid max-w-md grid-cols-3">
          <AthleteNavButton active={tab === 'today'} icon={Home} label="Hoje" onClick={() => setTab('today')} />
          <AthleteNavButton active={tab === 'history'} icon={History} label="Histórico" onClick={() => setTab('history')} />
          <AthleteNavButton active={tab === 'profile'} icon={UserRound} label="Perfil" onClick={() => setTab('profile')} />
        </div>
      </nav>
    </div>
  );
}

function TodayView({ workout }: { workout?: AthleteWorkout }) {
  if (!workout) return <EmptyWorkout />;
  const sections = workout.classification?.sections ?? [];
  return (
    <div className="athlete-enter space-y-4">
      <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(15,23,42,.10)]">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-orange-600">{relativeWorkoutDate(workout.workout_date)}</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.035em]">{workout.title}</h2>
            </div>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600"><Zap className="h-6 w-6" /></div>
          </div>
          {(workout.classification?.formats ?? []).length > 0 && <div className="mt-4 flex flex-wrap gap-2">{workout.classification?.formats.map((format) => <span key={format} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-slate-600">{formatLabel(format)}</span>)}</div>}
        </div>
        <div className="space-y-3 p-3">
          {sections.length > 0 ? sections.map((section, index) => <AthleteWorkoutSection key={`${section.type}-${index}`} type={section.type} title={section.title} content={section.content} />) : <pre className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 font-sans text-sm leading-7 text-slate-700">{workout.raw_text || workout.movements}</pre>}
        </div>
      </section>
      <section className="flex gap-3 rounded-3xl border border-cyan-100 bg-cyan-50 p-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-500 text-white"><Sparkles className="h-5 w-5" /></div>
        <div><h3 className="text-sm font-extrabold text-slate-900">Este é o começo</h3><p className="mt-1 text-sm leading-6 text-slate-600">Em breve, suas cargas, PRs e resultados deixarão este treino ainda mais pessoal.</p></div>
      </section>
    </div>
  );
}

function AthleteWorkoutSection({ type, title, content }: { type: WorkoutSectionType; title: string; content: string }) {
  const isWOD = type === 'wod';
  return <section className={`rounded-3xl p-4 ${isWOD ? 'bg-[#071426] text-white' : 'bg-slate-50 text-slate-900'}`}>
    <div className="flex items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-xl text-xs font-black ${isWOD ? 'bg-orange-500 text-white' : 'bg-white text-orange-600 shadow-sm'}`}>{sectionOrdinal(type)}</span><p className={`text-xs font-extrabold uppercase tracking-[0.14em] ${isWOD ? 'text-orange-300' : 'text-slate-500'}`}>{sectionLabel(type)}</p></div>
    <h3 className="mt-3 text-lg font-black">{title}</h3>
    <p className={`mt-2 whitespace-pre-wrap text-sm leading-7 ${isWOD ? 'text-slate-200' : 'text-slate-700'}`}>{content || title}</p>
  </section>;
}

function HistoryView({ workouts }: { workouts: AthleteWorkout[] }) {
  return <div className="athlete-enter space-y-4"><div className="px-1"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-orange-600">Sua jornada</p><h2 className="mt-1 text-2xl font-black">Treinos publicados</h2></div>{workouts.length === 0 ? <EmptyWorkout /> : workouts.map((workout) => <article key={workout.id} className="rounded-3xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,.07)]"><div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-700"><CalendarDays className="h-5 w-5" /></div><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-orange-600">{formatWorkoutDate(workout.workout_date)}</p><h3 className="mt-1 truncate text-lg font-black">{workout.title}</h3><p className="mt-1 text-sm text-slate-500">{workout.box_name} · {(workout.classification?.sections ?? []).length} blocos</p></div></div></article>)}</div>;
}

function ProfileView({ profile, installPrompt, onInstall, onLogout }: { profile: AthleteProfile; installPrompt?: Event; onInstall: () => void; onLogout: () => void }) {
  return <div className="athlete-enter space-y-4"><section className="rounded-[28px] bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,.08)]"><div className="grid h-16 w-16 place-items-center rounded-3xl bg-[#071426] text-xl font-black text-white">{initials(profile.name)}</div><h2 className="mt-4 text-2xl font-black">{profile.name}</h2><p className="mt-1 text-sm text-slate-500">{profile.email}</p></section><section className="rounded-[28px] bg-white p-5"><p className="text-xs font-extrabold uppercase tracking-[.15em] text-slate-400">Meus boxes</p><div className="mt-3 space-y-3">{profile.memberships.map((membership) => <div key={membership.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4"><div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-100 text-orange-600"><Dumbbell className="h-5 w-5" /></div><div><p className="font-extrabold">{membership.box_name}</p><p className="text-xs text-slate-500">Vínculo ativo</p></div></div>)}</div></section>{installPrompt && <button onClick={onInstall} className="flex w-full items-center gap-3 rounded-3xl bg-cyan-50 p-4 text-left"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-500 text-white"><Download className="h-5 w-5" /></div><div><p className="font-extrabold">Instalar EngageFit</p><p className="text-sm text-slate-600">Acesso rápido direto da tela inicial</p></div></button>}<button onClick={onLogout} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-extrabold text-slate-700"><LogOut className="h-4 w-4" /> Sair da conta</button></div>;
}

function AthleteAuthShell({ children }: { children: ReactNode }) { return <div className="relative min-h-[100dvh] overflow-hidden bg-[#071426] px-5 py-[max(2rem,env(safe-area-inset-top))]"><div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" /><div className="absolute -bottom-20 -left-28 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" /><main className="relative mx-auto max-w-md"><div className="mb-12"><AthleteBrand /></div>{children}</main></div>; }
function AthleteSplash() { return <div className="grid min-h-[100dvh] place-items-center bg-[#071426]"><div className="text-center"><AthleteBrand /><div className="mx-auto mt-8 h-1.5 w-28 overflow-hidden rounded-full bg-white/10"><div className="athlete-loading h-full w-1/2 rounded-full bg-orange-500" /></div></div></div>; }
function AthleteBrand() { return <div className="inline-flex items-center" aria-label="EngageFit"><span className="rounded-xl bg-white px-2 py-1 shadow-lg shadow-black/20"><img src="/engagefit-logo-cropped.png" alt="EngageFit" className="h-7 w-auto" /></span></div>; }
function AthleteAuthSkeleton() { return <div className="animate-pulse space-y-5"><div className="h-7 w-36 rounded-full bg-white/10" /><div className="h-24 rounded-3xl bg-white/10" /><div className="h-80 rounded-[28px] bg-white/10" /></div>; }
function AuthMessage({ title, message }: { title: string; message: string }) { return <div className="rounded-[28px] bg-white p-6"><h1 className="text-2xl font-black">{title}</h1><p className="mt-3 leading-6 text-slate-600">{message}</p><button className="mt-6 font-bold text-orange-600" onClick={() => navigateAthlete('login')}>Ir para o login</button></div>; }
function AthleteField({ label, type, value, onChange, ...props }: { label: string; type: string; value: string; onChange: (value: string) => void; autoComplete?: string; placeholder?: string }) { return <label className="block text-sm font-bold text-slate-700">{label}<input {...props} type={type} value={value} onChange={(event) => onChange(event.target.value)} required className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-medium outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" /></label>; }
function AthleteNavButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Home; label: string; onClick: () => void }) { return <button onClick={onClick} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-extrabold transition ${active ? 'text-orange-600' : 'text-slate-400'}`}><Icon className={`h-5 w-5 ${active ? 'fill-orange-100' : ''}`} />{label}</button>; }
function EmptyWorkout() { return <section className="athlete-enter rounded-[28px] bg-white p-7 text-center shadow-[0_12px_35px_rgba(15,23,42,.08)]"><div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-orange-50 text-orange-600"><Dumbbell className="h-7 w-7" /></div><h2 className="mt-5 text-xl font-black">O próximo treino ainda não chegou</h2><p className="mt-2 text-sm leading-6 text-slate-500">Assim que o box publicar, ele aparece aqui automaticamente.</p></section>; }

function featuredWorkout(workouts: AthleteWorkout[]) { const today = localDate(); return workouts.find((item) => item.workout_date === today) ?? workouts.find((item) => item.workout_date > today) ?? workouts[0]; }
function localDate() { const now = new Date(); const offset = now.getTimezoneOffset() * 60000; return new Date(now.getTime() - offset).toISOString().slice(0, 10); }
function navigateAthlete(target: 'app' | 'login') { window.location.hash = target === 'app' ? '/athlete' : '/athlete/login'; }
function firstName(name: string) { return name.trim().split(/\s+/)[0] || 'atleta'; }
function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(''); }
function greeting() { const hour = new Date().getHours(); return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'; }
function relativeWorkoutDate(value: string) { if (value === localDate()) return 'Treino de hoje'; const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); const offset = tomorrow.getTimezoneOffset() * 60000; if (value === new Date(tomorrow.getTime() - offset).toISOString().slice(0, 10)) return 'Treino de amanhã'; return formatWorkoutDate(value); }
function formatWorkoutDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`)).replace('.', ''); }
function sectionLabel(type: WorkoutSectionType) { return ({ warmup: 'Aquecimento', skill: 'Técnica', strength: 'Força', wod: 'Workout of the day', accessory: 'Acessório', cooldown: 'Volta à calma', other: 'Treino' } as Record<WorkoutSectionType, string>)[type]; }
function sectionOrdinal(type: WorkoutSectionType) { return ({ warmup: '01', skill: '02', strength: '03', wod: 'W', accessory: '+', cooldown: '✓', other: '•' } as Record<WorkoutSectionType, string>)[type]; }
function formatLabel(value: string) { return ({ amrap: 'AMRAP', emom: 'EMOM', for_time: 'For time', tabata: 'Tabata', interval: 'Intervalado', max_effort: 'Carga máxima' } as Record<string, string>)[value] ?? value; }

export function athleteRouteFromHash(): AthleteRoute | null {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const invite = hash.match(/^athlete\/invite\/([A-Za-z0-9_-]{32,80})$/);
  if (invite) return { kind: 'invite', token: invite[1] };
  const reset = hash.match(/^athlete\/reset-password\/([A-Za-z0-9_-]{32,80})$/);
  if (reset) return { kind: 'reset', token: reset[1] };
  const verify = hash.match(/^athlete\/verify-email\/([A-Za-z0-9_-]{32,80})$/);
  if (verify) return { kind: 'verify', token: verify[1] };
  if (hash === 'athlete/login') return { kind: 'login' };
  if (hash === 'athlete') return { kind: 'app' };
  return null;
}
