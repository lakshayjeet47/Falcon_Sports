import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { useLiveMatch } from '../../hooks/useLiveMatch'
import { supabase } from '../../lib/supabaseClient'
import SetIndicator from '../../components/SetIndicator'
import StatusBadge from '../../components/StatusBadge'

const TEAM_THEME = {
  A: { border: 'border-hawkRed/60', bg: 'bg-hawkRed', text: 'text-hawkRed' },
  B: { border: 'border-blue-500/60', bg: 'bg-blue-600', text: 'text-blue-500' },
}

// Court background — sits behind the two score cards only
const BG_IMAGE = `${import.meta.env.BASE_URL}images/backgrounds/cort.png`

// Pool of generic logo images — one gets assigned per team
const LOGO_POOL = [
  `${import.meta.env.BASE_URL}images/logos/a.png`,
  `${import.meta.env.BASE_URL}images/logos/b.png`,
  `${import.meta.env.BASE_URL}images/logos/c.png`,
  `${import.meta.env.BASE_URL}images/logos/d.png`,
  `${import.meta.env.BASE_URL}images/logos/e.png`,
]

function hashName(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return hash
}

// Picks a logo per team, deterministically (same team name -> same logo
// every render), but guarantees the two teams IN THE SAME MATCH never
// get the same logo — bumping the second team to the next index on collision.
function pickPairLogos(nameA = '', nameB = '') {
  const idxA = hashName(nameA) % LOGO_POOL.length
  let idxB = hashName(nameB) % LOGO_POOL.length
  if (LOGO_POOL.length > 1 && idxB === idxA) {
    idxB = (idxB + 1) % LOGO_POOL.length
  }
  return { a: LOGO_POOL[idxA], b: LOGO_POOL[idxB] }
}

