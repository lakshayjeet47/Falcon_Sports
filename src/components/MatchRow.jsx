import React from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'

export default function MatchRow({ match, editable, onEdit, onStart, onOpenLive, onDelete }) {
  const navigate = useNavigate()
  const stripe = match.status === 'live' ? '#D64545' : match.status === 'completed' ? '#2f855a' : '#E8A23D'

  const openMatch = () => {
    if (match.status === 'live') {
      if (onOpenLive) onOpenLive(match)
      else navigate(`/match/${match.id}`)
    } else if (match.status === 'completed') {
      navigate(`/match/${match.id}`)
    }
  }

  return (
    <div
      onClick={openMatch}
      className="flex items-center justify-between bg-white px-4 py-3 stripe-top cursor-pointer"
      style={{ '--stripe-color': stripe }}
    >
      <div className="min-w-0">
        {match.round_label && <p className="text-xs text-ink/40 mb-0.5">{match.round_label}</p>}
        <p className="font-semibold truncate">
          {match.team_a?.name || 'TBD'} <span className="text-ink/30 font-normal">vs</span> {match.team_b?.name || 'TBD'}
        </p>
        {match.status === 'completed' && (
          <p className="text-sm text-ink/50 mt-0.5 scoreboard-digit">
            {match.sets_won_a} – {match.sets_won_b}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <StatusBadge status={match.status} />
        {editable && match.status === 'upcoming' && (
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(match) }}
              className="text-xs font-semibold text-ink/60 hover:text-ink px-2 py-1"
            >
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onStart(match) }}
              className="text-xs font-bold text-courtNavy bg-falconAmber px-3 py-1.5 rounded"
            >
              Start
            </button>
          </div>
        )}
        {editable && onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(match) }}
            className="text-xs font-semibold text-hawkRed hover:text-hawkRed/80 px-2 py-1"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
