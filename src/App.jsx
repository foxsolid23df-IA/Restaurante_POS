import { BrowserRouter, HashRouter, Routes, Route, Navigate, Outlet, useLocation, Link } from 'react-router-dom'
import { Component, useEffect, Suspense } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Toaster } from 'sonner'
import AdminLayout from '@/components/Layout/AdminLayout'
import POSLayout from '@/components/Layout/POSLayout'
import Login from '@/pages/Login'
import PINLogin from '@/pages/PINLogin'
import ActivateLicense from '@/pages/ActivateLicense'
import AdminDashboard from '@/pages/Dashboard'
import Inventory from '@/pages/admin/Inventory'
import Products from '@/pages/admin/Products'
import Categories from '@/pages/admin/Categories'
import RecipeBuilder from '@/pages/admin/RecipeBuilder'
import Tables from '@/pages/Tables'
import POS from '@/pages/POS'
import ActiveOrders from '@/pages/ActiveOrders'
import KitchenOrders from '@/pages/KitchenOrders'
import BarOrders from '@/pages/BarOrders'
import CashClosing from '@/pages/CashClosing'
import DailyClosing from '@/pages/DailyClosing'
import SalesReports from '@/pages/admin/reports/SalesReports'
import Users from '@/pages/admin/Users'
import CRM from '@/pages/admin/CRM'
import Reservations from '@/pages/Reservations'
import CustomerProfile from '@/pages/CustomerProfile'
import LoyaltyProgram from '@/pages/LoyaltyProgram'
import Delivery from '@/pages/Delivery'
import DeliveryOptimizer from '@/pages/DeliveryOptimizer'
import Purchases from '@/pages/admin/Purchases'
import Settings from '@/pages/admin/Settings'
import Licenses from '@/pages/admin/Licenses'
import { useBranchStore } from '@/store/branchStore'
import { useBusinessStore } from '@/hooks/useBusinessSettings'
import { Monitor } from 'lucide-react'
import Branches from '@/pages/admin/Branches'
import SplitBill from '@/pages/SplitBill'
import SalonLayout from '@/pages/admin/SalonLayout'
import CustomerMenu from '@/pages/public/CustomerMenu'
import { hasPermission } from '@/hooks/useRolePermissions'
import { isElectron } from '@/lib/electronBridge'
import OfflineStatusBar from '@/components/Electron/OfflineStatusBar'
import UpdateNotification from '@/components/Updates/UpdateNotification'
import ElectronSeedScreen from '@/components/Electron/ElectronSeedScreen'

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 max-w-lg text-center">
            <h1 className="text-xl font-black text-slate-950 mb-2">No se pudo cargar la aplicación</h1>
            <p className="text-sm text-slate-500 mb-5">
              Hubo un problema al iniciar. Recarga la página; si continúa, revisa que las migraciones de Supabase estén aplicadas.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-slate-950 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Recargar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Default landing path depending on environment
const getDefaultPath = () => (isElectron ? '/pos' : '/admin')

// Shown when a desktop-only route is accessed from the web
function DesktopOnly() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Monitor size={32} className="text-blue-600" />
        </div>
        <h1 className="text-xl font-black text-slate-950 mb-2">Solo disponible en app de escritorio</h1>
        <p className="text-sm text-slate-500 mb-6">
          El punto de venta, operaciones de venta y órdenes solo están disponibles en la aplicación de escritorio.
        </p>
        <Link
          to="/admin"
          className="inline-flex items-center justify-center gap-2 bg-slate-950 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          Ir al portal administrador
        </Link>
      </div>
    </div>
  )
}

// Protected Route wrapper
const adminRoutePermissions = [
  { prefix: '/admin/reports', permission: 'view_reports', fallbackRoles: ['admin', 'manager'] },
  { prefix: '/admin/inventory', permission: 'manage_inventory', fallbackRoles: ['admin', 'manager'] },
  { prefix: '/admin/purchases', permission: 'manage_inventory', fallbackRoles: ['admin', 'manager', 'cashier'] },
  { prefix: '/admin/staff', permission: 'manage_staff', fallbackRoles: ['admin'] },
  { prefix: '/admin/licenses', permission: 'manage_staff', fallbackRoles: ['admin'], requireEmail: 'admin@restaurante.com' },
  { prefix: '/admin/settings', permission: 'access_admin', fallbackRoles: ['admin'] },
  { prefix: '/admin/branches', permission: null, fallbackRoles: ['admin'] },
  { prefix: '/admin', permission: 'access_admin', fallbackRoles: ['admin', 'manager'] }
]

