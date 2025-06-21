import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from './i18n';
import { AuthProvider } from './contexts/AuthContext';
import { MobileWrapper } from './components/Mobile/MobileWrapper';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { Layout } from './components/Layout/Layout';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { ProductionPage } from './pages/Production/ProductionPage';
import { DatabasePage } from './pages/Database/DatabasePage';
import { ShiftsPage } from './pages/Shifts/ShiftsPage';
import { CalendarPage } from './pages/Calendar/CalendarPage';
import { ActiveOperationsPage } from './pages/ActiveOperations';
import { OperatorsPage } from './pages/Operators';
import { TranslationsPage } from './pages/Translations';
import { TranslationTestPage } from './pages/TranslationTest/TranslationTestPage';
import { LanguageSwitcherDemo } from './components/LanguageSwitcher/LanguageSwitcherDemo';

const App: React.FC = () => {
  return (
    <I18nProvider>
      <AuthProvider>
        <MobileWrapper>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              {/* Публичные маршруты */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Защищенные маршруты */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/database" replace />} />
                <Route path="database" element={<DatabasePage />} />
                <Route path="production" element={<ProductionPage />} />
                <Route path="shifts" element={<ShiftsPage />} />
                <Route path="operations" element={<ActiveOperationsPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="operators" element={<OperatorsPage />} />
                <Route path="translations" element={<TranslationsPage />} />
                <Route path="translation-test" element={<TranslationTestPage />} />
                <Route path="language-demo" element={<LanguageSwitcherDemo />} />
              </Route>
            </Routes>
          </Router>
        </MobileWrapper>
      </AuthProvider>
    </I18nProvider>
  );
};

export default App;
