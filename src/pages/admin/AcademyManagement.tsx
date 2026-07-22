import { Archive, Building2, PauseCircle, PlayCircle, Plus, Save } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import type { AdminBox, BoxStatus } from '../../features/api/types';

export type CreateAcademyPayload = {
  box_name: string;
  owner_name: string;
  owner_email: string;
  password: string;
  reason: string;
};

export function AcademyStatusBadge({ status }: { status: BoxStatus }) {
  const styles = status === 'active' ? 'bg-emerald-100 text-emerald-700' : status === 'suspended' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700';
  const label = status === 'active' ? 'Ativa' : status === 'suspended' ? 'Suspensa' : 'Arquivada';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles}`}>{label}</span>;
}

export function CreateAcademyForm({ saving, onSubmit, onCancel }: { saving: boolean; onSubmit: (payload: CreateAcademyPayload) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState<CreateAcademyPayload>({ box_name: '', owner_name: '', owner_email: '', password: '', reason: 'Onboarding comercial aprovado' });
  const [confirmation, setConfirmation] = useState('');
  const [validation, setValidation] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setValidation('');
    if (form.password.length < 12) { setValidation('A senha inicial deve ter ao menos 12 caracteres.'); return; }
    if (form.password !== confirmation) { setValidation('A confirmação da senha não confere.'); return; }
    try { await onSubmit(form); } catch { /* O container exibe o erro acionável. */ }
  }

  return (
    <Card className="border-accent/30">
      <CardHeader><div className="flex items-center gap-3"><Plus className="h-5 w-5 text-accent" /><div><h2 className="font-bold text-slate-950">Nova academia</h2><p className="text-sm text-slate-500">Cria o tenant e seu primeiro proprietário em uma única operação.</p></div></div></CardHeader>
      <CardContent>
        {validation && <p className="mb-4 text-sm font-semibold text-rose-700">{validation}</p>}
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <label className="space-y-1 text-sm font-semibold text-slate-600">Nome da academia<Input value={form.box_name} onChange={(event) => setForm((current) => ({ ...current, box_name: event.target.value }))} required /></label>
          <label className="space-y-1 text-sm font-semibold text-slate-600">Nome do proprietário<Input value={form.owner_name} onChange={(event) => setForm((current) => ({ ...current, owner_name: event.target.value }))} required /></label>
          <label className="space-y-1 text-sm font-semibold text-slate-600">E-mail do proprietário<Input type="email" value={form.owner_email} onChange={(event) => setForm((current) => ({ ...current, owner_email: event.target.value }))} required /></label>
          <label className="space-y-1 text-sm font-semibold text-slate-600">Motivo do cadastro<Input value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} required /></label>
          <label className="space-y-1 text-sm font-semibold text-slate-600">Senha inicial<Input type="password" autoComplete="new-password" minLength={12} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required /></label>
          <label className="space-y-1 text-sm font-semibold text-slate-600">Confirmar senha<Input type="password" autoComplete="new-password" minLength={12} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label>
          <div className="flex gap-2 md:col-span-2"><Button disabled={saving}><Plus className="h-4 w-4" />{saving ? 'Criando' : 'Criar academia'}</Button><Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>Cancelar</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}

export function AcademyLifecycleEditor({ academy, saving, onUpdate, onStatus }: { academy: AdminBox; saving: boolean; onUpdate: (name: string, reason: string) => Promise<void>; onStatus: (status: BoxStatus, reason: string) => Promise<void> }) {
  const [name, setName] = useState(academy.name);
  const [editReason, setEditReason] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [archiveConfirmation, setArchiveConfirmation] = useState('');
  useEffect(() => { setName(academy.name); setEditReason(''); setStatusReason(''); setArchiveConfirmation(''); }, [academy]);

  async function update(event: FormEvent) {
    event.preventDefault();
    try { await onUpdate(name, editReason); setEditReason(''); } catch { /* O container exibe o erro acionável. */ }
  }

  async function changeStatus(status: BoxStatus) {
    try {
      await onStatus(status, statusReason);
      setStatusReason('');
      setArchiveConfirmation('');
    } catch { /* O container exibe o erro acionável. */ }
  }

  return <div className="space-y-4">
    <Card>
      <CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-3"><Building2 className="h-5 w-5 text-accent" /><div><h2 className="font-bold text-slate-950">Cadastro da academia</h2><p className="text-sm text-slate-500">Criada em {new Date(academy.created_at).toLocaleString('pt-BR')}</p></div></div><AcademyStatusBadge status={academy.status} /></div></CardHeader>
      <CardContent className="space-y-5">
        <dl className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-2"><div><dt className="text-slate-500">Proprietário</dt><dd className="font-bold text-slate-900">{academy.owner_name}</dd></div><div><dt className="text-slate-500">E-mail de acesso</dt><dd className="font-bold text-slate-900">{academy.owner_email}</dd></div>{academy.status_reason && <div className="md:col-span-2"><dt className="text-slate-500">Último motivo de status</dt><dd className="font-semibold text-slate-800">{academy.status_reason}{academy.status_changed_at ? ` · ${new Date(academy.status_changed_at).toLocaleString('pt-BR')}` : ''}</dd></div>}</dl>
        <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end" onSubmit={update}>
          <label className="space-y-1 text-sm font-semibold text-slate-600">Nome<Input value={name} onChange={(event) => setName(event.target.value)} disabled={academy.status === 'archived'} required /></label>
          <label className="space-y-1 text-sm font-semibold text-slate-600">Motivo da alteração<Input value={editReason} onChange={(event) => setEditReason(event.target.value)} disabled={academy.status === 'archived'} required /></label>
          <Button disabled={saving || academy.status === 'archived'}><Save className="h-4 w-4" />Salvar cadastro</Button>
        </form>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><div><h2 className="font-bold text-slate-950">Ciclo de vida</h2><p className="text-sm text-slate-500">Suspender bloqueia login, sessões, automações e novos envios. Arquivar é uma ação terminal no painel.</p></div></CardHeader>
      <CardContent className="space-y-4">
        {academy.status !== 'archived' ? <>
          <label className="block space-y-1 text-sm font-semibold text-slate-600">Motivo da ação<Input value={statusReason} onChange={(event) => setStatusReason(event.target.value)} placeholder="Obrigatório para auditoria" required /></label>
          <div className="flex flex-wrap gap-2">
            {academy.status === 'active' ? <Button type="button" variant="secondary" disabled={saving || !statusReason.trim()} onClick={() => void changeStatus('suspended')}><PauseCircle className="h-4 w-4" />Suspender academia</Button> : <Button type="button" disabled={saving || !statusReason.trim()} onClick={() => void changeStatus('active')}><PlayCircle className="h-4 w-4" />Reativar academia</Button>}
          </div>
          <div className="border-t border-rose-100 pt-4">
            <p className="text-sm font-bold text-rose-800">Arquivamento</p><p className="mt-1 text-xs text-slate-500">Os dados são preservados, mas a academia não poderá ser reativada por este painel.</p>
            <div className="mt-3 flex flex-wrap items-end gap-2"><label className="space-y-1 text-sm font-semibold text-slate-600">Digite ARQUIVAR para confirmar<Input value={archiveConfirmation} onChange={(event) => setArchiveConfirmation(event.target.value)} /></label><Button type="button" variant="secondary" className="border-rose-200 text-rose-700 hover:bg-rose-50" disabled={saving || !statusReason.trim() || archiveConfirmation !== 'ARQUIVAR'} onClick={() => void changeStatus('archived')}><Archive className="h-4 w-4" />Arquivar definitivamente</Button></div>
          </div>
        </> : <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Esta academia está arquivada. Os dados permanecem preservados para retenção e auditoria.</div>}
      </CardContent>
    </Card>
  </div>;
}
