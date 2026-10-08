import React, { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageCircle, X, Send } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

// ---------- 1. Static "how do I..." answers (edit freely) ----------
const FAQ = [
    { keys: ['create', 'tournament', 'new tournament'], answer: 'Dashboard → menu → New Tournament. Enter a name, pick Fixed (set max teams) or Flexible, then tap Create.' },
    { keys: ['add team', 'team', 'add player', 'player'], answer: 'Open your tournament (Organise) → add teams, then pick a team to add its players.' },
    { keys: ['fixture', 'create match', 'schedule'], answer: 'Open your tournament → Fixtures. Pick Team A, Team B and a round label, add the pairs, then Save All.' },
    { keys: ['start', 'settings', 'best of', 'points per set'], answer: 'Open an upcoming match → set Best-of sets and Points per set → Start. The match goes Live.' },
    { keys: ['score', 'update score', 'point'], answer: 'Open your live match from the Dashboard (Live Now) and use the score buttons for each team. Sets advance automatically.' },
    { keys: ['join', 'watch', 'viewer'], answer: 'On the Dashboard enter the Tournament ID in the Join box, or tap a match under Live Now.' },
    { keys: ['obs', 'overlay', 'youtube', 'stream', 'live stream'], answer: 'In OBS add a Browser Source with: <your-site>/#/overlay/<MATCHCODE>. Match code is the #XXXXXX shown on the live screen. Optional: ?scale=0.7&position=bottom-right (bottom-left, top-left, top-right).' },
    { keys: ['quick match', 'normal match', 'local match'], answer: 'Quick/Normal Match is local only: scores stay on your device and are not saved to the database.' },
    { keys: ['login', 'sign in', 'google'], answer: 'The app uses Google sign-in. Tap "Sign in with Google" on the login page.' },
]

const SUGGESTIONS = ['Live matches', 'Upcoming matches', 'My tournaments', 'How to start a match?', 'How to use OBS overlay?']

const STOP = new Set(['a', 'an', 'the', 'of', 'in', 'for', 'on', 'is', 'are', 'me', 'show', 'tell', 'give', 'list', 'find', 'search', 'what', 'which', 'who', 'how', 'many', 'teams', 'team', 'players', 'player', 'tournament', 'tournaments', 'match', 'matches', 'id', 'code', 'name', 'named', 'called', 'with', 'to', 'my', 'please', 'details', 'info', 'about', 'all', 'squad', 'roster', 'results', 'result', 'completed', 'upcoming', 'live'])

