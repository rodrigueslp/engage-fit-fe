import { Mail, Plus, Send } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { api } from '../../features/api/endpoints';
import type { Campaign, EmailCampaign, EmailCampaignPreview, EmailRecipient, EmailSettings, EmailTemplate } from '../../features/api/types';

const templateVariables = ['{{name}}', '{{box_name}}', '{{campaign_name}}', '{{current_checkins}}', '{{remaining_checkins}}', '{{target_checkins}}', '{{reward_name}}', '{{platform}}'];
const defaultSubject = '{{name}}, sua meta no {{box_name}}';
const defaultContent = 'Olá, {{name}}! Você está com {{current_checkins}} check-ins na campanha {{campaign_name}}. Faltam {{remaining_checkins}} para atingir {{target_checkins}} e garantir {{reward_name}}.';

export function EmailPage() {
  const [settings, setSettings] = useState<EmailSettings>();
  const [settingsForm, setSettingsForm] = useState({ provider: 'mock' as 'smtp' | 'mock', smtp_host: 'mock://local', smtp_port: 587, username: '', password: '', from_email: '', from_name: '', enabled: true });
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [goalCampaigns, setGoalCampaigns] = useState<Campaign[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [templateSubject, setTemplateSubject] = useState(defaultSubject);
  const [templateContent, setTemplateContent] = useState(defaultContent);
  const [campaignName, setCampaignName] = useState('');
  const [goalCampaignId, setGoalCampaignId] = useState('');
  const [audience, setAudience] = useState('almost_there');
  const [templateId, setTemplateId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [sendingCampaignId, setSendingCampaignId] = useState('');
  const [previewingCampaignId, setPreviewingCampaignId] = useState('');
  const [previewsByCampaign, setPreviewsByCampaign] = useState<Record<string, EmailCampaignPreview>>({});
  const [recipientsByCampaign, setRecipientsByCampaign] = useState<Record<string, EmailRecipient[]>>({});

  function load() {
    setLoading(true);
    Promise.allSettled([api.emailSettings(), api.emailTemplates(), api.emailCampaigns(), api.campaigns()])
      .then(([settingsResult, templatesResult, campaignsResult, goalCampaignsResult]) => {
        if (settingsResult.status === 'fulfilled') {
          const value = settingsResult.value;
          setSettings(value);
          setSettingsForm({ provider: value.provider, smtp_host: value.smtp_host, smtp_port: value.smtp_port || 587, username: value.username, password: '', from_email: value.from_email, from_name: value.from_name, enabled: value.enabled });
        }
        if (templatesResult.status === 'fulfilled') {
          setTemplates(templatesResult.value);
          setTemplateId(templatesResult.value[0]?.id ?? '');
        }
        if (campaignsResult.status === 'fulfilled') setCampaigns(campaignsResult.value);
        if (goalCampaignsResult.status === 'fulfilled') {
          setGoalCampaigns(goalCampaignsResult.value);
          setGoalCampaignId((current) => current || goalCampaignsResult.value[0]?.id || '');
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar e-mail'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const saved = await api.updateEmailSettings(settingsForm);
      setSettings(saved);
      setSettingsForm((current) => ({ ...current, password: '' }));
      setStatus('Configuração de e-mail salva.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configuração');
    }
  }

  async function testSettings() {
    setError('');
    try {
      await api.testEmailSettings(settingsForm);
      setStatus('Configuração validada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao testar configuração');
    }
  }

  async function createTemplate(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await api.createEmailTemplate({ name: templateName, subject: templateSubject, content: templateContent });
      setTemplateName('');
      setTemplateSubject(defaultSubject);
      setTemplateContent(defaultContent);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar template');
    }
  }

  async function createCampaign(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await api.createEmailCampaign({ name: campaignName, campaign_id: goalCampaignId, audience, template_id: templateId });
      setCampaignName('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar campanha');
    }
  }

  async function previewCampaign(campaignId: string) {
    setError('');
    setPreviewingCampaignId(campaignId);
    try {
      const preview = await api.emailCampaignPreview(campaignId);
      setPreviewsByCampaign((current) => ({ ...current, [campaignId]: preview }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar preview');
    } finally {
      setPreviewingCampaignId('');
    }
  }

  async function sendCampaign(campaignId: string) {
    setError('');
    setStatus('');
    setSendingCampaignId(campaignId);
    try {
      const result = await api.sendEmailCampaign(campaignId);
      setStatus(`Envio finalizado: ${result.sent}/${result.total} enviados, ${result.failed} falhas.`);
      const recipients = latestRecipientBatch(await api.emailRecipients(campaignId));
      setRecipientsByCampaign((current) => ({ ...current, [campaignId]: recipients }));
      const failedRecipient = recipients.find((recipient) => recipient.status === 'failed');
      if (failedRecipient) {
        setError('Falha no envio para ' + failedRecipient.email + ': ' + (failedRecipient.error_message || 'erro não informado pelo provedor'));
      }
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar campanha');
    } finally {
      setSendingCampaignId('');
    }
  }

  function latestRecipientBatch(recipients: EmailRecipient[]) {
    const latestCreatedAt = recipients.reduce((latest, recipient) => (recipient.created_at > latest ? recipient.created_at : latest), '');
    return recipients.filter((recipient) => recipient.created_at === latestCreatedAt);
  }

  function goalCampaignName(campaignId: string) {
    return goalCampaigns.find((campaign) => campaign.id === campaignId)?.name ?? 'Campanha não selecionada';
  }

  if (loading) return <LoadingState label="Carregando e-mail" />;

  return (
    <div className="space-y-5">
      <PageHeader title="E-mail" eyebrow="Comunicação complementar" description="Configure SMTP/mock, crie templates e acompanhe campanhas com preview e auditoria." />
      {error && <ErrorState message={error} />}
      {status && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{status}</div>}

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><h2 className="text-base font-bold text-slate-950">Configuração SMTP</h2></CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={saveSettings}>
              <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={settingsForm.provider} onChange={(event) => setSettingsForm((current) => ({ ...current, provider: event.target.value as 'smtp' | 'mock' }))}>
                <option value="mock">Mock local</option>
                <option value="smtp">SMTP</option>
              </select>
              <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                <Input placeholder="Host SMTP" value={settingsForm.smtp_host} onChange={(event) => setSettingsForm((current) => ({ ...current, smtp_host: event.target.value }))} />
                <Input type="number" placeholder="Porta" value={settingsForm.smtp_port} onChange={(event) => setSettingsForm((current) => ({ ...current, smtp_port: Number(event.target.value) }))} />
              </div>
              <Input placeholder="Usuario" value={settingsForm.username} onChange={(event) => setSettingsForm((current) => ({ ...current, username: event.target.value }))} />
              <Input type="password" placeholder={settings?.has_password ? 'Senha salva; deixe vazio para preservar' : 'Senha'} value={settingsForm.password} onChange={(event) => setSettingsForm((current) => ({ ...current, password: event.target.value }))} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="E-mail remetente" value={settingsForm.from_email} onChange={(event) => setSettingsForm((current) => ({ ...current, from_email: event.target.value }))} />
                <Input placeholder="Nome remetente" value={settingsForm.from_name} onChange={(event) => setSettingsForm((current) => ({ ...current, from_name: event.target.value }))} />
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <input type="checkbox" checked={settingsForm.enabled} onChange={(event) => setSettingsForm((current) => ({ ...current, enabled: event.target.checked }))} />
                Ativar envio de e-mail
              </label>
              <div className="flex flex-wrap gap-2">
                <Button><Mail className="h-4 w-4" />Salvar</Button>
                <Button type="button" variant="secondary" onClick={testSettings}>Testar</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-base font-bold text-slate-950">Templates</h2></CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-3" onSubmit={createTemplate}>
              <Input placeholder="Nome do template" value={templateName} onChange={(event) => setTemplateName(event.target.value)} required />
              <Input placeholder="Assunto" value={templateSubject} onChange={(event) => setTemplateSubject(event.target.value)} required />
              <Textarea placeholder="Conteúdo" value={templateContent} onChange={(event) => setTemplateContent(event.target.value)} required />
              <div className="flex flex-wrap gap-2">
                {templateVariables.map((variable) => <button key={variable} type="button" className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent-dark" onClick={() => setTemplateContent((content) => `${content} ${variable}`.trim())}>{variable}</button>)}
              </div>
              <Button><Plus className="h-4 w-4" />Criar template</Button>
            </form>
            {templates.length === 0 ? <EmptyState message="Nenhum template de e-mail" /> : templates.map((template) => (
              <div key={template.id} className="rounded-md border border-slate-100 p-3">
                <p className="font-semibold text-slate-950">{template.name}</p>
                <p className="text-sm font-semibold text-slate-600">{template.subject}</p>
                <p className="mt-1 text-sm text-slate-500">{template.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><h2 className="text-base font-bold text-slate-950">Campanhas de e-mail</h2></CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-3 lg:grid-cols-[1fr_220px_180px_220px_auto]" onSubmit={createCampaign}>
            <Input placeholder="Nome da campanha" value={campaignName} onChange={(event) => setCampaignName(event.target.value)} required />
            <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={goalCampaignId} onChange={(event) => setGoalCampaignId(event.target.value)} required>
              {goalCampaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
            </select>
            <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={audience} onChange={(event) => setAudience(event.target.value)}>
              <option value="almost_there">Falta pouco</option>
              <option value="near_goal">Próximos da meta</option>
              <option value="achieved">Meta atingida</option>
              <option value="inactive">Inativos</option>
              <option value="all">Todos</option>
            </select>
            <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={templateId} onChange={(event) => setTemplateId(event.target.value)} required>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
            <Button disabled={!templateId || !goalCampaignId}><Plus className="h-4 w-4" />Criar</Button>
          </form>

          {campaigns.length === 0 ? <EmptyState message="Nenhuma campanha de e-mail" /> : campaigns.map((campaign) => (
            <div key={campaign.id} className="space-y-3 rounded-md border border-slate-100 p-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-semibold text-slate-950">{campaign.name}</p>
                  <p className="text-sm text-slate-500">{audienceLabel(campaign.audience)} · {goalCampaignName(campaign.campaign_id)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => previewCampaign(campaign.id)} disabled={previewingCampaignId === campaign.id}>{previewingCampaignId === campaign.id ? 'Gerando' : 'Preview'}</Button>
                  <Button type="button" variant="secondary" onClick={() => sendCampaign(campaign.id)} disabled={sendingCampaignId === campaign.id}><Send className="h-4 w-4" />{sendingCampaignId === campaign.id ? 'Enviando' : campaign.sent_at ? 'Reenviar' : 'Enviar'}</Button>
                </div>
              </div>
              {previewsByCampaign[campaign.id] && (
                <div className="space-y-2 rounded-md border border-accent/20 bg-accent-soft p-3">
                  <div className="flex flex-col gap-1 text-xs font-semibold text-slate-600 md:flex-row md:items-center md:justify-between"><span>Preview com {previewsByCampaign[campaign.id].student_name || 'aluno exemplo'}</span><span>{previewsByCampaign[campaign.id].total} destinatários</span></div>
                  <p className="text-sm font-semibold text-slate-800">{previewsByCampaign[campaign.id].subject}</p>
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{previewsByCampaign[campaign.id].body || 'Nenhum destinatário encontrado.'}</p>
                  {previewsByCampaign[campaign.id].email && <p className="text-xs font-semibold text-slate-500">E-mail exemplo: {previewsByCampaign[campaign.id].email}</p>}
                </div>
              )}
              {(recipientsByCampaign[campaign.id]?.length ?? 0) > 0 && (
                <div className="space-y-2 rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-500">Auditoria do ultimo envio</p>
                  {recipientsByCampaign[campaign.id].map((recipient) => <div key={recipient.id} className="rounded-md border border-slate-200 bg-white p-2 text-xs"><p className="font-semibold text-slate-800">{recipient.email} · {recipient.status}</p>{recipient.error_message && <p className="mt-1 break-words text-red-600">{recipient.error_message}</p>}</div>)}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function audienceLabel(audience: EmailCampaign['audience']) {
  const labels: Record<EmailCampaign['audience'], string> = {
    almost_there: 'Falta pouco',
    near_goal: 'Próximos da meta',
    achieved: 'Meta atingida',
    inactive: 'Inativos',
    all: 'Todos',
  };
  return labels[audience];
}
