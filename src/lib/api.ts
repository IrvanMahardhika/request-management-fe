import { clearSession, getToken } from '@/lib/auth'

// Empty string uses Vite dev-server proxy (see vite.config.ts); set VITE_API_BASE_URL for direct API calls.
const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function api<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const headers = new Headers(options.headers || {})
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
  })

  if (res.status === 401) {
    clearSession()
    if (!path.startsWith('/auth/login')) {
      window.location.href = '/login'
    }
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(res.status, data.error || res.statusText || 'Request failed')
  }
  return data as T
}
