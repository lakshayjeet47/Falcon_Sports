import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../../components/Modal'

const SET_OPTIONS = [1, 3, 5]
const POINT_OPTIONS = [15, 21, 25]

export default function NormalMatchModal({ onClose }) {
  const navigate = useNavigate()
  const [sets, setSets] = useState(3)
  const [customSets, setCustomSets] = useState('')
  const [points, setPoints] = useState(25)
  const [customPoints, setCustomPoints] = useState('')

  const finalSets = customSets ? Number(customSets) : sets
  const finalPoints = customPoints ? Number(customPoints) : points

  const create = () => {
    navigate('/organise/local-scoreboard', { state: { sets: finalSets, points: finalPoints } })
  }

  return (
    <Modal
      title="Normal Match"
      onClose={onClose}
      footer={
        <button
          onClick={create}
          disabled={!finalSets || !finalPoints}
          className="w-full bg-falconAmber text-courtNavy font-bold py-3 rounded disabled:opacity-40"
        >
          Create Match
        </button>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold mb-2">Number of sets</p>
          <div className="flex gap-2 flex-wrap">
            {SET_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => { setSets(n); setCustomSets('') }}
                className={`px-4 py-2 rounded-full text-sm font-semibold border ${sets === n && !customSets ? 'bg-courtNavy text-chalk border-courtNavy' : 'border-ink/15 text-ink/60'}`}
              >
                Best of {n}
              </button>
            ))}
            <input
              type="number"
              min="1"
              placeholder="Custom"
              value={customSets}
              onChange={(e) => setCustomSets(e.target.value)}
              className="w-24 px-3 py-2 rounded-full text-sm border border-ink/15 focus:outline-none focus:border-falconAmber"
            />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold mb-2">Points per set</p>
          <div className="flex gap-2 flex-wrap">
            {POINT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => { setPoints(n); setCustomPoints('') }}
                className={`px-4 py-2 rounded-full text-sm font-semibold border ${points === n && !customPoints ? 'bg-courtNavy text-chalk border-courtNavy' : 'border-ink/15 text-ink/60'}`}
              >
                {n} pts
              </button>
            ))}
            <input
              type="number"
              min="1"
              placeholder="Custom"
              value={customPoints}
              onChange={(e) => setCustomPoints(e.target.value)}
              className="w-24 px-3 py-2 rounded-full text-sm border border-ink/15 focus:outline-none focus:border-falconAmber"
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
