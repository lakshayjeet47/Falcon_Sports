import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import TabBar from '../components/TabBar'

export default function Dashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [liveMatches, setLiveMatches] = useState([])

  useEffect(() => {
    supabase
      .from('matches')
      .select('id, current_set, sets_won_a, sets_won_b, team_a:team_a_id(name), team_b:team_b_id(name), tournament:tournament_id(name)')
      .eq('status', 'live')
      .limit(10)
      .then(({ data }) => setLiveMatches(data || []))
  }, [])

  return (
    <div className="min-h-screen bg-chalk pb-24 md:pb-8">
      <header className="bg-courtNavy text-chalk px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-falconAmber" />
          )}
          <div>
            <p className="text-xs text-chalk/50 leading-none">Welcome back</p>
            <p className="font-semibold leading-tight">{profile?.full_name || 'Player'}</p>
          </div>
        </div>
        <button onClick={signOut} className="text-xs text-chalk/50 hover:text-chalk">Sign out</button>
      </header>

      <div className="max-w-3xl mx-auto px-5">
        {/* Promotions */}
        <section className="mt-5">
          <div className="flex gap-3 overflow-x-auto pb-1">
            <div className="shrink-0 w-72 h-28 rounded-lg bg-gradient-to-br from-courtNavy to-courtNavyLight text-chalk p-4 flex flex-col justify-end stripe-top" style={{ '--stripe-color': '#E8A23D' }}>
              <p className="font-display text-xl tracking-wide">Host your first tournament</p>
              <p className="text-xs text-chalk/60">Free forever on Falcon Sports</p>
            </div>
            <div className="shrink-0 w-72 h-28 rounded-lg bg-falconAmber text-courtNavy p-4 flex flex-col justify-end stripe-top" style={{ '--stripe-color': '#101A2B' }}>
              <p className="font-display text-xl tracking-wide">Share a Tournament ID</p>
              <p className="text-xs text-courtNavy/70">Anyone can watch live, no login</p>
            </div>
          </div>
        </section>

        {/* Live now */}
        <section className="mt-6">
          <h2 className="font-display text-2xl tracking-wide mb-2">Live Now</h2>
          {liveMatches.length === 0 ? (
            <p className="text-sm text-ink/40 bg-white px-4 py-6 rounded text-center">No matches are live right now.</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {liveMatches.map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigate(`/match/${m.id}`)}
                  className="shrink-0 w-56 bg-white text-left px-4 py-3 rounded stripe-top"
                  style={{ '--stripe-color': '#D64545' }}
                >
                  <p className="text-xs text-hawkRed font-bold flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-hawkRed animate-pulse" /> LIVE · {m.tournament?.name}
                  </p>
                  <p className="text-sm font-semibold truncate">{m.team_a?.name} vs {m.team_b?.name}</p>
                  <p className="scoreboard-digit text-lg text-courtNavy">{m.sets_won_a} – {m.sets_won_b} sets</p>
                </button>
              ))}
            </div>
          )}
        </section>

        <p className="text-center text-sm text-ink/40 mt-8">Use the tabs below to organise or join a tournament.</p>
      </div>

      <TabBar />
    </div>
  )
}
