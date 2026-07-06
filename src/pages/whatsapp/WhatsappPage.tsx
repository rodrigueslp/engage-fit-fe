import { MessageCircle, Plus } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { api } from '../../features/api/endpoints';
import type { Campaign, MessageCampaign, MessageCampaignPreview, MessageRecipient, MessageTemplate } from '../../features/api/types';

const templateVariables = [
  '{{name}}',
  '{{box_name}}',
  '{{current_checkins}}',
  '{{remaining_checkins}}',
  '{{target_checkins}}',
  '{{reward_name}}',
  '{{platform}}',
];

const defaultTemplate = 'Olá, {{name}}! Recebemos seu check-in no {{box_name}}. Você já realizou {{current_checkins}} check-ins neste mês e faltam apenas {{remaining_checkins}} para atingir sua meta de {{target_checkins}} e garantir {{reward_name}}.';

export function WhatsappPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<MessageCampaign[]>([]);
  const [goalCampaigns, setGoalCampaigns] = useState<Campaign[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState(defaultTemplate);
  const [contentSid, setContentSid] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState('');
  const [editingContentSid, setEditingContentSid] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [goalCampaignId, setGoalCampaignId] = useState('');
  const [audience, setAudience] = useState('almost_there');
  const [templateId, setTemplateId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingCampaignId, setSendingCampaignId] = useState('');
  const [sendStatus, setSendStatus] = useState('');
  const [recipientsByCampaign, setRecipientsByCampaign] = useState<Record<string, MessageRecipient[]>>({});
  const [previewsByCampaign, setPreviewsByCampaign] = useState<Record<string, MessageCampaignPreview>>({});
  const [previewingCampaignId, setPreviewingCampaignId] = useState('');

  function load() {
    setLoading(true);
    Promise.all([api.templates(), api.messageCampaigns(), api.campaigns()])
      .then(([templates, campaigns, goalCampaigns]) => {
        setTemplates(templates);
        setCampaigns(campaigns);
        setGoalCampaigns(goalCampaigns);
        setTemplateId(templates[0]?.id ?? '');
        setGoalCampaignId((current) => current || goalCampaigns[0]?.id || '');
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

  async function saveTemplateContentSid(template: MessageTemplate) {
    setError('');
    try {
      await api.updateTemplate(template.id, {
        name: template.name,
        content: template.content,
        content_sid: editingContentSid,
      });
      setEditingTemplateId('');
      setEditingContentSid('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar Content SID');
    }
  }

  async function createCampaign(event: FormEvent) {
    event.preventDefault();
    try {
      await api.createMessageCampaign({ name: campaignName, campaign_id: goalCampaignId, audience, template_id: templateId });
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
      await loadRecipients(campaignId);
      setError(err instanceof Error ? err.message : 'Erro ao enviar campanha');
    } finally {
      setSendingCampaignId('');
    }
  }

  async function previewCampaign(campaignId: string) {
    setError('');
    setPreviewingCampaignId(campaignId);
    try {
      const preview = await api.messageCampaignPreview(campaignId);
      setPreviewsByCampaign((current) => ({ ...current, [campaignId]: preview }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar preview');
    } finally {
      setPreviewingCampaignId('');
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

  function goalCampaignName(campaignId: string) {
    return goalCampaigns.find((campaign) => campaign.id === campaignId)?.name ?? 'Campanha não selecionada';
  }

  if (loading) return <LoadingState label="Carregando WhatsApp" />;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <div className="xl:col-span-2">
        <PageHeader title="WhatsApp" eyebrow="Campanhas de relacionamento" description="Crie templates, confira o preview da mensagem e acompanhe falhas do último envio." />
      </div>
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
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Para Twilio WhatsApp, cadastre o <span className="font-semibold">Content SID (HX...)</span> aprovado no console. Sem isso, mensagens só funcionam dentro de 24h após o destinatário responder no sandbox.
          </div>
          <form className="space-y-3" onSubmit={createTemplate}>
            <Input placeholder="Nome do template" value={templateName} onChange={(event) => setTemplateName(event.target.value)} required />
            <Input placeholder="Content SID aprovado na Twilio (HX...)" value={contentSid} onChange={(event) => setContentSid(event.target.value)} required />
            <Textarea placeholder="Conteúdo da mensagem" value={templateContent} onChange={(event) => setTemplateContent(event.target.value)} required />
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
              {template.content_sid ? (
                <p className="mt-1 text-xs font-semibold text-emerald-700">{template.content_sid}</p>
              ) : (
                <p className="mt-1 text-xs font-semibold text-amber-700">Content SID não configurado — envio via Twilio vai falhar fora da janela de 24h</p>
              )}
              <p className="mt-1 text-sm text-slate-500">{template.content}</p>
              {editingTemplateId === template.id ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Content SID aprovado na Twilio (HX...)"
                    value={editingContentSid}
                    onChange={(event) => setEditingContentSid(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button type="button" onClick={() => saveTemplateContentSid(template)}>Salvar SID</Button>
                    <Button type="button" variant="secondary" onClick={() => setEditingTemplateId('')}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-3"
                  onClick={() => {
                    setEditingTemplateId(template.id);
                    setEditingContentSid(template.content_sid);
                  }}
                >
                  {template.content_sid ? 'Editar Content SID' : 'Configurar Content SID'}
                </Button>
              )}
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
            <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={goalCampaignId} onChange={(event) => setGoalCampaignId(event.target.value)} required>
              {goalCampaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
            </select>
            <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={audience} onChange={(event) => setAudience(event.target.value)}>
              <option value="almost_there">Falta pouco</option>
              <option value="near_goal">Próximos da meta</option>
              <option value="achieved">Meta atingida</option>
              <option value="inactive">Inativos</option>
              <option value="all">Todos</option>
            </select>
            <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={templateId} onChange={(event) => setTemplateId(event.target.value)} required>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
            <Button disabled={!templateId || !goalCampaignId}>
              <MessageCircle className="h-4 w-4" />
              Criar campanha
            </Button>
          </form>
          {campaigns.length === 0 ? <EmptyState message="Nenhuma campanha de mensagem" /> : campaigns.map((campaign) => (
            <div key={campaign.id} className="space-y-3 rounded-md border border-slate-100 p-3">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="min-w-0 truncate font-semibold text-slate-950">{campaign.name}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                      {campaign.sent_at ? 'Enviada' : 'Rascunho'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{audienceLabel(campaign.audience)} · {goalCampaignName(campaign.campaign_id)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:w-[220px]">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => previewCampaign(campaign.id)}
                    disabled={previewingCampaignId === campaign.id}
                  >
                    {previewingCampaignId === campaign.id ? 'Gerando' : 'Preview'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => sendCampaign(campaign.id)}
                    disabled={sendingCampaignId === campaign.id}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {sendingCampaignId === campaign.id ? 'Enviando' : campaign.sent_at ? 'Reenviar' : 'Enviar'}
                  </Button>
                </div>
              </div>
              {previewsByCampaign[campaign.id] && (
                <div className="space-y-2 rounded-md border border-accent/20 bg-accent-soft p-3">
                  <div className="flex flex-col gap-1 text-xs font-semibold text-slate-600 md:flex-row md:items-center md:justify-between">
                    <span>Preview com {previewsByCampaign[campaign.id].student_name || 'aluno exemplo'}</span>
                    <span>{previewsByCampaign[campaign.id].total} destinatários na audiência</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-slate-800">{previewsByCampaign[campaign.id].body || 'Nenhum destinatário encontrado para esta audiência.'}</p>
                  {previewsByCampaign[campaign.id].phone && <p className="text-xs font-semibold text-slate-500">Telefone exemplo: {previewsByCampaign[campaign.id].phone}</p>}
                </div>
              )}
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

function audienceLabel(audience: MessageCampaign['audience']) {
  const labels: Record<MessageCampaign['audience'], string> = {
    almost_there: 'Falta pouco',
    near_goal: 'Próximos da meta',
    achieved: 'Meta atingida',
    inactive: 'Inativos',
    all: 'Todos',
  };
  return labels[audience];
}
