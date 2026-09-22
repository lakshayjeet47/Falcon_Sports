import React, { useState } from 'react'
import Modal from './Modal'
import { supabase } from '../lib/supabaseClient'

export default function AddTeamModal({ tournamentId, onClose, onAdded }) {
    const [name, setName] = useState('')
    const [saving, setSaving] = useState(false)
    const [confirmDiscard, setConfirmDiscard] = useState(false)

    const dirty = name.trim().length > 0

    const requestClose = () => {
        if (dirty) setConfirmDiscard(true)
        else onClose()
    }

    const save = async () => {
        if (!name.trim()) return
        setSaving(true)
        const { data, error } = await supabase
            .from('teams')
            .insert({ tournament_id: tournamentId, name: name.trim() })
            .select()
            .single()
        setSaving(false)
        if (!error) {
            onAdded?.(data)
            onClose()
        }
    }

    return (
        <>
            <Modal
                title="Add New Team"
                onClose={requestClose}
                footer={
                    <button
                        onClick={save}
                        disabled={!dirty || saving}
                        className="w-full bg-falconAmber text-courtNavy font-bold py-3 rounded disabled:opacity-40"
                    >
                        {saving ? 'Adding…' : 'Add Team'}
                    </button>
                }
            >
                <label className="block text-sm font-semibold mb-1.5 text-ink">Team name</label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Team Alpha"
                    className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-300 bg-gray-100 text-ink placeholder:text-ink/55 focus:outline-none focus:ring-2 focus:ring-falconAmber focus:border-falconAmber"
                    autoFocus
                />
            </Modal>

            {confirmDiscard && (
                <div className="fixed inset-0 z-[60] bg-ink/60 flex items-center justify-center p-6">
                    <div className="bg-chalk text-ink rounded-lg p-5 w-full max-w-xs">
                        <p className="font-semibold mb-1 text-ink">Team not saved</p>
                        <p className="text-sm text-ink/70 mb-4">
                            You typed a team name but haven't added it yet. Close anyway?
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setConfirmDiscard(false)}
                                className="flex-1 py-2 rounded border border-ink/20 text-ink font-semibold text-sm hover:bg-ink/5"
                            >
                                Keep editing
                            </button>
                            <button onClick={onClose} className="flex-1 py-2 rounded bg-hawkRed text-white font-semibold text-sm">
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}