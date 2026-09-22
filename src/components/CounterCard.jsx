import React from 'react'
import { Plus, Minus } from 'lucide-react'

// LCD-style score card used by both the local scoreboard and the
// tournament live scoreboard — label, digital score, +/- underneath.
export default function CounterCard({ label, sublabel, score, onInc, onDec, disabled }) {
    return (
        <div className="bg-courtNavyLight rounded-xl px-3 py-4 flex flex-col items-center gap-3">
            <div className="text-center">
                <p className="text-xs sm:text-sm font-semibold text-chalk/70 uppercase tracking-wide truncate max-w-[220px]">
                    {label}
                </p>
                {sublabel && <p className="text-[11px] text-chalk/40 mt-0.5">{sublabel}</p>}
            </div>

            <div className="w-full bg-courtNavy rounded-lg py-3 px-2 flex items-center justify-center border border-chalk/10">
                <p className="scoreboard-digit text-5xl sm:text-6xl">{score}</p>
            </div>

            <div className="flex items-center gap-2 w-full">
                <button
                    onClick={onInc}
                    disabled={disabled}
                    className="flex-1 py-2.5 rounded-lg bg-falconAmber active:bg-falconAmberDark text-courtNavy flex items-center justify-center disabled:opacity-40"
                    aria-label="Add point"
                >
                    <Plus size={20} strokeWidth={3} />
                </button>
                <button
                    onClick={onDec}
                    disabled={disabled}
                    className="flex-1 py-2.5 rounded-lg border-2 border-blue-500/60 text-blue-400 active:bg-blue-500/10 flex items-center justify-center disabled:opacity-40"
                    aria-label="Remove point"
                >
                    <Minus size={20} strokeWidth={3} />
                </button>
            </div>
        </div>
    )
}