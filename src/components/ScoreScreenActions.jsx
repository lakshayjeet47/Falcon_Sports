import React from 'react'
import { UserPlus, Swords, CalendarClock } from 'lucide-react'

// Bottom action row on the counting screen. On Local Match, pass
// `disabled` and no `onUpcoming` (that button won't render at all).
// On the tournament live screen, pass all three handlers, enabled.
export default function ScoreScreenActions({ onAddTeam, onCreateMatch, onUpcoming, disabled }) {
    return (
        <div className="px-4 pb-6 space-y-2.5">
            <button
                onClick={onAddTeam}
                disabled={disabled}
                className="w-full flex items-center justify-center gap-2 bg-falconAmber disabled:opacity-40 disabled:cursor-not-allowed text-courtNavy font-bold py-3 rounded-lg"
            >
                <UserPlus size={18} /> Add New Team
            </button>
            <button
                onClick={onCreateMatch}
                disabled={disabled}
                className="w-full flex items-center justify-center gap-2 bg-courtNavyLight border border-chalk/15 disabled:opacity-40 disabled:cursor-not-allowed text-chalk font-bold py-3 rounded-lg"
            >
                <Swords size={18} /> Create New Match
            </button>
            {onUpcoming && (
                <button
                    onClick={onUpcoming}
                    disabled={disabled}
                    className="w-full flex items-center justify-center gap-2 bg-transparent border border-chalk/10 disabled:opacity-40 disabled:cursor-not-allowed text-chalk/70 font-semibold py-2.5 rounded-lg text-sm"
                >
                    <CalendarClock size={16} /> Upcoming Matches
                </button>
            )}
        </div>
    )
}