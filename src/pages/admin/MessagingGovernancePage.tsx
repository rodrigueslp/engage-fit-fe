import { AlertTriangle, Building2, KeyRound, Plug, Save, ShieldCheck, WalletCards } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ErrorState, LoadingState } from '../../components/common/State';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { api, type MessagingPolicyPayload } from '../../features/api/endpoints';
import type { MessagingBoxOverview, MessagingPolicy, MessagingPolicyWithUsage, WhatsappSettings } from '../../features/api/types';

function money(micros: number, currency = 'USD') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(micros / 1_000_000);
}

function percent(value: number, limit: number) {
  if (limit <= 0) return 100;
  return Math.min(100, Math.round((value / limit) * 100));
}

function UsageBar({ label, used, reserved, limit }: { label: string; used: number; reserved: number; limit: number }) {
  const usagePercent = percent(used + reserved, limit);
  const color = usagePercent >= 90 ? 'bg-rose-500' : usagePercent >= 75 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="text-slate-500">{used} usados{reserved > 0 ? ` + ${reserved} reservados` : ''} / {limit}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${color}`} style={{ width: `${usagePercent}%` }} /></div>
    </div>
  );
}

function PolicyEditor({ title, description, data, onSave, saving }: { title: string; description: string; data: MessagingPolicyWithUsage; onSave: (payload: MessagingPolicyPayload) => Promise<void>; saving: boolean }) {
  const [form, setForm] = useState<MessagingPolicyPayload>(() => toPayload(data.policy));

  useEffect(() => setForm(toPayload(data.policy)), [data.policy]);

  function numberField(field: keyof MessagingPolicyPayload, value: string) {
    setForm((current) => ({ ...current, [field]: Number(value) }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSave(form);
  }

  const policy = data.policy;
  const usage = data.usage;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${policy.blocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {policy.blocked ? 'Envios bloqueados' : 'Envios liberados'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <UsageBar label="Uso diário" used={usage.daily_accepted} reserved={usage.daily_reserved} limit={policy.daily_message_limit} />
          <UsageBar label="Uso mensal" used={usage.monthly_accepted} reserved={usage.monthly_reserved} limit={policy.monthly_message_limit} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Custo diário estimado" value={money(usage.daily_estimated_cost_micros + usage.daily_reserved_cost_micros, policy.currency)} detail={`limite ${money(policy.daily_cost_limit_micros, policy.currency)}`} />
          <Metric label="Custo mensal estimado" value={money(usage.monthly_estimated_cost_micros + usage.monthly_reserved_cost_micros, policy.currency)} detail={`limite ${money(policy.monthly_cost_limit_micros, policy.currency)}`} />
          <Metric label="Estimativa unitária" value={money(policy.estimated_cost_micros_per_message, policy.currency)} detail="reserva conservadora" />
          <Metric label="Alerta" value={`${policy.warning_percent}%`} detail={policy.timezone} />
        </div>
        <form className="space-y-5" onSubmit={submit}>
          <FieldGroup title="Volume de mensagens" description="Define quanto pode ser enviado antes de o sistema bloquear o disparo.">
            <NumberInput label="Limite por dia" value={form.daily_message_limit} onChange={(value) => numberField('daily_message_limit', value)} />
            <NumberInput label="Limite por mês" value={form.monthly_message_limit} onChange={(value) => numberField('monthly_message_limit', value)} />
            <NumberInput label="Máximo em um disparo" value={form.per_dispatch_limit} onChange={(value) => numberField('per_dispatch_limit', value)} />
          </FieldGroup>
          <FieldGroup title="Proteção de custo" description="Valores estimados usados na reserva preventiva antes de chamar o provedor.">
            <MoneyInput label="Custo por mensagem" micros={form.estimated_cost_micros_per_message} onChange={(value) => setForm((current) => ({ ...current, estimated_cost_micros_per_message: Math.round(Number(value) * 1_000_000) }))} />
            <MoneyInput label="Orçamento por dia" micros={form.daily_cost_limit_micros} onChange={(value) => setForm((current) => ({ ...current, daily_cost_limit_micros: Math.round(Number(value) * 1_000_000) }))} />
            <MoneyInput label="Orçamento por mês" micros={form.monthly_cost_limit_micros} onChange={(value) => setForm((current) => ({ ...current, monthly_cost_limit_micros: Math.round(Number(value) * 1_000_000) }))} />
          </FieldGroup>
          <FieldGroup title="Regras operacionais" description="Configura alerta, período de apuração e bloqueio manual.">
            <NumberInput label="Alertar ao atingir (%)" value={form.warning_percent} min={1} max={100} onChange={(value) => numberField('warning_percent', value)} />
            <label className="space-y-1 text-sm font-semibold text-slate-600">Moeda
              <Input value={form.currency} maxLength={3} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))} required />
            </label>
            <label className="space-y-1 text-sm font-semibold text-slate-600">Timezone
              <Input value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} required />
            </label>
          </FieldGroup>
          <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <label className="space-y-1 text-sm font-semibold text-slate-600">Motivo da alteração
              <Input value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Ex.: aumento de limite aprovado para o plano Pro" required />
            </label>
            <label className={`flex h-10 items-center gap-3 rounded-md border px-3 text-sm font-semibold ${form.blocked ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-700'}`}>
              <input type="checkbox" checked={form.blocked} onChange={(event) => setForm((current) => ({ ...current, blocked: event.target.checked }))} />
              Bloquear novos disparos
            </label>
          </div>
          <div className="flex justify-end"><Button disabled={saving}><Save className="h-4 w-4" />{saving ? 'Salvando' : 'Salvar alterações'}</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}

function FieldGroup({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="grid gap-4 border-t border-slate-100 pt-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <div><p className="text-sm font-bold text-slate-800">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>
      <div className="grid gap-4 md:grid-cols-3">{children}</div>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-md border border-slate-200 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-lg font-bold text-slate-950">{value}</p><p className="text-xs text-slate-500">{detail}</p></div>;
}

function NumberInput({ label, value, onChange, min = 0, max }: { label: string; value: number; onChange: (value: string) => void; min?: number; max?: number }) {
  return <label className="space-y-1 text-sm font-semibold text-slate-600">{label}<Input type="number" min={min} max={max} value={value} onChange={(event) => onChange(event.target.value)} required /></label>;
}

function MoneyInput({ label, micros, onChange }: { label: string; micros: number; onChange: (value: string) => void }) {
  return <label className="space-y-1 text-sm font-semibold text-slate-600">{label} (na moeda configurada)<Input type="number" min={0} step="0.000001" value={micros / 1_000_000} onChange={(event) => onChange(event.target.value)} required /></label>;
}

function toPayload(policy: MessagingPolicy): MessagingPolicyPayload {
  return { daily_message_limit: policy.daily_message_limit, monthly_message_limit: policy.monthly_message_limit,
    per_dispatch_limit: policy.per_dispatch_limit, estimated_cost_micros_per_message: policy.estimated_cost_micros_per_message,
    daily_cost_limit_micros: policy.daily_cost_limit_micros, monthly_cost_limit_micros: policy.monthly_cost_limit_micros,
    currency: policy.currency, warning_percent: policy.warning_percent, timezone: policy.timezone, blocked: policy.blocked, reason: '' };
}

type ConnectionPayload = { connection_mode: 'platform' | 'dedicated'; provider: 'twilio' | 'meta_cloud'; base_url: string; instance_name: string; api_key: string; enabled: boolean };

function ConnectionEditor({ settings, saving, onSave, onTest }: { settings: WhatsappSettings; saving: boolean; onSave: (payload: ConnectionPayload) => Promise<void>; onTest: (payload: ConnectionPayload) => Promise<void> }) {
  const [form, setForm] = useState<ConnectionPayload>({ connection_mode: settings.connection_mode, provider: settings.provider, base_url: settings.base_url, instance_name: settings.instance_name, api_key: '', enabled: settings.enabled });
  useEffect(() => setForm({ connection_mode: settings.connection_mode, provider: settings.provider, base_url: settings.base_url, instance_name: settings.instance_name, api_key: '', enabled: settings.enabled }), [settings]);
  return <Card><CardHeader><div className="flex items-center gap-3"><Plug className="h-5 w-5 text-accent" /><div><h2 className="font-bold text-slate-950">Conexão gerenciada</h2><p className="text-sm text-slate-500">Credenciais e remetente são visíveis e editáveis somente pelo administrador da plataforma.</p></div></div></CardHeader><CardContent>
    <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={(event) => { event.preventDefault(); void onSave(form); }}>
      <label className="space-y-1 text-sm font-semibold text-slate-600">Modo<select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={form.connection_mode} onChange={(event) => setForm((current) => ({ ...current, connection_mode: event.target.value as ConnectionPayload['connection_mode'] }))}><option value="platform">Número EngageFit</option><option value="dedicated">Número dedicado</option></select></label>
      {form.connection_mode === 'dedicated' && <>
        <label className="space-y-1 text-sm font-semibold text-slate-600">Provedor<select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={form.provider} onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value as ConnectionPayload['provider'] }))}><option value="twilio">Twilio WhatsApp</option><option value="meta_cloud">Meta Cloud API</option></select></label>
        <label className="space-y-1 text-sm font-semibold text-slate-600">Base URL<Input value={form.base_url} onChange={(event) => setForm((current) => ({ ...current, base_url: event.target.value }))} placeholder="https://api.twilio.com" /></label>
        <label className="space-y-1 text-sm font-semibold text-slate-600">Remetente / Phone number ID<Input value={form.instance_name} onChange={(event) => setForm((current) => ({ ...current, instance_name: event.target.value }))} required /></label>
        <label className="space-y-1 text-sm font-semibold text-slate-600">Credencial<KeyRound className="sr-only" /><Input type="password" value={form.api_key} onChange={(event) => setForm((current) => ({ ...current, api_key: event.target.value }))} placeholder={settings.has_api_key ? 'Credencial cadastrada; deixe vazio para preservar' : 'Account SID:Auth Token'} /></label>
      </>}
      <label className="flex items-center gap-3 rounded-md border border-slate-200 p-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.enabled} onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))} />Conexão ativa</label>
      <div className="flex gap-2 md:col-span-2 xl:col-span-3"><Button disabled={saving}><Save className="h-4 w-4" />Salvar conexão</Button><Button type="button" variant="secondary" disabled={saving} onClick={() => void onTest(form)}>Testar conexão</Button></div>
    </form>
  </CardContent></Card>;
}

