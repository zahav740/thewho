import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ru' ? 'en' : 'ru';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <button 
      onClick={toggleLanguage}
      className="flex items-center space-x-2 p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
      title={`Switch to ${i18n.language === 'ru' ? 'English' : 'Русский'}`}
    >
      <Globe className="h-5 w-5" />
      <span className="font-medium">
        {i18n.language === 'ru' ? '🇷🇺 RU' : '🇺🇸 EN'}
      </span>
      <span className="text-xs text-gray-500 md:hidden">
        {i18n.language === 'ru' ? 'Русский' : 'English'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;