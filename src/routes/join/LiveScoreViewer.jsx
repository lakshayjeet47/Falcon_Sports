import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useLiveMatch } from '../../hooks/useLiveMatch'
import SetIndicator from '../../components/SetIndicator'
import StatusBadge from '../../components/StatusBadge'

// Read-only live score view, used both from the tournament details "back"
// flow and from the dashboard's Live Now cards.
export default function LiveScoreViewer() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { match, sets } = useLiveMatch(matchId)

  if (!match) return null
  const currentSet = sets.find((s) => s.is_current) || sets[sets.length - 1]

  return (
    <div className="min-h-screen bg-courtNavy text-chalk flex flex-col">
      <header className="flex items-center justify-between px-4 py-4">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} /></button>
        <div className="text-center">
          <StatusBadge status={match.status} />
          <div className="mt-1">
            <SetIndicator totalSets={match.best_of_sets} setsWonA={match.sets_won_a} setsWonB={match.sets_won_b} currentSet={match.current_set} />
          </div>
        </div>
        <span className="text-xs text-chalk/40">#{match.match_code}</span>
      </header>

      <div className="flex-1 grid grid-cols-2 gap-3 p-4">
        {[
          { label: match.team_a?.name || 'Team A', score: currentSet?.score_a ?? 0, setsWon: match.sets_won_a },
          { label: match.team_b?.name || 'Team B', score: currentSet?.score_b ?? 0, setsWon: match.sets_won_b },
        ].map((t, i) => (
          <div key={i} className="bg-courtNavyLight rounded-lg flex flex-col items-center justify-center gap-4 py-10 px-3">
            <p className="font-semibold text-chalk/70 truncate max-w-[140px]">{t.label}</p>
            <p className="scoreboard-digit text-8xl">{t.score}</p>
            <p className="text-xs text-chalk/40">{t.setsWon} sets won</p>
          </div>
        ))}
      </div>

      {sets.length > 0 && (
        <div className="px-4 pb-8">
          <p className="text-xs text-chalk/40 mb-2">Set by set</p>
          <div className="flex gap-2 overflow-x-auto">
            {sets.map((s) => (
              <div key={s.id} className="shrink-0 bg-courtNavyLight rounded px-3 py-2 text-center min-w-[64px]">
                <p className="text-[10px] text-chalk/40">Set {s.set_number}</p>
                <p className="scoreboard-digit text-lg">{s.score_a}-{s.score_b}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
