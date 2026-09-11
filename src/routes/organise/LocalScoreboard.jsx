import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import ScoreButton from '../../components/ScoreButton'
import SetIndicator from '../../components/SetIndicator'

export default function LocalScoreboard() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const totalSets = state?.sets || 3
  const pointsToWin = state?.points || 25

  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [setsWonA, setSetsWonA] = useState(0)
  const [setsWonB, setSetsWonB] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const setsToWin = Math.ceil(totalSets / 2)

  const checkSetWin = (a, b) => {
    const leader = a > b ? 'A' : b > a ? 'B' : null
    if (!leader) return
    const winnerScore = Math.max(a, b)
    const loserScore = Math.min(a, b)
    if (winnerScore >= pointsToWin && winnerScore - loserScore >= 2) {
      if (leader === 'A') setSetsWonA((v) => v + 1)
      else setSetsWonB((v) => v + 1)
      setScoreA(0)
      setScoreB(0)
      setCurrentSet((v) => Math.min(v + 1, totalSets))
    }
  }

  const inc = (team) => {
    if (team === 'A') {
      const next = scoreA + 1
      setScoreA(next)
      checkSetWin(next, scoreB)
    } else {
      const next = scoreB + 1
      setScoreB(next)
      checkSetWin(scoreA, next)
    }
  }
  const dec = (team) => {
    if (team === 'A') setScoreA((v) => Math.max(0, v - 1))
    else setScoreB((v) => Math.max(0, v - 1))
  }

  const matchOver = setsWonA >= setsToWin || setsWonB >= setsToWin

  const reset = () => {
    setScoreA(0); setScoreB(0); setSetsWonA(0); setSetsWonB(0); setCurrentSet(1)
    setShowResetConfirm(false)
  }

  return (
    <div className="min-h-screen bg-courtNavy text-chalk flex flex-col">
      <header className="flex items-center justify-between px-4 py-4">
        <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft size={22} /></button>
        <div className="text-center">
          <p className="text-xs text-chalk/50">Local Match</p>
          <SetIndicator totalSets={totalSets} setsWonA={setsWonA} setsWonB={setsWonB} currentSet={currentSet} />
        </div>
        <button onClick={() => setShowResetConfirm(true)} className="p-1"><RotateCcw size={20} /></button>
      </header>

      {matchOver && (
        <div className="text-center py-2 bg-falconAmber text-courtNavy font-bold text-sm">
          {setsWonA > setsWonB ? 'Team A' : 'Team B'} wins the match!
        </div>
      )}

      <div className="flex-1 grid grid-cols-2 gap-3 p-4">
        {[{ label: 'Team A', score: scoreA, sets: setsWonA, key: 'A' }, { label: 'Team B', score: scoreB, sets: setsWonB, key: 'B' }].map((t) => (
          <div key={t.key} className="bg-courtNavyLight rounded-lg flex flex-col items-center justify-between py-6 px-3">
            <div className="text-center">
              <p className="font-semibold text-chalk/70">{t.label}</p>
              <p className="text-xs text-chalk/40">{t.sets} sets won</p>
            </div>
            <p className="scoreboard-digit text-8xl">{t.score}</p>
            <ScoreButton onInc={() => inc(t.key)} onDec={() => dec(t.key)} disabled={matchOver} />
          </div>
        ))}
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-ink/60 flex items-center justify-center p-6 z-50">
          <div className="bg-chalk text-ink rounded-lg p-5 w-full max-w-xs">
            <p className="font-semibold mb-1">Reset match?</p>
            <p className="text-sm text-ink/60 mb-4">This clears the current score and sets. This can't be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2 rounded border border-ink/15 font-semibold text-sm">Cancel</button>
              <button onClick={reset} className="flex-1 py-2 rounded bg-hawkRed text-white font-semibold text-sm">Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
