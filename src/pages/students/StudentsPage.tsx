import { useEffect, useMemo, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/State';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { api } from '../../features/api/endpoints';
import type { Student } from '../../features/api/types';

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .students()
      .then(setStudents)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar alunos'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return students.filter((student) => [student.name, student.email, student.phone].join(' ').toLowerCase().includes(query));
  }, [students, search]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-950">Alunos</h1>
          <p className="text-sm text-slate-500">{students.length} alunos importados</p>
        </div>
        <Input className="sm:max-w-xs" placeholder="Buscar aluno" value={search} onChange={(event) => setSearch(event.target.value)} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : filtered.length === 0 ? (
          <EmptyState message="Nenhum aluno encontrado" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((student) => (
                  <tr key={student.id}>
                    <td className="py-3 font-semibold text-slate-950">{student.name}</td>
                    <td className="text-slate-600">{student.email}</td>
                    <td className="text-slate-600">{student.phone}</td>
                    <td><StatusBadge value={student.source} label={student.source} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
