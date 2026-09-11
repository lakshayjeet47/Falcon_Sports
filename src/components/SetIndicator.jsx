import React from 'react'

export default function SetIndicator({ totalSets, setsWonA, setsWonB, currentSet }) {
  const dots = Array.from({ length: totalSets })
  return (
    <div className="flex items-center gap-1.5">
      {dots.map((_, i) => {
        const num = i + 1
        let color = 'bg-chalk/20'
        if (num < currentSet || num <= setsWonA + setsWonB) color = 'bg-falconAmber'
        if (num === currentSet) color = 'bg-falconAmber ring-2 ring-falconAmber/40'
        return <span key={i} className={`w-2.5 h-2.5 rounded-full ${color}`} />
      })}
    </div>
  )
}
