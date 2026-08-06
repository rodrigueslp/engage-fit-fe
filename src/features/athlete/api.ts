import type { AthleteInvitation, AthletePersonalRecord, AthleteProfile, AthleteWorkout, AthleteWorkoutInsight, AthleteWorkoutResult, SaveAthleteResult } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function athleteCSRFToken() {
  const prefix = `${encodeURIComponent('engagefit_athlete_csrf')}=`;
  const cookie = document.cookie.split('; ').find((item) => item.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : '';
}

async function athleteRequest<T>(path: string, options: RequestInit = {}, csrf = false): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (csrf) {
    const token = athleteCSRFToken();
    if (token) headers.set('X-CSRF-Token', token);
  }
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, credentials: 'include' });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof body.message === 'string' ? body.message : 'Não foi possível concluir. Tente novamente.');
  return body as T;
}

export const athleteApi = {
  invitation: (token: string) => athleteRequest<AthleteInvitation>(`/api/v1/athlete/invitations/${encodeURIComponent(token)}`),
  claim: (token: string, payload: { name: string; email: string; password: string }) => athleteRequest<AthleteProfile>(`/api/v1/athlete/invitations/${encodeURIComponent(token)}/claim`, { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: { email: string; password: string }) => athleteRequest<AthleteProfile>('/api/v1/athlete/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => athleteRequest<AthleteProfile>('/api/v1/athlete/me'),
  workouts: () => athleteRequest<AthleteWorkout[]>('/api/v1/athlete/workouts'),
  saveResult: (workoutId: string, payload: SaveAthleteResult) => athleteRequest<{ result: AthleteWorkoutResult; possible_records: AthletePersonalRecord[] }>(`/api/v1/athlete/workouts/${workoutId}/result`, { method: 'PUT', body: JSON.stringify(payload) }, true),
  explainWorkout: (workoutId: string) => athleteRequest<AthleteWorkoutInsight>(`/api/v1/athlete/workouts/${workoutId}/explanation`, { method: 'POST' }, true),
  results: () => athleteRequest<AthleteWorkoutResult[]>('/api/v1/athlete/results'),
  personalRecords: () => athleteRequest<AthletePersonalRecord[]>('/api/v1/athlete/personal-records'),
  confirmPersonalRecord: (id: string) => athleteRequest<void>(`/api/v1/athlete/personal-records/${id}/confirm`, { method: 'POST' }, true),
  requestPasswordReset: (email: string) => athleteRequest<void>('/api/v1/athlete/auth/password-reset', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) => athleteRequest<void>(`/api/v1/athlete/auth/password-reset/${encodeURIComponent(token)}`, { method: 'POST', body: JSON.stringify({ password }) }),
  requestEmailVerification: () => athleteRequest<void>('/api/v1/athlete/auth/verify-email', { method: 'POST' }, true),
  verifyEmail: (token: string) => athleteRequest<void>(`/api/v1/athlete/auth/verify-email/${encodeURIComponent(token)}`, { method: 'POST' }),
  logout: () => athleteRequest<void>('/api/v1/athlete/auth/logout', { method: 'POST' }, true),
};
