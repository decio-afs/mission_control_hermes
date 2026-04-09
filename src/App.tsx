import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import GhostNetwork from './pages/GhostNetwork';
import WarRoom from './pages/WarRoom';
import OperationsCenter from './pages/OperationsCenter';
import IntelligenceDeck from './pages/IntelligenceDeck';
import ContentFactory from './pages/ContentFactory';
import WorkflowBuilder from './pages/WorkflowBuilder';
import Archives from './pages/Archives';
import BriefingTerminal from './pages/BriefingTerminal';
import SocialPublishing from './pages/SocialPublishing';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/network" replace />} />
          <Route path="network" element={<GhostNetwork />} />
          <Route path="war-room" element={<WarRoom />} />
          <Route path="operations" element={<OperationsCenter />} />
          <Route path="intelligence" element={<IntelligenceDeck />} />
          <Route path="factory" element={<ContentFactory />} />
          <Route path="builder" element={<WorkflowBuilder />} />
          <Route path="archives" element={<Archives />} />
          <Route path="briefing" element={<BriefingTerminal />} />
          <Route path="broadcast" element={<SocialPublishing />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
