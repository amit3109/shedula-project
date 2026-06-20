import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProjectBoard from './pages/ProjectBoard';
import CalendarView from './pages/CalendarView';
import Team from './pages/Team';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import CommandPalette from './components/CommandPalette';
import Inbox from './pages/Inbox';

// ─── 🛡️ THE GATEKEEPER (PROTECTED ROUTE) ─────────────────────────────────
// This function wraps our private pages. If a user tries to type "/dashboard" 
// into the URL bar without being logged in, this instantly intercepts them 
// and throws them back to the login page.
function ProtectedRoute({ children }) {
  const isAuthenticated = !!localStorage.getItem('token');

  if (!isAuthenticated) {
    // Redirect them to the login page, and replace the history 
    // so they can't click the "back" button to bypass it.
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <CommandPalette />

      <Routes>
        {/* ── PUBLIC ROUTES (Anyone can visit these) ── */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── PRIVATE ROUTES (Locked behind the Gatekeeper) ── */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />
        <Route
          path="/projects"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />
        <Route
          path="/project/:projectId"
          element={<ProtectedRoute><ProjectBoard /></ProtectedRoute>}
        />
        <Route
          path="/calendar"
          element={<ProtectedRoute><CalendarView /></ProtectedRoute>}
        />
        <Route
          path="/team"
          element={<ProtectedRoute><Team /></ProtectedRoute>}
        />
        <Route
          path="/reports"
          element={<ProtectedRoute><Reports /></ProtectedRoute>}
        />
        <Route
          path="/settings"
          element={<ProtectedRoute><Settings /></ProtectedRoute>}
        />
        {/* 🚀 FIXED: Moved Inbox inside the <Routes> block */}
        <Route
          path="/inbox"
          element={<ProtectedRoute><Inbox /></ProtectedRoute>}
        />
      </Routes>
    </Router>
  );
}

export default App;