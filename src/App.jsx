import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Login from './routes/Login'
import Dashboard from './routes/Dashboard'
import OrganiseHome from './routes/organise/OrganiseHome'
import LocalScoreboard from './routes/organise/LocalScoreboard'
import TournamentManage from './routes/organise/TournamentManage'
import FixturesScreen from './routes/organise/FixturesScreen'
import LiveScoreboardOrganiser from './routes/organise/LiveScoreboardOrganiser'
import JoinHome from './routes/join/JoinHome'
import TournamentDetails from './routes/join/TournamentDetails'
import LiveScoreViewer from './routes/join/LiveScoreViewer'
import OverlayScoreboard from './routes/OverlayScoreboard'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

      <Route path="/organise" element={<PrivateRoute><OrganiseHome /></PrivateRoute>} />
      <Route path="/organise/local-scoreboard" element={<PrivateRoute><LocalScoreboard /></PrivateRoute>} />
      <Route path="/organise/tournament/:id" element={<PrivateRoute><TournamentManage /></PrivateRoute>} />
      <Route path="/organise/tournament/:id/fixtures" element={<PrivateRoute><FixturesScreen /></PrivateRoute>} />
      <Route path="/organise/live/:matchId" element={<PrivateRoute><LiveScoreboardOrganiser /></PrivateRoute>} />

      <Route path="/join" element={<PrivateRoute><JoinHome /></PrivateRoute>} />
      <Route path="/join/tournament/:id" element={<PrivateRoute><TournamentDetails /></PrivateRoute>} />

      {/* Shared live score viewer (used from dashboard "Live Now" and tournament ScoreBar) */}
      <Route path="/match/:matchId" element={<PrivateRoute><LiveScoreViewer /></PrivateRoute>} />
      <Route path="/overlay/:matchCode" element={<OverlayScoreboard />} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
