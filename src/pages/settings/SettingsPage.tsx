import {
  CheckCircle2,
  ChevronRight,
  KeyRound,
  MessageCircle,
  Plug,
  Save,
  ShieldAlert,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorState, LoadingState } from '../../components/common/State';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { api } from '../../features/api/endpoints';

type SettingsSection = 'risk' | 'security' | 'whatsapp';

const sections: Array<{
  id: SettingsSection;
  label: string;
  description: string;
  icon: typeof ShieldAlert;
}> = [
  {
    id: 'risk',
    label: 'Alunos em risco',
    description: 'Critérios e frequência de contato',
    icon: ShieldAlert,
  },
  {
    id: 'security',
    label: 'Acesso e segurança',
    description: 'Senha da sua conta',
    icon: KeyRound,
  },
  {
    id: 'whatsapp',
    label: 'Integração WhatsApp',
    description: 'Status do canal de mensagens',
    icon: MessageCircle,
  },
];

export function SettingsPage({ whatsappEnabled, onSessionRevoked }: { whatsappEnabled: boolean; onSessionRevoked: () => void }) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('risk');
  const [boxName, setBoxName] = useState('');
  const [riskInactiveDays, setRiskInactiveDays] = useState(7);
  const [riskMessageCooldownDays, setRiskMessageCooldownDays] = useState(14);
  const [connectionMode, setConnectionMode] = useState<'platform' | 'dedicated'>('platform');
  const [provider, setProvider] = useState<'twilio' | 'meta_cloud'>('twilio');
  const [baseUrl, setBaseUrl] = useState('');
  const [instanceName, setInstanceName] = useState('');
  const apiKey = '';
  const [enabled, setEnabled] = useState(false);
  const [hasSavedCredential, setHasSavedCredential] = useState(false);
  const [updatedAt, setUpdatedAt] = useState('');
  const [platformAvailable, setPlatformAvailable] = useState(false);
  const [platformSender, setPlatformSender] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingRiskSettings, setSavingRiskSettings] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    Promise.all([whatsappEnabled ? api.whatsappSettings() : Promise.resolve(undefined), api.box()])
      .then(([settings, box]) => {
        setBoxName(box.name ?? '');
        setRiskInactiveDays(box.risk_inactive_days ?? 7);
        setRiskMessageCooldownDays(box.risk_message_cooldown_days ?? 14);
        if (settings) {
          setConnectionMode(settings.connection_mode ?? 'platform');
          setProvider(settings.provider ?? 'twilio');
          setBaseUrl(settings.base_url ?? '');
          setInstanceName(settings.instance_name ?? '');
          setHasSavedCredential(settings.has_api_key ?? false);
          setUpdatedAt(settings.updated_at ?? '');
          setEnabled(settings.enabled ?? false);
          setPlatformAvailable(settings.platform_available ?? false);
          setPlatformSender(settings.platform_sender ?? '');
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar configurações'))
      .finally(() => setLoading(false));
  }, [whatsappEnabled]);

  function selectSection(section: SettingsSection) {
    setActiveSection(section);
    setError('');
    setStatus('');
  }

  async function testConnection() {
    setError('');
    setStatus('');
    setTesting(true);
    try {
      await api.testWhatsappSettings({
        connection_mode: connectionMode,
        provider,
        base_url: baseUrl,
        instance_name: instanceName,
        api_key: apiKey,
        enabled,
      });
      setStatus('Conexão com o WhatsApp validada com sucesso');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao testar conexão');
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
      setStatus('Regras de alunos em risco salvas com sucesso');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar regras de risco');
    } finally {
      setSavingRiskSettings(false);
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setError('');
    setStatus('');
    if (newPassword.length < 12) {
      setError('A nova senha deve ter ao menos 12 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('A confirmação da nova senha não confere');
      return;
    }
    setChangingPassword(true);
    try {
      await api.changePassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onSessionRevoked();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar senha');
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) return <LoadingState label="Carregando configurações" />;

  const whatsappReady = connectionMode === 'platform'
    ? platformAvailable
    : enabled && hasSavedCredential;
  const whatsappModeLabel = connectionMode === 'platform'
    ? 'Número compartilhado do EngageFit'
    : 'Número próprio da academia';

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Sua academia"
        title="Configurações"
        description="Gerencie as regras da operação, a segurança da sua conta e consulte suas integrações."
      />

      {error && <ErrorState message={error} />}
      {status && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {status}
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-5 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0" aria-label="Seções das configurações">
              {sections.filter((section) => section.id !== 'whatsapp' || whatsappEnabled).map((section) => {
            const Icon = section.icon;
            const selected = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => selectSection(section.id)}
                className={`flex min-w-[190px] items-center gap-3 rounded-lg px-3 py-3 text-left transition lg:w-full lg:min-w-0 ${
                  selected
                    ? 'bg-accent-soft text-accent-dark ring-1 ring-accent/15'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
                aria-current={selected ? 'page' : undefined}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${selected ? 'bg-white' : 'bg-slate-100'}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{section.label}</span>
                  <span className={`mt-0.5 hidden text-xs font-normal lg:block ${selected ? 'text-accent-dark/75' : 'text-slate-500'}`}>
                    {section.description}
                  </span>
                </span>
                <ChevronRight className={`hidden h-4 w-4 lg:block ${selected ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          {activeSection === 'risk' && (
            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-dark">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-950">Quando um aluno precisa de atenção?</h2>
                    <p className="mt-1 text-sm text-slate-500">Defina quando o aluno aparece como “em risco” e o intervalo mínimo entre contatos.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={saveRiskSettings}>
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="space-y-2 text-sm font-semibold text-slate-700">
                      Dias sem check-in
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        value={riskInactiveDays}
                        onChange={(event) => setRiskInactiveDays(Number(event.target.value))}
                        required
                      />
                      <span className="block text-xs font-normal leading-relaxed text-slate-500">
                        Depois desse período, o aluno entra na lista de atenção.
                      </span>
                    </label>
                    <label className="space-y-2 text-sm font-semibold text-slate-700">
                      Intervalo entre mensagens
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        value={riskMessageCooldownDays}
                        onChange={(event) => setRiskMessageCooldownDays(Number(event.target.value))}
                        required
                      />
                      <span className="block text-xs font-normal leading-relaxed text-slate-500">
                        Evita abordar o mesmo aluno novamente antes desse prazo.
                      </span>
                    </label>
                  </div>

                  <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                    <p className="font-bold">Como a regra será aplicada</p>
                    <p className="mt-1 leading-relaxed text-sky-800">
                      Um aluno será considerado em risco após <strong>{riskInactiveDays || 0} dias</strong> sem check-in. Depois de uma abordagem, uma nova mensagem poderá ser enviada após <strong>{riskMessageCooldownDays || 0} dias</strong>.
                    </p>
                  </div>

                  <div className="flex justify-end border-t border-slate-100 pt-5">
                    <Button disabled={savingRiskSettings}>
                      <Save className="h-4 w-4" />
                      {savingRiskSettings ? 'Salvando...' : 'Salvar alterações'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-dark">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-950">Alterar senha</h2>
                    <p className="mt-1 text-sm text-slate-500">Use uma senha exclusiva, com pelo menos 12 caracteres.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form className="max-w-xl space-y-5" onSubmit={changePassword}>
                  <label className="block space-y-2 text-sm font-semibold text-slate-700">
                    Senha atual
                    <Input
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      required
                    />
                  </label>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block space-y-2 text-sm font-semibold text-slate-700">
                      Nova senha
                      <Input
                        type="password"
                        autoComplete="new-password"
                        minLength={12}
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        required
                      />
                    </label>
                    <label className="block space-y-2 text-sm font-semibold text-slate-700">
                      Confirmar nova senha
                      <Input
                        type="password"
                        autoComplete="new-password"
                        minLength={12}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        required
                      />
                    </label>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                    Ao alterar a senha, as sessões abertas desta conta serão encerradas por segurança.
                  </div>

                  <div className="flex justify-end border-t border-slate-100 pt-5">
                    <Button disabled={changingPassword}>
                      <KeyRound className="h-4 w-4" />
                      {changingPassword ? 'Alterando...' : 'Alterar senha'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeSection === 'whatsapp' && (
            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-dark">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-950">Canal do WhatsApp</h2>
                    <p className="mt-1 text-sm text-slate-500">Consulte a conexão usada nas campanhas e valide se o canal está respondendo.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className={`flex items-start gap-3 rounded-lg border p-4 ${whatsappReady ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${whatsappReady ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <div>
                    <p className={`font-bold ${whatsappReady ? 'text-emerald-900' : 'text-amber-900'}`}>
                      {whatsappReady ? 'Conexão disponível' : 'Conexão aguardando configuração'}
                    </p>
                    <p className={`mt-1 text-sm ${whatsappReady ? 'text-emerald-800' : 'text-amber-800'}`}>
                      {whatsappReady
                        ? 'O canal está configurado. Você pode testar a comunicação antes de iniciar um disparo.'
                        : 'A equipe do EngageFit precisa concluir a configuração antes que mensagens possam ser enviadas.'}
                    </p>
                  </div>
                </div>

                <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr] sm:items-center">
                    <dt className="text-sm text-slate-500">Tipo de conexão</dt>
                    <dd className="text-sm font-bold text-slate-950">{whatsappModeLabel}</dd>
                  </div>
                  {connectionMode === 'dedicated' && (
                    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr] sm:items-center">
                      <dt className="text-sm text-slate-500">Provedor</dt>
                      <dd className="text-sm font-bold text-slate-950">{provider === 'twilio' ? 'Twilio WhatsApp' : 'Meta Cloud API'}</dd>
                    </div>
                  )}
                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr] sm:items-center">
                    <dt className="text-sm text-slate-500">Remetente</dt>
                    <dd className="text-sm font-bold text-slate-950">
                      {connectionMode === 'platform'
                        ? platformSender || 'Definido pelo EngageFit'
                        : instanceName || 'Ainda não definido'}
                    </dd>
                  </div>
                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr] sm:items-center">
                    <dt className="text-sm text-slate-500">Última atualização</dt>
                    <dd className="text-sm font-bold text-slate-950">
                      {updatedAt ? new Date(updatedAt).toLocaleString('pt-BR') : 'Nenhuma atualização registrada'}
                    </dd>
                  </div>
                </dl>

                <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
                  A conta, o número e as credenciais são administrados com segurança pela equipe do EngageFit. Se precisar alterar o canal, fale com o suporte.
                </div>

                <div className="flex justify-end border-t border-slate-100 pt-5">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={testConnection}
                    disabled={testing || !whatsappReady}
                  >
                    <Plug className="h-4 w-4" />
                    {testing ? 'Testando...' : 'Testar conexão'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
