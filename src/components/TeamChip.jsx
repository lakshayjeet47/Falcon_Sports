import React from 'react'

export default function TeamChip({ team, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-colors ${
        active ? 'bg-courtNavy text-chalk border-courtNavy' : 'bg-white text-ink/70 border-ink/10'
      }`}
    >
      {team.name}
    </button>
  )
}
