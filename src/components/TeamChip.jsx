import React from 'react'

export default function TeamChip({ team, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-colors ${
        active ? 'bg-courtNavy text-chalk border-courtNavy' : 'bg-gray-100 text-ink border-gray-300 hover:bg-gray-200'
      }`}
    >
      {team.name}
    </button>
  )
}