function OwnerAccessEditor({ saving, onReset }: { saving: boolean; onReset: (password: string, reason: string) => Promise<void> }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [reason, setReason] = useState('');
  const [validation, setValidation] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setValidation('');
    if (password.length < 12) { setValidation('A nova senha deve ter ao menos 12 caracteres.'); return; }
    if (password !== confirmation) { setValidation('A confirmação da senha não confere.'); return; }
    try {
      await onReset(password, reason);
      setPassword(''); setConfirmation(''); setReason('');
    } catch {
      // A mensagem acionável é exibida pelo container da página.
    }
  }
  return (
    <Card>
      <CardHeader><div className="flex items-center gap-3"><KeyRound className="h-5 w-5 text-accent" /><div><h2 className="font-bold text-slate-950">Acesso do owner</h2><p className="text-sm text-slate-500">Redefina a senha somente após confirmar a solicitação da academia.</p></div></div></CardHeader>
      <CardContent>
        <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">A alteração é imediata e fica registrada na auditoria administrativa. A senha nunca será exibida novamente.</div>
        {validation && <p className="mb-4 text-sm font-semibold text-rose-700">{validation}</p>}
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <label className="space-y-1 text-sm font-semibold text-slate-600">Nova senha<Input type="password" autoComplete="new-password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          <label className="space-y-1 text-sm font-semibold text-slate-600">Confirmar nova senha<Input type="password" autoComplete="new-password" minLength={12} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label>
          <label className="space-y-1 text-sm font-semibold text-slate-600 md:col-span-2">Motivo da redefinição<Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ex.: owner confirmou perda de acesso pelo canal de suporte" required /></label>
          <div className="md:col-span-2"><Button disabled={saving}><KeyRound className="h-4 w-4" />{saving ? 'Redefinindo' : 'Redefinir senha do owner'}</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}