function routePermissionFor(pathname) {
  return adminRoutePermissions.find((entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`))
}

function ProtectedRoute({ allowedRoles, requireSession = false, useAdminPermissions = false }) {
  const { user, profile, loading } = useAuthStore()
  const { initializeBranch } = useBranchStore()
  const location = useLocation()

  useEffect(() => {
    if (profile) {
      initializeBranch(profile)
    }
  }, [profile, initializeBranch])

  if (loading) return null

  if (requireSession && !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!user && !profile) {
    return <Navigate to="/pin-login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    const defaultPath = getDefaultPath()
    if (window.location.pathname === defaultPath || window.location.pathname === `${defaultPath}/`) return null;
    return <Navigate to={defaultPath} replace />
  }

  if (location.pathname.startsWith('/pos') && !hasPermission(profile, 'access_pos', allowedRoles || [])) {
    return <Navigate to="/pin-login" replace />
  }

  if (useAdminPermissions) {
    const routeAccess = routePermissionFor(location.pathname)
    if (routeAccess) {
      const allowed = routeAccess.permission
        ? hasPermission(profile, routeAccess.permission, routeAccess.fallbackRoles)
        : routeAccess.fallbackRoles.includes(profile?.role)

      if (!allowed) {
        return <Navigate to={getDefaultPath()} replace />
      }

      if (routeAccess.requireEmail) {
        const userEmail = (user?.email || '').trim().toLowerCase()
        if (userEmail !== routeAccess.requireEmail.toLowerCase()) {
          return <Navigate to={getDefaultPath()} replace />
        }
      }
    }
  }

  return <Outlet />
}

function App() {
  const { initialize } = useAuthStore()
  const { fetchSettings } = useBusinessStore()

  useEffect(() => {
    initialize()
    fetchSettings()
  }, [initialize, fetchSettings])

  const Router = isElectron ? HashRouter : BrowserRouter

  return (
    <Router>
      <ElectronSeedScreen>
        <OfflineStatusBar />
        <Toaster position="top-center" richColors />
        <AppErrorBoundary>
          <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] font-sans">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary/10 border-t-secondary mb-6" />
              <p className="font-black text-primary tracking-[0.3em] text-[10px] uppercase animate-pulse">Restaurante Elite</p>
            </div>
          }>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/pin-login" element={<PINLogin />} />
              <Route path="/activate" element={<ActivateLicense />} />
              
              {/* Admin Portal */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} requireSession useAdminPermissions />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="reports" element={<SalesReports />} />
                  <Route path="catalog" element={<Products />} />
                  <Route path="catalog/categories" element={<Categories />} />
                  <Route path="catalog/:productId/recipe" element={<RecipeBuilder />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="staff" element={<Users />} />
                  <Route path="crm" element={<CRM />} />
                  <Route path="purchases" element={<Purchases />} />
                  <Route path="branches" element={<Branches />} />
                  <Route path="salon" element={<SalonLayout />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="licenses" element={<Licenses />} />
                </Route>
              </Route>

              {/* POS Portal — only available in the desktop app (.exe) */}
              {isElectron ? (
                <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'cashier', 'waiter']} />}>
                  <Route path="/pos" element={<POSLayout />}>
                    <Route index element={<Navigate to="/pos/tables" replace />} />
                    <Route path="tables" element={<Tables />} />
                    <Route path="orders" element={<POS />} />
                    <Route path="active-orders" element={<ActiveOrders />} />
                    <Route path="kitchen" element={<KitchenOrders />} />
                    <Route path="bar" element={<BarOrders />} />
                    <Route path="delivery" element={<Delivery />} />
                    <Route path="delivery-optimizer" element={<DeliveryOptimizer />} />
                    <Route path="reservations" element={<Reservations />} />
                    <Route path="cash-closing" element={<CashClosing />} />
                    <Route path="daily-closing" element={<DailyClosing />} />
                    <Route path="loyalty" element={<LoyaltyProgram />} />
                    <Route path="customer/:id" element={<CustomerProfile />} />
                    <Route path="split-bill/:tableId" element={<SplitBill />} />
                  </Route>
                </Route>
              ) : (
                <Route path="/pos/*" element={<Navigate to="/admin" replace />} />
              )}

              {/* Public customer menu — available on web and desktop */}
              <Route path="/menu/:tableId" element={<CustomerMenu />} />

              {/* Global Redirects */}
              <Route path="/" element={<Navigate to={isElectron ? '/pos' : '/admin'} replace />} />
              <Route path="*" element={<Navigate to={isElectron ? '/pos' : '/admin'} replace />} />
            </Routes>
          </Suspense>
        </AppErrorBoundary>
        <UpdateNotification />
      </ElectronSeedScreen>
    </Router>
  )
}

export default App
