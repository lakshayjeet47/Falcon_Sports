import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveMatch } from '../hooks/useLiveMatch'

// Sticky top bar that shows a live match score. Only this component
// re-renders on score change (via useLiveMatch's realtime subscription) —
// it never causes the parent screen to reload.
export default function ScoreBar({ matchId }) {
  const { match, sets } = useLiveMatch(matchId)
  const navigate = useNavigate()

  if (!match || match.status !== 'live') return null
  const current = sets.find((s) => s.is_current) || sets[sets.length - 1]

  return (
    <button
      onClick={() => navigate(`/match/${matchId}`)}
      className="w-full flex items-center justify-between bg-courtNavy text-chalk px-4 py-2.5 stripe-top"
      style={{ '--stripe-color': '#D64545' }}
    >
      <span className="flex items-center gap-2 text-xs font-bold text-hawkRed">
        <span className="w-2 h-2 rounded-full bg-hawkRed animate-pulse" />
        LIVE
      </span>
      <span className="flex items-center gap-3 font-display text-2xl tracking-wide">
        <span className="truncate max-w-[90px]">{match.team_a?.name}</span>
        <span className="scoreboard-digit text-falconAmber">
          {current?.score_a ?? 0} – {current?.score_b ?? 0}
        </span>
        <span className="truncate max-w-[90px]">{match.team_b?.name}</span>
      </span>
      <span className="text-xs text-chalk/50">Set {match.current_set}</span>
    </button>
  )
}
