import { KeyRound, Plus, UserCheck, UserX, Users } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { api } from '../../features/api/endpoints';
import type { TeamMember } from '../../features/api/types';

export function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  async function load() {
    setLoading(true);
    try { setMembers(await api.teamMembers()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível carregar a equipe.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function create(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(''); setStatus('');
    try {
      await api.createCoach(form);
      setForm({ name: '', email: '', password: '' });
      setStatus('Coach criado. Compartilhe a senha inicial por um canal seguro.');
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível criar o coach.'); }
    finally { setSaving(false); }
  }

  async function toggle(member: TeamMember) {
    setError(''); setStatus('');
    try {
      await api.updateCoach(member.id, { name: member.name, active: !member.active });
      setStatus(member.active ? 'Acesso do coach desativado e sessões revogadas.' : 'Acesso do coach reativado.');
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível atualizar o acesso.'); }
  }

  async function resetPassword(member: TeamMember) {
    const password = window.prompt(`Nova senha para ${member.name} (mínimo de 12 caracteres):`);
    if (!password) return;
    setError(''); setStatus('');
    try {
      await api.resetCoachPassword(member.id, password);
      setStatus('Senha atualizada e sessões anteriores revogadas.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível redefinir a senha.'); }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Equipe" eyebrow="Acesso operacional" description="Crie acessos de coach para operar o radar sem liberar cobrança, integrações, campanhas ou configurações da academia." />
      {error && <ErrorState message={error} />}
      {status && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{status}</div>}
      <div className="grid items-start gap-5 xl:grid-cols-[380px_1fr]">
        <Card><CardHeader><h2 className="font-bold text-slate-950">Novo coach</h2><p className="text-sm text-slate-500">O coach poderá consultar alunos e frequência e registrar acompanhamentos.</p></CardHeader><CardContent><form className="space-y-3" onSubmit={create}><label className="block text-xs font-semibold text-slate-500">Nome<Input className="mt-1" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></label><label className="block text-xs font-semibold text-slate-500">E-mail<Input className="mt-1" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required /></label><label className="block text-xs font-semibold text-slate-500">Senha inicial<Input className="mt-1" type="password" minLength={12} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required /><span className="mt-1 block font-normal text-slate-400">Mínimo de 12 caracteres.</span></label><Button className="w-full" disabled={saving}><Plus className="h-4 w-4" />{saving ? 'Criando' : 'Criar acesso'}</Button></form></CardContent></Card>
        <Card><CardHeader><h2 className="font-bold text-slate-950">Pessoas com acesso</h2><p className="text-sm text-slate-500">Desativar um coach revoga suas sessões imediatamente.</p></CardHeader><CardContent>{loading ? <LoadingState /> : members.length === 0 ? <EmptyState message="Nenhuma pessoa cadastrada" /> : <div className="divide-y divide-slate-100">{members.map((member) => <div key={member.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="rounded-xl bg-slate-100 p-2 text-slate-600"><Users className="h-5 w-5" /></span><div><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-slate-950">{member.name}</p><StatusBadge value={member.active ? 'achieved' : 'inactive'} label={member.active ? 'Ativo' : 'Desativado'} /><span className="text-xs font-semibold text-slate-400">{member.role === 'OWNER' ? 'Proprietário' : 'Coach'}</span></div><p className="mt-1 text-sm text-slate-500">{member.email}</p></div></div>{member.role === 'COACH' && <div className="flex flex-wrap gap-2 sm:justify-end"><Button variant="ghost" onClick={() => void resetPassword(member)}><KeyRound className="h-4 w-4" />Nova senha</Button><Button variant="secondary" onClick={() => void toggle(member)}>{member.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}{member.active ? 'Desativar' : 'Reativar'}</Button></div>}</div>)}</div>}</CardContent></Card>
      </div>
    </div>
  );
}
