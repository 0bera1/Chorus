import { API_URL } from './config';
import { T } from './strings';

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT';
  body?: unknown;
  /** Host uç noktaları için x-host-key başlığı */
  hostKey?: string;
}

/** REST çağrısı. Sunucunun { error: { code, message } } biçimini ApiError'a çevirir. */
export async function api<T>(path: string, { method = 'GET', body, hostKey }: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(hostKey ? { 'x-host-key': hostKey } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('network', T.errors.offline, 0);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      data?.error?.code ?? 'generic',
      data?.error?.message ?? T.errors.generic,
      res.status,
      data?.error?.details,
    );
  }
  return data as T;
}
