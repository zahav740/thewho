/**
 * @file: ImprovedExcelImportPage.tsx
 * @description: Страница с улучшенным импортом Excel файлов
 * @created: 2025-07-03
 */
import React from 'react';
import ImprovedExcelUploader from '../components/ExcelUploader/ImprovedExcelUploader';

const ImprovedExcelImportPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Улучшенная загрузка Excel файлов</h1>
        <p className="page-description">
          Новая версия модуля загрузки Excel файлов с дефолтными колонками и расширенными возможностями настройки.
        </p>
      </div>

      <div className="page-content">
        <ImprovedExcelUploader />
      </div>
    </div>
  );
};

export default ImprovedExcelImportPage;
