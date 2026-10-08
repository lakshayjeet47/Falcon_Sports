import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'

// Floating "Home" button shown on every page except Login, the Dashboard
// itself (already home), and the OBS overlay (which must stay bare for
// streaming — any extra UI there would show up on camera).
export default function HomeButton() {
    const { pathname } = useLocation()
    const navigate = useNavigate()

    const hiddenOn = ['/login', '/dashboard']
    const isOverlay = pathname.startsWith('/overlay')
    if (hiddenOn.includes(pathname) || isOverlay) return null

    return (
        <button
            onClick={() => navigate('/dashboard')}
            aria-label="Go to home"
            className="fixed bottom-4 right-4 z-40 w-11 h-11 rounded-full bg-falconAmber text-courtNavy shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        >
            <Home size={20} strokeWidth={2.5} />
        </button>
    )
}