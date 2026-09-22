import React, { useEffect, useState } from 'react'
import Modal from './Modal'
import TeamChip from './TeamChip'
import { supabase } from '../lib/supabaseClient'

export default function CreateMatchModal({ tournamentId, onClose, onCreated }) {
    const [teams, setTeams] = useState([])
    const [teamA, setTeamA] = useState(null)
    const [teamB, setTeamB] = useState(null)
    const [roundLabel, setRoundLabel] = useState('')
    const [saving, setSaving] = useState(false)
    const [confirmDiscard, setConfirmDiscard] = useState(false)

    useEffect(() => {
        supabase.from('teams').select('*').eq('tournament_id', tournamentId).order('name')
            .then(({ data }) => setTeams(data || []))
    }, [tournamentId])

    const dirty = !!teamA || !!teamB || roundLabel.trim().length > 0
    const canCreate = teamA && teamB && teamA.id !== teamB.id

    const requestClose = () => {
        if (dirty) setConfirmDiscard(true)
        else onClose()
    }

    const create = async () => {
        if (!canCreate) return
        setSaving(true)
        const { data, error } = await supabase
            .from('matches')
            .insert({ tournament_id: tournamentId, team_a_id: teamA.id, team_b_id: teamB.id, round_label: roundLabel.trim() || null })
            .select('*, team_a:team_a_id(name), team_b:team_b_id(name)')
            .single()
        setSaving(false)
        if (!error) {
            onCreated?.(data)
            onClose()
        }
    }

    return (
        <>
            <Modal
                title="Create New Match"
                onClose={requestClose}
                footer={
                    <button
                        onClick={create}
                        disabled={!canCreate || saving}
                        className="w-full bg-falconAmber text-courtNavy font-bold py-3 rounded disabled:opacity-40"
                    >
                        {saving ? 'Creating…' : 'Create Match'}
                    </button>
                }
            >
                {teams.length < 2 ? (
                <p className="text-sm text-ink/60">Add at least 2 teams before creating a match.</p>
                ) : (
                    <div className="space-y-4">
                        <section>
                            <p className="text-sm font-semibold mb-2 text-ink">Team A</p>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {teams.map((t) => (
                                    <TeamChip key={t.id} team={t} active={teamA?.id === t.id} onClick={() => setTeamA(t)} />
                                ))}
                            </div>
                        </section>
                        <section>
                            <p className="text-sm font-semibold mb-2 text-ink">Team B</p>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {teams.map((t) => (
                                    <TeamChip key={t.id} team={t} active={teamB?.id === t.id} onClick={() => setTeamB(t)} />
                                ))}
                            </div>
                        </section>
                        <section>
                            <p className="text-sm font-semibold mb-1.5 text-ink">Round label (optional)</p>
                            <input
                                value={roundLabel}
                                onChange={(e) => setRoundLabel(e.target.value)}
                                placeholder="e.g. Round 1, Semi Final"
                                className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-300 bg-gray-100 text-ink placeholder:text-ink/55 focus:outline-none focus:ring-2 focus:ring-falconAmber focus:border-falconAmber"
                            />
                        </section>
                    </div>
                )}
            </Modal>

            {confirmDiscard && (
                <div className="fixed inset-0 z-[60] bg-ink/60 flex items-center justify-center p-6">
                    <div className="bg-chalk text-ink rounded-lg p-5 w-full max-w-xs">
                        <p className="font-semibold mb-1 text-ink">Leave without creating match?</p>
                        <p className="text-sm text-ink/70 mb-4">Your team selection hasn't been saved as a match yet.</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setConfirmDiscard(false)}
                                className="flex-1 py-2 rounded border border-ink/20 text-ink font-semibold text-sm hover:bg-ink/5"
                            >
                                Keep editing
                            </button>
                            <button onClick={onClose} className="flex-1 py-2 rounded bg-hawkRed text-white font-semibold text-sm">
                                Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}