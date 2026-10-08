import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import "@supabase/functions-js/edge-runtime.d.ts";

const MODEL = 'openai/gpt-oss-120b' // if it ever fails, try 'openai/gpt-oss-20b' or 'llama-3.1-8b-instant'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM = `You are the assistant inside "Falcon Sports", a volleyball match and tournament app.
You ONLY help with Falcon Sports: matches, scores, sets, tournaments, teams, players, and how to use the app
(create tournament, add teams, fixtures, start match, scoring, join with Tournament ID, OBS overlay at #/overlay/<MATCHCODE>).
If the question is not about Falcon Sports, reply exactly: "Sorry, I can only help with Falcon Sports."

Rules:
- Get facts ONLY by calling tools. Never invent scores, teams or players. If a tool returns nothing, say so.
- If the user asks about several teams (even teams that never play each other), call team_matches once per team, then combine the results into one clear answer.
- "sets" = sets won (setsWonA/setsWonB); "sets" array holds the points of each set.
- Reply in the same language the user writes in. Keep answers short; use short lines, one match per line.`

const TOOLS = [
  {
    type: 'function', function: {
      name: 'team_matches',
      description: 'All matches involving a team (name can be partial), with set scores. Call once per team. status is optional: live, upcoming, completed or cancelled.',
      parameters: {
        type: 'object', properties: {
          team_name: { type: 'string' },
          status: { type: ['string', 'null'] }
        }, required: ['team_name']
      }
    }
  },
  {
    type: 'function', function: {
      name: 'list_matches',
      description: 'List matches. Both fields are optional (use null for none): status (live, upcoming, completed or cancelled) and tournament_name.',
      parameters: {
        type: 'object', properties: {
          status: { type: ['string', 'null'] },
          tournament_name: { type: ['string', 'null'] }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'tournament_info',
      description: 'Find a tournament by name or ID code; returns its details and teams.',
      parameters: { type: 'object', properties: { name_or_code: { type: 'string' } }, required: ['name_or_code'] }
    }
  },
  {
    type: 'function', function: {
      name: 'list_tournaments',
      description: 'List tournaments (name, code, status).', parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function', function: {
      name: 'team_players',
      description: 'Players of a team (name can be partial).',
      parameters: { type: 'object', properties: { team_name: { type: 'string' } }, required: ['team_name'] }
    }
  },
]

const safe = (s: unknown) => String(s ?? '').replace(/[,()%*\\]/g, ' ').trim().slice(0, 60)
const MSEL = 'status, round_label, sets_won_a, sets_won_b, team_a:team_a_id(name), team_b:team_b_id(name), tournament:tournament_id(name), match_sets(set_number, score_a, score_b, is_current)'

const fmt = (m: any) => ({
  tournament: m.tournament?.name, round: m.round_label, status: m.status,
  teamA: m.team_a?.name, teamB: m.team_b?.name,
  setsWonA: m.sets_won_a, setsWonB: m.sets_won_b,
  sets: (m.match_sets || []).sort((a: any, b: any) => a.set_number - b.set_number)
    .map((s: any) => ({ set: s.set_number, a: s.score_a, b: s.score_b, current: s.is_current })),
})

async function runTool(sb: any, name: string, a: any) {
  if (name === 'team_matches') {
    const { data: teams } = await sb.from('teams').select('id, name').ilike('name', `%${safe(a.team_name)}%`).limit(10)
    if (!teams?.length) return { error: `No team found matching "${a.team_name}"` }
    const ids = teams.map((t: any) => t.id).join(',')
    let q = sb.from('matches').select(MSEL).or(`team_a_id.in.(${ids}),team_b_id.in.(${ids})`).limit(30)
    if (a.status) q = q.eq('status', a.status)
    const { data } = await q
    return { teamsMatched: teams.map((t: any) => t.name), matches: (data || []).map(fmt) }
  }
  if (name === 'list_matches') {
    let q = sb.from('matches').select(MSEL).limit(30)
    if (a.status) q = q.eq('status', a.status)
    if (a.tournament_name) {
      const { data: ts } = await sb.from('tournaments').select('id').ilike('name', `%${safe(a.tournament_name)}%`).limit(10)
      if (!ts?.length) return { error: 'Tournament not found' }
      q = q.in('tournament_id', ts.map((t: any) => t.id))
    }
    const { data } = await q
    return { matches: (data || []).map(fmt) }
  }
  if (name === 'tournament_info') {
    const s = safe(a.name_or_code)
    const { data } = await sb.from('tournaments').select('*').or(`name.ilike.%${s}%,code.ilike.%${s}%`).limit(1)
    const t = data?.[0]
    if (!t) return { error: 'Tournament not found' }
    const { data: teams } = await sb.from('teams').select('name').eq('tournament_id', t.id)
    return { name: t.name, code: t.code, status: t.status, maxTeams: t.max_teams, teams: (teams || []).map((x: any) => x.name) }
  }
  if (name === 'list_tournaments') {
    const { data } = await sb.from('tournaments').select('name, code, status').limit(20)
    return { tournaments: data || [] }
  }
  if (name === 'team_players') {
    const { data: teams } = await sb.from('teams').select('id, name').ilike('name', `%${safe(a.team_name)}%`).limit(3)
    if (!teams?.length) return { error: 'Team not found' }
    const out = []
    for (const t of teams) {
      const { data } = await sb.from('players').select('name').eq('team_id', t.id)
      out.push({ team: t.name, players: (data || []).map((p: any) => p.name) })
    }
    return { teams: out }
  }
  return { error: 'Unknown tool' }
}

const json = (reply: string) =>
  new Response(JSON.stringify({ reply }), { headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { question, history } = await req.json()
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } })

    const past = (Array.isArray(history) ? history : []).slice(-6)
      .filter((m: any) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m: any) => ({ role: m.role, content: m.content.slice(0, 500) }))

    const messages: any[] = [{ role: 'system', content: SYSTEM }, ...past,
    { role: 'user', content: String(question || '').slice(0, 300) }]

    for (let i = 0; i < 5; i++) {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('GROQ_API_KEY')}` },
        body: JSON.stringify({ model: MODEL, messages, tools: TOOLS, tool_choice: 'auto', temperature: 0.2, max_tokens: 1500 }),
      })
      const j = await res.json()

      if (!res.ok) {
        // real reason goes to the Supabase function logs; the app falls back to the keyword bot
        console.error('Groq error', res.status, JSON.stringify(j))
        return new Response(JSON.stringify({ reply: '' }), { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } })
      }

      const msg = j.choices?.[0]?.message
      if (!msg) break
      if (!msg.tool_calls?.length) return json(msg.content || 'Sorry, I could not answer that.')

      messages.push({ role: 'assistant', content: msg.content || '', tool_calls: msg.tool_calls })
      for (const tc of msg.tool_calls) {
        let out
        try { out = await runTool(sb, tc.function.name, JSON.parse(tc.function.arguments || '{}')) }
        catch { out = { error: 'Lookup failed' } }
        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(out).slice(0, 6000) })
      }
    }
    return json('Sorry, I could not answer that.')
  } catch (e) {
    console.error('Function error', e)
    return json('Sorry, something went wrong.')
  }
})