function TeamLogo({ src, name, size = 'w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20', fallbackBg = 'bg-hawkRed' }) {
  const [failed, setFailed] = useState(false)

  if (failed || !src) {
    return (
      <div className={`${size} rounded-xl sm:rounded-2xl ${fallbackBg} ring-2 sm:ring-4 ring-courtNavy flex items-center justify-center font-display text-lg sm:text-2xl shadow-lg`}>
        {(name || '?').charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className={`${size} rounded-xl sm:rounded-2xl ring-2 sm:ring-4 ring-courtNavy object-cover shadow-lg bg-courtNavyLight`}
    />
  )
}

// Read-only live score view, used both from the tournament details "back"
// flow and from the dashboard's Live Now cards.
export default function LiveScoreViewer() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { match, sets } = useLiveMatch(matchId)
  const [upcoming, setUpcoming] = useState([])
  const [showInfo, setShowInfo] = useState(false)
  const setsScrollRef = useRef(null)

  // Fetch other upcoming matches in the same tournament for the sidebar.
  useEffect(() => {
    if (!match?.tournament_id) return
    supabase
      .from('matches')
      .select('*, team_a:team_a_id(name), team_b:team_b_id(name)')
      .eq('tournament_id', match.tournament_id)
      .eq('status', 'upcoming')
      .neq('id', match.id)
      .order('round_label')
      .limit(6)
      .then(({ data }) => setUpcoming(data || []))
  }, [match?.tournament_id, match?.id])

  const mainLogos = useMemo(
    () => pickPairLogos(match?.team_a?.name || 'Team A', match?.team_b?.name || 'Team B'),
    [match?.team_a?.name, match?.team_b?.name]
  )

  if (!match) return null
  const currentSet = sets.find((s) => s.is_current) || sets[sets.length - 1]

  const teams = [
    { key: 'A', label: match.team_a?.name || 'Team A', score: currentSet?.score_a ?? 0, setsWon: match.sets_won_a, logo: mainLogos.a },
    { key: 'B', label: match.team_b?.name || 'Team B', score: currentSet?.score_b ?? 0, setsWon: match.sets_won_b, logo: mainLogos.b },
  ]

  const scrollSets = (dir) => {
    setsScrollRef.current?.scrollBy({ left: dir * 160, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-courtNavy text-chalk overflow-x-hidden">
      <div className="flex flex-col lg:flex-row lg:max-w-6xl lg:mx-auto">
        {/* ---- Main scoreboard ---- */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 sm:py-4">
            <button
              onClick={() => navigate(-1)}
              className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-courtNavyLight/70"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="flex flex-col items-center gap-1 sm:gap-1.5 min-w-0">
              {match.status === 'live' ? (
                <span className="inline-flex items-center gap-1.5 bg-hawkRed text-chalk text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-chalk animate-pulse shrink-0" /> Live Now
                </span>
              ) : (
                <StatusBadge status={match.status} />
              )}
              <SetIndicator
                totalSets={match.best_of_sets}
                setsWonA={match.sets_won_a}
                setsWonB={match.sets_won_b}
                currentSet={match.current_set}
              />
            </div>

            <div className="relative shrink-0">
              <button
                onClick={() => setShowInfo((v) => !v)}
                className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold bg-courtNavyLight/70 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg whitespace-nowrap"
              >
                <Info size={13} className="text-chalk/50 shrink-0" />
                <span className="hidden xs:inline">Match Info</span>
                <span className="xs:hidden">Info</span>
              </button>
              {showInfo && (
                <div className="absolute right-0 mt-2 w-48 sm:w-52 bg-courtNavyLight border border-chalk/10 rounded-lg p-3 z-10 text-left shadow-xl">
                  <p className="text-[10px] text-chalk/40">Match code</p>
                  <p className="text-sm font-semibold mb-2">#{match.match_code}</p>
                  {match.round_label && (
                    <>
                      <p className="text-[10px] text-chalk/40">Round</p>
                      <p className="text-sm font-semibold mb-2">{match.round_label}</p>
                    </>
                  )}
                  <p className="text-[10px] text-chalk/40">Format</p>
                  <p className="text-sm font-semibold">Best of {match.best_of_sets}</p>
                </div>
              )}
            </div>
          </header>

          {/* ---- Score cards with court background behind them ---- */}
          <div
            className="relative bg-cover bg-center rounded-none sm:mx-4 sm:rounded-2xl overflow-hidden"
            style={{ backgroundImage: `url(${BG_IMAGE})` }}
          >
            <div className="absolute inset-0 bg-courtNavy/75" />
            <div className="relative grid grid-cols-2 gap-2 sm:gap-4 lg:gap-6 p-3 sm:p-6 lg:px-8 pt-5 sm:pt-8">
              {teams.map((t) => {
                const theme = TEAM_THEME[t.key]
                return (
                  <div
                    key={t.key}
                    className={`relative rounded-xl sm:rounded-2xl border-2 ${theme.border} bg-courtNavyLight/70 flex flex-col items-center justify-center gap-1.5 sm:gap-2 pt-8 sm:pt-10 pb-5 sm:pb-8 px-2 sm:px-3 overflow-visible`}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${theme.bg}`} />
                    <div className={`absolute -top-5 sm:-top-6 ${t.key === 'A' ? '-left-1 sm:-left-2' : '-right-1 sm:-right-2'}`}>
                      <TeamLogo src={t.logo} name={t.label} fallbackBg={theme.bg} />
                    </div>
                    <p className={`font-semibold text-xs sm:text-sm lg:text-base truncate max-w-full mt-3 sm:mt-4 ${theme.text}`}>{t.label}</p>
                    <p className="scoreboard-digit text-4xl sm:text-6xl lg:text-7xl">{t.score}</p>
                    <p className="text-[10px] sm:text-[11px] text-chalk/40 text-center px-1">
                      Sets Won: {t.setsWon} <span className="text-chalk/25">(Current Set: {match.current_set})</span>
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {sets.length > 0 && (
            <div className="px-3 sm:px-4 pb-6 sm:pb-8 pt-3 sm:pt-4">
              <p className="text-xs text-chalk/40 mb-2">Set by set</p>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => scrollSets(-1)}
                  className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-courtNavyLight flex items-center justify-center text-chalk/50 hover:text-chalk"
                >
                  <ChevronLeft size={14} />
                </button>
                <div ref={setsScrollRef} className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scroll-smooth">
                  {sets.map((s, i) => (
                    <React.Fragment key={s.id}>
                      {i > 0 && <div className="w-3 sm:w-4 h-px bg-chalk/15 shrink-0" />}
                      <div
                        className={`shrink-0 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-center min-w-[68px] sm:min-w-[80px] border ${s.is_current ? 'bg-falconAmber/15 border-falconAmber' : 'bg-courtNavyLight border-chalk/10'
                          }`}
                      >
                        <p className={`text-[9px] sm:text-[10px] ${s.is_current ? 'text-falconAmber' : 'text-chalk/40'}`}>
                          Set {s.set_number}
                          {s.is_current ? ' (Ongoing)' : ''}
                        </p>
                        <p className="scoreboard-digit text-base sm:text-lg">
                          {s.score_a}-{s.score_b}
                        </p>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                <button
                  onClick={() => scrollSets(1)}
                  className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-courtNavyLight flex items-center justify-center text-chalk/50 hover:text-chalk"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ---- Upcoming matches sidebar (no Notify Me) ---- */}
        {upcoming.length > 0 && (
          <aside className="border-t border-chalk/10 lg:border-t-0 lg:border-l lg:w-72 shrink-0 px-3 sm:px-4 py-4 sm:py-5 lg:py-4">
            <p className="text-xs font-semibold tracking-wide text-chalk/40 mb-3">UPCOMING MATCHES</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 sm:gap-3">
              {upcoming.map((m) => {
                const logos = pickPairLogos(m.team_a?.name || 'Team A', m.team_b?.name || 'Team B')
                return (
                  <div key={m.id} className="bg-courtNavyLight/70 border border-chalk/10 rounded-xl p-2.5 sm:p-3">
                    {m.round_label && <p className="text-[10px] sm:text-[11px] text-chalk/40 mb-1.5 sm:mb-2 truncate">{m.round_label}</p>}
                    <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                      <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                        <TeamLogo src={logos.a} name={m.team_a?.name || 'Team A'} size="w-8 h-8 sm:w-9 sm:h-9" fallbackBg="bg-hawkRed/80" />
                        <p className="text-[10px] sm:text-[11px] truncate max-w-full">{m.team_a?.name || 'Team A'}</p>
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-chalk/30 font-semibold shrink-0">VS</span>
                      <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                        <TeamLogo src={logos.b} name={m.team_b?.name || 'Team B'} size="w-8 h-8 sm:w-9 sm:h-9" fallbackBg="bg-blue-600/80" />
                        <p className="text-[10px] sm:text-[11px] truncate max-w-full">{m.team_b?.name || 'Team B'}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}