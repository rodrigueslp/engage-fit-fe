import { MessageCircle, Plus } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { api } from '../../features/api/endpoints';
import type { MessageCampaign, MessageRecipient, MessageTemplate } from '../../features/api/types';

const templateVariables = [
  '{{name}}',
  '{{box_name}}',
  '{{current_checkins}}',
  '{{remaining_checkins}}',
  '{{target_checkins}}',
  '{{reward_name}}',
  '{{platform}}',
];

const defaultTemplate = 'Ola, {{name}}! Recebemos seu check-in no {{box_name}}. Voce ja realizou {{current_checkins}} check-ins neste mes e faltam apenas {{remaining_checkins}} para atingir sua meta de {{target_checkins}} e garantir {{reward_name}}.';

export function WhatsappPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<MessageCampaign[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState(defaultTemplate);
  const [contentSid, setContentSid] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [audience, setAudience] = useState('almost_there');
  const [templateId, setTemplateId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingCampaignId, setSendingCampaignId] = useState('');
  const [sendStatus, setSendStatus] = useState('');
  const [recipientsByCampaign, setRecipientsByCampaign] = useState<Record<string, MessageRecipient[]>>({});

  function load() {
    setLoading(true);
    Promise.all([api.templates(), api.messageCampaigns()])
      .then(([templates, campaigns]) => {
        setTemplates(templates);
        setCampaigns(campaigns);
        setTemplateId(templates[0]?.id ?? '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar WhatsApp'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function createTemplate(event: FormEvent) {
    event.preventDefault();
    try {
      await api.createTemplate({ name: templateName, content: templateContent, content_sid: contentSid });
      setTemplateName('');
      setTemplateContent(defaultTemplate);
      setContentSid('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar template');
    }
  }

  async function createCampaign(event: FormEvent) {
    event.preventDefault();
    try {
      await api.createMessageCampaign({ name: campaignName, audience, template_id: templateId });
      setCampaignName('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar campanha');
    }
  }

  async function sendCampaign(campaignId: string) {
    setError('');
    setSendStatus('');
    setSendingCampaignId(campaignId);
    try {
      const result = await api.sendMessageCampaign(campaignId);
      setSendStatus(`Envio finalizado: ${result.sent}/${result.total} enviadas, ${result.failed} falhas.`);
      await loadRecipients(campaignId);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar campanha');
    } finally {
      setSendingCampaignId('');
    }
  }

  async function loadRecipients(campaignId: string) {
    try {
      const recipients = latestRecipientBatch(await api.messageRecipients(campaignId));
      setRecipientsByCampaign((current) => ({ ...current, [campaignId]: recipients }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar auditoria de envio');
    }
  }

  function latestRecipientBatch(recipients: MessageRecipient[]) {
    const latestCreatedAt = recipients.reduce((latest, recipient) => (recipient.created_at > latest ? recipient.created_at : latest), '');
    return recipients.filter((recipient) => recipient.created_at === latestCreatedAt);
  }

  if (loading) return <LoadingState label="Carregando WhatsApp" />;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {error && <div className="xl:col-span-2"><ErrorState message={error} /></div>}
      {sendStatus && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 xl:col-span-2">
          {sendStatus}
        </div>
      )}
      <Card>
        <CardHeader>
          <h1 className="text-base font-bold text-slate-950">Templates</h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={createTemplate}>
            <Input placeholder="Nome do template" value={templateName} onChange={(event) => setTemplateName(event.target.value)} required />
            <Input placeholder="Content SID aprovado na Twilio (HX...)" value={contentSid} onChange={(event) => setContentSid(event.target.value)} />
            <Textarea placeholder="Conteudo da mensagem" value={templateContent} onChange={(event) => setTemplateContent(event.target.value)} required />
            <div className="flex flex-wrap gap-2">
              {templateVariables.map((variable) => (
                <button
                  key={variable}
                  type="button"
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent-dark"
                  onClick={() => setTemplateContent((content) => `${content} ${variable}`.trim())}
                >
                  {variable}
                </button>
              ))}
            </div>
            <Button>
              <Plus className="h-4 w-4" />
              Criar template
            </Button>
          </form>
          {templates.length === 0 ? <EmptyState message="Nenhum template criado" /> : templates.map((template) => (
            <div key={template.id} className="rounded-md border border-slate-100 p-3">
              <p className="font-semibold text-slate-950">{template.name}</p>
              {template.content_sid && <p className="mt-1 text-xs font-semibold text-emerald-700">{template.content_sid}</p>}
              <p className="mt-1 text-sm text-slate-500">{template.content}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-bold text-slate-950">Campanhas de mensagem</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={createCampaign}>
            <Input placeholder="Nome da campanha" value={campaignName} onChange={(event) => setCampaignName(event.target.value)} required />
            <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={audience} onChange={(event) => setAudience(event.target.value)}>
              <option value="almost_there">Falta pouco</option>
              <option value="near_goal">Proximos da meta</option>
              <option value="achieved">Meta atingida</option>
              <option value="inactive">Inativos</option>
              <option value="all">Todos</option>
            </select>
            <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={templateId} onChange={(event) => setTemplateId(event.target.value)} required>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
            <Button disabled={!templateId}>
              <MessageCircle className="h-4 w-4" />
              Criar campanha
            </Button>
          </form>
          {campaigns.length === 0 ? <EmptyState message="Nenhuma campanha de mensagem" /> : campaigns.map((campaign) => (
            <div key={campaign.id} className="space-y-3 rounded-md border border-slate-100 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-950">{campaign.name}</p>
                  <p className="text-sm text-slate-500">{campaign.audience}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs font-semibold text-slate-500">{campaign.sent_at ? 'Enviada' : 'Rascunho'}</p>
                  <Button type="button" variant="secondary" onClick={() => sendCampaign(campaign.id)} disabled={sendingCampaignId === campaign.id}>
                    <MessageCircle className="h-4 w-4" />
                    {sendingCampaignId === campaign.id ? 'Enviando' : campaign.sent_at ? 'Reenviar' : 'Enviar'}
                  </Button>
                </div>
              </div>
              {(recipientsByCampaign[campaign.id]?.length ?? 0) > 0 && (
                <div className="space-y-2 rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Auditoria do ultimo envio</p>
                  {recipientsByCampaign[campaign.id].map((recipient) => (
                    <div key={recipient.id} className="rounded-md border border-slate-200 bg-white p-2 text-xs">
                      <p className="font-semibold text-slate-800">{recipient.phone} · {recipient.status}</p>
                      {recipient.error_message && <p className="mt-1 break-words text-red-600">{recipient.error_message}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
