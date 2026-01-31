import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { BarLoader } from 'react-spinners'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Lazy loading de componentes para code splitting
const POS = lazy(() => import('@/pages/POS'))
const KitchenOrders = lazy(() => import('@/pages/KitchenOrders'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Products = lazy(() => import('@/pages/Products'))
const Inventory = lazy(() => import('@/pages/Inventory'))
const Tables = lazy(() => import('@/pages/Tables'))
const Users = lazy(() => import('@/pages/Users'))
const DailyClosing = lazy(() => import('@/pages/DailyClosing'))
const Reports = lazy(() => import('@/pages/reports/SalesReports'))
const ProductReports = lazy(() => import('@/pages/reports/ProductReports'))
const RecipeBuilder = lazy(() => import('@/pages/RecipeBuilder'))
const Login = lazy(() => import('@/pages/Login'))
const PINLogin = lazy(() => import('@/pages/PINLogin'))

// Componente de carga optimizado para POS
const POSFallback = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <BarLoader color="#3b82f6" height={8} width={200} />
      <p className="text-white mt-4 text-lg">Cargando Sistema POS...</p>
    </div>
  </div>
)

// Fallback genérico
const GenericFallback = () => (
  <LoadingSpinner size="lg" message="Cargando..." />
)

// Router con lazy loading y preloading optimizado
const createOptimizedRouter = () => {
  return createBrowserRouter([
    {
      path: '/',
      element: <Login />,
      errorElement: <ErrorBoundary />
    },
    {
      path: '/pos',
      element: (
        <ProtectedRoute>
          <Suspense fallback={<POSFallback />}>
            <POS />
          </Suspense>
        </ProtectedRoute>
      ),
      errorElement: <ErrorBoundary />
    },
    {
      path: '/kitchen',
      element: (
        <ProtectedRoute requiredRole="kitchen">
          <Suspense fallback={<GenericFallback />}>
            <KitchenOrders />
          </Suspense>
        </ProtectedRoute>
      ),
      errorElement: <ErrorBoundary />
    },
    {
      path: '/dashboard',
      element: (
        <ProtectedRoute requiredRole="admin">
          <Suspense fallback={<GenericFallback />}>
            <Dashboard />
          </Suspense>
        </ProtectedRoute>
      ),
      errorElement: <ErrorBoundary />,
      children: [
        {
          path: 'products',
          element: (
            <Suspense fallback={<GenericFallback />}>
              <Products />
            </Suspense>
          )
        },
        {
          path: 'inventory',
          element: (
            <Suspense fallback={<GenericFallback />}>
              <Inventory />
            </Suspense>
          )
        },
        {
          path: 'tables',
          element: (
            <Suspense fallback={<GenericFallback />}>
              <Tables />
            </Suspense>
          )
        },
        {
          path: 'users',
          element: (
            <Suspense fallback={<GenericFallback />}>
              <Users />
            </Suspense>
          )
        },
        {
          path: 'closing',
          element: (
            <Suspense fallback={<GenericFallback />}>
              <DailyClosing />
            </Suspense>
          )
        },
        {
          path: 'reports',
          element: (
            <Suspense fallback={<GenericFallback />}>
              <Reports />
            </Suspense>
          ),
          children: [
            {
              path: 'products',
              element: (
                <Suspense fallback={<GenericFallback />}>
                  <ProductReports />
                </Suspense>
              )
            }
          ]
        },
        {
          path: 'recipes',
          element: (
            <Suspense fallback={<GenericFallback />}>
              <RecipeBuilder />
            </Suspense>
          )
        }
      ]
    },
    {
      path: '/pin-login',
      element: (
        <Suspense fallback={<GenericFallback />}>
          <PINLogin />
        </Suspense>
      )
    }
  ])
}

export const AppRouter = () => {
  return <RouterProvider router={createOptimizedRouter()} />
}

// Prefetching estratégico de chunks críticos
export const prefetchCriticalChunks = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Pre-cargar chunks críticos para POS
      import('@/pages/POS')
      import('@/pages/KitchenOrders')
    })
  }
}

export default AppRouter