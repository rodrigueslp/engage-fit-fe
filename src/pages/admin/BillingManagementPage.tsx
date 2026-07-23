import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, CreditCard, RefreshCw, Save, WalletCards } from 'lucide-react';
import { ErrorState, LoadingState } from '../../components/common/State';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { api } from '../../features/api/endpoints';
import type { BillingCustomer, BillingOverview, BillingPlan, BillingSubscription, BillingSummary } from '../../features/api/types';

const emptyCustomer = {
  legal_name: '', cpf_cnpj: '', email: '', phone: '', postal_code: '', address: '', address_number: '',
  complement: '', province: '', city: '', state: '', notification_disabled: false, reason: '',
};

const emptyPlan = {
  code: '', version: 1, name: '', description: '', monthly_price_cents: 0, monthly_message_limit: 300,
  daily_message_limit: 50, per_dispatch_limit: 50, warning_percent: 80, grace_period_days: 5, active: true, reason: '',
};

type CustomerForm = typeof emptyCustomer;
type PlanForm = typeof emptyPlan;

function money(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function dateInput(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function statusLabel(status?: string) {
  return ({ trialing: 'Período inicial', pending: 'Pendente', active: 'Ativa', past_due: 'Em atraso', suspended: 'Suspensa', canceled: 'Cancelada' } as Record<string, string>)[status || ''] || 'Sem assinatura';
}

function StatusPill({ overview }: { overview: BillingOverview }) {
  const risky = overview.billing_access_blocked || ['past_due', 'suspended'].includes(overview.subscription?.status || '');
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${risky ? 'bg-rose-100 text-rose-700' : overview.subscription ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{statusLabel(overview.subscription?.status)}</span>;
}

function SummaryCards({ data }: { data: BillingSummary }) {
  const cards = [
    ['Receita recorrente mensal', money(data.monthly_recurring_revenue_cents)],
    ['Recebido neste mês', money(data.received_this_month_cents)],
    ['Valor pendente', money(data.pending_amount_cents)],
    ['Assinaturas ativas', String(data.active_subscriptions)],
    ['Em atraso', String(data.past_due_subscriptions)],
    ['Suspensas', String(data.suspended_subscriptions)],
  ];
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{cards.map(([label, value]) => <Card key={label}><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-xl font-bold text-slate-950">{value}</p></CardContent></Card>)}</div>;
}

function PlanEditor({ plans, saving, onSaved }: { plans: BillingPlan[]; saving: boolean; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState<PlanForm>(emptyPlan);
  const [editingID, setEditingID] = useState('');
  const [error, setError] = useState('');

  function edit(plan: BillingPlan) {
    setEditingID(plan.id);
    setForm({ code: plan.code, version: plan.version, name: plan.name, description: plan.description,
      monthly_price_cents: plan.monthly_price_cents, monthly_message_limit: plan.monthly_message_limit,
      daily_message_limit: plan.daily_message_limit, per_dispatch_limit: plan.per_dispatch_limit,
      warning_percent: plan.warning_percent, grace_period_days: plan.grace_period_days, active: plan.active, reason: '' });
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    try {
      if (editingID) await api.updateBillingPlan(editingID, form);
      else await api.createBillingPlan(form);
      setEditingID(''); setForm(emptyPlan); await onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível salvar o plano'); }
  }

  const number = (field: keyof PlanForm, value: string) => setForm((current) => ({ ...current, [field]: Number(value) }));
  return <Card>
    <CardHeader><div className="flex items-center gap-3"><WalletCards className="h-5 w-5 text-accent" /><div><h2 className="font-bold text-slate-950">Planos comerciais</h2><p className="text-sm text-slate-500">Um preço mensal único já inclui a franquia de mensagens definida aqui.</p></div></div></CardHeader>
    <CardContent className="space-y-5">
      <div className="grid gap-3 lg:grid-cols-2">{plans.map((plan) => <button type="button" key={plan.id} onClick={() => edit(plan)} className={`rounded-lg border p-4 text-left ${editingID === plan.id ? 'border-accent bg-blue-50' : 'border-slate-200'}`}>
        <div className="flex justify-between gap-3"><div><p className="font-bold text-slate-950">{plan.name} <span className="text-xs text-slate-400">v{plan.version}</span></p><p className="text-sm text-slate-500">{plan.description}</p></div><p className="font-bold text-slate-950">{money(plan.monthly_price_cents)}/mês</p></div>
        <p className="mt-3 text-xs font-semibold text-slate-600">{plan.monthly_message_limit} mensagens/mês · {plan.daily_message_limit}/dia · {plan.per_dispatch_limit}/disparo · {plan.grace_period_days} dias de tolerância</p>
      </button>)}</div>
      {error && <p className="text-sm font-semibold text-rose-700">{error}</p>}
      <form className="grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-3" onSubmit={submit}>
        <Field label="Código"><Input value={form.code} disabled={Boolean(editingID)} onChange={(e) => setForm((v) => ({ ...v, code: e.target.value }))} required /></Field>
        <Field label="Versão"><Input type="number" min={1} value={form.version} disabled={Boolean(editingID)} onChange={(e) => number('version', e.target.value)} required /></Field>
        <Field label="Nome"><Input value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} required /></Field>
        <Field label="Preço mensal (R$)"><Input type="number" min={0} step=".01" value={form.monthly_price_cents / 100} onChange={(e) => number('monthly_price_cents', String(Math.round(Number(e.target.value) * 100)))} required /></Field>
        <Field label="Mensagens por mês"><Input type="number" min={0} value={form.monthly_message_limit} onChange={(e) => number('monthly_message_limit', e.target.value)} required /></Field>
        <Field label="Mensagens por dia"><Input type="number" min={0} value={form.daily_message_limit} onChange={(e) => number('daily_message_limit', e.target.value)} required /></Field>
        <Field label="Máximo por disparo"><Input type="number" min={0} value={form.per_dispatch_limit} onChange={(e) => number('per_dispatch_limit', e.target.value)} required /></Field>
        <Field label="Alerta de uso (%)"><Input type="number" min={1} max={100} value={form.warning_percent} onChange={(e) => number('warning_percent', e.target.value)} required /></Field>
        <Field label="Tolerância após vencimento"><Input type="number" min={0} max={90} value={form.grace_period_days} onChange={(e) => number('grace_period_days', e.target.value)} required /></Field>
        <Field label="Descrição" className="md:col-span-2"><Input value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} /></Field>
        <label className="flex items-center gap-3 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.active} onChange={(e) => setForm((v) => ({ ...v, active: e.target.checked }))} />Plano disponível</label>
        <Field label="Motivo da alteração" className="md:col-span-2"><Input value={form.reason} onChange={(e) => setForm((v) => ({ ...v, reason: e.target.value }))} required /></Field>
        <div className="flex gap-2 md:items-end"><Button disabled={saving}><Save className="h-4 w-4" />Salvar plano</Button>{editingID && <Button type="button" variant="secondary" onClick={() => { setEditingID(''); setForm(emptyPlan); }}>Novo</Button>}</div>
      </form>
    </CardContent>
  </Card>;
}

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return <label className={`space-y-1 text-sm font-semibold text-slate-600 ${className}`}>{label}{children}</label>;
}

function AcademyBilling({ overview, plans, onChanged }: { overview: BillingOverview; plans: BillingPlan[]; onChanged: () => Promise<void> }) {
  const [customer, setCustomer] = useState<CustomerForm>(emptyCustomer);
  const [planID, setPlanID] = useState('');
  const [billingType, setBillingType] = useState<BillingSubscription['billing_type']>('UNDEFINED');
  const [dueDate, setDueDate] = useState(dateInput(7));
  const [reason, setReason] = useState('');
  const [graceUntil, setGraceUntil] = useState(dateInput(5));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const value = overview.customer;
    setCustomer(value ? { legal_name: value.legal_name, cpf_cnpj: value.cpf_cnpj, email: value.email, phone: value.phone,
      postal_code: value.postal_code, address: value.address, address_number: value.address_number, complement: value.complement,
      province: value.province, city: value.city, state: value.state, notification_disabled: value.notification_disabled, reason: '' } : emptyCustomer);
    setPlanID(overview.plan?.id || plans.find((plan) => plan.active)?.id || '');
  }, [overview, plans]);

  async function run(action: () => Promise<unknown>, message: string) {
    setSaving(true); setError(''); setStatus('');
    try { await action(); setStatus(message); await onChanged(); } catch (err) { setError(err instanceof Error ? err.message : 'Operação não concluída'); } finally { setSaving(false); }
  }

  async function saveCustomer(event: FormEvent) {
    event.preventDefault();
    await run(() => api.saveBillingCustomer(overview.box_id, customer), 'Dados de cobrança sincronizados com o Asaas.');
  }

  async function createSubscription(event: FormEvent) {
    event.preventDefault();
    await run(() => api.createBillingSubscription(overview.box_id, { plan_id: planID, billing_type: billingType, next_due_date: dueDate, reason }), 'Assinatura criada e limites do plano aplicados.');
  }

  return <div className="space-y-5">
    {overview.billing_access_blocked && <div className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertTriangle className="h-5 w-5 shrink-0" /><div><p className="font-bold">Acesso financeiro bloqueado</p><p>{overview.billing_access_reason}</p></div></div>}
    {error && <ErrorState message={error} />}
    {status && <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" />{status}</div>}
    <Card><CardHeader><h2 className="font-bold text-slate-950">Cliente de cobrança</h2><p className="text-sm text-slate-500">Estes dados são criados ou atualizados no Asaas sem armazenar dados de cartão.</p></CardHeader><CardContent>
      <form className="grid gap-4 md:grid-cols-3" onSubmit={saveCustomer}>
        <Field label="Razão social / nome"><Input value={customer.legal_name} onChange={(e) => setCustomer((v) => ({ ...v, legal_name: e.target.value }))} required /></Field>
        <Field label="CPF/CNPJ"><Input value={customer.cpf_cnpj} onChange={(e) => setCustomer((v) => ({ ...v, cpf_cnpj: e.target.value }))} /></Field>
        <Field label="E-mail de cobrança"><Input type="email" value={customer.email} onChange={(e) => setCustomer((v) => ({ ...v, email: e.target.value }))} required /></Field>
        <Field label="Telefone"><Input value={customer.phone} onChange={(e) => setCustomer((v) => ({ ...v, phone: e.target.value }))} /></Field>
        <Field label="CEP"><Input value={customer.postal_code} onChange={(e) => setCustomer((v) => ({ ...v, postal_code: e.target.value }))} /></Field>
        <Field label="Endereço"><Input value={customer.address} onChange={(e) => setCustomer((v) => ({ ...v, address: e.target.value }))} /></Field>
        <Field label="Número"><Input value={customer.address_number} onChange={(e) => setCustomer((v) => ({ ...v, address_number: e.target.value }))} /></Field>
        <Field label="Complemento"><Input value={customer.complement} onChange={(e) => setCustomer((v) => ({ ...v, complement: e.target.value }))} /></Field>
        <Field label="Bairro"><Input value={customer.province} onChange={(e) => setCustomer((v) => ({ ...v, province: e.target.value }))} /></Field>
        <Field label="Cidade"><Input value={customer.city} onChange={(e) => setCustomer((v) => ({ ...v, city: e.target.value }))} /></Field>
        <Field label="UF"><Input maxLength={2} value={customer.state} onChange={(e) => setCustomer((v) => ({ ...v, state: e.target.value.toUpperCase() }))} /></Field>
        <label className="flex items-center gap-3 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={customer.notification_disabled} onChange={(e) => setCustomer((v) => ({ ...v, notification_disabled: e.target.checked }))} />Desativar avisos do Asaas</label>
        <Field label="Motivo" className="md:col-span-2"><Input value={customer.reason} onChange={(e) => setCustomer((v) => ({ ...v, reason: e.target.value }))} required /></Field>
        <div className="md:items-end"><Button disabled={saving}><Save className="h-4 w-4" />Sincronizar cliente</Button></div>
      </form>
    </CardContent></Card>
    <Card><CardHeader><h2 className="font-bold text-slate-950">Assinatura</h2><p className="text-sm text-slate-500">{overview.subscription ? `${statusLabel(overview.subscription.status)} · próximo vencimento ${overview.subscription.next_due_date}` : 'Crie a assinatura depois de sincronizar o cliente.'}</p></CardHeader><CardContent>
      {!overview.subscription ? <form className="grid gap-4 md:grid-cols-4" onSubmit={createSubscription}>
        <Field label="Plano"><select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={planID} onChange={(e) => setPlanID(e.target.value)} required>{plans.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.name} · {money(p.monthly_price_cents)}</option>)}</select></Field>
        <Field label="Cobrança"><select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={billingType} onChange={(e) => setBillingType(e.target.value as BillingSubscription['billing_type'])}><option value="UNDEFINED">Cliente escolhe</option><option value="PIX">Pix</option><option value="BOLETO">Boleto</option><option value="CREDIT_CARD">Cartão</option></select></Field>
        <Field label="Primeiro vencimento"><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required /></Field>
        <Field label="Motivo"><Input value={reason} onChange={(e) => setReason(e.target.value)} required /></Field>
        <div className="md:col-span-4"><Button disabled={saving || !overview.customer}><CreditCard className="h-4 w-4" />Criar assinatura no Asaas</Button></div>
      </form> : <div className="flex flex-wrap items-end gap-3">
        <Field label="Liberar tolerância até"><Input type="date" value={graceUntil} onChange={(e) => setGraceUntil(e.target.value)} /></Field>
        <Field label="Motivo da ação"><Input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        <Button type="button" variant="secondary" disabled={saving || !reason} onClick={() => void run(() => api.grantBillingGrace(overview.box_id, graceUntil, reason), 'Tolerância aplicada.')}>Conceder tolerância</Button>
        <Button type="button" className="bg-rose-600 hover:bg-rose-700" disabled={saving || !reason} onClick={() => { if (window.confirm('Cancelar a assinatura no Asaas e bloquear o acesso?')) void run(() => api.cancelBillingSubscription(overview.box_id, reason), 'Assinatura cancelada.'); }}>Cancelar assinatura</Button>
      </div>}
    </CardContent></Card>
    <Card><CardHeader><h2 className="font-bold text-slate-950">Cobranças</h2></CardHeader><CardContent>
      {(overview.invoices || []).length === 0 ? <p className="text-sm text-slate-500">Nenhuma cobrança sincronizada.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-slate-500"><th className="py-2">Vencimento</th><th>Status</th><th>Valor</th><th>Forma</th><th>Link</th></tr></thead><tbody>{overview.invoices?.map((invoice) => <tr key={invoice.id} className="border-b border-slate-100"><td className="py-3">{invoice.due_date}</td><td className="font-semibold">{invoice.status}</td><td>{money(invoice.value_cents)}</td><td>{invoice.billing_type}</td><td>{invoice.invoice_url && <a className="font-semibold text-accent hover:underline" href={invoice.invoice_url} target="_blank" rel="noreferrer">Abrir cobrança</a>}</td></tr>)}</tbody></table></div>}
    </CardContent></Card>
  </div>;
}

export function BillingManagementPage() {
  const [summary, setSummary] = useState<BillingSummary>();
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [boxes, setBoxes] = useState<BillingOverview[]>([]);
  const [selectedID, setSelectedID] = useState('');
  const [detail, setDetail] = useState<BillingOverview>();
  const [section, setSection] = useState<'academies' | 'plans'>('academies');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const [summaryData, planData, boxData] = await Promise.all([api.billingSummary(), api.billingPlans(), api.billingBoxes()]);
    setSummary(summaryData); setPlans(planData); setBoxes(boxData);
    setSelectedID((current) => boxData.some((box) => box.box_id === current) ? current : boxData[0]?.box_id || '');
  }
  async function loadDetail(id = selectedID) { if (id) setDetail(await api.billingBox(id)); }
  useEffect(() => { load().catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar financeiro')).finally(() => setLoading(false)); }, []);
  useEffect(() => { setDetail(undefined); loadDetail(selectedID).catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar academia')); }, [selectedID]);
  const selected = useMemo(() => boxes.find((box) => box.box_id === selectedID), [boxes, selectedID]);
  async function refresh() { await load(); await loadDetail(selectedID); }
  async function reconcile() { setSaving(true); setError(''); try { await api.reconcileBilling(); await refresh(); } catch (err) { setError(err instanceof Error ? err.message : 'Reconciliação falhou'); } finally { setSaving(false); } }

  if (loading) return <LoadingState label="Carregando financeiro" />;
  if (error && !summary) return <ErrorState message={error} />;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-950">Financeiro</h1><p className="mt-1 text-sm text-slate-500">Assinaturas, inadimplência, franquias e cobranças Asaas em um só lugar.</p></div><Button variant="secondary" disabled={saving} onClick={() => void reconcile()}><RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />Reconciliar Asaas</Button></div>
    {summary && <SummaryCards data={summary} />}
    {error && <ErrorState message={error} />}
    <div className="flex gap-2 border-b border-slate-200"><button className={`px-4 py-3 text-sm font-bold ${section === 'academies' ? 'border-b-2 border-accent text-accent' : 'text-slate-500'}`} onClick={() => setSection('academies')}>Academias</button><button className={`px-4 py-3 text-sm font-bold ${section === 'plans' ? 'border-b-2 border-accent text-accent' : 'text-slate-500'}`} onClick={() => setSection('plans')}>Planos</button></div>
    {section === 'plans' && <PlanEditor plans={plans} saving={saving} onSaved={refresh} />}
    {section === 'academies' && <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
      <Card><CardHeader><h2 className="font-bold text-slate-950">Academias</h2></CardHeader><CardContent className="space-y-2">{boxes.map((box) => <button key={box.box_id} onClick={() => setSelectedID(box.box_id)} className={`w-full rounded-lg border p-3 text-left ${selectedID === box.box_id ? 'border-accent bg-blue-50' : 'border-slate-200'}`}><div className="flex items-center justify-between gap-2"><p className="font-bold text-slate-900">{box.box_name}</p><StatusPill overview={box} /></div><p className="mt-1 text-xs text-slate-500">{box.plan ? `${box.plan.name} · ${money(box.plan.monthly_price_cents)}` : 'Sem plano contratado'}</p></button>)}</CardContent></Card>
      <div>{selected && <div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-bold text-slate-950">{selected.box_name}</h2><p className="text-sm text-slate-500">Status operacional: {selected.box_status}</p></div><StatusPill overview={selected} /></div>}{detail ? <AcademyBilling overview={detail} plans={plans} onChanged={refresh} /> : <LoadingState label="Carregando cobrança" />}</div>
    </div>}
  </div>;
}
