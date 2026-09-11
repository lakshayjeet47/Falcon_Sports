import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useLiveMatch } from '../../hooks/useLiveMatch'
import ScoreButton from '../../components/ScoreButton'
import SetIndicator from '../../components/SetIndicator'

export default function LiveScoreboardOrganiser() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { match, sets, refresh } = useLiveMatch(matchId)
  const [confirmWinner, setConfirmWinner] = useState(null)

  if (!match) return null

  const currentSet = sets.find((s) => s.is_current)
  const setsToWin = Math.ceil(match.best_of_sets / 2)

  const updateScore = async (team, delta) => {
    if (!currentSet) return
    const field = team === 'A' ? 'score_a' : 'score_b'
    const newVal = Math.max(0, (currentSet[field] || 0) + delta)
    await supabase.from('match_sets').update({ [field]: newVal }).eq('id', currentSet.id)

    const scoreA = team === 'A' ? newVal : currentSet.score_a
    const scoreB = team === 'B' ? newVal : currentSet.score_b
    const winnerScore = Math.max(scoreA, scoreB)
    const loserScore = Math.min(scoreA, scoreB)
    const leader = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : null

    if (delta > 0 && leader && winnerScore >= match.points_per_set && winnerScore - loserScore >= 2) {
      setConfirmWinner(leader)
    }
    refresh()
  }

  const confirmSetWin = async () => {
    const setsWonA = match.sets_won_a + (confirmWinner === 'A' ? 1 : 0)
    const setsWonB = match.sets_won_b + (confirmWinner === 'B' ? 1 : 0)
    await supabase.from('match_sets').update({ is_current: false }).eq('id', currentSet.id)

    if (setsWonA >= setsToWin || setsWonB >= setsToWin) {
      await supabase
        .from('matches')
        .update({
          sets_won_a: setsWonA,
          sets_won_b: setsWonB,
          status: 'completed',
          winner_team_id: setsWonA > setsWonB ? match.team_a_id : match.team_b_id,
          completed_at: new Date().toISOString(),
        })
        .eq('id', matchId)
    } else {
      const nextSetNumber = match.current_set + 1
      await supabase.from('match_sets').insert({ match_id: matchId, set_number: nextSetNumber, score_a: 0, score_b: 0, is_current: true })
      await supabase.from('matches').update({ sets_won_a: setsWonA, sets_won_b: setsWonB, current_set: nextSetNumber }).eq('id', matchId)
    }
    setConfirmWinner(null)
    refresh()
  }

  return (
    <div className="min-h-screen bg-courtNavy text-chalk flex flex-col">
      <header className="flex items-center justify-between px-4 py-4">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} /></button>
        <div className="text-center">
          <p className="text-xs text-hawkRed font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-hawkRed animate-pulse" /> LIVE
          </p>
          <SetIndicator totalSets={match.best_of_sets} setsWonA={match.sets_won_a} setsWonB={match.sets_won_b} currentSet={match.current_set} />
        </div>
        <span className="text-xs text-chalk/40">#{match.match_code}</span>
      </header>

      {match.status === 'completed' && (
        <div className="text-center py-2 bg-falconAmber text-courtNavy font-bold text-sm">Match completed</div>
      )}

      <div className="flex-1 grid grid-cols-2 gap-3 p-4">
        {[
          { label: match.team_a?.name || 'Team A', score: currentSet?.score_a ?? 0, setsWon: match.sets_won_a, key: 'A' },
          { label: match.team_b?.name || 'Team B', score: currentSet?.score_b ?? 0, setsWon: match.sets_won_b, key: 'B' },
        ].map((t) => (
          <div key={t.key} className="bg-courtNavyLight rounded-lg flex flex-col items-center justify-between py-6 px-3">
            <div className="text-center">
              <p className="font-semibold text-chalk/70 truncate max-w-[120px]">{t.label}</p>
              <p className="text-xs text-chalk/40">{t.setsWon} sets won</p>
            </div>
            <p className="scoreboard-digit text-8xl">{t.score}</p>
            <ScoreButton onInc={() => updateScore(t.key, 1)} onDec={() => updateScore(t.key, -1)} disabled={match.status === 'completed'} />
          </div>
        ))}
      </div>

      {confirmWinner && (
        <div className="fixed inset-0 bg-ink/60 flex items-center justify-center p-6 z-50">
          <div className="bg-chalk text-ink rounded-lg p-5 w-full max-w-xs text-center">
            <p className="font-display text-2xl tracking-wide mb-1">Set Point</p>
            <p className="text-sm text-ink/60 mb-4">
              Confirm {confirmWinner === 'A' ? match.team_a?.name : match.team_b?.name} wins this set?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmWinner(null)} className="flex-1 py-2 rounded border border-ink/15 font-semibold text-sm">Not yet</button>
              <button onClick={confirmSetWin} className="flex-1 py-2 rounded bg-falconAmber text-courtNavy font-bold text-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
