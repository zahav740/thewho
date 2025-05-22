import { useEffect } from 'react';

const ErrorBoundaryHandler = () => {
  useEffect(() => {
    // Обработчик JavaScript ошибок
    const handleError = (event: ErrorEvent) => {
      // Фильтруем ошибки от внешних скриптов и расширений браузера
      const ignoredErrors = [
        'attribute d: Expected number',
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'The provided value is not of type \'NodeList\'',
        'Script error',
        'Loading chunk',
        'Loading CSS chunk',
        'QuotaExceededError',
        'Failed to execute \'setItem\' on \'Storage\'',
        'toLowerCase is not a function',
        'Cannot read properties of undefined',
        'Cannot read property of undefined'
      ];

      const shouldIgnore = ignoredErrors.some(error => 
        event.message?.includes(error) || 
        event.filename?.includes('extension') ||
        event.filename?.includes('jquery') ||
        event.filename?.includes('chrome-extension')
      );

      if (shouldIgnore) {
        event.preventDefault();
        return false;
      }
    };

    // Обработчик отклоненных промисов
    const handleRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || String(event.reason);
      
      const ignoredRejections = [
        'message channel closed',
        'listener indicated an asynchronous response',
        'Extension context invalidated',
        'Could not establish connection'
      ];

      const shouldIgnore = ignoredRejections.some(error => 
        message.includes(error)
      );

      if (shouldIgnore) {
        event.preventDefault();
        return false;
      }
    };

    // Добавляем слушатели
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Очистка при размонтировании
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null; // Компонент ничего не рендерит
};

export default ErrorBoundaryHandler;
