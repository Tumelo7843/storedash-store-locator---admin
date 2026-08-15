import { auth } from '../lib/firebase';
import { env } from '../lib/env';

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

// No request here should be able to hang forever — a slow/unreachable API
// must not leave callers (most importantly AuthContext.loading, which gates
// what the user sees on launch) stuck indefinitely. 15s is generous for a
// normal request but bounded.
const REQUEST_TIMEOUT_MS = 15000;

export async function request<T>(path: string, options: RequestInit = {}, withAuth = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
    ...(withAuth ? await authHeaders() : {}),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${env.apiUrl}${path}`, { ...options, headers, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(0, 'TIMEOUT', 'The request took too long. Please check your connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    let body: any = {};
    try {
      body = await res.json();
    } catch {
      // non-JSON error response (e.g. gateway timeout HTML page)
    }
    throw new ApiError(res.status, body?.error?.code || 'UNKNOWN', body?.error?.message || `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export function toQuery<T extends object>(params: T): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  }
  const s = query.toString();
  return s ? `?${s}` : '';
}

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
