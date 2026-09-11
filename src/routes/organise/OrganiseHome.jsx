import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gamepad2, Trophy } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import TabBar from '../../components/TabBar'
import NormalMatchModal from './NormalMatchModal'
import CreateTournamentModal from './CreateTournamentModal'

export default function OrganiseHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showNormal, setShowNormal] = useState(false)
  const [showCreateTournament, setShowCreateTournament] = useState(false)
  const [myTournaments, setMyTournaments] = useState([])

  useEffect(() => {
    if (!user) return
    supabase
      .from('tournaments')
      .select('*')
      .eq('organiser_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setMyTournaments(data || []))
  }, [user])

  return (
    <div className="min-h-screen bg-chalk pb-24 md:pb-8">
      <header className="bg-courtNavy text-chalk px-5 py-5">
        <h1 className="font-display text-3xl tracking-wide">Organise</h1>
        <p className="text-chalk/50 text-sm">Run a quick match, or manage a full tournament.</p>
      </header>

      <div className="max-w-3xl mx-auto px-5 mt-5 grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowNormal(true)}
          className="bg-white p-5 rounded stripe-top text-left"
          style={{ '--stripe-color': '#E8A23D' }}
        >
          <Gamepad2 className="text-falconAmberDark mb-3" size={28} />
          <p className="font-display text-xl tracking-wide">Normal Match</p>
          <p className="text-xs text-ink/50 mt-1">Local scoreboard, no login needed to score</p>
        </button>
        <button
          onClick={() => setShowCreateTournament(true)}
          className="bg-white p-5 rounded stripe-top text-left"
          style={{ '--stripe-color': '#101A2B' }}
        >
          <Trophy className="text-courtNavy mb-3" size={28} />
          <p className="font-display text-xl tracking-wide">Tournament</p>
          <p className="text-xs text-ink/50 mt-1">Teams, fixtures, and live broadcast score</p>
        </button>
      </div>

      {myTournaments.length > 0 && (
        <div className="max-w-3xl mx-auto px-5 mt-8">
          <h2 className="font-display text-2xl tracking-wide mb-2">Your Tournaments</h2>
          <div className="space-y-2">
            {myTournaments.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/organise/tournament/${t.id}`)}
                className="w-full flex items-center justify-between bg-white px-4 py-3 rounded stripe-top text-left"
                style={{ '--stripe-color': '#E8A23D' }}
              >
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-ink/40">ID: {t.code}</p>
                </div>
                <span className="text-xs font-bold text-ink/40 uppercase">{t.status}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showNormal && <NormalMatchModal onClose={() => setShowNormal(false)} />}
      {showCreateTournament && (
        <CreateTournamentModal
          onClose={() => setShowCreateTournament(false)}
          onCreated={(t) => navigate(`/organise/tournament/${t.id}`)}
        />
      )}

      <TabBar />
    </div>
  )
}
