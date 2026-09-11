import React, { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Modal from '../../components/Modal'

const SET_OPTIONS = [1, 3, 5]
const POINT_OPTIONS = [15, 21, 25]

export default function MatchSettingsModal({ match, onClose, onStarted }) {
  const [sets, setSets] = useState(3)
  const [customSets, setCustomSets] = useState('')
  const [points, setPoints] = useState(25)
  const [customPoints, setCustomPoints] = useState('')
  const [saving, setSaving] = useState(false)

  const finalSets = customSets ? Number(customSets) : sets
  const finalPoints = customPoints ? Number(customPoints) : points

  const start = async () => {
    setSaving(true)
    await supabase
      .from('matches')
      .update({
        best_of_sets: finalSets,
        points_per_set: finalPoints,
        status: 'live',
        current_set: 1,
        started_at: new Date().toISOString(),
      })
      .eq('id', match.id)

    await supabase.from('match_sets').insert({ match_id: match.id, set_number: 1, score_a: 0, score_b: 0, is_current: true })

    setSaving(false)
    onStarted(match.id)
  }

  return (
    <Modal
      title="Match Settings"
      onClose={onClose}
      footer={
        <button onClick={start} disabled={saving} className="w-full bg-falconAmber text-courtNavy font-bold py-3 rounded disabled:opacity-40">
          {saving ? 'Starting…' : 'Confirm & Start'}
        </button>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold mb-2">Number of sets</p>
          <div className="flex gap-2 flex-wrap">
            {SET_OPTIONS.map((n) => (
              <button key={n} onClick={() => { setSets(n); setCustomSets('') }} className={`px-4 py-2 rounded-full text-sm font-semibold border ${sets === n && !customSets ? 'bg-courtNavy text-chalk border-courtNavy' : 'border-ink/15 text-ink/60'}`}>
                Best of {n}
              </button>
            ))}
            <input type="number" min="1" placeholder="Custom" value={customSets} onChange={(e) => setCustomSets(e.target.value)} className="w-24 px-3 py-2 rounded-full text-sm border border-ink/15 focus:outline-none focus:border-falconAmber" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold mb-2">Points per set</p>
          <div className="flex gap-2 flex-wrap">
            {POINT_OPTIONS.map((n) => (
              <button key={n} onClick={() => { setPoints(n); setCustomPoints('') }} className={`px-4 py-2 rounded-full text-sm font-semibold border ${points === n && !customPoints ? 'bg-courtNavy text-chalk border-courtNavy' : 'border-ink/15 text-ink/60'}`}>
                {n} pts
              </button>
            ))}
            <input type="number" min="1" placeholder="Custom" value={customPoints} onChange={(e) => setCustomPoints(e.target.value)} className="w-24 px-3 py-2 rounded-full text-sm border border-ink/15 focus:outline-none focus:border-falconAmber" />
          </div>
        </div>
      </div>
    </Modal>
  )
}
