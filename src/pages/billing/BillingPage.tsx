import { useEffect, useState } from 'react';
import { AlertTriangle, CreditCard, ExternalLink, MessageCircle } from 'lucide-react';
import { ErrorState, LoadingState } from '../../components/common/State';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { api } from '../../features/api/endpoints';
import type { BillingOverview } from '../../features/api/types';

function money(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

export function BillingPage() {
  const [data, setData] = useState<BillingOverview>();
  const [error, setError] = useState('');
  useEffect(() => { api.ownerBilling().then(setData).catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar assinatura')); }, []);
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState label="Carregando assinatura" />;
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-slate-950">Plano e cobranças</h1><p className="mt-1 text-sm text-slate-500">Consulte sua mensalidade, franquia incluída e histórico de pagamentos.</p></div>
    {data.billing_access_blocked && <div className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertTriangle className="h-5 w-5 shrink-0" /><div><p className="font-bold">Acesso suspenso por pendência financeira</p><p>{data.billing_access_reason}</p></div></div>}
    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardContent className="p-5"><CreditCard className="h-5 w-5 text-accent" /><p className="mt-3 text-xs font-semibold uppercase text-slate-500">Mensalidade</p><p className="mt-1 text-2xl font-bold text-slate-950">{data.plan ? money(data.plan.monthly_price_cents) : 'Não definida'}</p><p className="text-sm text-slate-500">{data.plan?.name || 'Sem plano'}</p></CardContent></Card>
      <Card><CardContent className="p-5"><MessageCircle className="h-5 w-5 text-accent" /><p className="mt-3 text-xs font-semibold uppercase text-slate-500">Mensagens incluídas</p><p className="mt-1 text-2xl font-bold text-slate-950">{data.plan?.monthly_message_limit ?? 0}/mês</p><p className="text-sm text-slate-500">Até {data.plan?.daily_message_limit ?? 0} por dia</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-xs font-semibold uppercase text-slate-500">Assinatura</p><p className="mt-2 text-lg font-bold capitalize text-slate-950">{data.subscription?.status.replace('_', ' ') || 'Não criada'}</p><p className="text-sm text-slate-500">{data.subscription ? `Próximo vencimento: ${data.subscription.next_due_date}` : 'Fale com o suporte EngageFit'}</p></CardContent></Card>
    </div>
    <Card><CardHeader><h2 className="font-bold text-slate-950">Histórico de cobranças</h2><p className="text-sm text-slate-500">O pagamento é processado com segurança pelo Asaas.</p></CardHeader><CardContent>
      {(data.invoices || []).length === 0 ? <p className="text-sm text-slate-500">Nenhuma cobrança disponível.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-slate-500"><th className="py-2">Vencimento</th><th>Status</th><th>Valor</th><th>Forma</th><th></th></tr></thead><tbody>{data.invoices?.map((invoice) => <tr className="border-b border-slate-100" key={invoice.id}><td className="py-3">{invoice.due_date}</td><td className="font-semibold">{invoice.status}</td><td>{money(invoice.value_cents)}</td><td>{invoice.billing_type}</td><td>{invoice.invoice_url && <a href={invoice.invoice_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-accent hover:underline">Abrir <ExternalLink className="h-3.5 w-3.5" /></a>}</td></tr>)}</tbody></table></div>}
    </CardContent></Card>
  </div>;
}
