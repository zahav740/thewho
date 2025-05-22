import { ReactNode, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChartBar, ClipboardList, Clock, Settings, FileText, Calendar, Bug } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import OperatorsModal from './OperatorsModal';
import JsonExportModal from './JsonExportModal';
import WorkingDaysCalendarModal from './WorkingDaysCalendarModal';
import SyncStatusIndicator from './SyncStatusIndicator';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslation();
  const [isOperatorsModalOpen, setIsOperatorsModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Montserrat:wght@600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row" style={{ fontFamily: 'Roboto, sans-serif' }}>
      {/* Sidebar */}
      <nav className="bg-white w-full md:w-64 shadow-lg flex md:flex-col items-center justify-between md:justify-start py-4 md:py-8">
        <div className="mb-0 md:mb-10 px-4 md:px-0">
          <h1 className="font-bold text-blue-600 text-2xl" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {t('app_name')}
          </h1>
          <div className="mt-1 text-xs text-gray-400 italic leading-tight" style={{ 
            fontFamily: 'Georgia, serif',
            fontSize: '10px',
            lineHeight: '1.2',
            letterSpacing: '0.5px'
          }}
          dangerouslySetInnerHTML={{ __html: "\"I'm free, And freedom tastes of reality\"" }}
          />
        </div>
        
        <div className="flex md:flex-col space-x-4 md:space-x-0 md:space-y-2 w-full md:px-4 overflow-x-auto md:overflow-x-visible">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `p-3 rounded-xl transition-all flex items-center md:w-full ${
                isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
              }`
            }
            title={t('orders_list')}
          >
            <ClipboardList size={24} className="flex-shrink-0" />
            <span className="ml-3 truncate">{t('orders_list')}</span>
          </NavLink>
          
          <NavLink 
            to="/shifts" 
            className={({ isActive }) => 
              `p-3 rounded-xl transition-all flex items-center md:w-full ${
                isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
              }`
            }
            title={t('shifts')}
          >
            <Clock size={24} className="flex-shrink-0" />
            <span className="ml-3 truncate">{t('shifts')}</span>
          </NavLink>
          
          <NavLink 
            to="/planning" 
            className={({ isActive }) => 
              `p-3 rounded-xl transition-all flex items-center md:w-full ${
                isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
              }`
            }
            title={t('production_planning')}
          >
            <ChartBar size={24} className="flex-shrink-0" />
            <span className="ml-3 truncate">{t('production_planning')}</span>
          </NavLink>
          
          <NavLink 
            to="/results" 
            className={({ isActive }) => 
              `p-3 rounded-xl transition-all flex items-center md:w-full ${
                isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
              }`
            }
            title={t('results')}
          >
            <FileText size={24} className="flex-shrink-0" />
            <span className="ml-3 truncate">{t('results')}</span>
          </NavLink>
          
          {/* Отладка планирования */}
          {process.env.NODE_ENV === 'development' && (
            <NavLink 
              to="/planning-debug" 
              className={({ isActive }) => 
                `p-3 rounded-xl transition-all flex items-center md:w-full ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
                }`
              }
              title="Отладка планирования"
            >
              <Bug size={24} className="flex-shrink-0" />
              <span className="ml-3 truncate">Отладка планирования</span>
            </NavLink>
          )}
          
          {/* Calendar button */}
          <button
            onClick={() => setIsCalendarModalOpen(true)}
            className="p-3 rounded-xl transition-all flex items-center text-gray-500 hover:bg-gray-100 md:w-full"
            title={t('working_days')}
          >
            <Calendar size={24} className="flex-shrink-0" />
            <span className="ml-3 truncate">{t('working_days')}</span>
          </button>
        </div>

        <div className="flex md:flex-col md:mt-auto space-x-4 md:space-x-0 md:space-y-4 px-4 md:px-4 md:mb-8">
          <button
            onClick={() => setIsJsonModalOpen(true)}
            className="p-3 rounded-xl transition-all text-gray-500 hover:bg-gray-100 flex items-center md:w-full"
            title={t('json_export_import')}
          >
            <FileText size={24} className="flex-shrink-0" />
            <span className="ml-3 truncate">JSON</span>
          </button>
          
          <button
            onClick={() => setIsOperatorsModalOpen(true)}
            className="p-3 rounded-xl transition-all text-gray-500 hover:bg-gray-100 flex items-center md:w-full"
            title={t('settings')}
          >
            <Settings size={24} className="flex-shrink-0" />
            <span className="ml-3 truncate">{t('settings')}</span>
          </button>
          
          <LanguageSwitcher />
          
          {/* Индикатор синхронизации */}
          <SyncStatusIndicator />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        {children}
      </main>
      
      {/* Operators Modal */}
      <OperatorsModal 
        isOpen={isOperatorsModalOpen} 
        onClose={() => setIsOperatorsModalOpen(false)} 
      />
      
      {/* JSON Export Modal */}
      <JsonExportModal 
        isOpen={isJsonModalOpen} 
        onClose={() => setIsJsonModalOpen(false)} 
      />
      
      {/* Working Days Calendar Modal */}
      <WorkingDaysCalendarModal 
        isOpen={isCalendarModalOpen} 
        onClose={() => setIsCalendarModalOpen(false)} 
      />
    </div>
  );
}