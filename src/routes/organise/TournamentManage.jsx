import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Plus, ListPlus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import TeamChip from '../../components/TeamChip'
import MatchRow from '../../components/MatchRow'
import Modal from '../../components/Modal'
import DestructiveConfirmModal from '../../components/DestructiveConfirmModal'
import MatchSettingsModal from './MatchSettingsModal'

export default function TournamentManage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tournament, setTournament] = useState(null)
  const [teams, setTeams] = useState([])
  const [matches, setMatches] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [players, setPlayers] = useState([])
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newPlayerName, setNewPlayerName] = useState('')
  const [matchToStart, setMatchToStart] = useState(null)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState('')
  const [copied, setCopied] = useState(false)

  const loadAll = useCallback(async () => {
    const [{ data: t }, { data: tm }, { data: m }] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', id).single(),
      supabase.from('teams').select('*').eq('tournament_id', id).order('name'),
      supabase
        .from('matches')
        .select('*, team_a:team_a_id(name), team_b:team_b_id(name)')
        .eq('tournament_id', id)
        .order('started_at', { ascending: false }),
    ])
    setTournament(t)
    setTeams(tm || [])
    setMatches(m || [])
  }, [id])

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    if (!selectedTeam) { setPlayers([]); return }
    supabase.from('players').select('*').eq('team_id', selectedTeam.id).then(({ data }) => setPlayers(data || []))
  }, [selectedTeam])

  const copyCode = () => {
    navigator.clipboard.writeText(tournament.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const addTeam = async () => {
    if (!newTeamName.trim()) return
    await supabase.from('teams').insert({ tournament_id: id, name: newTeamName.trim() })
    setNewTeamName('')
    setShowAddTeam(false)
    loadAll()
  }

  const addPlayer = async () => {
    if (!newPlayerName.trim() || !selectedTeam) return
    await supabase.from('players').insert({ team_id: selectedTeam.id, name: newPlayerName.trim() })
    setNewPlayerName('')
    const { data } = await supabase.from('players').select('*').eq('team_id', selectedTeam.id)
    setPlayers(data || [])
  }

  const startMatch = (match) => setMatchToStart(match)

  const onMatchStarted = (matchId) => {
    setMatchToStart(null)
    navigate(`/organise/live/${matchId}`)
  }

  const deleteItem = async () => {
    setDeleting(true)
    setActionError('')
    const isTournament = itemToDelete.type === 'tournament'
    const query = isTournament
      ? supabase.from('tournaments').delete().eq('id', id).eq('organiser_id', tournament.organiser_id)
      : supabase.from('matches').delete().eq('id', itemToDelete.match.id).eq('tournament_id', id)
    const { error } = await query
    setDeleting(false)
    if (error) {
      setActionError(error.message)
      return
    }
    if (isTournament) {
      navigate('/organise')
    } else {
      setItemToDelete(null)
      loadAll()
    }
  }

  if (!tournament) return null

  return (
    <div className="min-h-screen bg-chalk pb-10">
      <header className="bg-courtNavy text-chalk px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/organise')}><ArrowLeft size={22} /></button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl tracking-wide truncate">{tournament.name}</h1>
          <button onClick={copyCode} className="flex items-center gap-1.5 text-xs text-falconAmber font-semibold">
            ID: {tournament.code} <Copy size={12} /> {copied && '· Copied'}
          </button>
        </div>
        <button
          onClick={() => { setActionError(''); setItemToDelete({ type: 'tournament' }) }}
          className="flex items-center gap-1.5 text-xs font-bold text-hawkRed bg-chalk px-3 py-2 rounded"
        >
          <Trash2 size={15} /> Delete
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-4">
        {/* Teams */}
        <section className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-xl tracking-wide">Teams</h2>
            <button onClick={() => setShowAddTeam(true)} className="flex items-center gap-1 text-sm font-semibold text-courtNavy">
              <Plus size={16} /> Add Team
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {teams.length === 0 && <p className="text-sm text-ink/40">No teams yet — add your first team.</p>}
            {teams.map((t) => (
              <TeamChip key={t.id} team={t} active={selectedTeam?.id === t.id} onClick={() => setSelectedTeam(t)} />
            ))}
          </div>
        </section>

        {/* Create matches action */}
        <section className="mt-6">
          <button
            onClick={() => navigate(`/organise/tournament/${id}/fixtures`)}
            disabled={teams.length < 2}
            className="w-full flex items-center justify-center gap-2 bg-falconAmber disabled:opacity-40 text-courtNavy font-bold py-3 rounded"
          >
            <ListPlus size={18} /> Create Matches
          </button>
          {teams.length < 2 && <p className="text-xs text-ink/40 text-center mt-1.5">Add at least 2 teams first.</p>}
        </section>

        {/* Matches */}
        <section className="mt-6">
          <h2 className="font-display text-xl tracking-wide mb-2">Matches</h2>
          {matches.length === 0 ? (
            <p className="text-sm text-ink/40 bg-white px-4 py-6 rounded text-center">No matches created yet.</p>
          ) : (
            <div className="space-y-2">
              {matches.map((m) => (
                <MatchRow
                  key={m.id}
                  match={m}
                  editable
                  onEdit={() => navigate(`/organise/tournament/${id}/fixtures`)}
                  onStart={startMatch}
                  onOpenLive={(match) => navigate(`/organise/live/${match.id}`)}
                  onDelete={(match) => { setActionError(''); setItemToDelete({ type: 'match', match }) }}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Add team modal */}
      {showAddTeam && (
        <Modal
          title="Add Team"
          onClose={() => setShowAddTeam(false)}
          footer={
            <button onClick={addTeam} disabled={!newTeamName.trim()} className="w-full bg-falconAmber text-courtNavy font-bold py-3 rounded disabled:opacity-40">
              Add Team
            </button>
          }
        >
          <input
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Team name"
            className="w-full px-3 py-2.5 rounded border border-ink/15 focus:outline-none focus:border-falconAmber"
            autoFocus
          />
        </Modal>
      )}

      {/* Players slide-over */}
      {selectedTeam && (
        <Modal title={`${selectedTeam.name} — Players`} onClose={() => setSelectedTeam(null)}>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Player name (optional)"
                className="flex-1 px-3 py-2 rounded border border-ink/15 focus:outline-none focus:border-falconAmber"
              />
              <button onClick={addPlayer} className="px-4 py-2 rounded bg-courtNavy text-chalk text-sm font-semibold">Add</button>
            </div>
            {players.length === 0 ? (
              <p className="text-sm text-ink/40">No players added — that's fine, it's optional.</p>
            ) : (
              <ul className="space-y-1.5">
                {players.map((p) => (
                  <li key={p.id} className="text-sm bg-ink/[0.03] px-3 py-2 rounded">{p.name}</li>
                ))}
              </ul>
            )}
          </div>
        </Modal>
      )}

      {matchToStart && (
        <MatchSettingsModal match={matchToStart} onClose={() => setMatchToStart(null)} onStarted={onMatchStarted} />
      )}

      {itemToDelete && (
        <DestructiveConfirmModal
          title={itemToDelete.type === 'tournament' ? 'Delete tournament?' : 'Delete match?'}
          description={itemToDelete.type === 'tournament'
            ? 'This permanently deletes the tournament, its teams, fixtures, and scores.'
            : `This permanently deletes ${itemToDelete.match.team_a?.name || 'Team A'} vs ${itemToDelete.match.team_b?.name || 'Team B'} and its score.`}
          confirmationText={itemToDelete.type === 'tournament' ? tournament.name : `${itemToDelete.match.team_a?.name || 'Team A'} vs ${itemToDelete.match.team_b?.name || 'Team B'}`}
          onClose={() => setItemToDelete(null)}
          onConfirm={deleteItem}
          busy={deleting}
        />
      )}
      {actionError && <p className="fixed bottom-4 left-4 right-4 z-[60] bg-hawkRed text-white px-4 py-3 rounded text-sm">{actionError}</p>}
    </div>
  )
}
