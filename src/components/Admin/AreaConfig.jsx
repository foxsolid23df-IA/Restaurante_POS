import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { updateCategoryPrinterDestinations, PRINTER_DESTINATIONS } from '@/lib/orderHelpers'

export default function AreaConfig() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateCategoryDestination = async (categoryId, destination) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ printer_destination: destination })
        .eq('id', categoryId)

      if (error) throw error
      
      // Actualizar estado local
      setCategories(prev => 
        prev.map(cat => 
          cat.id === categoryId 
            ? { ...cat, printer_destination: destination }
            : cat
        )
      )
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  const autoConfigure = async () => {
    setUpdating(true)
    await updateCategoryPrinterDestinations(supabase)
    await fetchCategories()
    setUpdating(false)
  }

  const getDestinationColor = (destination) => {
    switch (destination) {
      case PRINTER_DESTINATIONS.KITCHEN:
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case PRINTER_DESTINATIONS.BAR:
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case PRINTER_DESTINATIONS.SUSHI_BAR:
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case PRINTER_DESTINATIONS.GRILL:
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getDestinationLabel = (destination) => {
    switch (destination) {
      case PRINTER_DESTINATIONS.KITCHEN:
        return 'Cocina'
      case PRINTER_DESTINATIONS.BAR:
        return 'Bar'
      case PRINTER_DESTINATIONS.SUSHI_BAR:
        return 'Barra de Sushi'
      case PRINTER_DESTINATIONS.GRILL:
        return 'Parrilla'
      default:
        return 'Sin asignar'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuración de Áreas</h2>
        <p className="text-gray-600">
          Define a qué área (cocina, bar, etc.) se enviarán las comandas de cada categoría.
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={autoConfigure}
          disabled={updating}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updating ? 'Configurando...' : 'Auto-configurar categorías'}
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Asigna automáticamente áreas según el nombre de la categoría
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Área de impresión
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {category.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getDestinationColor(category.printer_destination)}`}>
                    {getDestinationLabel(category.printer_destination)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <select
                    value={category.printer_destination || ''}
                    onChange={(e) => updateCategoryDestination(category.id, e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Seleccionar área</option>
                    <option value={PRINTER_DESTINATIONS.KITCHEN}>Cocina</option>
                    <option value={PRINTER_DESTINATIONS.BAR}>Bar</option>
                    <option value={PRINTER_DESTINATIONS.SUSHI_BAR}>Barra de Sushi</option>
                    <option value={PRINTER_DESTINATIONS.GRILL}>Parrilla</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Cómo funciona:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Cocina:</strong> Platos principales, entradas, postres</li>
          <li>• <strong>Bar:</strong> Bebidas, cócteles, refrescos</li>
          <li>• <strong>Barra de Sushi:</strong> Rolls, sashimi, tempuras</li>
          <li>• <strong>Parrilla:</strong> Carnes asadas, brochetas</li>
        </ul>
      </div>
    </div>
  )
}