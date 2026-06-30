import { Gift, Plus, Power, RefreshCw, Save, Target, Trophy } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { api } from '../../features/api/endpoints';
import type { Campaign, CampaignGoal, CampaignProgress, Reward } from '../../features/api/types';

type CampaignDetails = {
  goals: CampaignGoal[];
  rewards: Reward[];
  progress: CampaignProgress[];
};

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [details, setDetails] = useState<CampaignDetails>({ goals: [], rewards: [], progress: [] });
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [wellhubGoal, setWellhubGoal] = useState('12');
  const [totalpassGoal, setTotalpassGoal] = useState('12');
  const [rewardName, setRewardName] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');
  const [rewardQuantity, setRewardQuantity] = useState('100');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editWellhubGoal, setEditWellhubGoal] = useState('12');
  const [editTotalpassGoal, setEditTotalpassGoal] = useState('12');
  const [editRewardName, setEditRewardName] = useState('');
  const [editRewardDescription, setEditRewardDescription] = useState('');
  const [editRewardQuantity, setEditRewardQuantity] = useState('100');

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedCampaignId),
    [campaigns, selectedCampaignId],
  );

  const achieved = details.progress.filter((item) => item.achieved).length;
  const nearGoal = details.progress.filter((item) => item.near_goal && !item.achieved).length;
  const averageProgress = details.progress.length
    ? Math.round(details.progress.reduce((total, item) => total + item.progress_percentage, 0) / details.progress.length)
    : 0;

  function loadCampaigns(nextSelectedId?: string) {
    setLoading(true);
    api
      .campaigns()
      .then((result) => {
        setCampaigns(result);
        setSelectedCampaignId(nextSelectedId ?? selectedCampaignId ?? result[0]?.id ?? '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar campanhas'))
      .finally(() => setLoading(false));
  }

  function loadDetails(campaignId: string) {
    if (!campaignId) {
      setDetails({ goals: [], rewards: [], progress: [] });
      return;
    }
    setDetailsLoading(true);
    Promise.all([api.campaignGoals(campaignId), api.rewards(campaignId), api.campaignProgress(campaignId)])
      .then(([goals, rewards, progress]) => setDetails({ goals, rewards, progress }))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes da campanha'))
      .finally(() => setDetailsLoading(false));
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    loadDetails(selectedCampaignId);
  }, [selectedCampaignId]);

  useEffect(() => {
    if (!selectedCampaign) return;
    setEditName(selectedCampaign.name);
    setEditDescription(selectedCampaign.description);
    setEditStartDate(selectedCampaign.start_date);
    setEditEndDate(selectedCampaign.end_date);
  }, [selectedCampaign]);

  useEffect(() => {
    const wellhub = details.goals.find((goal) => goal.source === 'wellhub');
    const totalpass = details.goals.find((goal) => goal.source === 'totalpass');
    const reward = details.rewards[0];
    setEditWellhubGoal(String(wellhub?.target_checkins ?? 12));
    setEditTotalpassGoal(String(totalpass?.target_checkins ?? 12));
    setEditRewardName(reward?.name ?? '');
    setEditRewardDescription(reward?.description ?? '');
    setEditRewardQuantity(String(reward?.quantity ?? 100));
  }, [details.goals, details.rewards]);

  async function create(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const campaign = await api.createCampaign({ name, description, start_date: startDate, end_date: endDate });
      await Promise.all([
        api.createCampaignGoal(campaign.id, { source: 'wellhub', target_checkins: Number(wellhubGoal) }),
        api.createCampaignGoal(campaign.id, { source: 'totalpass', target_checkins: Number(totalpassGoal) }),
        api.createReward(campaign.id, { name: rewardName, description: rewardDescription, quantity: Number(rewardQuantity) }),
      ]);
      setName('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setWellhubGoal('12');
      setTotalpassGoal('12');
      setRewardName('');
      setRewardDescription('');
      setRewardQuantity('100');
      loadCampaigns(campaign.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar campanha');
    } finally {
      setSubmitting(false);
    }
  }

  async function recalculate() {
    if (!selectedCampaignId) return;
    setError('');
    setDetailsLoading(true);
    try {
      await api.recalculateCampaignProgress(selectedCampaignId);
      loadDetails(selectedCampaignId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao recalcular campanha');
      setDetailsLoading(false);
    }
  }

  async function saveCampaignBasics(event: FormEvent) {
    event.preventDefault();
    if (!selectedCampaign) return;
    setError('');
    setSavingDetails(true);
    try {
      await api.updateCampaign(selectedCampaign.id, {
        name: editName,
        description: editDescription,
        start_date: editStartDate,
        end_date: editEndDate,
        active: selectedCampaign.active,
      });
      loadCampaigns(selectedCampaign.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar campanha');
    } finally {
      setSavingDetails(false);
    }
  }

  async function saveCampaignGoals(event: FormEvent) {
    event.preventDefault();
    if (!selectedCampaign) return;
    setError('');
    setSavingDetails(true);
    try {
      await Promise.all([
        upsertGoal(selectedCampaign.id, 'wellhub', Number(editWellhubGoal)),
        upsertGoal(selectedCampaign.id, 'totalpass', Number(editTotalpassGoal)),
      ]);
      loadDetails(selectedCampaign.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar metas');
    } finally {
      setSavingDetails(false);
    }
  }

  async function upsertGoal(campaignId: string, source: 'wellhub' | 'totalpass', targetCheckins: number) {
    const existing = details.goals.find((goal) => goal.source === source);
    if (existing) {
      return api.updateCampaignGoal(campaignId, existing.id, { source, target_checkins: targetCheckins });
    }
    return api.createCampaignGoal(campaignId, { source, target_checkins: targetCheckins });
  }

  async function saveCampaignReward(event: FormEvent) {
    event.preventDefault();
    if (!selectedCampaign) return;
    setError('');
    setSavingDetails(true);
    try {
      const payload = { name: editRewardName, description: editRewardDescription, quantity: Number(editRewardQuantity) };
      if (details.rewards[0]) {
        await api.updateReward(details.rewards[0].id, payload);
      } else {
        await api.createReward(selectedCampaign.id, payload);
      }
      loadDetails(selectedCampaign.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar brinde');
    } finally {
      setSavingDetails(false);
    }
  }

  async function toggleCampaignActive() {
    if (!selectedCampaign) return;
    setError('');
    setSavingDetails(true);
    try {
      if (selectedCampaign.active) {
        await api.closeCampaign(selectedCampaign.id);
      } else {
        await api.updateCampaign(selectedCampaign.id, {
          name: selectedCampaign.name,
          description: selectedCampaign.description,
          start_date: selectedCampaign.start_date,
          end_date: selectedCampaign.end_date,
          active: true,
        });
      }
      loadCampaigns(selectedCampaign.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status da campanha');
    } finally {
      setSavingDetails(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Campanhas"
        eyebrow="Metas e recompensas"
        description="Crie campanhas mensais, acompanhe progresso individual e controle o estoque operacional de brindes."
        actions={selectedCampaign && <StatusBadge value={selectedCampaign.active ? 'active' : 'inactive'} label={selectedCampaign.active ? 'Ativa' : 'Encerrada'} />}
      />

      {error && <ErrorState message={error} />}

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <h2 className="text-base font-bold text-slate-950">Nova campanha</h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={create}>
              <div className="space-y-3">
                <Input placeholder="Nome da campanha" value={name} onChange={(event) => setName(event.target.value)} required />
                <Textarea placeholder="Descrição" value={description} onChange={(event) => setDescription(event.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
                  <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
                </div>
              </div>

              <div className="rounded-md border border-slate-200 p-3">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-950">
                  <Target className="h-4 w-4 text-accent" />
                  Metas de check-in
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-xs font-semibold text-slate-500">
                    Wellhub
                    <Input min="1" type="number" value={wellhubGoal} onChange={(event) => setWellhubGoal(event.target.value)} required />
                  </label>
                  <label className="space-y-1 text-xs font-semibold text-slate-500">
                    TotalPass
                    <Input min="1" type="number" value={totalpassGoal} onChange={(event) => setTotalpassGoal(event.target.value)} required />
                  </label>
                </div>
              </div>

              <div className="rounded-md border border-slate-200 p-3">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-950">
                  <Gift className="h-4 w-4 text-accent" />
                  Brinde da campanha
                </div>
                <div className="space-y-3">
                  <Input placeholder="Nome do brinde" value={rewardName} onChange={(event) => setRewardName(event.target.value)} required />
                  <Textarea placeholder="Descrição do brinde" value={rewardDescription} onChange={(event) => setRewardDescription(event.target.value)} />
                  <Input min="1" type="number" placeholder="Quantidade" value={rewardQuantity} onChange={(event) => setRewardQuantity(event.target.value)} required />
                </div>
              </div>

              <Button disabled={submitting} className="w-full">
                <Plus className="h-4 w-4" />
                {submitting ? 'Criando' : 'Criar campanha completa'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <h2 className="text-base font-bold text-slate-950">Campanhas criadas</h2>
                <select
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm"
                  value={selectedCampaignId}
                  onChange={(event) => setSelectedCampaignId(event.target.value)}
                >
                  <option value="">Selecione</option>
                  {campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState />
              ) : campaigns.length === 0 ? (
                <EmptyState message="Nenhuma campanha criada" />
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {campaigns.map((campaign) => (
                    <button
                      key={campaign.id}
                      className={`rounded-md border p-4 text-left transition ${
                        selectedCampaignId === campaign.id ? 'border-accent bg-accent-soft' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                      onClick={() => setSelectedCampaignId(campaign.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{campaign.name}</p>
                          <p className="mt-1 text-sm text-slate-500">{campaign.start_date} até {campaign.end_date}</p>
                        </div>
                        <StatusBadge value={campaign.active ? 'active' : 'inactive'} label={campaign.active ? 'Ativa' : 'Encerrada'} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <CampaignEditPanel
            campaign={selectedCampaign}
            saving={savingDetails}
            name={editName}
            description={editDescription}
            startDate={editStartDate}
            endDate={editEndDate}
            wellhubGoal={editWellhubGoal}
            totalpassGoal={editTotalpassGoal}
            rewardName={editRewardName}
            rewardDescription={editRewardDescription}
            rewardQuantity={editRewardQuantity}
            onNameChange={setEditName}
            onDescriptionChange={setEditDescription}
            onStartDateChange={setEditStartDate}
            onEndDateChange={setEditEndDate}
            onWellhubGoalChange={setEditWellhubGoal}
            onTotalpassGoalChange={setEditTotalpassGoal}
            onRewardNameChange={setEditRewardName}
            onRewardDescriptionChange={setEditRewardDescription}
            onRewardQuantityChange={setEditRewardQuantity}
            onSaveBasics={saveCampaignBasics}
            onSaveGoals={saveCampaignGoals}
            onSaveReward={saveCampaignReward}
            onToggleActive={toggleCampaignActive}
          />

          <CampaignOperationalPanel
            campaign={selectedCampaign}
            details={details}
            loading={detailsLoading}
            achieved={achieved}
            nearGoal={nearGoal}
            averageProgress={averageProgress}
            onRecalculate={recalculate}
          />
        </div>
      </div>
    </div>
  );
}

function CampaignEditPanel({
  campaign,
  saving,
  name,
  description,
  startDate,
  endDate,
  wellhubGoal,
  totalpassGoal,
  rewardName,
  rewardDescription,
  rewardQuantity,
  onNameChange,
  onDescriptionChange,
  onStartDateChange,
  onEndDateChange,
  onWellhubGoalChange,
  onTotalpassGoalChange,
  onRewardNameChange,
  onRewardDescriptionChange,
  onRewardQuantityChange,
  onSaveBasics,
  onSaveGoals,
  onSaveReward,
  onToggleActive,
}: {
  campaign?: Campaign;
  saving: boolean;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  wellhubGoal: string;
  totalpassGoal: string;
  rewardName: string;
  rewardDescription: string;
  rewardQuantity: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onWellhubGoalChange: (value: string) => void;
  onTotalpassGoalChange: (value: string) => void;
  onRewardNameChange: (value: string) => void;
  onRewardDescriptionChange: (value: string) => void;
  onRewardQuantityChange: (value: string) => void;
  onSaveBasics: (event: FormEvent) => void;
  onSaveGoals: (event: FormEvent) => void;
  onSaveReward: (event: FormEvent) => void;
  onToggleActive: () => void;
}) {
  if (!campaign) {
    return (
      <Card>
        <CardContent>
          <EmptyState message="Selecione uma campanha para editar" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Editar campanha</h2>
            <p className="text-sm text-slate-500">Ajuste dados, metas, brinde e status operacional.</p>
          </div>
          <Button type="button" variant="secondary" onClick={onToggleActive} disabled={saving}>
            <Power className="h-4 w-4" />
            {campaign.active ? 'Encerrar' : 'Reativar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onSaveBasics}>
          <Input placeholder="Nome da campanha" value={name} onChange={(event) => onNameChange(event.target.value)} required />
          <Textarea placeholder="Descrição" value={description} onChange={(event) => onDescriptionChange(event.target.value)} />
          <Input type="date" value={startDate} onChange={(event) => onStartDateChange(event.target.value)} required />
          <Input type="date" value={endDate} onChange={(event) => onEndDateChange(event.target.value)} required />
          <div className="md:col-span-2">
            <Button disabled={saving}>
              <Save className="h-4 w-4" />
              Salvar dados
            </Button>
          </div>
        </form>

        <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={onSaveGoals}>
          <label className="space-y-1 text-xs font-semibold text-slate-500">
            Meta Wellhub
            <Input min="1" type="number" value={wellhubGoal} onChange={(event) => onWellhubGoalChange(event.target.value)} required />
          </label>
          <label className="space-y-1 text-xs font-semibold text-slate-500">
            Meta TotalPass
            <Input min="1" type="number" value={totalpassGoal} onChange={(event) => onTotalpassGoalChange(event.target.value)} required />
          </label>
          <div className="flex items-end">
            <Button disabled={saving}>
              <Save className="h-4 w-4" />
              Salvar metas
            </Button>
          </div>
        </form>

        <form className="grid gap-3 md:grid-cols-[1fr_1fr_120px_auto]" onSubmit={onSaveReward}>
          <Input placeholder="Nome do brinde" value={rewardName} onChange={(event) => onRewardNameChange(event.target.value)} required />
          <Input placeholder="Descrição do brinde" value={rewardDescription} onChange={(event) => onRewardDescriptionChange(event.target.value)} />
          <Input min="1" type="number" value={rewardQuantity} onChange={(event) => onRewardQuantityChange(event.target.value)} required />
          <div className="flex items-end">
            <Button disabled={saving}>
              <Save className="h-4 w-4" />
              Salvar brinde
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function CampaignOperationalPanel({
  campaign,
  details,
  loading,
  achieved,
  nearGoal,
  averageProgress,
  onRecalculate,
}: {
  campaign?: Campaign;
  details: CampaignDetails;
  loading: boolean;
  achieved: number;
  nearGoal: number;
  averageProgress: number;
  onRecalculate: () => void;
}) {
  if (!campaign) {
    return (
      <Card>
        <CardContent>
          <EmptyState message="Selecione uma campanha" />
        </CardContent>
      </Card>
    );
  }

  const wellhub = details.goals.find((goal) => goal.source === 'wellhub');
  const totalpass = details.goals.find((goal) => goal.source === 'totalpass');

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">{campaign.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{campaign.description || 'Campanha sem descrição'}</p>
          </div>
          <Button variant="secondary" onClick={onRecalculate} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Recalcular
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingState />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-4">
              <Metric label="Wellhub" value={wellhub ? `${wellhub.target_checkins}` : '-'} />
              <Metric label="TotalPass" value={totalpass ? `${totalpass.target_checkins}` : '-'} />
              <Metric label="Atingiram" value={`${achieved}`} />
              <Metric label="Próximos" value={`${nearGoal}`} />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
              <div className="rounded-md border border-slate-200 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-bold text-slate-950">Progressó da campanha</h3>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(averageProgress, 100)}%` }} />
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-700">{averageProgress}% de progresso medio</p>
              </div>

              <div className="rounded-md border border-slate-200 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-bold text-slate-950">Brinde</h3>
                </div>
                {details.rewards.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum brinde cadastrado</p>
                ) : (
                  <div className="space-y-3">
                    {details.rewards.map((reward) => {
                      const delivered = reward.delivered_deliveries ?? 0;
                      const pending = reward.pending_deliveries ?? 0;
                      const available = reward.available_quantity ?? Math.max(0, reward.quantity - delivered);
                      return (
                        <div key={reward.id} className="rounded-md border border-slate-100 p-3">
                          <p className="font-semibold text-slate-950">{reward.name}</p>
                          <p className="text-sm text-slate-500">{reward.description || 'Sem descrição'}</p>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <RewardStockMetric label="Total" value={reward.quantity} />
                            <RewardStockMetric label="Disponiveis" value={available} />
                            <RewardStockMetric label="Pendentes" value={pending} />
                            <RewardStockMetric label="Entregues" value={delivered} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-md border border-slate-200">
              <div className="grid min-w-[620px] grid-cols-[1fr_120px_110px_120px] border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase text-slate-500">
                <span>Aluno</span>
                <span>Check-ins</span>
                <span>Faltam</span>
                <span>Status</span>
              </div>
              {details.progress.length === 0 ? (
                <div className="p-4">
                  <EmptyState message="Nenhum progresso calculado" />
                </div>
              ) : (
                details.progress.slice(0, 8).map((item) => (
                  <div key={item.id} className="grid min-w-[620px] grid-cols-[1fr_120px_110px_120px] items-center border-b border-slate-100 px-4 py-3 last:border-b-0">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{item.student_name ?? item.student_id}</p>
                      <p className="text-xs font-semibold text-slate-500">{item.student_source ?? 'plataforma'}</p>
                    </div>
                    <span className="text-sm text-slate-600">{item.current_checkins}/{item.target_checkins}</span>
                    <span className="text-sm text-slate-600">{item.remaining_checkins}</span>
                    <StatusBadge value={item.achieved ? 'achieved' : item.near_goal ? 'near' : 'open'} label={item.achieved ? 'Meta' : item.near_goal ? 'Próximo' : 'Aberto'} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function RewardStockMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-50 p-2">
      <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
      <p className="text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}
