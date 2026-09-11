import React from 'react'
import { X } from 'lucide-react'

export default function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-ink/50 p-0 md:p-4">
      <div className="w-full md:max-w-md bg-chalk rounded-t-2xl md:rounded-lg overflow-hidden stripe-top" style={{ '--stripe-color': '#E8A23D' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/10">
          <h2 className="font-display text-2xl tracking-wide text-ink">{title}</h2>
          <button onClick={onClose} className="text-ink/50 hover:text-ink">
            <X size={22} />
          </button>
        </div>
        <div className="px-5 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-ink/10 bg-ink/[0.02]">{footer}</div>}
      </div>
    </div>
  )
}
