import React, { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/Modal'

export default function CreateTournamentModal({ onClose, onCreated }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [teamMode, setTeamMode] = useState('flexible')
  const [maxTeams, setMaxTeams] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const create = async () => {
    if (!name.trim()) return
    setSaving(true)
    setError('')
    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        name: name.trim(),
        team_mode: teamMode,
        max_teams: teamMode === 'fixed' ? Number(maxTeams) || null : null,
        organiser_id: user.id,
      })
      .select()
      .single()
    setSaving(false)
    if (error) { setError(error.message); return }
    onCreated(data)
  }

  return (
    <Modal
      title="Create Tournament"
      onClose={onClose}
      footer={
        <button
          onClick={create}
          disabled={!name.trim() || saving}
          className="w-full bg-falconAmber text-courtNavy font-bold py-3 rounded disabled:opacity-40"
        >
          {saving ? 'Creating…' : 'Create'}
        </button>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="text-sm font-semibold block mb-1.5">Tournament name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Summer Smash 2026"
            className="w-full px-3 py-2.5 rounded border border-ink/15 focus:outline-none focus:border-falconAmber"
          />
        </div>
        <div>
          <label className="text-sm font-semibold block mb-1.5">Team entry</label>
          <div className="flex gap-2">
            <button
              onClick={() => setTeamMode('fixed')}
              className={`flex-1 py-2.5 rounded border text-sm font-semibold ${teamMode === 'fixed' ? 'bg-courtNavy text-chalk border-courtNavy' : 'border-ink/15 text-ink/60'}`}
            >
              Fixed number
            </button>
            <button
              onClick={() => setTeamMode('flexible')}
              className={`flex-1 py-2.5 rounded border text-sm font-semibold ${teamMode === 'flexible' ? 'bg-courtNavy text-chalk border-courtNavy' : 'border-ink/15 text-ink/60'}`}
            >
              Flexible / open
            </button>
          </div>
          {teamMode === 'fixed' && (
            <input
              type="number"
              min="2"
              value={maxTeams}
              onChange={(e) => setMaxTeams(e.target.value)}
              placeholder="Number of teams"
              className="w-full mt-2 px-3 py-2.5 rounded border border-ink/15 focus:outline-none focus:border-falconAmber"
            />
          )}
        </div>
        {error && <p className="text-sm text-hawkRed">{error}</p>}
      </div>
    </Modal>
  )
}
