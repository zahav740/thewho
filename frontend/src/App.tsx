import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from './i18n';
import { Layout } from './components/Layout/Layout';
import { ProductionPage } from './pages/Production/ProductionPage';
import { DatabasePage } from './pages/Database/DatabasePage';
import { ShiftsPage } from './pages/Shifts/ShiftsPage';
import { CalendarPage } from './pages/Calendar/CalendarPage';
import { ProductionPlanningPage } from './pages/Planning';
import { ActiveOperationsPage } from './pages/ActiveOperations';
import { OperationHistory } from './pages/OperationHistory';
import { OperatorsPage } from './pages/Operators';
import { TranslationsPage } from './pages/Translations';
import { TranslationTestPage } from './pages/TranslationTest/TranslationTestPage';

const App: React.FC = () => {
  return (
    <I18nProvider>
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
            <Route path="operators" element={<OperatorsPage />} />
            <Route path="planning" element={<ProductionPlanningPage />} />
            <Route path="operations" element={<ActiveOperationsPage />} />
            <Route path="operation-history" element={<OperationHistory />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="translations" element={<TranslationsPage />} />
            <Route path="translation-test" element={<TranslationTestPage />} />
          </Route>
        </Routes>
      </Router>
    </I18nProvider>
  );
};

export default App;
