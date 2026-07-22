import { CheckCircle2, Gift, Search, Target } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { api } from '../../features/api/endpoints';
import type { RewardDelivery } from '../../features/api/types';

type DeliveryStatusFilter = 'pending' | 'all' | 'delivered';

export function RewardsPage() {
  const [deliveries, setDeliveries] = useState<RewardDelivery[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeliveryStatusFilter>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deliveringIds, setDeliveringIds] = useState<string[]>([]);

  const filteredDeliveries = useMemo(() => {
    const normalizedQuery = normalize(query);
    return deliveries.filter((delivery) => {
      if (statusFilter === 'pending' && delivery.delivered) return false;
      if (statusFilter === 'delivered' && !delivery.delivered) return false;
      if (!normalizedQuery) return true;

      const searchable = [
        delivery.campaign_name,
        delivery.campaign_id,
        delivery.student_name,
        delivery.student_phone,
        delivery.student_id,
        delivery.reward_name,
        delivery.reward_id,
      ].map((value) => normalize(value ?? '')).join(' ');

      return searchable.includes(normalizedQuery);
    });
  }, [deliveries, query, statusFilter]);

  const pendingDeliveries = deliveries.filter((delivery) => !delivery.delivered);
  const deliveredDeliveries = deliveries.filter((delivery) => delivery.delivered);
  const pendingCampaigns = new Set(pendingDeliveries.map((delivery) => delivery.campaign_id ?? delivery.campaign_name).filter(Boolean)).size;

  useEffect(() => {
    api
      .rewardDeliveries()
      .then(setDeliveries)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar entregas de brindes'))
      .finally(() => setLoading(false));
  }, []);

  async function markDelivered(deliveryId: string) {
    setError('');
    setDeliveringIds((ids) => [...ids, deliveryId]);
    try {
      await api.markRewardDelivered(deliveryId);
      const deliveredAt = new Date().toISOString();
      setDeliveries((current) => current.map((delivery) => (
        delivery.id === deliveryId ? { ...delivery, delivered: true, delivered_at: deliveredAt } : delivery
      )));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar brinde como entregue');
    } finally {
      setDeliveringIds((ids) => ids.filter((id) => id !== deliveryId));
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Brindes" eyebrow="Entrega operacional" description="Localize pendências, confira telefone e dê baixa nos brindes entregues sem sair da tela." />

      {error && <ErrorState message={error} />}

      <div className="grid gap-3 md:grid-cols-3">
        <RewardMetric label="Pendentes" value={pendingDeliveries.length} icon={Gift} />
        <RewardMetric label="Campanhas com pendências" value={pendingCampaigns} icon={Target} />
        <RewardMetric label="Entregues" value={deliveredDeliveries.length} icon={CheckCircle2} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950">Entregas de brindes</h2>
              <p className="mt-1 text-sm text-slate-500">{pendingCampaigns} campanha(s) com pendências de brinde.</p>
            </div>
            <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row">
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as DeliveryStatusFilter)}
              >
                <option value="pending">Pendentes</option>
                <option value="all">Todas</option>
                <option value="delivered">Entregues</option>
              </select>
              <div className="relative w-full lg:w-96">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-9"
                  placeholder="Buscar campanha, aluno, telefone ou brinde"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  autoFocus
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5">
              <LoadingState label="Carregando brindes" />
            </div>
          ) : deliveries.length === 0 ? (
            <div className="p-5">
              <EmptyState message="Nenhuma entrega de brinde registrada" />
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="p-5">
              <EmptyState message="Nenhum brinde encontrado para essa busca" />
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 md:hidden">
                {filteredDeliveries.map((delivery) => {
                  const delivering = deliveringIds.includes(delivery.id);
                  return (
                    <div key={delivery.id} className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-950">{delivery.student_name ?? 'Aluno'}</p>
                          <p className="mt-0.5 text-sm text-slate-500">{delivery.campaign_name ?? 'Campanha'}</p>
                        </div>
                        <StatusBadge value={delivery.delivered ? 'achieved' : 'warning'} label={delivery.delivered ? 'Entregue' : 'Pendente'} />
                      </div>
                      <dl className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                        <div><dt className="text-xs text-slate-500">Brinde</dt><dd className="mt-0.5 font-semibold text-slate-800">{delivery.reward_name ?? 'Não informado'}</dd></div>
                        <div><dt className="text-xs text-slate-500">Telefone</dt><dd className="mt-0.5 font-semibold text-slate-800">{delivery.student_phone || 'Sem telefone'}</dd></div>
                      </dl>
                      {delivery.delivered ? (
                        <p className="text-xs font-semibold text-slate-500">Entregue em {delivery.delivered_at ? formatDateTime(delivery.delivered_at) : 'data não informada'}</p>
                      ) : (
                        <Button type="button" variant="secondary" className="w-full" disabled={delivering} onClick={() => markDelivered(delivery.id)}>
                          <CheckCircle2 className="h-4 w-4" />{delivering ? 'Salvando' : 'Marcar como entregue'}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="hidden overflow-x-auto md:block">
              <div className="min-w-[920px] divide-y divide-slate-100">
                <div className="grid grid-cols-[1.2fr_1.1fr_1fr_1fr_120px_150px] px-5 py-3 text-xs font-bold uppercase text-slate-500">
                  <span>Campanha</span>
                  <span>Aluno</span>
                  <span>Telefone</span>
                  <span>Brinde</span>
                  <span>Status</span>
                  <span className="text-right">Ação</span>
                </div>
                {filteredDeliveries.map((delivery) => {
                  const delivering = deliveringIds.includes(delivery.id);
                  return (
                    <div key={delivery.id} className="grid grid-cols-[1.2fr_1.1fr_1fr_1fr_120px_150px] items-center gap-3 px-5 py-4">
                      <div>
                        <p className="font-semibold text-slate-950">{delivery.campaign_name ?? 'Campanha'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950">{delivery.student_name ?? delivery.student_id}</p>
                      </div>
                      <p className="text-sm text-slate-600">{delivery.student_phone || '-'}</p>
                      <p className="text-sm font-semibold text-slate-700">{delivery.reward_name ?? delivery.reward_id}</p>
                      <div>
                        <StatusBadge value={delivery.delivered ? 'achieved' : 'warning'} label={delivery.delivered ? 'Entregue' : 'Pendente'} />
                        {delivery.delivered_at && <p className="mt-1 text-xs text-slate-400">{formatDateTime(delivery.delivered_at)}</p>}
                      </div>
                      <div className="text-right">
                        {delivery.delivered ? (
                          <span className="text-xs font-semibold text-slate-400">Finalizado</span>
                        ) : (
                          <Button
                            type="button"
                            variant="secondary"
                            className="h-8 px-2 text-xs"
                            disabled={delivering}
                            onClick={() => markDelivered(delivery.id)}
                          >
                            {delivering ? 'Salvando' : 'Marcar entregue'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div></div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RewardMetric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Gift }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-panel">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
        <span className="rounded-lg bg-amber-50 p-2 text-amber-700"><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}
