@echo off
echo ============================================
echo   ПРОВЕРКА ТАБЛИЦЫ EXCEL_FILES
echo ============================================
echo.

echo 🔍 Проверяем, существует ли таблица excel_files...
echo.

REM Проверка таблицы в PostgreSQL
psql -U postgres -d thewho -c "\dt" | find "excel_files"

if %ERRORLEVEL% EQU 0 (
    echo ✅ Таблица excel_files существует
    echo.
    echo 📊 Структура таблицы:
    psql -U postgres -d thewho -c "\d excel_files"
) else (
    echo ❌ Таблица excel_files НЕ НАЙДЕНА!
    echo.
    echo 📋 Доступные таблицы:
    psql -U postgres -d thewho -c "\dt"
    echo.
    echo 🔧 Создаем таблицу excel_files...
    echo.
    
    REM Создаем таблицу вручную
psql -U postgres -d thewho -c "
CREATE TABLE IF NOT EXISTS excel_files (
    id SERIAL PRIMARY KEY,
    originalName VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    fileSize BIGINT NOT NULL,
    mimeType VARCHAR(100) NOT NULL,
    fileHash VARCHAR(64) NOT NULL,
    fileData BYTEA NOT NULL,
    headers JSON,
    parsedData TEXT,
    rowsCount INTEGER DEFAULT 0,
    sheetsCount INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'uploading' CHECK (status IN ('uploading', 'parsed', 'error', 'processing')),
    errorMessage TEXT,
    uploadedBy VARCHAR(255),
    metadata JSON,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS IDX_excel_files_originalName ON excel_files (originalName);
CREATE INDEX IF NOT EXISTS IDX_excel_files_createdAt ON excel_files (createdAt);
CREATE INDEX IF NOT EXISTS IDX_excel_files_status ON excel_files (status);
CREATE INDEX IF NOT EXISTS IDX_excel_files_fileHash ON excel_files (fileHash);
"
    
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Таблица excel_files создана успешно!
    ) else (
        echo ❌ Ошибка создания таблицы!
    )
)

echo.
echo ============================================
pause
