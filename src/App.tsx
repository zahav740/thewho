import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ListPage from './pages/ListPage';
import ShiftsPage from './pages/ShiftsPage';
import ResultsPage from './pages/ResultsPage';
import PlanningDebugPage from './pages/PlanningDebugPage';
import ProductionPlanningDashboard from './components/ProductionPlanningDashboard';
import WebhookSync from './components/WebhookSync';
import ErrorBoundaryHandler from './components/ErrorBoundaryHandler';
import { AppProvider } from './context/AppContext';

import './index.css';

export function App() {
  return (
    <AppProvider>
      <ErrorBoundaryHandler />
      <Router>
        <Layout>
          <Routes>
            {/* Основные маршруты */}
            <Route path="/" element={<ListPage />} />
            <Route path="/shifts" element={<ShiftsPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/planning" element={<ProductionPlanningDashboard />} />
            <Route path="/planning-debug" element={<PlanningDebugPage />} />
          </Routes>
        </Layout>
        <WebhookSync />
      </Router>
    </AppProvider>
  );
}

export default App;
