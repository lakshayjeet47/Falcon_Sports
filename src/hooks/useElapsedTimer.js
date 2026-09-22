import { useEffect, useState } from 'react'

// Returns an elapsed time string "M:SS" (or "H:MM:SS" past an hour),
// ticking every second from `startTime` (a Date, ISO string, or timestamp).
export function useElapsedTimer(startTime) {
    const [now, setNow] = useState(Date.now())

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(id)
    }, [])

    if (!startTime) return '0:00'
    const start = new Date(startTime).getTime()
    const diff = Math.max(0, Math.floor((now - start) / 1000))
    const h = Math.floor(diff / 3600)
    const m = Math.floor((diff % 3600) / 60)
    const s = diff % 60
    const pad = (n) => String(n).padStart(2, '0')
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}