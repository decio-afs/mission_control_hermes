import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Cyberpunk from './pages/Cyberpunk';
import GhostNetwork from './pages/GhostNetwork';
import AgentHub from './pages/AgentHub';
import WarRoom from './pages/WarRoom';
import OperationsCenter from './pages/OperationsCenter';
import IntelligenceDeck from './pages/IntelligenceDeck';
import ContentFactory from './pages/ContentFactory';
import BriefingTerminal from './pages/BriefingTerminal';
import WorkflowBuilder from './pages/WorkflowBuilder';
import Archives from './pages/Archives';
import BroadcastUplink from './pages/BroadcastUplink';
import ChatTerminal from './pages/ChatTerminal';
import LeadTracker from './pages/LeadTracker';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/command" replace />} />
          {/* Live Hermes-backed modules */}
          <Route path="command" element={<Cyberpunk />} />
          <Route path="network" element={<GhostNetwork />} />
          <Route path="agent-hub" element={<AgentHub />} />
          <Route path="war-room" element={<WarRoom />} />
          <Route path="operations" element={<OperationsCenter />} />
          <Route path="leads" element={<LeadTracker />} />
          {/* Design showcase modules (static demo data) */}
          <Route path="intelligence" element={<IntelligenceDeck />} />
          <Route path="factory" element={<ContentFactory />} />
          <Route path="briefing" element={<BriefingTerminal />} />
          <Route path="builder" element={<WorkflowBuilder />} />
          <Route path="archives" element={<Archives />} />
          <Route path="broadcast" element={<BroadcastUplink />} />
          <Route path="chat" element={<ChatTerminal />} />
          {/* Legacy redirects */}
          <Route path="signal-intelligence" element={<Navigate to="/war-room" replace />} />
          <Route path="cyberpunk" element={<Navigate to="/command" replace />} />
          <Route path="*" element={<Navigate to="/command" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
