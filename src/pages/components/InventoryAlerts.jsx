import React, { useState, useEffect } from 'react'
import { useInventoryIntegration } from '@/hooks/useInventoryIntegration'
import { AlertTriangle, X, Package, TrendingDown } from 'lucide-react'

const InventoryAlerts = () => {
  const [showAlerts, setShowAlerts] = useState(false)
  const { alerts, getActiveAlerts, resolveAlert, loading } = useInventoryIntegration()
  const [localAlerts, setLocalAlerts] = useState([])

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const activeAlerts = await getActiveAlerts()
        setLocalAlerts(activeAlerts)
      } catch (error) {
        console.error('Error loading alerts:', error)
      }
    }

    loadAlerts()
    
    // Actualizar alertas cada 30 segundos
    const interval = setInterval(loadAlerts, 30000)
    return () => clearInterval(interval)
  }, [getActiveAlerts])

  const criticalAlerts = localAlerts.filter(alert => alert.severity === 'critical')
  const lowAlerts = localAlerts.filter(alert => alert.severity === 'low')

  const handleResolveAlert = async (alertId) => {
    try {
      await resolveAlert(alertId)
      setLocalAlerts(prev => prev.filter(alert => alert.id !== alertId))
    } catch (error) {
      console.error('Error resolving alert:', error)
      alert('Error al resolver alerta')
    }
  }

  const getAlertIcon = (severity) => {
    return severity === 'critical' ? TrendingDown : AlertTriangle
  }

  const getAlertColor = (severity) => {
    return severity === 'critical' 
      ? 'bg-red-100 border-red-200 text-red-800'
      : 'bg-yellow-100 border-yellow-200 text-yellow-800'
  }

  if (localAlerts.length === 0) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-100 border border-green-200 text-green-800 px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          <span className="text-sm font-medium">Inventario OK</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Alert Summary */}
      {!showAlerts && (
        <button
          onClick={() => setShowAlerts(true)}
          className="bg-orange-100 border border-orange-200 text-orange-800 px-4 py-2 rounded-lg shadow-lg hover:bg-orange-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {criticalAlerts.length > 0 && '⚠️ '}
              {localAlerts.length} Alerta{localAlerts.length !== 1 ? 's' : ''} de Inventario
            </span>
          </div>
        </button>
      )}

      {/* Detailed Alerts */}
      {showAlerts && (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-96 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">
                Alertas de Inventario ({localAlerts.length})
              </h3>
            </div>
            <button
              onClick={() => setShowAlerts(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alerts List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-300 mx-auto mb-2"></div>
                Cargando alertas...
              </div>
            ) : localAlerts.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No hay alertas activas
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {criticalAlerts.map(alert => (
                  <div key={alert.id} className={`p-4 ${getAlertColor(alert.severity)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {React.createElement(getAlertIcon(alert.severity), { className: "w-5 h-5 mt-0.5" })}
                        <div>
                          <div className="font-medium">{alert.item_name}</div>
                          <div className="text-sm opacity-90">
                            Stock actual: {alert.current_stock} {alert.unit}
                          </div>
                          <div className="text-sm opacity-90">
                            Mínimo requerido: {alert.min_stock} {alert.unit}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded hover:bg-opacity-70 transition-colors"
                      >
                        Resolver
                      </button>
                    </div>
                  </div>
                ))}

                {lowAlerts.map(alert => (
                  <div key={alert.id} className={`p-4 ${getAlertColor(alert.severity)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {React.createElement(getAlertIcon(alert.severity), { className: "w-5 h-5 mt-0.5" })}
                        <div>
                          <div className="font-medium">{alert.item_name}</div>
                          <div className="text-sm opacity-90">
                            Stock bajo: {alert.current_stock} {alert.unit} (mín: {alert.min_stock})
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded hover:bg-opacity-70 transition-colors"
                      >
                        Resolver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {criticalAlerts.length} críticas, {lowAlerts.length} bajas
              </span>
              <button
                onClick={() => window.location.href = '/inventory'}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Gestionar Inventario →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryAlerts