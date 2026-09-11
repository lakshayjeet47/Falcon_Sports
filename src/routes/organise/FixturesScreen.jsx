import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import TeamChip from '../../components/TeamChip'

export default function FixturesScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [teamA, setTeamA] = useState(null)
  const [teamB, setTeamB] = useState(null)
  const [roundLabel, setRoundLabel] = useState('')
  const [pendingMatches, setPendingMatches] = useState([])
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    supabase.from('teams').select('*').eq('tournament_id', id).order('name').then(({ data }) => setTeams(data || []))
  }, [id])

  useEffect(() => { load() }, [load])

  const addPending = () => {
    if (!teamA || !teamB || teamA.id === teamB.id) return
    setPendingMatches((list) => [...list, { teamA, teamB, roundLabel: roundLabel.trim() || null, key: Date.now() }])
    setTeamA(null)
    setTeamB(null)
    setRoundLabel('')
  }

  const removePending = (key) => setPendingMatches((list) => list.filter((m) => m.key !== key))

  const saveAll = async () => {
    if (pendingMatches.length === 0) return
    setSaving(true)
    const rows = pendingMatches.map((m) => ({
      tournament_id: id,
      team_a_id: m.teamA.id,
      team_b_id: m.teamB.id,
      round_label: m.roundLabel,
    }))
    await supabase.from('matches').insert(rows)
    setSaving(false)
    navigate(`/organise/tournament/${id}`)
  }

  return (
    <div className="min-h-screen bg-chalk pb-10">
      <header className="bg-courtNavy text-chalk px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(`/organise/tournament/${id}`)}><ArrowLeft size={22} /></button>
        <h1 className="font-display text-2xl tracking-wide">Create Matches</h1>
      </header>

      <div className="max-w-3xl mx-auto px-4 mt-5 space-y-6">
        <section>
          <p className="text-sm font-semibold mb-2">Team A</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {teams.map((t) => (
              <TeamChip key={t.id} team={t} active={teamA?.id === t.id} onClick={() => setTeamA(t)} />
            ))}
          </div>
        </section>
        <section>
          <p className="text-sm font-semibold mb-2">Team B</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {teams.map((t) => (
              <TeamChip key={t.id} team={t} active={teamB?.id === t.id} onClick={() => setTeamB(t)} />
            ))}
          </div>
        </section>
        <section>
          <p className="text-sm font-semibold mb-2">Round label (optional)</p>
          <input
            value={roundLabel}
            onChange={(e) => setRoundLabel(e.target.value)}
            placeholder="e.g. Round 1, Semi Final"
            className="w-full px-3 py-2.5 rounded border border-ink/15 focus:outline-none focus:border-falconAmber"
          />
        </section>
        <button
          onClick={addPending}
          disabled={!teamA || !teamB || teamA?.id === teamB?.id}
          className="w-full bg-courtNavy text-chalk font-bold py-3 rounded disabled:opacity-40"
        >
          Add Match to List
        </button>

        {pendingMatches.length > 0 && (
          <section>
            <p className="text-sm font-semibold mb-2">Matches to create ({pendingMatches.length})</p>
            <div className="space-y-2">
              {pendingMatches.map((m) => (
                <div key={m.key} className="flex items-center justify-between bg-white px-4 py-2.5 rounded">
                  <span className="text-sm">
                    {m.roundLabel && <span className="text-ink/40 mr-2">{m.roundLabel}</span>}
                    {m.teamA.name} vs {m.teamB.name}
                  </span>
                  <button onClick={() => removePending(m.key)} className="text-xs text-hawkRed font-semibold">Remove</button>
                </div>
              ))}
            </div>
            <button
              onClick={saveAll}
              disabled={saving}
              className="w-full bg-falconAmber text-courtNavy font-bold py-3 rounded mt-4 disabled:opacity-40"
            >
              {saving ? 'Saving…' : `Save ${pendingMatches.length} Match${pendingMatches.length > 1 ? 'es' : ''}`}
            </button>
          </section>
        )}
      </div>
    </div>
  )
}
