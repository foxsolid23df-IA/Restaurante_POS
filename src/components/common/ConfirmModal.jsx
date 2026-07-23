import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useModalTrap } from '@/hooks/useModalTrap'

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false }) {
  const modalRef = useModalTrap(isOpen)

  if (!isOpen) return null

  return (
    <div 
      ref={modalRef}
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[150] p-6 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-[2rem] p-8 shadow-2xl w-full max-w-md border border-white/20">
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-3 rounded-xl ${danger ? 'bg-rose-50' : 'bg-amber-50'}`}>
            <AlertTriangle size={24} className={danger ? 'text-rose-500' : 'text-amber-500'} />
          </div>
          <div>
            <h3 id="confirm-modal-title" className="text-lg font-black text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{message}</p>
          </div>
        </div>
        
        <div className="flex gap-3 justify-end">
          <button
            data-modal-close
            onClick={onClose}
            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={`px-6 py-3 rounded-xl font-bold text-sm text-white transition-all ${
              danger 
                ? 'bg-rose-500 hover:bg-rose-600' 
                : 'bg-slate-900 hover:bg-black'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
