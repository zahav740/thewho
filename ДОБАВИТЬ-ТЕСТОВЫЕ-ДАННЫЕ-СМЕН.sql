-- Скрипт добавления тестовых данных смен для проверки отображения
-- Выполните этот скрипт в базе данных PostgreSQL

-- Сначала очистим существующие тестовые данные
DELETE FROM shift_records WHERE DATE(date) = CURRENT_DATE;

-- Добавляем тестовые данные смен для станка Doosan 3 (ID = 2)
INSERT INTO shift_records (
    "machineId", 
    date, 
    "drawingNumber",
    "dayShiftOperator", 
    "dayShiftQuantity", 
    "dayShiftTimePerUnit",
    "nightShiftOperator", 
    "nightShiftQuantity", 
    "nightShiftTimePerUnit",
    archived,
    "createdAt",
    "updatedAt"
) VALUES 
(2, CURRENT_DATE, 'C6HP0021A', 'Иван', 15, 1.5, 'Аркадий', 12, 1.3, false, NOW(), NOW()),
(2, CURRENT_DATE, 'C6HP0021A', 'Сергей', 8, 1.4, 'Аркадий', 5, 1.2, false, NOW(), NOW());

-- Добавляем тестовые данные смен для станка Doosan Hadasha (ID = 3)  
INSERT INTO shift_records (
    "machineId", 
    date, 
    "drawingNumber",
    "dayShiftOperator", 
    "dayShiftQuantity", 
    "dayShiftTimePerUnit",
    "nightShiftOperator", 
    "nightShiftQuantity", 
    "nightShiftTimePerUnit",
    archived,
    "createdAt",
    "updatedAt"
) VALUES 
(3, CURRENT_DATE, 'TH1K4108A', 'Петр', 20, 1.1, 'Аркадий', 18, 1.0, false, NOW(), NOW()),
(3, CURRENT_DATE, 'TH1K4108A', 'Михаил', 7, 1.3, 'Аркадий', 3, 1.4, false, NOW(), NOW());

-- Добавляем тестовые данные смен для станка JohnFord (ID = 1)
INSERT INTO shift_records (
    "machineId", 
    date, 
    "drawingNumber",
    "dayShiftOperator", 
    "dayShiftQuantity", 
    "dayShiftTimePerUnit",
    "nightShiftOperator", 
    "nightShiftQuantity", 
    "nightShiftTimePerUnit",
    archived,
    "createdAt",
    "updatedAt"
) VALUES 
(1, CURRENT_DATE, 'A01S1104A', 'Алексей', 10, 2.0, 'Аркадий', 8, 1.8, false, NOW(), NOW()),
(1, CURRENT_DATE, 'A01S1104A', 'Николай', 5, 2.2, 'Аркадий', 4, 2.0, false, NOW(), NOW());

-- Проверяем добавленные данные
SELECT 
    sr.id,
    sr."machineId",
    sr.date,
    sr."drawingNumber",
    sr."dayShiftOperator",
    sr."dayShiftQuantity",
    sr."nightShiftOperator", 
    sr."nightShiftQuantity",
    (sr."dayShiftQuantity" + sr."nightShiftQuantity") as "totalQuantity"
FROM shift_records sr 
WHERE DATE(sr.date) = CURRENT_DATE
ORDER BY sr."machineId", sr.id;

-- Также покажем итоги по операциям
SELECT 
    sr."machineId",
    sr."drawingNumber",
    SUM(sr."dayShiftQuantity") as "totalDayShift",
    SUM(sr."nightShiftQuantity") as "totalNightShift",
    SUM(sr."dayShiftQuantity" + sr."nightShiftQuantity") as "grandTotal"
FROM shift_records sr 
WHERE DATE(sr.date) = CURRENT_DATE
GROUP BY sr."machineId", sr."drawingNumber"
ORDER BY sr."machineId";
