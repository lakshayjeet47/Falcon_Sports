import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Settings, Swords, Radio, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import NormalMatchModal from './organise/NormalMatchModal'
import CreateTournamentModal from './organise/CreateTournamentModal'

const STATUS_ORDER = { live: 0, upcoming: 1, completed: 2, cancelled: 3 }
const LIVE_POLL_MS = 4000

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [liveMatches, setLiveMatches] = useState([])
  const [myTournaments, setMyTournaments] = useState([])
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showQuickMatch, setShowQuickMatch] = useState(false)
  const [showNewTournament, setShowNewTournament] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    const fetchLive = () => {
      supabase
        .from('matches')
        .select(`
          id, current_set, sets_won_a, sets_won_b,
          team_a:team_a_id(name), team_b:team_b_id(name),
          tournament:tournament_id(name, organiser_id),
          match_sets(score_a, score_b, is_current)
        `)
        .eq('status', 'live')
        .limit(10)
        .then(({ data }) => { if (!cancelled) setLiveMatches(data || []) })
    }

    fetchLive()
    const interval = setInterval(fetchLive, LIVE_POLL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    supabase
      .from('tournaments')
      .select('*')
      .eq('organiser_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const sorted = [...(data || [])].sort(
          (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
        )
        setMyTournaments(sorted)
      })
  }, [user])

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function handleJoin() {
    if (!joinCode.trim()) return
    setJoinLoading(true)
    setJoinError('')
    const { data, error } = await supabase
      .from('tournaments')
      .select('id')
      .ilike('code', joinCode.trim())
      .single()
    setJoinLoading(false)
    if (error || !data) {
      setJoinError('No tournament found with that ID. Please check and enter the correct ID.')
      return
    }
    navigate(`/join/tournament/${data.id}`)
  }

  function openLiveMatch(m) {
    const isOrganiser = m.tournament?.organiser_id === user?.id
    navigate(isOrganiser ? `/organise/live/${m.id}` : `/match/${m.id}`)
  }

  return (
    <div className="min-h-screen bg-chalk pb-8">
      <header className="bg-courtNavy text-chalk px-5 py-5 flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full ring-2 ring-falconAmber/40" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-falconAmber" />
          )}
          <div>
            <p className="text-xs text-chalk/50 leading-none">Welcome back</p>
            <p className="font-display text-xl tracking-wide leading-tight mt-0.5">{profile?.full_name || 'Player'}</p>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 text-chalk/70 hover:text-chalk px-2 py-1.5 rounded"
          >
            <ChevronDown size={16} className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 w-44 bg-white text-ink rounded shadow-lg overflow-hidden z-10">
              <button className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-chalk text-left">
                <Settings size={15} /> Settings
              </button>
              <button onClick={signOut} className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-chalk text-left text-hawkRed">
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5">
        {/* Organise / Join panels */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg p-5 bg-gradient-to-br from-falconAmber to-falconAmberDark text-ink">
            <Swords size={24} className="mb-3" />
            <p className="font-display text-2xl tracking-wide">Organise</p>
            <p className="text-sm text-ink/70 mt-1 mb-4">Launch a match or run a tournament</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowQuickMatch(true)}
                className="flex-1 bg-ink/90 text-chalk text-sm font-semibold py-2 rounded hover:bg-ink"
              >
                Quick Match
              </button>
              <button
                onClick={() => setShowNewTournament(true)}
                className="flex-1 bg-white/90 text-ink text-sm font-semibold py-2 rounded hover:bg-white"
              >
                New Tournament
              </button>
            </div>
          </div>

          <div className="rounded-lg p-5 bg-gradient-to-br from-courtNavy to-courtNavyLight text-chalk">
            <Radio size={24} className="mb-3 text-falconAmber" />
            <p className="font-display text-2xl tracking-wide">Join Ongoing</p>
            <p className="text-sm text-chalk/60 mt-1 mb-4">Enter a tournament code to watch live</p>
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="e.g. K7X2QD"
                className="flex-1 bg-white/10 border border-chalk/20 rounded px-3 text-sm placeholder:text-chalk/40 focus:outline-none focus:border-falconAmber"
              />
              <button onClick={handleJoin} disabled={joinLoading} className="bg-falconAmber text-ink text-sm font-semibold px-4 rounded hover:bg-falconAmberDark disabled:opacity-40">
                {joinLoading ? '...' : 'Join'}
              </button>
            </div>
            {joinError && <p className="text-xs text-hawkRed mt-2">{joinError}</p>}
          </div>
        </section>

        {/* My Tournaments */}
        <section className="mt-8">
          <h2 className="font-display text-2xl tracking-wide mb-3">My Tournaments</h2>
          {myTournaments.length === 0 ? (
            <p className="text-sm text-ink/40 bg-white px-4 py-6 rounded text-center">
              You haven't organised a tournament yet.
            </p>
          ) : (
            <div className="space-y-2">
              {myTournaments.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/organise/tournament/${t.id}`)}
                  className="w-full flex items-center justify-between bg-white px-4 py-3 rounded stripe-top text-left"
                  style={{ '--stripe-color': t.status === 'live' ? '#D64545' : '#E8A23D' }}
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{t.name}</p>
                    <p className="text-xs text-ink/40">ID: {t.code}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Live now */}
        <section className="mt-8">
          <h2 className="font-display text-2xl tracking-wide mb-3">Live Now</h2>
          {liveMatches.length === 0 ? (
            <p className="text-sm text-ink/40 bg-white px-4 py-6 rounded text-center">No matches are live right now.</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {liveMatches.map((m) => {
                const isOrganiser = m.tournament?.organiser_id === user?.id
                const currentSet = m.match_sets?.find((s) => s.is_current)
                const scoreA = currentSet?.score_a ?? 0
                const scoreB = currentSet?.score_b ?? 0
                return (
                  <div key={m.id} className="shrink-0 w-64 bg-white rounded-lg overflow-hidden stripe-top" style={{ '--stripe-color': '#D64545' }}>
                    <div className="px-4 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-ink/40 truncate">{m.tournament?.name}</p>
                        <span className="text-[10px] bg-hawkRed text-chalk font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-chalk animate-pulse" /> LIVE
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-xs font-semibold text-hawkRed truncate max-w-[40%]">
                          {m.team_a?.name || 'Team A'}
                        </p>
                        <span className="text-[10px] text-ink/30 font-bold shrink-0">VS</span>
                        <p className="text-xs font-semibold text-blue-600 truncate max-w-[40%] text-right">
                          {m.team_b?.name || 'Team B'}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="scoreboard-digit text-3xl text-courtNavy leading-none">{scoreA} – {scoreB}</p>
                        <p className="text-[10px] text-ink/40 mt-1">
                          Set {m.current_set} · Sets {m.sets_won_a}-{m.sets_won_b}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => openLiveMatch(m)}
                      className="w-full mt-4 bg-courtNavy text-chalk text-sm font-semibold py-2.5 hover:bg-courtNavyLight"
                    >
                      {isOrganiser ? 'Continue Scoring' : 'Spectate'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {showQuickMatch && <NormalMatchModal onClose={() => setShowQuickMatch(false)} />}
      {showNewTournament && (
        <CreateTournamentModal
          onClose={() => setShowNewTournament(false)}
          onCreated={(t) => navigate(`/organise/tournament/${t.id}`)}
        />
      )}
    </div>
  )
}