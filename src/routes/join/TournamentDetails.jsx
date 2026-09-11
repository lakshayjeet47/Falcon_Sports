import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import ScoreBar from '../../components/ScoreBar'
import MatchRow from '../../components/MatchRow'

const FILTERS = ['live', 'upcoming', 'completed', 'cancelled']

export default function TournamentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tournament, setTournament] = useState(null)
  const [matches, setMatches] = useState([])
  const [filter, setFilter] = useState('live')
  const [liveMatchId, setLiveMatchId] = useState(null)

  const load = useCallback(async () => {
    const [{ data: t }, { data: m }] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', id).single(),
      supabase.from('matches').select('*, team_a:team_a_id(name), team_b:team_b_id(name)').eq('tournament_id', id).order('round_label'),
    ])
    setTournament(t)
    setMatches(m || [])
    const live = (m || []).find((x) => x.status === 'live')
    setLiveMatchId(live?.id || null)
  }, [id])

  useEffect(() => { load() }, [load])

  const filtered = matches.filter((m) => m.status === filter)

  if (!tournament) return null

  return (
    <div className="min-h-screen bg-chalk">
      {liveMatchId && <ScoreBar matchId={liveMatchId} />}

      <header className="bg-courtNavy text-chalk px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/join')}><ArrowLeft size={22} /></button>
        <div>
          <h1 className="font-display text-2xl tracking-wide">{tournament.name}</h1>
          <p className="text-xs text-chalk/40">ID: {tournament.code}</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 mt-5">
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize border ${filter === f ? 'bg-courtNavy text-chalk border-courtNavy' : 'border-ink/15 text-ink/60'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-ink/40 bg-white px-4 py-6 rounded text-center">No {filter} matches.</p>
        ) : (
          <div className="space-y-2 pb-8">
            {filtered.map((m) => <MatchRow key={m.id} match={m} />)}
          </div>
        )}
      </div>
    </div>
  )
}
