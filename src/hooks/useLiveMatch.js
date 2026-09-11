import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Subscribes to realtime changes on a single match row (+ its sets).
// Falls back to a 4s poll automatically if the realtime channel never
// reports SUBSCRIBED (e.g. Realtime not enabled on the table).
export function useLiveMatch(matchId) {
  const [match, setMatch] = useState(null)
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!matchId) return
    const [{ data: m }, { data: s }] = await Promise.all([
      supabase.from('matches').select('*, team_a:team_a_id(name), team_b:team_b_id(name)').eq('id', matchId).single(),
      supabase.from('match_sets').select('*').eq('match_id', matchId).order('set_number'),
    ])
    setMatch(m)
    setSets(s || [])
    setLoading(false)
  }, [matchId])

  useEffect(() => {
    fetchAll()
    if (!matchId) return

    let usingRealtime = false

    const channel = supabase
      .channel(`match-${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_sets', filter: `match_id=eq.${matchId}` }, fetchAll)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') usingRealtime = true
      })

    const poll = setInterval(() => {
      if (!usingRealtime) fetchAll()
    }, 4000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [matchId, fetchAll])

  return { match, sets, loading, refresh: fetchAll }
}
