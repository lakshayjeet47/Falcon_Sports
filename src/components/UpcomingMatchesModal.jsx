import React, { useEffect, useState } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabaseClient'

// Read-only — no unsaved state, so it just closes normally with no warning.
export default function UpcomingMatchesModal({ tournamentId, excludeMatchId, onClose }) {
    const [matches, setMatches] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase
            .from('matches')
            .select('*, team_a:team_a_id(name), team_b:team_b_id(name)')
            .eq('tournament_id', tournamentId)
            .eq('status', 'upcoming')
            .neq('id', excludeMatchId || '')
            .order('round_label')
            .then(({ data }) => {
                setMatches(data || [])
                setLoading(false)
            })
    }, [tournamentId, excludeMatchId])

    return (
        <Modal title="Upcoming Matches" onClose={onClose}>
            {loading ? (
                <p className="text-sm text-ink/50">Loading…</p>
            ) : matches.length === 0 ? (
                <p className="text-sm text-ink/50">No upcoming matches yet.</p>
            ) : (
                <div className="space-y-2">
                    {matches.map((m) => (
                        <div key={m.id} className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-3">
                            {m.round_label && <p className="text-[11px] font-medium text-ink/60 mb-1 uppercase tracking-wide">{m.round_label}</p>}
                            <p className="font-bold text-sm text-ink">
                                {m.team_a?.name || 'TBD'}
                                <span className="text-ink/50 font-normal mx-1.5">vs</span>
                                {m.team_b?.name || 'TBD'}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    )
}