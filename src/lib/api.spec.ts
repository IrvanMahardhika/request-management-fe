import { describe, expect, it, vi, beforeEach } from 'vitest'
import { api, ApiError } from '@/lib/api'
import * as auth from '@/lib/auth'

describe('api', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('location', { href: '' })
  })

  it('sends JSON requests with auth header when token exists', async () => {
    auth.setSession('secret', {
      id: '1',
      email: 'a@b.com',
      fullName: 'A',
      status: 'active',
      role: { id: 'r', code: 'staff_member', name: 'Staff', organizationScope: 'site' },
      scopeType: 'site',
      countryId: null,
      territoryId: null,
      siteId: null,
      country: null,
      territory: null,
      site: null,
      permissions: [],
    })

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    } as Response)

    const result = await api<{ ok: boolean }>('/requests', {
      method: 'POST',
      json: { title: 'Test' },
    })

    expect(result).toEqual({ ok: true })
    expect(fetch).toHaveBeenCalledWith('/requests', expect.objectContaining({ method: 'POST' }))
    const [, options] = vi.mocked(fetch).mock.calls[0]!
    const headers = options!.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer secret')
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('throws ApiError with server message on failure', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ error: 'Invalid payload' }),
    } as Response)

    await expect(api('/requests')).rejects.toEqual(
      new ApiError(400, 'Invalid payload'),
    )
  })

  it('clears session and redirects on 401 for protected routes', async () => {
    auth.setSession('expired', {
      id: '1',
      email: 'a@b.com',
      fullName: 'A',
      status: 'active',
      role: { id: 'r', code: 'staff_member', name: 'Staff', organizationScope: 'site' },
      scopeType: 'site',
      countryId: null,
      territoryId: null,
      siteId: null,
      country: null,
      territory: null,
      site: null,
      permissions: [],
    })

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({}),
    } as Response)

    await expect(api('/requests')).rejects.toBeInstanceOf(ApiError)
    expect(auth.getToken()).toBeNull()
    expect(location.href).toBe('/login')
  })

  it('does not redirect on 401 for login route', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ error: 'Bad credentials' }),
    } as Response)

    await expect(api('/auth/login', { method: 'POST', json: {} })).rejects.toBeInstanceOf(ApiError)
    expect(location.href).toBe('')
  })
})
