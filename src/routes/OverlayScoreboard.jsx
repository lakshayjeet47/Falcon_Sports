import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useLiveMatch } from '../hooks/useLiveMatch'
import { useElapsedTimer } from '../hooks/useElapsedTimer'

const POSITION_CLASSES = {
    'bottom-left': 'bottom-3 left-3 sm:bottom-6 sm:left-6',
    'bottom-right': 'bottom-3 right-3 sm:bottom-6 sm:right-6',
    'top-left': 'top-3 left-3 sm:top-6 sm:left-6',
    'top-right': 'top-3 right-3 sm:top-6 sm:right-6',
}

// OBS Browser Source scorecard, addressed by the short match_code
// (the "#5TXRBF"-style code shown on the organiser's live screen) rather
// than the internal database id, since that's the only identifier you can
// actually see and copy from the app.
//
// Add this route's URL as a Browser Source in OBS — the page background is
// fully transparent, so only this scorecard panel is visible; your stream
// shows through everywhere else.
//
// NOTE on sizing: OBS Browser Source renders the page at a fixed pixel
// resolution YOU choose in the source's Width/Height fields — it doesn't
// know or care about "mobile" vs "desktop". The CSS here is responsive so
// the card also looks correct if opened directly in a phone browser (e.g.
// to preview it), but for OBS itself the simplest sizing control is:
//   1. Set the Browser Source's Width/Height in OBS to roughly the card's
//      natural size (try 560 x 130, adjust to taste)
//   2. Or use the URL param below to shrink/grow it without touching OBS:
//        ?scale=0.7   (default 1)
//   ?position=bottom-left|bottom-right|top-left|top-right   (default bottom-left)
export default function OverlayScoreboard() {
    const { matchCode } = useParams()
    const [params] = useSearchParams()
    const [resolvedId, setResolvedId] = useState(null)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        if (!matchCode) return
        supabase
            .from('matches')
            .select('id')
            .eq('match_code', matchCode.toUpperCase())
            .single()
            .then(({ data, error }) => {
                if (error || !data) setNotFound(true)
                else setResolvedId(data.id)
            })
    }, [matchCode])

    const { match, sets } = useLiveMatch(resolvedId)
    const elapsed = useElapsedTimer(match?.started_at)

    useEffect(() => {
        document.body.classList.add('overlay-mode')
        return () => document.body.classList.remove('overlay-mode')
    }, [])

    const position = POSITION_CLASSES[params.get('position')] || POSITION_CLASSES['bottom-left']
    const alignRight = (params.get('position') || '').includes('right')
    const scale = Number(params.get('scale')) || 1

    if (notFound) {
        return (
            <p className="fixed bottom-3 left-3 text-hawkRed bg-courtNavy/90 px-3 py-2 rounded text-xs sm:text-sm">
                Match code "{matchCode}" not found
            </p>
        )
    }
    if (!match) return null

    const currentSet = sets.find((s) => s.is_current) || sets[sets.length - 1]

    return (
        <div
            className={`fixed ${position} w-[94vw] max-w-[560px]`}
            style={{ transform: `scale(${scale})`, transformOrigin: `bottom ${alignRight ? 'right' : 'left'}` }}
        >
            <div className="flex items-stretch rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-chalk/10 bg-courtNavy/95 backdrop-blur-md">
                {/* Logo panel */}
                <div className="flex flex-col items-center justify-center px-2 sm:px-4 gap-0.5 border-r border-falconAmber/40 shrink-0">
                    <p className="font-display text-xs sm:text-lg leading-none text-falconAmber tracking-wide">FALCON</p>
                    <p className="text-[6px] sm:text-[9px] leading-none text-chalk/60 tracking-[0.2em] font-semibold">SPORTS</p>
                </div>

                <TeamPanel
                    label="Team A"
                    teamName={match.team_a?.name || 'Team A'}
                    liveScore={currentSet?.score_a ?? 0}
                    setsWon={match.sets_won_a}
                    currentSetNumber={match.current_set}
                    gradient="from-courtNavyLight to-courtNavy"
                    accent="border-falconAmber"
                />

                <div className="flex items-center justify-center px-1.5 sm:px-3 bg-courtNavy border-x border-chalk/10 shrink-0">
                    <span className="scoreboard-digit text-xs sm:text-xl text-chalk/70">
                        {match.sets_won_a}<span className="text-chalk/30 mx-0.5">-</span>{match.sets_won_b}
                    </span>
                </div>

                <TeamPanel
                    label="Team B"
                    teamName={match.team_b?.name || 'Team B'}
                    liveScore={currentSet?.score_b ?? 0}
                    setsWon={match.sets_won_b}
                    currentSetNumber={match.current_set}
                    gradient="from-blue-900/60 to-courtNavy"
                    accent="border-blue-500"
                />

                <div className="flex flex-col items-center justify-center px-2 sm:px-4 gap-0.5 sm:gap-1 bg-hawkRed shrink-0 min-w-[56px] sm:min-w-[100px]">
                    <p className="text-[6px] sm:text-[8px] font-bold tracking-widest text-chalk/70 uppercase hidden sm:block">Match</p>
                    {match.status === 'live' ? (
                        <span className="inline-flex items-center gap-1 sm:gap-1.5 text-chalk text-[9px] sm:text-xs font-bold whitespace-nowrap">
                            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-chalk animate-pulse shrink-0" /> LIVE
                        </span>
                    ) : (
                        <span className="text-chalk text-[9px] sm:text-xs font-bold uppercase">{match.status}</span>
                    )}
                    <p className="scoreboard-digit text-[10px] sm:text-sm text-chalk/90">{elapsed}</p>
                </div>
            </div>
        </div>
    )
}

function TeamPanel({ label, teamName, liveScore, setsWon, currentSetNumber, gradient, accent }) {
    return (
        <div className={`flex-1 min-w-0 px-2 sm:px-4 py-1.5 sm:py-2.5 bg-gradient-to-b ${gradient} border-t-2 sm:border-t-4 ${accent} flex flex-col items-center text-center gap-0.5`}>
            <p className="text-[7px] sm:text-[9px] font-bold tracking-widest text-chalk/50 uppercase">{label}</p>
            <p className="text-[10px] sm:text-sm font-bold text-chalk truncate max-w-full">{teamName}</p>
            <p className="scoreboard-digit text-2xl sm:text-5xl leading-none text-chalk mt-0.5 sm:mt-1">{liveScore}</p>
            <p className="text-[7px] sm:text-[10px] text-chalk/50 mt-0.5 sm:mt-1 leading-tight">
                Sets Won: {setsWon} <span className="text-chalk/30">(Set {currentSetNumber})</span>
            </p>
        </div>
    )
}