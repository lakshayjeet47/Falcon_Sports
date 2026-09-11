import React from 'react'
import { Plus, Minus } from 'lucide-react'

export default function ScoreButton({ onInc, onDec, disabled }) {
  return (
    <div className="flex md:flex-col gap-2">
      <button
        onClick={onInc}
        disabled={disabled}
        className="flex-1 md:flex-none aspect-square md:w-16 md:h-16 rounded-full bg-falconAmber active:bg-falconAmberDark text-courtNavy flex items-center justify-center shadow-sm disabled:opacity-40"
        aria-label="Add point"
      >
        <Plus size={28} strokeWidth={3} />
      </button>
      <button
        onClick={onDec}
        disabled={disabled}
        className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-courtNavyLight active:bg-courtNavy text-chalk flex items-center justify-center disabled:opacity-40"
        aria-label="Remove point"
      >
        <Minus size={22} strokeWidth={3} />
      </button>
    </div>
  )
}
