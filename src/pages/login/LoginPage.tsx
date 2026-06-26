import { FormEvent, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { api } from '../../features/api/endpoints';
import { setToken } from '../../features/api/client';
import { ErrorState } from '../../components/common/State';

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.login(email, password);
      setToken(response.access_token);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
        <div className="mb-7 text-center">
          <img src="/engagefit-logo-cropped.png" alt="EngageFit" className="mx-auto h-auto w-44" />
          <p className="mt-3 text-sm text-slate-500">Acesse seu dashboard</p>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          {error && <ErrorState message={error} />}
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Senha</label>
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>
          <Button className="w-full" disabled={loading}>
            {loading ? 'Entrando' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
