import { CheckCircle2, KeyRound, Plug, Save, ShieldAlert } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { ErrorState, LoadingState } from '../../components/common/State';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { api } from '../../features/api/endpoints';

export function SettingsPage() {
  const [boxName, setBoxName] = useState('');
  const [riskInactiveDays, setRiskInactiveDays] = useState(7);
  const [riskMessageCooldownDays, setRiskMessageCooldownDays] = useState(14);
  const [provider, setProvider] = useState<'twilio' | 'meta_cloud'>('twilio');
  const [baseUrl, setBaseUrl] = useState('');
  const [instanceName, setInstanceName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [hasSavedCredential, setHasSavedCredential] = useState(false);
  const [updatedAt, setUpdatedAt] = useState('');
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingRiskSettings, setSavingRiskSettings] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    Promise.all([api.whatsappSettings(), api.box()])
      .then(([settings, box]) => {
        setBoxName(box.name ?? '');
        setRiskInactiveDays(box.risk_inactive_days ?? 7);
        setRiskMessageCooldownDays(box.risk_message_cooldown_days ?? 14);
        setProvider(settings.provider ?? 'twilio');
        setBaseUrl(settings.base_url ?? '');
        setInstanceName(settings.instance_name ?? '');
        setHasSavedCredential(settings.has_api_key ?? false);
        setUpdatedAt(settings.updated_at ?? '');
        setEnabled(settings.enabled ?? false);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar configuracoes'))
      .finally(() => setLoading(false));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    setError('');
    setStatus('');
    setSaving(true);
    try {
      const settings = await api.updateWhatsappSettings({ provider, base_url: baseUrl, instance_name: instanceName, api_key: apiKey, enabled });
      setApiKey('');
      setHasSavedCredential(settings.has_api_key ?? Boolean(apiKey));
      setUpdatedAt(settings.updated_at ?? '');
      setDirty(false);
      setStatus('Configuracao salva e pronta para teste');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configuracao');
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    setError('');
    setStatus('');
    setTesting(true);
    try {
      await api.testWhatsappSettings({ provider, base_url: baseUrl, instance_name: instanceName, api_key: apiKey, enabled });
      setStatus('Conexao validada');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao testar conexao');
    } finally {
      setTesting(false);
    }
  }

  async function saveRiskSettings(event: FormEvent) {
    event.preventDefault();
    setError('');
    setStatus('');
    setSavingRiskSettings(true);
    try {
      const box = await api.updateBox({
        name: boxName,
        risk_inactive_days: riskInactiveDays,
        risk_message_cooldown_days: riskMessageCooldownDays,
      });
      setRiskInactiveDays(box.risk_inactive_days ?? 7);
      setRiskMessageCooldownDays(box.risk_message_cooldown_days ?? 14);
      setStatus('Regras de risco salvas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar regras de risco');
    } finally {
      setSavingRiskSettings(false);
    }
  }

  if (loading) return <LoadingState label="Carregando configuracoes" />;

  function markChanged(update: () => void) {
    update();
    setDirty(true);
    setStatus('');
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Configuracoes</h1>
        <p className="mt-1 text-sm text-slate-500">Conexao operacional com canais externos.</p>
      </div>

      {error && <ErrorState message={error} />}
      {status && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {status}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-soft text-accent-dark">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-950">Regras de risco</h2>
              <p className="text-sm text-slate-500">Controle quando um aluno entra em risco e a cadencia de novas abordagens.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={saveRiskSettings}>
            <label className="space-y-1 text-sm font-semibold text-slate-600">
              Aluno em risco apos quantos dias sem check-in
              <Input
                type="number"
                min={1}
                max={365}
                value={riskInactiveDays}
                onChange={(event) => setRiskInactiveDays(Number(event.target.value))}
                required
              />
            </label>
            <label className="space-y-1 text-sm font-semibold text-slate-600">
              Reenviar mensagem de risco apos quantos dias
              <Input
                type="number"
                min={1}
                max={365}
                value={riskMessageCooldownDays}
                onChange={(event) => setRiskMessageCooldownDays(Number(event.target.value))}
                required
              />
            </label>
            <div className="md:col-span-2">
              <Button disabled={savingRiskSettings}>
                <Save className="h-4 w-4" />
                {savingRiskSettings ? 'Salvando' : 'Salvar regras de risco'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-soft text-accent-dark">
              <Plug className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-950">Integracao WhatsApp</h2>
              <p className="text-sm text-slate-500">WhatsApp comercial para campanhas de engajamento.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-slate-200 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Provedor selecionado</p>
              <p className="mt-1 text-sm font-bold text-slate-950">{provider === 'twilio' ? 'Twilio WhatsApp' : 'Meta Cloud API'}</p>
            </div>
            <div className="rounded-md border border-slate-200 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Credencial</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-950">
                <KeyRound className="h-4 w-4 text-slate-500" />
                {hasSavedCredential ? 'Cadastrada' : 'Nao cadastrada'}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ultima atualizacao</p>
              <p className="mt-1 text-sm font-bold text-slate-950">{updatedAt ? new Date(updatedAt).toLocaleString('pt-BR') : 'Nunca'}</p>
            </div>
          </div>
          <form className="grid gap-4 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1fr_1fr_1fr]" onSubmit={save}>
            <label className="space-y-1 text-sm font-semibold text-slate-600">
              Provedor
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                value={provider}
                onChange={(event) => markChanged(() => setProvider(event.target.value as 'twilio' | 'meta_cloud'))}
              >
                <option value="twilio">Twilio WhatsApp</option>
                <option value="meta_cloud">Meta Cloud API</option>
              </select>
            </label>
            <label className="space-y-1 text-sm font-semibold text-slate-600">
              Base URL
              <Input
                placeholder={provider === 'twilio' ? 'https://api.twilio.com' : 'https://graph.facebook.com/v20.0'}
                value={baseUrl}
                onChange={(event) => markChanged(() => setBaseUrl(event.target.value))}
              />
            </label>
            <label className="space-y-1 text-sm font-semibold text-slate-600">
              {provider === 'twilio' ? 'Remetente WhatsApp ou Messaging Service SID' : 'Phone number ID'}
              <Input
                placeholder={provider === 'twilio' ? 'whatsapp:+14155238886 ou MG...' : '123456789012345'}
                value={instanceName}
                onChange={(event) => markChanged(() => setInstanceName(event.target.value))}
                required
              />
            </label>
            <label className="space-y-1 text-sm font-semibold text-slate-600">
              {provider === 'twilio' ? 'Account SID:Auth Token' : 'Access token'}
              <Input
                type="password"
                placeholder={hasSavedCredential ? 'Credencial cadastrada; preencha apenas para trocar' : provider === 'twilio' ? 'AC...:token' : '••••••••'}
                value={apiKey}
                onChange={(event) => markChanged(() => setApiKey(event.target.value))}
                required={!hasSavedCredential}
              />
            </label>
            <label className="flex h-10 items-center gap-3 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={enabled} onChange={(event) => markChanged(() => setEnabled(event.target.checked))} />
              Ativar WhatsApp
            </label>
            <div className="flex gap-3 xl:col-span-2">
              <Button disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Salvando' : 'Salvar'}
              </Button>
              <Button type="button" variant="secondary" onClick={testConnection} disabled={testing}>
                <Plug className="h-4 w-4" />
                {testing ? 'Testando' : dirty ? 'Testar dados atuais' : 'Testar conexao salva'}
              </Button>
            </div>
            {dirty && (
              <p className="text-sm font-semibold text-amber-700 xl:col-span-3">
                Existem alteracoes nao salvas. O teste usa os dados atuais da tela; clique em Salvar para persistir.
              </p>
            )}
          </form>

          <div className="mt-5 flex gap-3 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Para campanhas ativas em producao, use templates aprovados na Twilio/Meta e preencha o Content SID no template. Em desenvolvimento, envio real so e liberado com `WHATSAPP_ALLOW_REAL_SEND=true`; use `WHATSAPP_DEV_ALLOWED_RECIPIENT_PHONES` para limitar os numeros permitidos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
