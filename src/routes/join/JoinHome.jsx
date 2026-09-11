import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import TabBar from '../../components/TabBar'

export default function JoinHome() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const search = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('tournaments')
      .select('id')
      .ilike('code', code.trim())
      .single()
    setLoading(false)
    if (error || !data) {
      setError('No tournament found with that ID. Double check and try again.')
      return
    }
    navigate(`/join/tournament/${data.id}`)
  }

  return (
    <div className="min-h-screen bg-chalk pb-24 md:pb-8">
      <header className="bg-courtNavy text-chalk px-5 py-5">
        <h1 className="font-display text-3xl tracking-wide">Join Ongoing</h1>
        <p className="text-chalk/50 text-sm">Enter a Tournament ID to watch live scores and results.</p>
      </header>

      <div className="max-w-3xl mx-auto px-5 mt-6">
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="e.g. K7X2QD"
            className="flex-1 px-4 py-3 rounded border border-ink/15 font-display text-xl tracking-widest focus:outline-none focus:border-falconAmber"
          />
          <button onClick={search} disabled={loading} className="px-5 rounded bg-falconAmber text-courtNavy font-bold flex items-center gap-2 disabled:opacity-40">
            <Search size={18} /> {loading ? '...' : 'Find'}
          </button>
        </div>
        {error && <p className="text-sm text-hawkRed mt-2">{error}</p>}
      </div>

      <TabBar />
    </div>
  )
}
