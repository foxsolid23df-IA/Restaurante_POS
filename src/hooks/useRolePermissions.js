
import { useAuthStore } from '@/store/authStore'

export const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    CASHIER: 'cashier',
    WAITER: 'waiter'
}

export function useRolePermissions() {
    const { profile } = useAuthStore()
    const role = profile?.role || 'guest'

    const permissions = {
        // General
        isAdmin: role === ROLES.ADMIN,
        isManager: role === ROLES.MANAGER,
        isCashier: role === ROLES.CASHIER,
        isWaiter: role === ROLES.WAITER,

        // Vistas
        canViewAdminPanel: [ROLES.ADMIN, ROLES.MANAGER].includes(role),
        canViewDashboard: [ROLES.ADMIN, ROLES.MANAGER].includes(role),
        canViewInventory: [ROLES.ADMIN, ROLES.MANAGER].includes(role),
        canViewReports: [ROLES.ADMIN, ROLES.MANAGER].includes(role),
        canViewSettings: [ROLES.ADMIN].includes(role),

        // POS / Tables Actions
        canEditTableLayout: [ROLES.ADMIN, ROLES.MANAGER].includes(role), // Drag & drop, create/delete tables
        canManageAllTables: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER].includes(role), // View all tables vs only assigned

        // Order Actions
        canCreateOrder: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.WAITER].includes(role),
        canAddItems: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.WAITER].includes(role),
        canDeleteItems: [ROLES.ADMIN, ROLES.MANAGER].includes(role), // Delete sent items
        canVoidOrder: [ROLES.ADMIN, ROLES.MANAGER].includes(role),

        // Payment / Cash
        canCheckout: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER].includes(role),
        canViewCashClosing: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER].includes(role),
        canProcessRefund: [ROLES.ADMIN, ROLES.MANAGER].includes(role),

        // Data
        canManageCatalog: [ROLES.ADMIN].includes(role),
        canManageStaff: [ROLES.ADMIN].includes(role),
    }

    return {
        role,
        ...permissions
    }
}
