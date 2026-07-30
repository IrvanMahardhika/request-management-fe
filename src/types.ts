export type PermissionCode =
  | 'view_user'
  | 'create_user'
  | 'deactivate_user'
  | 'assign_role'
  | 'assign_organization_scope'
  | 'view_request_history'
  | 'platform_reporting'
  | 'country_reporting'
  | 'territory_reporting'
  | 'site_reporting'
  | 'approve_standard_priority_request'
  | 'decline_standard_priority_request'
  | 'view_standard_priority_request'
  | 'request_info_on_standard_priority_request'
  | 'submit_standard_priority_request'
  | 'submit_standard_priority_request_on_behalf_of_the_staff'
  | 'approve_high_priority_request'
  | 'decline_high_priority_request'
  | 'view_high_priority_request'
  | 'request_info_on_high_priority_request'
  | 'escalate_request_to_territory_manager'
  | 'escalate_request_to_country_ops_manager'
  | 'resolve_request'

export type RoleCode =
  | 'platform_admin'
  | 'country_ops_manager'
  | 'territory_manager'
  | 'site_manager'
  | 'staff_member'

export interface PublicUser {
  id: string
  email: string
  fullName: string
  status: 'active' | 'inactive'
  role: {
    id: string
    code: RoleCode
    name: string
    organizationScope: string
  }
  scopeType: string
  countryId: string | null
  territoryId: string | null
  siteId: string | null
  country: { id: string; name: string; code: string } | null
  territory: { id: string; name: string; countryId: string } | null
  site: { id: string; name: string; territoryId: string } | null
  permissions: PermissionCode[]
}

export interface OperationalRequest {
  id: string
  type: string
  title: string
  description: string
  priority: 'standard' | 'high'
  status: string
  requestingUserId: string
  requestingUser?: {
    id: string
    fullName: string
    email: string
    status: string
  }
  siteId: string
  site?: {
    id: string
    name: string
    territoryId: string
    territory?: {
      id: string
      name: string
      countryId: string
      country?: { id: string; name: string; code: string }
    }
  }
  declineReason?: string | null
  resolutionNote?: string | null
  decidedByUserId?: string | null
  decidedAt?: string | null
  resolvedByUserId?: string | null
  resolvedAt?: string | null
  version: number
  createdAt: string
  updatedAt: string
  ageInDays: number
}
