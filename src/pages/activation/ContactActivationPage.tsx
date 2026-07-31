import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, Link2, MessageCircle, QrCode, RefreshCw, UserCheck, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../features/api/endpoints';
import type { ContactActivation, ContactActivationStart, ContactActivationSummary, Student } from '../../features/api/types';
import { PageHeader, InlineNotice } from '../../components/common/PageHeader';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ErrorState, LoadingState, EmptyState } from '../../components/common/State';

export function ContactActivationPage() {
  const [summary, setSummary] = useState<ContactActivationSummary>();
  const [activations, setActivations] = useState<ContactActivation[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assisted, setAssisted] = useState<ContactActivationStart>();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState('');
  const [error, setError] = useState('');
  const publicURL = summary?.activation_code ? `${window.location.origin}${window.location.pathname}#/activate/${summary.activation_code}` : '';
  const pending = useMemo(() => activations.filter((item) => item.status === 'needs_review'), [activations]);
  const recent = useMemo(() => activations.filter((item) => item.status !== 'needs_review').slice(0, 20), [activations]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [nextSummary, nextActivations, nextStudents] = await Promise.all([
        api.contactActivationSummary(), api.contactActivations(), api.students(),
      ]);
      setSummary(nextSummary);
      setActivations(nextActivations);
      setStudents(nextStudents.filter((student) => !student.anonymized_at));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as ativações.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function resolve(activation: ContactActivation, studentId: string) {
    if (!studentId) return;
    setProcessing(activation.id);
    setError('');
    try {
      const updated = await api.resolveContactActivation(activation.id, studentId);
      setActivations((current) => current.map((item) => item.id === updated.id ? updated : item));
      const nextSummary = await api.contactActivationSummary();
      setSummary(nextSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir o vínculo.');
    } finally {
      setProcessing('');
    }
  }

  async function createAssisted() {
    if (!selectedStudentId) return;
    setProcessing('assisted');
    setError('');
    try {
      setAssisted(await api.startStudentContactActivation(selectedStudentId));
      setActivations(await api.contactActivations());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o convite.');
    } finally {
      setProcessing('');
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Ativação no WhatsApp" eyebrow="Base própria e consentida" description="Convide alunos a vincularem o próprio número e acompanhe a cobertura da sua base." actions={<Button variant="secondary" onClick={() => void load()}><RefreshCw className="h-4 w-4" />Atualizar</Button>} />
      {error && <ErrorState message={error} />}
      {loading ? <LoadingState /> : summary && (
        <>
          {!summary.whatsapp_ready && <InlineNotice tone="warning">A conexão Twilio precisa estar ativa e usar um número de telefone como remetente antes de publicar o QR Code.</InlineNotice>}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Metric label="Alunos cadastrados" value={summary.total_students} icon={Users} />
            <Metric label="Com telefone" value={summary.with_phone} icon={MessageCircle} />
            <Metric label="Autorizados" value={summary.opted_in} icon={UserCheck} />
            <Metric label="Aguardando envio" value={summary.awaiting_message} icon={Link2} />
            <Metric label="Revisar vínculo" value={summary.pending_review} icon={QrCode} attention={summary.pending_review > 0} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader><h2 className="font-bold text-slate-950">QR de entrada da academia</h2><p className="mt-1 text-sm text-slate-500">Novos alunos se cadastram no primeiro treino; alunos atuais ativam o WhatsApp. Use na recepção, TV ou balcão.</p></CardHeader>
              <CardContent>
                {summary.whatsapp_ready && publicURL ? <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="rounded-xl border border-slate-200 bg-white p-3"><QRCodeSVG value={publicURL} size={184} level="M" /></div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <p className="text-sm font-semibold text-slate-800">Primeiro treino? Escaneie para entrar na academia e ativar seu acompanhamento.</p>
                    <code className="block break-all rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{publicURL}</code>
                    <Button variant="secondary" onClick={() => void navigator.clipboard.writeText(publicURL)}><Copy className="h-4 w-4" />Copiar link</Button>
                  </div>
                </div> : <EmptyState message="Configure uma conexão Twilio disponível para liberar o QR Code." />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><h2 className="font-bold text-slate-950">Convite assistido</h2><p className="mt-1 text-sm text-slate-500">Selecione o aluno na recepção e mostre um QR já vinculado ao cadastro correto.</p></CardHeader>
              <CardContent className="space-y-4">
                <select className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={selectedStudentId} onChange={(event) => { setSelectedStudentId(event.target.value); setAssisted(undefined); }}>
                  <option value="">Selecione um aluno</option>
                  {students.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.source === 'wellhub' ? 'Wellhub' : 'TotalPass'}</option>)}
                </select>
                <Button className="w-full" disabled={!selectedStudentId || processing === 'assisted' || !summary.whatsapp_ready} onClick={() => void createAssisted()}>Gerar convite individual</Button>
                {assisted && <div className="flex flex-col items-center gap-3 rounded-xl bg-emerald-50 p-4 text-center">
                  <QRCodeSVG value={assisted.whatsapp_url} size={168} level="M" />
                  <p className="text-xs font-semibold text-emerald-900">O aluno escaneia e envia a mensagem pronta. Expira em 30 minutos.</p>
                  <a className="text-xs font-bold text-emerald-800 underline" href={assisted.whatsapp_url} target="_blank" rel="noreferrer">Abrir convite</a>
                </div>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><h2 className="font-bold text-slate-950">Vínculos que precisam de revisão</h2><p className="mt-1 text-sm text-slate-500">Acontece quando nome, plataforma e presença não produziram uma correspondência única.</p></CardHeader>
            <CardContent className="space-y-3">
              {pending.length === 0 ? <EmptyState message="Nenhum vínculo aguardando revisão." /> : pending.map((item) => {
                const candidates = students.filter((student) => student.source === item.source);
                return <div key={item.id} className="grid gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <div><p className="font-bold text-slate-950">{item.claimed_name}</p><p className="text-xs text-slate-600">{item.source === 'wellhub' ? 'Wellhub' : 'TotalPass'} · presença informada {item.recent_checkin_date ? new Date(item.recent_checkin_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'não informada'} · telefone final {item.phone?.slice(-4)}</p></div>
                  <select id={`resolve-${item.id}`} className="h-10 rounded-md border border-amber-200 bg-white px-3 text-sm" defaultValue="">
                    <option value="">Selecione o cadastro correto</option>
                    {candidates.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                  </select>
                  <Button disabled={processing === item.id} onClick={() => {
                    const select = document.getElementById(`resolve-${item.id}`) as HTMLSelectElement | null;
                    void resolve(item, select?.value || '');
                  }}>Confirmar vínculo</Button>
                </div>;
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="font-bold text-slate-950">Ativações recentes</h2></CardHeader>
            <CardContent className="space-y-2">
              {recent.length === 0 ? <EmptyState message="Nenhuma ativação iniciada." /> : recent.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 rounded-lg border border-slate-100 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-semibold text-slate-900">{item.student_name || item.claimed_name}</p><p className="text-xs text-slate-500">{item.is_new_student ? 'Novo cadastro · ' : ''}{item.source === 'wellhub' ? 'Wellhub' : 'TotalPass'} · {new Date(item.created_at).toLocaleString('pt-BR')}</p></div>
                  <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${item.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : item.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`}>
                    {item.status === 'confirmed' && <CheckCircle2 className="h-3.5 w-3.5" />}{statusLabel(item.status)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, icon: Icon, attention = false }: { label: string; value: number; icon: typeof Users; attention?: boolean }) {
  return <Card><CardContent className="flex items-center gap-3 p-4"><div className={`rounded-lg p-2 ${attention ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}><Icon className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-slate-950">{value}</p><p className="text-xs font-semibold text-slate-500">{label}</p></div></CardContent></Card>;
}

function statusLabel(status: ContactActivation['status']) {
  return { awaiting_message: 'Aguardando envio', confirmed: 'Ativado', needs_review: 'Revisar', expired: 'Expirado', cancelled: 'Cancelado' }[status];
}
