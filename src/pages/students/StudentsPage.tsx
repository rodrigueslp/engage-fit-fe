import { Download, MoreHorizontal, ShieldOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { api } from '../../features/api/endpoints';
import type { Student } from '../../features/api/types';

const pageSize = 10;

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [contactFilter, setContactFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
	const [processingId, setProcessingId] = useState('');

  useEffect(() => {
    api
      .students()
      .then(setStudents)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar alunos'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return students.filter((student) => {
      const matchesSearch = [student.name, student.email, student.phone].join(' ').toLowerCase().includes(query);
      const matchesSource = sourceFilter === 'all' || student.source === sourceFilter;
      const matchesContact = contactFilter === 'all' || (student.contact_status || 'unknown') === contactFilter;
      return matchesSearch && matchesSource && matchesContact;
    });
  }, [students, search, sourceFilter, contactFilter]);

  useEffect(() => setPage(1), [search, sourceFilter, contactFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleStudents = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  async function updateContact(student: Student, status: Student['contact_status']) {
    setProcessingId(student.id);
    setError('');
    try {
      await api.updateStudentContactPreference(student.id, status, 'owner_dashboard');
      setStudents((current) => current.map((item) => item.id === student.id ? { ...item, contact_status: status } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar preferência de contato');
    } finally {
      setProcessingId('');
    }
  }

  async function exportData(student: Student) {
    setProcessingId(student.id);
    setError('');
    try {
      const blob = await api.exportStudentData(student.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dados-${student.id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar dados');
    } finally {
      setProcessingId('');
    }
  }

  async function anonymize(student: Student) {
    const reason = window.prompt(`Motivo da anonimização de ${student.name}:`);
    if (!reason || reason.trim().length < 5) return;
    if (!window.confirm('Esta ação remove os dados pessoais e não pode ser desfeita. Continuar?')) return;
    setProcessingId(student.id);
    setError('');
    try {
      await api.anonymizeStudent(student.id, reason.trim());
      setStudents((current) => current.map((item) => item.id === student.id ? { ...item, name: 'Aluno anonimizado', email: '', phone: '', contact_status: 'opted_out', anonymized_at: new Date().toISOString() } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao anonimizar aluno');
    } finally {
      setProcessingId('');
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Alunos" eyebrow="Base da academia" description="Consulte contatos, origem e preferências de comunicação dos alunos importados." />
      {error && <ErrorState message={error} />}
      <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div><h2 className="text-base font-bold text-slate-950">Todos os alunos</h2><p className="text-sm text-slate-500">{filtered.length} de {students.length} alunos</p></div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Input placeholder="Buscar nome, e-mail ou telefone" value={search} onChange={(event) => setSearch(event.target.value)} />
            <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}><option value="all">Todas as plataformas</option><option value="wellhub">Wellhub</option><option value="totalpass">TotalPass</option></select>
            <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={contactFilter} onChange={(event) => setContactFilter(event.target.value)}><option value="all">Qualquer contato</option><option value="unknown">Não informado</option><option value="opted_in">Autorizado</option><option value="opted_out">Não contatar</option></select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-5"><LoadingState /></div>
        ) : filtered.length === 0 ? (
          <div className="p-5"><EmptyState message="Nenhum aluno encontrado" /></div>
        ) : (
          <>
          <div className="divide-y divide-slate-100 md:hidden">
            {visibleStudents.map((student) => (
              <div key={student.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-bold text-slate-950">{student.name}</p><p className="truncate text-sm text-slate-500">{student.email || student.phone || 'Sem contato cadastrado'}</p></div><StatusBadge value={student.source} label={student.source} /></div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-500">Preferência de contato<select className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-800" value={student.contact_status || 'unknown'} disabled={processingId === student.id || Boolean(student.anonymized_at)} onChange={(event) => void updateContact(student, event.target.value as Student['contact_status'])}><option value="unknown">Não informado</option><option value="opted_in">Autorizado</option><option value="opted_out">Não contatar</option></select></label>
                  <StudentPrivacyActions student={student} processing={processingId === student.id} onExport={exportData} onAnonymize={anonymize} />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Origem</th>
                  <th>Contato</th>
                  <th className="text-right">Privacidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="px-5 py-3 font-semibold text-slate-950">{student.name}</td>
                    <td className="text-slate-600">{student.email}</td>
                    <td className="text-slate-600">{student.phone}</td>
                    <td><StatusBadge value={student.source} label={student.source} /></td>
                    <td>
                      <select
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
                        value={student.contact_status || 'unknown'}
                        disabled={processingId === student.id || Boolean(student.anonymized_at)}
                        onChange={(event) => void updateContact(student, event.target.value as Student['contact_status'])}
                      >
                        <option value="unknown">Não informado</option>
                        <option value="opted_in">Autorizado</option>
                        <option value="opted_out">Não contatar</option>
                      </select>
                    </td>
                    <td>
                      <div className="flex justify-end"><StudentPrivacyActions compact student={student} processing={processingId === student.id} onExport={exportData} onAnonymize={anonymize} /></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > pageSize && <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:px-5"><span className="text-xs font-semibold text-slate-500">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} de {filtered.length} alunos</span><div className="flex w-full items-center justify-between gap-2 sm:w-auto"><Button type="button" variant="secondary" className="px-2 text-xs" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</Button><span className="text-xs font-semibold text-slate-500">Página {currentPage} de {totalPages}</span><Button type="button" variant="secondary" className="px-2 text-xs" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Próxima</Button></div></div>}
          </>
        )}
      </CardContent>
      </Card>
    </div>
  );
}

function StudentPrivacyActions({ student, processing, compact = false, onExport, onAnonymize }: { student: Student; processing: boolean; compact?: boolean; onExport: (student: Student) => Promise<void>; onAnonymize: (student: Student) => Promise<void> }) {
  return (
    <details className={`group relative ${compact ? '' : 'self-end'}`}>
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
        <MoreHorizontal className="h-4 w-4" />{compact ? <span className="sr-only">Ações de privacidade</span> : 'Dados e privacidade'}
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
        <button type="button" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50" disabled={processing} onClick={() => void onExport(student)}><Download className="h-4 w-4" />Exportar dados</button>
        {!student.anonymized_at && <button type="button" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50" disabled={processing} onClick={() => void onAnonymize(student)}><ShieldOff className="h-4 w-4" />Anonimizar aluno</button>}
      </div>
    </details>
  );
}
