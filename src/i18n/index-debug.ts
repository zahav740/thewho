import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { en } from './locales/en';
import { ru } from './locales/ru';

// Добавим дебаг информацию
console.log('Инициализация i18n...');
console.log('localStorage language:', localStorage.getItem('language'));

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en
      },
      ru: {
        translation: ru
      }
    },
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    debug: true, // Включаем дебаг режим для диагностики
    interpolation: {
      escapeValue: false
    },
    detection: {
      // Настройка детекции языка
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  })
  .then(() => {
    console.log('i18n инициализирован успешно');
    console.log('Текущий язык:', i18n.language);
    console.log('Доступные языки:', Object.keys(i18n.services.resourceStore.data));
  })
  .catch((err) => {
    console.error('Ошибка инициализации i18n:', err);
  });

export default i18n;
