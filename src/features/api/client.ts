const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const CSRF_COOKIE_NAME = import.meta.env.VITE_CSRF_COOKIE_NAME ?? 'engagefit_session_csrf';

function csrfToken() {
  const prefix = `${encodeURIComponent(CSRF_COOKIE_NAME)}=`;
  const cookie = document.cookie.split('; ').find((item) => item.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : '';
}

type RequestOptions = RequestInit & {
  auth?: boolean;
};

export class ApiError extends Error {
  constructor(public readonly code: string, message: string, public readonly requestId: string) {
    super(requestId ? `${message} (suporte: ${requestId})` : message);
    this.name = 'ApiError';
  }
}

function responseError(payload: unknown, response: Response) {
  const body = typeof payload === 'object' && payload ? payload as Record<string, unknown> : {};
  const message = typeof body.message === 'string' ? body.message : 'Erro na requisição';
  const code = typeof body.code === 'string' ? body.code : 'request_failed';
  const requestId = typeof body.request_id === 'string' ? body.request_id : response.headers.get('x-request-id') ?? '';
  return new ApiError(code, message, requestId);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const method = (options.method ?? 'GET').toUpperCase();
  if (options.auth !== false && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = csrfToken();
    if (csrf) headers.set('X-CSRF-Token', csrf);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw responseError(payload, response);
  }

  return payload as T;
}

export async function apiDownload(path: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}${path}`, { credentials: 'include' });
  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? '';
    const payload = contentType.includes('application/json') ? await response.json() : undefined;
    throw responseError(payload, response);
  }

  return response.blob();
}
