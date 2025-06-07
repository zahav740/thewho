import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { ProductionPage } from './pages/Production/ProductionPage';
import { DatabasePage } from './pages/Database/DatabasePage';
import { ShiftsPage } from './pages/Shifts/ShiftsPage';
import { CalendarPage } from './pages/Calendar/CalendarPage';
import { ProductionPlanningPage } from './pages/Planning';
import { ActiveOperationsPage } from './pages/ActiveOperations';

const App: React.FC = () => {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/production" replace />} />
          <Route path="production" element={<ProductionPage />} />
          <Route path="database" element={<DatabasePage />} />
          <Route path="shifts" element={<ShiftsPage />} />
          <Route path="planning" element={<ProductionPlanningPage />} />
          <Route path="operations" element={<ActiveOperationsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
