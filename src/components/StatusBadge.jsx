import React from 'react'

const STYLES = {
  live: 'bg-hawkRed/10 text-hawkRed',
  upcoming: 'bg-courtNavy/10 text-courtNavy',
  completed: 'bg-green-600/10 text-green-700',
  cancelled: 'bg-ink/10 text-ink/40 line-through',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded ${STYLES[status] || STYLES.upcoming}`}>
      {status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-hawkRed animate-pulse" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
