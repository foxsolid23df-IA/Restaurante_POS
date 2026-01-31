import { useState, useEffect } from 'react'
import { usePrinters } from '@/hooks/usePrinters'
import { Printer, Plus, Trash2, Wifi, Usb, Save, AlertCircle, X, Loader2, Cpu } from 'lucide-react'
import { toast } from 'sonner'

export default function PrinterSettings() {
  const { getPrinters, savePrinter, deletePrinter, loading } = usePrinters()
  const [printers, setPrinters] = useState([])
  const [editingPrinter, setEditingPrinter] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const loadPrinters = async () => {
    try {
      const data = await getPrinters()
      setPrinters(data || [])
    } catch (error) {
       toast.error("Error al cargar hardware de impresión")
    }
  }

  useEffect(() => {
    loadPrinters()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setActionLoading(true)
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
      toast.success(editingPrinter ? "Hardware actualizado" : "Impresora registrada")
      setShowModal(false)
      setEditingPrinter(null)
      loadPrinters()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta configuración de impresora?')) return
    try {
      await deletePrinter(id)
      toast.success("Configuración eliminada")
      loadPrinters()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <section className="bg-white rounded-[3.5rem] p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 mt-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg">
              <Cpu size={24} />
            </div>
            Puertos de Impresión (Hardware)
          </h3>
          <p className="text-slate-500 font-medium text-xs uppercase tracking-widest mt-2 ml-14">Gestión de periféricos ESC/POS y Red</p>
        </div>
        <button 
          onClick={() => { setEditingPrinter(null); setShowModal(true); }}
          className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-3 hover:bg-black transition-all shadow-2xl shadow-slate-200 text-xs uppercase tracking-[0.2em] active:scale-95"
        >
          <Plus size={20} />
          Nueva Impresora
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {printers.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
             <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-inner">
                <Printer size={40} />
             </div>
             <h4 className="text-xl font-black text-slate-900 mb-2">Sin Periféricos Detéctados</h4>
             <p className="text-slate-400 font-medium text-xs uppercase tracking-widest">Configura una impresora térmica para comandas y cuentas</p>
          </div>
        ) : (
          printers.map(printer => {
            const isNetwork = printer.connection_type === 'network'
            return (
              <div key={printer.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 group hover:border-blue-500 shadow-sm hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                <div className={`absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-all scale-150 transform group-hover:-rotate-12 ${isNetwork ? 'text-blue-600' : 'text-slate-600'}`}>
                  <Printer size={100} />
                </div>
                
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className={`p-4 rounded-2xl border transition-all ${
                    isNetwork 
                      ? 'bg-blue-50 border-blue-100 text-blue-600' 
                      : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-800'
                  }`}>
                    {isNetwork ? <Wifi size={24} /> : <Usb size={24} />}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                     <button 
                        onClick={() => { setEditingPrinter(printer); setShowModal(true); }} 
                        className="p-3 bg-white text-blue-600 border border-blue-50 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                        title="Editar"
                     >
                        <Save size={14} />
                     </button>
                     <button 
                        onClick={() => handleDelete(printer.id)} 
                        className="p-3 bg-white text-rose-500 border border-rose-50 rounded-xl hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm"
                        title="Eliminar"
                     >
                        <Trash2 size={14} />
                     </button>
                  </div>
                </div>
                
                <div className="relative z-10">
                  <h4 className="font-black text-slate-900 text-xl uppercase tracking-tight group-hover:text-blue-600 transition-colors">{printer.name}</h4>
                  <div className="flex items-center gap-2 mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <div className={`w-2 h-2 rounded-full ${isNetwork ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                      {isNetwork ? `${printer.ip_address}:${printer.port}` : 'Bridge USB Local'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[110] p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] p-12 shadow-2xl w-full max-w-xl border border-white/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <Printer size={180} />
            </div>

            <div className="flex justify-between items-start mb-12 relative z-10">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                  {editingPrinter ? 'Reconfigurar Equipo' : 'Nuevo Dispositivo'}
                </h2>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-2 border-l-4 border-blue-600 pl-4 ml-1">Puerto de Red / Conexión ESC/POS</p>
              </div>
              <button 
                onClick={() => { setShowModal(false); setEditingPrinter(null); }}
                className="p-5 bg-slate-50 hover:bg-rose-50 rounded-full text-slate-400 hover:text-rose-600 transition-all shadow-inner"
              >
                <X size={28} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-5">Identificador de la Impresora</label>
                <input 
                  name="name"
                  type="text" 
                  required
                  defaultValue={editingPrinter?.name}
                  placeholder="Ej: Impresora Cocina Central"
                  className="w-full bg-slate-50 border border-slate-100 rounded-[2.5rem] px-8 py-5 text-lg font-black text-slate-900 focus:ring-8 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-5">Módem de Conexión</label>
                  <select 
                    name="connection_type"
                    defaultValue={editingPrinter?.connection_type || 'network'}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 font-black text-slate-900 outline-none focus:ring-8 focus:ring-blue-600/5 focus:border-blue-600 transition-all appearance-none cursor-pointer"
                  >
                    <option value="network">Ethernet / Wi-Fi (IP)</option>
                    <option value="usb">USB (Puente Local)</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-5">Puerto TCP</label>
                  <input 
                    name="port"
                    type="number" 
                    defaultValue={editingPrinter?.port || 9100}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 font-black text-slate-900 focus:ring-8 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-5">Dirección IP Estática (Fija en Router)</label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 flex gap-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                  </div>
                  <input 
                    name="ip_address"
                    type="text" 
                    defaultValue={editingPrinter?.ip_address}
                    placeholder="Ej: 192.168.1.100"
                    className="w-full pl-12 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-black text-slate-900 focus:ring-8 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-200"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-10">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-6 bg-slate-50 text-slate-500 rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] hover:bg-slate-100 transition-all border border-slate-100"
                >
                  Cerrar
                </button>
                <button 
                  type="submit"
                  disabled={actionLoading}
                  className="flex-[2] py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] hover:bg-black transition-all shadow-2xl shadow-slate-200 flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={20}/> : <Save size={18} />}
                  {editingPrinter ? 'Actualizar Hardware' : 'Víncular Dispositivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
