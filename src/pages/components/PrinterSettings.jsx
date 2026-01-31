import { useState, useEffect } from 'react'
import { usePrinters } from '@/hooks/usePrinters'
import { Printer, Plus, Trash2, Wifi, Usb, Save, AlertCircle } from 'lucide-react'

export default function PrinterSettings() {
  const { getPrinters, savePrinter, deletePrinter, loading } = usePrinters()
  const [printers, setPrinters] = useState([])
  const [editingPrinter, setEditingPrinter] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const loadPrinters = async () => {
    const data = await getPrinters()
    setPrinters(data)
  }

  useEffect(() => {
    loadPrinters()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const printer = {
      id: editingPrinter?.id,
      name: formData.get('name'),
      connection_type: formData.get('connection_type'),
      ip_address: formData.get('ip_address'),
      port: parseInt(formData.get('port')) || 9100
    }

    try {
      await savePrinter(printer)
      setShowModal(false)
      setEditingPrinter(null)
      loadPrinters()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta configuración de impresora?')) return
    try {
      await deletePrinter(id)
      loadPrinters()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 mt-10">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <Printer className="text-blue-600" />
          Hardware de Impresión
        </h3>
        <button 
          onClick={() => { setEditingPrinter(null); setShowModal(true); }}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
        >
          <Plus size={18} />
          Nueva Impresora
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {printers.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
             <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
             <p className="text-slate-500 font-bold">No hay impresoras configuradas</p>
             <p className="text-slate-400 text-xs mt-1">Agrega una para empezar a imprimir comandas</p>
          </div>
        ) : (
          printers.map(printer => (
            <div key={printer.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group hover:border-blue-200 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  {printer.connection_type === 'network' ? <Wifi size={20} className="text-blue-600" /> : <Usb size={20} className="text-slate-400" />}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                   <button onClick={() => { setEditingPrinter(printer); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Save size={16} /></button>
                   <button onClick={() => handleDelete(printer.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>
              <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">{printer.name}</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {printer.connection_type === 'network' ? `IP: ${printer.ip_address}:${printer.port}` : 'USB / Local'}
              </p>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">
              {editingPrinter ? 'Editar Impresora' : 'Nueva Impresora'}
            </h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2">Nombre de la Impresora</label>
                <input 
                  name="name"
                  type="text" 
                  required
                  defaultValue={editingPrinter?.name}
                  placeholder="Ej: Cocina Caliente"
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 outline-none ring-2 ring-transparent focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2">Tipo de Conexión</label>
                <select 
                  name="connection_type"
                  defaultValue={editingPrinter?.connection_type || 'network'}
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 outline-none ring-2 ring-transparent focus:ring-blue-500/20 transition-all appearance-none"
                >
                  <option value="network">Red (IP / Ethernet)</option>
                  <option value="usb">USB (Local Bridge)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2">Dirección IP</label>
                  <input 
                    name="ip_address"
                    type="text" 
                    defaultValue={editingPrinter?.ip_address}
                    placeholder="192.168.1.XX"
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 outline-none ring-2 ring-transparent focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2">Puerto</label>
                  <input 
                    name="port"
                    type="number" 
                    defaultValue={editingPrinter?.port || 9100}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 outline-none ring-2 ring-transparent focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all uppercase"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 uppercase"
                >
                  {editingPrinter ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
