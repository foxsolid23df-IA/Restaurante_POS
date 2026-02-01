import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { updateCategoryPrinterDestinations } from '@/lib/orderHelpers'
import { useBranchStore } from '@/store/branchStore'
import { toast } from 'sonner'
import { Printer, Wand2, Loader2, AlertCircle } from 'lucide-react'

export default function AreaConfig() {
  const [categories, setCategories] = useState([])
  const [printers, setPrinters] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const { currentBranch } = useBranchStore()

  useEffect(() => {
    if (currentBranch?.id) {
       loadData()
    }
  }, [currentBranch])

  const loadData = async () => {
    setLoading(true)
    try {
      const [catsRes, printersRes] = await Promise.all([
        supabase.from('categories').select('*, printers(name)').order('name'),
        supabase.from('printers').select('*').eq('branch_id', currentBranch.id).order('name')
      ])

      if (catsRes.error) throw catsRes.error
      if (printersRes.error) throw printersRes.error

      setCategories(catsRes.data || [])
      setPrinters(printersRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar zonas de producción')
    } finally {
      setLoading(false)
    }
  }

  const updateCategoryPrinter = async (categoryId, printerId) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ printer_id: printerId || null })
        .eq('id', categoryId)

      if (error) throw error
      
      const printerName = printers.find(p => p.id === printerId)?.name || 'Sin asignar'
      toast.success(`Categoría actualizada a: ${printerName}`)
      
      // Actualizar estado local
      setCategories(prev => 
        prev.map(cat => 
          cat.id === categoryId 
            ? { ...cat, printer_id: printerId, printers: printerId ? { name: printerName } : null }
            : cat
        )
      )
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Error al actualizar impresora')
    }
  }

  const handleAutoConfigure = async () => {
    if (printers.length === 0) {
       toast.error('No hay impresoras configuradas', {
          description: 'Cree primero las zonas de producción en la sección de Configuración.'
       })
       return
    }

    setUpdating(true)
    const result = await updateCategoryPrinterDestinations(supabase, currentBranch.id)
    
    if (result.error) {
       toast.error(result.error)
    } else {
       toast.success(`Auto-configuración completa`, {
          description: `Se actualizaron ${result.count} categorías.`
       })
       loadData()
    }
    setUpdating(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando Zonas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
        <div className="flex-1">
          <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase italic tracking-tight">Auto-Configuración Inteligente</h2>
          <p className="text-slate-500 font-medium text-sm max-w-xl">
            El sistema analizará los nombres de tus categorías y las asignará a la zona de producción más lógica (Cocina, Bar, Sushi, etc).
          </p>
        </div>
        <button
          onClick={handleAutoConfigure}
          disabled={updating}
          className="bg-primary text-white px-8 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-200 flex items-center gap-3 disabled:opacity-50"
        >
          {updating ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
          {updating ? 'Procesando...' : 'Auto-Configurar Categorías'}
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Categoría</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Zona Actual</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right">Asignar Área</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <span className="font-black text-slate-900 uppercase tracking-tight">{category.name}</span>
                </td>
                <td className="px-8 py-6">
                  {category.printers ? (
                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 w-fit uppercase tracking-widest">
                       <Printer size={12} />
                       {category.printers.name}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 w-fit uppercase tracking-widest italic">
                       Sin asignar
                    </div>
                  )}
                </td>
                <td className="px-8 py-6 text-right">
                  <select
                    value={category.printer_id || ''}
                    onChange={(e) => updateCategoryPrinter(category.id, e.target.value)}
                    className="bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-xs text-slate-900 outline-none focus:border-primary transition-all cursor-pointer min-w-[200px]"
                  >
                    <option value="">Seleccionar zona...</option>
                    {printers.map(printer => (
                       <option key={printer.id} value={printer.id}>{printer.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-[2rem] p-8 flex gap-6 items-start">
         <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
            <AlertCircle size={24} />
         </div>
         <div className="space-y-2">
            <h3 className="font-black text-blue-900 uppercase tracking-tight text-sm leading-none">Reglas de Asignación Automática:</h3>
            <ul className="text-blue-700/70 text-xs font-bold space-y-2 pt-2 uppercase tracking-wide">
              <li>• 🍖 <strong className="text-blue-900">Parrilla/Asador:</strong> Carnes, steak, parrilla, brochetas.</li>
              <li>• 🍣 <strong className="text-blue-900">Barra de Sushi:</strong> Rollos, sashimi, tempuras, sushi.</li>
              <li>• 🍹 <strong className="text-blue-900">Bar/Bebidas:</strong> Refrescos, cervezas, cocteles, licores.</li>
              <li>• 🍳 <strong className="text-blue-900">Cocina Central:</strong> Todo lo demás se asigna a zona de cocina.</li>
            </ul>
         </div>
      </div>
    </div>
  )
}