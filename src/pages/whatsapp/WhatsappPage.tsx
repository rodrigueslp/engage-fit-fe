import { CheckCircle2, Lock, MessageCircle, Plus, Save, Send } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { api } from '../../features/api/endpoints';
import type { Campaign, MessageCampaign, MessageRecipient, MessageTemplateType, MessagingPolicyWithUsage, OfficialWhatsappTemplatePreview } from '../../features/api/types';

export function WhatsappPage() {
  const [campaigns, setCampaigns] = useState<MessageCampaign[]>([]);
  const [goalCampaigns, setGoalCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [connectionMode, setConnectionMode] = useState<'platform' | 'dedicated'>('platform');
  const [templatePreviews, setTemplatePreviews] = useState<OfficialWhatsappTemplatePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [error, setError] = useState('');
  const [sendingCampaignId, setSendingCampaignId] = useState('');
  const [creatingType, setCreatingType] = useState<MessageTemplateType | ''>('');
  const [sendStatus, setSendStatus] = useState('');
  const [recipientsByCampaign, setRecipientsByCampaign] = useState<Record<string, MessageRecipient[]>>({});
  const [messagingUsage, setMessagingUsage] = useState<MessagingPolicyWithUsage>();

  function load() {
    setLoading(true);
    Promise.all([api.messageCampaigns(), api.campaigns(), api.whatsappSettings(), api.messagingUsage()])
      .then(([messageCampaigns, goalCampaigns, settings, usage]) => {
        setCampaigns(messageCampaigns);
        setGoalCampaigns(goalCampaigns);
        setConnectionMode(settings.connection_mode ?? 'platform');
        setMessagingUsage(usage);
        setSelectedCampaignId((current) => current || goalCampaigns[0]?.id || '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar WhatsApp'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  useEffect(() => {
    if (!selectedCampaignId) {
      setTemplatePreviews([]);
      return;
    }
    setLoadingPreviews(true);
    setError('');
    api.whatsappTemplatePreviews(selectedCampaignId)
      .then(setTemplatePreviews)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar previews oficiais'))
      .finally(() => setLoadingPreviews(false));
  }, [selectedCampaignId]);

  const selectedCampaign = useMemo(
    () => goalCampaigns.find((campaign) => campaign.id === selectedCampaignId),
    [goalCampaigns, selectedCampaignId],
  );

  const campaignsForSelected = useMemo(
    () => campaigns.filter((campaign) => campaign.campaign_id === selectedCampaignId),
    [campaigns, selectedCampaignId],
  );

  async function createOfficialCampaign(template: OfficialWhatsappTemplatePreview) {
    if (!selectedCampaignId) return;
    setError('');
    setSendStatus('');
    setCreatingType(template.type);
    try {
      await api.createMessageCampaign({
        name: template.label,
        campaign_id: selectedCampaignId,
        template_type: template.type,
      });
      await reloadCampaignsOnly();
      setMessagingUsage(await api.messagingUsage());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar disparo oficial');
    } finally {
      setCreatingType('');
    }
  }

  async function reloadCampaignsOnly() {
    const messageCampaigns = await api.messageCampaigns();
    setCampaigns(messageCampaigns);
  }

  async function sendCampaign(campaignId: string) {
    setError('');
    setSendStatus('');
    setSendingCampaignId(campaignId);
    try {
      const result = await api.sendMessageCampaign(campaignId);
      setSendStatus(`Envio finalizado: ${result.sent}/${result.total} enviadas, ${result.failed} falhas.`);
      await loadRecipients(campaignId);
      await reloadCampaignsOnly();
    } catch (err) {
      await loadRecipients(campaignId);
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

  function messageCampaignForType(type: MessageTemplateType) {
    return campaignsForSelected.find((campaign) => campaign.template_type === type);
  }

  if (loading) return <LoadingState label="Carregando WhatsApp" />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="WhatsApp"
        eyebrow="Templates oficiais EngageFit"
        description="Configure a campanha e envie mensagens proativas usando apenas modelos oficiais aprováveis no WhatsApp Business."
      />
      {error && <ErrorState message={error} />}
      {sendStatus && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          {sendStatus}
        </div>
      )}

      {messagingUsage && (
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Uso diário</p><p className="mt-1 text-xl font-bold text-slate-950">{messagingUsage.usage.daily_accepted + messagingUsage.usage.daily_reserved} / {messagingUsage.policy.daily_message_limit}</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Uso mensal</p><p className="mt-1 text-xl font-bold text-slate-950">{messagingUsage.usage.monthly_accepted + messagingUsage.usage.monthly_reserved} / {messagingUsage.policy.monthly_message_limit}</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Máximo por disparo</p><p className="mt-1 text-xl font-bold text-slate-950">{messagingUsage.policy.per_dispatch_limit}</p>{messagingUsage.policy.blocked && <p className="text-xs font-bold text-rose-600">Envios bloqueados pelo administrador</p>}</div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_320px] md:items-center">
            <div>
              <h1 className="text-base font-bold text-slate-950">Mensagens automáticas da campanha</h1>
              <p className="mt-1 text-sm text-slate-500">Os textos-base são oficiais, padronizados e não editáveis pelo box.</p>
            </div>
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
              value={selectedCampaignId}
              onChange={(event) => setSelectedCampaignId(event.target.value)}
            >
              {goalCampaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {goalCampaigns.length === 0 ? (
            <EmptyState message="Crie uma campanha antes de configurar mensagens automáticas" />
          ) : loadingPreviews ? (
            <LoadingState label="Gerando previews" />
          ) : (
            <div className="grid gap-4 xl:grid-cols-3">
              {templatePreviews.map((template) => {
                const messageCampaign = messageCampaignForType(template.type);
                return (
                  <div key={template.type} className="flex min-h-[360px] flex-col rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-950">{template.label}</p>
                        <p className="mt-1 text-sm text-slate-500">{template.description}</p>
                      </div>
                      <StatusPill status={template.approvalStatus} />
                    </div>
                    <div className="mt-3 flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                      <Lock className="h-4 w-4 text-slate-400" />
                      Modelo oficial não editável
                    </div>
                    <div className="mt-3 flex-1 rounded-md border border-accent/20 bg-accent-soft p-3">
                      <div className="mb-2 flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                        <span>Preview</span>
                        <span>{selectedCampaign?.name ?? 'Campanha'}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{template.preview}</p>
                    </div>
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-slate-500">
                        {template.providerTemplateId ? `Provider template: ${template.providerTemplateId}` : 'Provider template ainda não configurado'}
                      </p>
                      {messageCampaign ? (
                        <Button type="button" className="w-full" variant="secondary" onClick={() => sendCampaign(messageCampaign.id)} disabled={sendingCampaignId === messageCampaign.id}>
                          <Send className="h-4 w-4" />
                          {sendingCampaignId === messageCampaign.id ? 'Enviando' : messageCampaign.sent_at ? 'Reenviar' : 'Enviar'}
                        </Button>
                      ) : (
                        <Button type="button" className="w-full" onClick={() => createOfficialCampaign(template)} disabled={creatingType === template.type}>
                          <Plus className="h-4 w-4" />
                          {creatingType === template.type ? 'Criando' : 'Ativar mensagem'}
                        </Button>
                      )}
                    </div>
                    {connectionMode === 'dedicated' && (
                      <TemplateProviderConfiguration
                        template={template}
                        onSaved={(updated) => setTemplatePreviews((current) => current.map((item) => item.type === updated.type ? updated : item))}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-bold text-slate-950">Auditoria dos disparos</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {campaignsForSelected.length === 0 ? <EmptyState message="Nenhum disparo oficial ativado para esta campanha" /> : campaignsForSelected.map((campaign) => (
            <div key={campaign.id} className="rounded-md border border-slate-100 p-3">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div>
                  <p className="font-semibold text-slate-950">{campaign.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{templateTypeLabel(campaign.template_type)} · {campaign.sent_at ? 'já enviada' : 'aguardando envio'}</p>
                </div>
                <Button type="button" variant="secondary" onClick={() => loadRecipients(campaign.id)}>Ver auditoria</Button>
              </div>
              {(recipientsByCampaign[campaign.id]?.length ?? 0) > 0 && (
                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {recipientsByCampaign[campaign.id].map((recipient) => (
                    <div key={recipient.id} className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs">
                      <p className="font-semibold text-slate-800">{recipient.phone} · {recipient.status}</p>
                      {recipient.provider_message_sid && <p className="mt-1 break-all text-slate-500">Twilio: {recipient.provider_message_sid} · {recipient.provider_status || 'aceita'}</p>}
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

function TemplateProviderConfiguration({ template, onSaved }: { template: OfficialWhatsappTemplatePreview; onSaved: (template: OfficialWhatsappTemplatePreview) => void }) {
  const [contentSid, setContentSid] = useState(template.providerTemplateId);
  const [approvalStatus, setApprovalStatus] = useState(template.approvalStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setContentSid(template.providerTemplateId);
    setApprovalStatus(template.approvalStatus);
  }, [template.providerTemplateId, template.approvalStatus]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const saved = await api.updateTemplate(template.type, { content_sid: contentSid, approval_status: approvalStatus });
      onSaved({ ...template, providerTemplateId: saved.content_sid, approvalStatus: saved.approval_status });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar template dedicado');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="mt-3 space-y-2 border-t border-slate-100 pt-3" onSubmit={save}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Template na conta da academia</p>
      <Input placeholder="Content SID (HX...)" value={contentSid} onChange={(event) => setContentSid(event.target.value)} required />
      <select
        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
        value={approvalStatus}
        onChange={(event) => setApprovalStatus(event.target.value as OfficialWhatsappTemplatePreview['approvalStatus'])}
      >
        <option value="NOT_CONFIGURED">Não configurado</option>
        <option value="PENDING">Pendente de aprovação</option>
        <option value="APPROVED">Aprovado</option>
        <option value="REJECTED">Rejeitado</option>
      </select>
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      <Button type="submit" className="w-full" variant="secondary" disabled={saving}>
        <Save className="h-4 w-4" />
        {saving ? 'Salvando' : 'Salvar Content SID'}
      </Button>
    </form>
  );
}

function StatusPill({ status }: { status: OfficialWhatsappTemplatePreview['approvalStatus'] }) {
  const labels: Record<OfficialWhatsappTemplatePreview['approvalStatus'], string> = {
    NOT_CONFIGURED: 'Não configurado',
    PENDING: 'Pendente de aprovação',
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
  };
  const classes: Record<OfficialWhatsappTemplatePreview['approvalStatus'], string> = {
    NOT_CONFIGURED: 'bg-slate-100 text-slate-600',
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${classes[status]}`}>
      {status === 'APPROVED' && <CheckCircle2 className="h-3.5 w-3.5" />}
      {labels[status]}
    </span>
  );
}

function templateTypeLabel(type: MessageTemplateType) {
  const labels: Record<MessageTemplateType, string> = {
    ALMOST_THERE: 'Falta pouco',
    GOAL_REACHED: 'Meta atingida',
    WE_MISS_YOU: 'Sentimos sua falta',
  };
  return labels[type] ?? type;
}
