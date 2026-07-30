import { vi } from 'vitest'
import type { PublicUser } from '@/types'

export function createMockUser(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    id: 'user-1',
    email: 'staff1@example.com',
    fullName: 'Staff One',
    status: 'active',
    role: {
      id: 'role-1',
      code: 'staff_member',
      name: 'Staff Member',
      organizationScope: 'site',
    },
    scopeType: 'site',
    countryId: 'country-1',
    territoryId: 'territory-1',
    siteId: 'site-1',
    country: { id: 'country-1', name: 'Country A', code: 'CA' },
    territory: { id: 'territory-1', name: 'Territory East', countryId: 'country-1' },
    site: { id: 'site-1', name: 'Site Alpha', territoryId: 'territory-1' },
    permissions: ['submit_standard_priority_request', 'view_request_history'],
    ...overrides,
  }
}

export function mockFetchJson(data: unknown, init: Partial<Response> = {}) {
  return vi.fn().mockResolvedValue({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? 'OK',
    json: () => Promise.resolve(data),
  } as Response)
}