export function MessagingGovernancePage({ whatsappEnabled }: { whatsappEnabled: boolean }) {
  const [boxes, setBoxes] = useState<MessagingBoxOverview[]>([]);
  const [platform, setPlatform] = useState<MessagingPolicyWithUsage>();
  const [connection, setConnection] = useState<WhatsappSettings>();
  const [selectedBoxID, setSelectedBoxID] = useState('');
  const [section, setSection] = useState<'global' | 'academies'>('academies');
  const [academyTab, setAcademyTab] = useState<'policy' | 'connection' | 'access'>('policy');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  async function load() {
    const [boxItems, platformPolicy] = await Promise.all([api.adminMessagingBoxes(), api.adminPlatformMessagingPolicy()]);
    setBoxes(boxItems);
    setPlatform(platformPolicy);
    setSelectedBoxID((current) => boxItems.some((box) => box.box_id === current) ? current : boxItems[0]?.box_id || '');
  }

  useEffect(() => { load().catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar governança')).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    if (!whatsappEnabled || !selectedBoxID) { setConnection(undefined); return; }
    setConnection(undefined);
    api.adminWhatsappSettings(selectedBoxID).then(setConnection).catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar conexão'));
  }, [selectedBoxID, whatsappEnabled]);

  async function savePlatform(payload: MessagingPolicyPayload) {
    setSaving(true); setError(''); setStatus('');
    try { setPlatform(await api.updateAdminPlatformMessagingPolicy(payload)); setStatus('Política global atualizada'); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao salvar política'); }
    finally { setSaving(false); }
  }

  async function saveBox(payload: MessagingPolicyPayload) {
    if (!selectedBoxID) return;
    setSaving(true); setError(''); setStatus('');
    try { await api.updateAdminBoxMessagingPolicy(selectedBoxID, payload); setStatus('Política da academia atualizada'); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao salvar política'); }
    finally { setSaving(false); }
  }

  async function saveConnection(payload: ConnectionPayload) {
    if (!selectedBoxID) return;
    setSaving(true); setError(''); setStatus('');
    try { setConnection(await api.updateAdminWhatsappSettings(selectedBoxID, payload)); setStatus('Conexão da academia atualizada'); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao salvar conexão'); }
    finally { setSaving(false); }
  }

  async function testConnection(payload: ConnectionPayload) {
    if (!selectedBoxID) return;
    setSaving(true); setError(''); setStatus('');
    try { await api.testAdminWhatsappSettings(selectedBoxID, payload); setStatus('Conexão validada pelo provedor'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao testar conexão'); }
    finally { setSaving(false); }
  }

  async function resetOwnerPassword(password: string, reason: string) {
    if (!selectedBoxID) return;
    setSaving(true); setError(''); setStatus('');
    try { await api.resetAdminOwnerPassword(selectedBoxID, { new_password: password, reason }); setStatus('Senha do owner redefinida e alteração registrada na auditoria'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao redefinir senha do owner'); throw err; }
    finally { setSaving(false); }
  }

  if (loading) return <LoadingState label="Carregando governança de mensageria" />;
  const selected = boxes.find((box) => box.box_id === selectedBoxID);
  const sharedConnections = boxes.filter((box) => box.connection_mode === 'platform').length;
  const blockedBoxes = boxes.filter((box) => box.policy.blocked).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-soft text-accent-dark"><ShieldCheck className="h-5 w-5" /></div><div><h1 className="text-2xl font-bold text-slate-950">Governança de WhatsApp</h1><p className="mt-1 text-sm text-slate-500">Controle o uso do número compartilhado e os limites de cada academia.</p></div></div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 shadow-sm">
          <SectionButton active={section === 'academies'} onClick={() => setSection('academies')}><Building2 className="h-4 w-4" />Academias</SectionButton>
          <SectionButton active={section === 'global'} onClick={() => setSection('global')}><ShieldCheck className="h-4 w-4" />Proteção global</SectionButton>
        </div>
      </div>
      {error && <ErrorState message={error} />}
      {status && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{status}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Academias cadastradas" value={String(boxes.length)} detail="tenants ativos no sistema" />
        <SummaryCard label="Número EngageFit" value={String(sharedConnections)} detail="academias na conexão compartilhada" />
        <SummaryCard label="Números dedicados" value={String(boxes.length - sharedConnections)} detail="conexões próprias de academias" />
        <SummaryCard label="Envios bloqueados" value={String(blockedBoxes)} detail={blockedBoxes === 0 ? 'nenhuma academia bloqueada' : 'exigem atenção operacional'} danger={blockedBoxes > 0} />
      </div>

      {section === 'global' && platform && (
        <div className="space-y-4">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><div className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-bold">Esta proteção vale somente para o número compartilhado do EngageFit.</p><p className="mt-1 text-amber-800">Ela funciona como um teto adicional à política individual de cada academia que usa essa conexão.</p></div></div></div>
          <PolicyEditor title="Proteção global" description="Limite consolidado de todas as academias que enviam pelo número EngageFit." data={platform} onSave={savePlatform} saving={saving} />
        </div>
      )}

      {section === 'academies' && (
        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)] xl:items-start">
          <Card className="xl:sticky xl:top-5">
            <CardHeader><div className="flex items-center gap-3"><Building2 className="h-5 w-5 text-accent" /><div><h2 className="font-bold text-slate-950">Academias</h2><p className="text-sm text-slate-500">Escolha quem deseja administrar.</p></div></div></CardHeader>
            <CardContent className="space-y-2">
              {boxes.length === 0 && <p className="text-sm text-slate-500">Nenhuma academia cadastrada.</p>}
              {boxes.map((box) => (
                <button key={box.box_id} type="button" onClick={() => setSelectedBoxID(box.box_id)} className={`w-full rounded-lg border p-3 text-left transition ${selectedBoxID === box.box_id ? 'border-accent bg-accent-soft/40' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                  <span className="block truncate text-sm font-bold text-slate-900">{box.box_name}</span>
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><WalletCards className="h-3.5 w-3.5" />{box.connection_mode === 'platform' ? 'Número EngageFit' : 'Número dedicado'}</span>
                  {box.policy.blocked && <span className="mt-2 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">Envios bloqueados</span>}
                </button>
              ))}
            </CardContent>
          </Card>

          {selected ? (
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Academia selecionada</p><h2 className="mt-1 text-xl font-bold text-slate-950">{selected.box_name}</h2></div>
                <div className="inline-flex rounded-lg bg-slate-100 p-1">
                  <SectionButton active={academyTab === 'policy'} onClick={() => setAcademyTab('policy')}><ShieldCheck className="h-4 w-4" />Limites e consumo</SectionButton>
                  {whatsappEnabled && <SectionButton active={academyTab === 'connection'} onClick={() => setAcademyTab('connection')}><Plug className="h-4 w-4" />Conexão</SectionButton>}
                  <SectionButton active={academyTab === 'access'} onClick={() => setAcademyTab('access')}><KeyRound className="h-4 w-4" />Acesso</SectionButton>
                </div>
              </div>
              {academyTab === 'policy' && <PolicyEditor key={selected.box_id} title="Limites da academia" description="Estes limites valem apenas para esta academia e são aplicados a todos os seus disparos." data={{ policy: selected.policy, usage: selected.usage }} onSave={saveBox} saving={saving} />}
              {academyTab === 'connection' && (connection ? <ConnectionEditor key={`connection-${selected.box_id}`} settings={connection} saving={saving} onSave={saveConnection} onTest={testConnection} /> : <LoadingState label="Carregando conexão da academia" />)}
              {academyTab === 'access' && <OwnerAccessEditor key={`access-${selected.box_id}`} saving={saving} onReset={resetOwnerPassword} />}
            </div>
          ) : <Card><CardContent><p className="text-sm text-slate-500">Selecione uma academia para visualizar limites e conexão.</p></CardContent></Card>}
        </div>
      )}
    </div>
  );
}

function SectionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} className={`inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition ${active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{children}</button>;
}

function SummaryCard({ label, value, detail, danger = false }: { label: string; value: string; detail: string; danger?: boolean }) {
  return <div className={`rounded-lg border bg-white p-4 shadow-sm ${danger ? 'border-rose-200' : 'border-slate-200'}`}><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-2 text-2xl font-bold ${danger ? 'text-rose-700' : 'text-slate-950'}`}>{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
}
