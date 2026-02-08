import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useEffect, Suspense } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Toaster } from 'sonner'
import AdminLayout from '@/components/Layout/AdminLayout'
import POSLayout from '@/components/Layout/POSLayout'
import Login from '@/pages/Login'
import PINLogin from '@/pages/PINLogin'
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
import { useBranchStore } from '@/store/branchStore'
import Branches from '@/pages/admin/Branches'
import SplitBill from '@/pages/SplitBill'
import SalonLayout from '@/pages/admin/SalonLayout'

// Protected Route wrapper
function ProtectedRoute({ allowedRoles }) {
  const { user, profile, loading } = useAuthStore()
  const { initializeBranch } = useBranchStore()

  useEffect(() => {
    if (profile) {
      initializeBranch(profile)
    }
  }, [profile, initializeBranch])

  if (loading) return null

  if (!user && !profile) {
    return <Navigate to="/pin-login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    if (window.location.pathname === '/pos' || window.location.pathname === '/pos/') return null;
    return <Navigate to="/pos" replace />
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

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Suspense fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] font-sans">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary/10 border-t-secondary mb-6" />
          <p className="font-black text-primary tracking-[0.3em] text-[10px] uppercase animate-pulse">Restaurante Elite</p>
        </div>
      }>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/pin-login" element={<PINLogin />} />
          
          {/* Admin Portal */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
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
            </Route>
          </Route>

          {/* POS Portal */}
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

          {/* Global Redirects */}
          <Route path="/" element={<Navigate to="/pos" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