const clean = (s) => s.toLowerCase().replace(/[^a-z0-9\s#-]/g, ' ').replace(/\s+/g, ' ').trim()
const term = (t) => t.split(' ').filter((w) => w && !STOP.has(w)).join(' ').replace(/^#/, '')
const hasAny = (t, arr) => arr.some((k) => new RegExp('(^|\\s)' + k + '(s|es)?(\\s|$)').test(t))

const matchLine = (m) => {
    const cur = (m.match_sets || []).find((s) => s.is_current) || {}
    return `${m.team_a?.name ?? '?'} vs ${m.team_b?.name ?? '?'} — sets ${m.sets_won_a ?? 0}:${m.sets_won_b ?? 0}` +
        (m.status === 'live' ? `, current set ${cur.score_a ?? 0}:${cur.score_b ?? 0}` : '') +
        (m.round_label ? ` (${m.round_label})` : '') +
        (m.tournament?.name ? ` · ${m.tournament.name}` : '')
}

const MATCH_SELECT = 'id, status, round_label, sets_won_a, sets_won_b, team_a:team_a_id(name), team_b:team_b_id(name), tournament:tournament_id(name), match_sets(score_a, score_b, is_current)'

async function findTournament(q) {
    const safe = q.replace(/[,()%]/g, ' ').trim()
    const { data } = await supabase.from('tournaments').select('*').or(`name.ilike.%${safe}%,code.ilike.%${safe}%`).limit(1)
    return data?.[0] || null
}

// ---------- AI (Supabase Edge Function "chat") ----------
async function askAI(question, history) {
    try {
        const { data, error } = await supabase.functions.invoke('chat', { body: { question, history } })
        if (!error && data?.reply) return { text: data.reply }
    } catch { }
    return null // AI unavailable, fall back to the keyword bot
}

// ---------- 2. Keyword bot (fallback): intent -> Supabase query -> reply ----------
async function answer(raw, user, pending) {
    const t = clean(raw)
    const q = term(t)

    // follow-up to "which tournament?" / "which team?"
    if (pending && q) return run(pending, q, user)
    if (pending && !q) return run(pending, t, user)

    if (/^(hi|hello|hey|hii|namaste)\b/.test(t)) return { text: 'Hi! I can help with Falcon Sports: live scores, matches, tournaments, teams, players, and how-to steps.' }

    const isHow = /\bhow (to|do|can)\b|\bsteps?\b|\bguide\b|\bwhere (do|can)\b/.test(t) && !t.includes('how many')
    if (isHow || hasAny(t, ['obs', 'overlay', 'youtube'])) {
        let best = null, bestScore = 0
        FAQ.forEach((f) => { const s = f.keys.filter((k) => t.includes(k)).length; if (s > bestScore) { best = f; bestScore = s } })
        if (best) return { text: best.answer }
    }

    if (hasAny(t, ['my tournament', 'my tournaments', 'i created', 'i organise', 'i organize'])) return run('myTournaments', q, user)
    if (hasAny(t, ['live', 'ongoing', 'playing now', 'current score', 'score now'])) return run('live', q, user)
    if (hasAny(t, ['upcoming', 'scheduled', 'next match', 'fixture'])) return run('upcoming', q, user)
    if (hasAny(t, ['completed', 'result', 'finished', 'who won'])) return run('completed', q, user)
    if (hasAny(t, ['player', 'squad', 'roster'])) return run('players', q, user)
    if (hasAny(t, ['team'])) return run('teams', q, user)
    if (hasAny(t, ['tournament', 'code', 'id'])) return run('tournament', q, user)

    return { text: "Sorry, I can only answer questions about Falcon Sports (matches, scores, tournaments, teams, players and how to use the app). Try one of these:", chips: SUGGESTIONS }
}

async function run(intent, q, user) {
    if (intent === 'live' || intent === 'upcoming' || intent === 'completed') {
        const { data, error } = await supabase.from('matches').select(MATCH_SELECT).eq('status', intent).limit(10)
        if (error) return { text: 'I could not read matches right now.' }
        if (!data?.length) return { text: `No ${intent} matches right now.` }
        return { text: `${intent[0].toUpperCase() + intent.slice(1)} matches:`, lines: data.map(matchLine) }
    }
    if (intent === 'myTournaments') {
        if (!user) return { text: 'Please sign in first.' }
        const { data } = await supabase.from('tournaments').select('name, code, status').eq('organiser_id', user.id).order('created_at', { ascending: false }).limit(10)
        if (!data?.length) return { text: "You haven't created any tournaments yet." }
        return { text: 'Your tournaments:', lines: data.map((x) => `${x.name} · ID ${x.code}${x.status ? ' · ' + x.status : ''}`) }
    }
    if (intent === 'tournament') {
        if (!q) return { text: 'Which tournament? Type its name or ID.', pending: 'tournament' }
        const tr = await findTournament(q)
        if (!tr) return { text: `No tournament found for "${q}".` }
        const [{ count: teams }, { count: matches }] = await Promise.all([
            supabase.from('teams').select('id', { count: 'exact', head: true }).eq('tournament_id', tr.id),
            supabase.from('matches').select('id', { count: 'exact', head: true }).eq('tournament_id', tr.id),
        ])
        return { text: `${tr.name} (ID ${tr.code})`, lines: [`Status: ${tr.status ?? 'n/a'}`, `Teams: ${teams ?? 0}${tr.max_teams ? ' / ' + tr.max_teams : ''}`, `Matches: ${matches ?? 0}`] }
    }
    if (intent === 'teams') {
        if (!q) return { text: 'Which tournament? Type its name or ID.', pending: 'teams' }
        const tr = await findTournament(q)
        if (!tr) return { text: `No tournament found for "${q}".` }
        const { data } = await supabase.from('teams').select('name').eq('tournament_id', tr.id).order('name')
        if (!data?.length) return { text: `${tr.name} has no teams yet.` }
        return { text: `Teams in ${tr.name} (${data.length}):`, lines: data.map((x) => x.name) }
    }
    if (intent === 'players') {
        if (!q) return { text: 'Which team? Type the team name.', pending: 'players' }
        const { data: teams } = await supabase.from('teams').select('id, name').ilike('name', `%${q.replace(/[,()%]/g, ' ')}%`).limit(1)
        if (!teams?.length) return { text: `No team found for "${q}".` }
        const { data } = await supabase.from('players').select('name').eq('team_id', teams[0].id)
        if (!data?.length) return { text: `${teams[0].name} has no players yet.` }
        return { text: `Players in ${teams[0].name}:`, lines: data.map((x) => x.name) }
    }
    return { text: 'Sorry, I did not get that.' }
}

// ---------- 3. UI ----------
export default function ChatBot() {
    const { pathname } = useLocation()
    const { user } = useAuth()
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState(false)
    const [input, setInput] = useState('')
    const [msgs, setMsgs] = useState([{ from: 'bot', text: 'Hi! Ask me about live scores, matches, tournaments, teams or how to use Falcon Sports.', chips: SUGGESTIONS }])
    const pendingRef = useRef(null)
    const endRef = useRef(null)

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, open])

    // never show on the OBS overlay or login screen
    if (pathname.startsWith('/overlay') || pathname === '/login') return null

    const send = async (text) => {
        const message = (text ?? input).trim()
        if (!message || busy) return
        setInput('')
        setMsgs((m) => [...m, { from: 'user', text: message }])
        setBusy(true)
        let reply
        try {
            const pending = pendingRef.current
            pendingRef.current = null
            const history = msgs.slice(-6).map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text || '' }))
            reply = pending
                ? await answer(message, user, pending)
                : (await askAI(message, history)) ?? (await answer(message, user, pending))
        } catch {
            reply = { text: 'Something went wrong. Please try again.' }
        }
        pendingRef.current = reply.pending || null
        setMsgs((m) => [...m, { from: 'bot', ...reply }])
        setBusy(false)
    }

    return (
        <>
            {!open && (
                <button onClick={() => setOpen(true)} aria-label="Open assistant"
                    className="fixed bottom-20 right-4 z-40 w-11 h-11 rounded-full bg-courtNavy text-falconAmber shadow-lg flex items-center justify-center active:scale-95 transition-transform">
                    <MessageCircle size={20} />
                </button>
            )}
            {open && (
                <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm h-[70vh] max-h-[560px] bg-chalk rounded-xl shadow-2xl flex flex-col overflow-hidden border border-ink/10">
                    <div className="bg-courtNavy text-chalk px-4 py-3 flex items-center justify-between">
                        <span className="font-display text-xl tracking-wide">Falcon Assistant</span>
                        <button onClick={() => setOpen(false)} aria-label="Close"><X size={20} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
                        {msgs.map((m, i) => (
                            <div key={i} className={m.from === 'user' ? 'text-right' : ''}>
                                <div className={`inline-block max-w-[90%] text-left rounded-lg px-3 py-2 ${m.from === 'user' ? 'bg-falconAmber text-courtNavy' : 'bg-white border border-ink/10'}`}>
                                    <p className="whitespace-pre-wrap">{m.text}</p>
                                    {m.lines && <ul className="mt-1.5 space-y-1 list-disc pl-4">{m.lines.map((l, j) => <li key={j}>{l}</li>)}</ul>}
                                </div>
                                {m.chips && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {m.chips.map((c) => (
                                            <button key={c} onClick={() => send(c)} className="px-2.5 py-1 rounded-full border border-ink/20 text-xs font-semibold text-ink/70">{c}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {busy && <p className="text-xs text-ink/40">Thinking…</p>}
                        <div ref={endRef} />
                    </div>
                    <div className="p-2 border-t border-ink/10 flex gap-2 bg-white">
                        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
                            placeholder="Ask about matches, teams…" className="flex-1 px-3 py-2 rounded border border-ink/15 text-sm outline-none" />
                        <button onClick={() => send()} disabled={busy || !input.trim()} aria-label="Send"
                            className="w-10 rounded bg-falconAmber text-courtNavy flex items-center justify-center disabled:opacity-40"><Send size={18} /></button>
                    </div>
                </div>
            )}
        </>
    )
}