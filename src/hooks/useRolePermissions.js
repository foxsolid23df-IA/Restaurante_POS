import { useAuthStore } from '@/store/authStore'

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  WAITER: 'waiter'
}

export const hasPermission = (profile, permission, fallbackRoles = []) => {
  if (!profile) return false
  if (!permission) return true

  if (fallbackRoles.includes(profile.role)) return true

  if (profile.permissions && Object.prototype.hasOwnProperty.call(profile.permissions, permission)) {
    return Boolean(profile.permissions[permission])
  }

  return false
}

export function useRolePermissions() {
  const { profile } = useAuthStore()
  const role = profile?.role || 'guest'

  const permissions = {
    isAdmin: role === ROLES.ADMIN,
    isManager: role === ROLES.MANAGER,
    isCashier: role === ROLES.CASHIER,
    isWaiter: role === ROLES.WAITER,

    canViewAdminPanel: hasPermission(profile, 'access_admin', [ROLES.ADMIN, ROLES.MANAGER]),
    canViewDashboard: hasPermission(profile, 'access_admin', [ROLES.ADMIN, ROLES.MANAGER]),
    canViewInventory: hasPermission(profile, 'manage_inventory', [ROLES.ADMIN, ROLES.MANAGER]),
    canViewReports: hasPermission(profile, 'view_reports', [ROLES.ADMIN, ROLES.MANAGER]),
    canViewSettings: hasPermission(profile, 'access_admin', [ROLES.ADMIN]),

    canEditTableLayout: [ROLES.ADMIN, ROLES.MANAGER].includes(role),
    canManageAllTables: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER].includes(role),

    canCreateOrder: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.WAITER].includes(role),
    canAddItems: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.WAITER].includes(role),
    canDeleteItems: [ROLES.ADMIN, ROLES.MANAGER].includes(role),
    canVoidOrder: [ROLES.ADMIN, ROLES.MANAGER].includes(role),

    canCheckout: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER].includes(role),
    canViewCashClosing: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER].includes(role),
    canProcessRefund: [ROLES.ADMIN, ROLES.MANAGER].includes(role),

    canManageCatalog: [ROLES.ADMIN, ROLES.MANAGER].includes(role),
    canManageStaff: hasPermission(profile, 'manage_staff', [ROLES.ADMIN])
  }

  return {
    role,
    ...permissions
  }
}
