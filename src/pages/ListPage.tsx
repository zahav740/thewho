import { useState, useEffect } from 'react';
import { Search, Upload, Edit, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import OrderForm from '../components/OrderForm';
import EditOrderModal from '../components/EditOrderModal';
import SupabaseSync from '../components/SupabaseSync';
import { Order } from '../types';
import * as XLSX from 'xlsx';

export default function ListPage() {
  const { t } = useTranslation();
  const { orders, addOrder, deleteOrder } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [columnMappings, setColumnMappings] = useState({
    drawingNumber: '',
    deadline: '',
    quantity: '',
    priority: ''
  });
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [originalExcelData, setOriginalExcelData] = useState<any[]>([]);
  const [colorFilter, setColorFilter] = useState<'all' | 'exclude_green' | 'only_green'>('all');
  const [cellColors, setCellColors] = useState<Map<string, string>>(new Map());
  const [detectedColors, setDetectedColors] = useState<string[]>([]);
  // Функция для определения цвета ячейки
  const getCellColor = (worksheet: any, row: number, col: number): string | null => {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = worksheet[cellAddress];
    
    if (!cell) return null;
    
    // Проверяем стили ячейки
    if (cell.s) {
      // Проверяем fill (заливка/фон)
      if (cell.s.fill) {
        if (cell.s.fill.fgColor) {
          // RGB цвет
          if (cell.s.fill.fgColor.rgb) {
            const rgb = cell.s.fill.fgColor.rgb;
            return rgb.startsWith('#') ? rgb : `#${rgb}`;
          }
          // Индексный цвет
          if (cell.s.fill.fgColor.indexed !== undefined) {
            const colorMap: Record<number, string> = {
              10: '#00FF00', // ярко-зеленый
              11: '#00FF00', // светло-зеленый
              43: '#92D050', // светло-зеленый
              50: '#00B050', // темно-зеленый
              35: '#00B050', // зеленый
              42: '#00AC4A', // темно-зеленый
              51: '#C6E0B4', // очень светло-зеленый
              3: '#FF0000',  // красный
              5: '#0000FF',  // синий
              4: '#00FF00',  // зеленый (другой индекс)
            };
            const color = colorMap[cell.s.fill.fgColor.indexed];
            if (color) return color;
          }
          // Цвет по теме
          if (cell.s.fill.fgColor.theme !== undefined) {
            // Обработка тематических цветов
            const themeColors: Record<number, string> = {
              2: '#00FF00', // зеленый в теме
              5: '#00B050', // темно-зеленый
            };
            return themeColors[cell.s.fill.fgColor.theme] || null;
          }
        }
        
        // Проверяем bgColor
        if (cell.s.fill.bgColor) {
          if (cell.s.fill.bgColor.rgb) {
            const rgb = cell.s.fill.bgColor.rgb;
            return rgb.startsWith('#') ? rgb : `#${rgb}`;
          }
          if (cell.s.fill.bgColor.indexed !== undefined) {
            const colorMap: Record<number, string> = {
              10: '#00FF00',
              43: '#92D050',
              50: '#00B050',
              35: '#00B050',
              42: '#00AC4A',
              51: '#C6E0B4',
            };
            return colorMap[cell.s.fill.bgColor.indexed] || null;
          }
        }
      }
      
      // Проверяем старые свойства (для совместимости)
      if (cell.s.fgColor || cell.s.bgColor) {
        const fgColor = cell.s.fgColor;
        const bgColor = cell.s.bgColor;
        
        if (fgColor) {
          if (fgColor.rgb) {
            const rgb = fgColor.rgb;
            return rgb.startsWith('#') ? rgb : `#${rgb}`;
          }
          if (fgColor.indexed !== undefined) {
            const colorMap: Record<number, string> = {
              10: '#00FF00', 43: '#92D050', 50: '#00B050',
              35: '#00B050', 42: '#00AC4A', 51: '#C6E0B4',
              3: '#FF0000', 5: '#0000FF', 4: '#00FF00'
            };
            return colorMap[fgColor.indexed] || null;
          }
        }
        
        if (bgColor) {
          if (bgColor.rgb) {
            const rgb = bgColor.rgb;
            return rgb.startsWith('#') ? rgb : `#${rgb}`;
          }
          if (bgColor.indexed !== undefined) {
            const colorMap: Record<number, string> = {
              10: '#00FF00', 43: '#92D050', 50: '#00B050',
              35: '#00B050', 42: '#00AC4A', 51: '#C6E0B4'
            };
            return colorMap[bgColor.indexed] || null;
          }
        }
      }
    }
    
    // Проверяем HTML содержимое (если есть)
    if (cell.h && typeof cell.h === 'string') {
      // Ищем цвет в HTML стилях
      const bgColorMatch = cell.h.match(/background-color:\s*([^;]+)/i);
      if (bgColorMatch) {
        const color = bgColorMatch[1].trim();
        if (color.startsWith('#')) return color;
        if (color.startsWith('rgb')) {
          // Преобразовываем rgb в hex
          const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (rgbMatch) {
            const [, r, g, b] = rgbMatch;
            return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
          }
        }
      }
    }
    
    return null;
  };
  
  // Функция для проверки, является ли цвет зеленым
  const isGreenColor = (color: string): boolean => {
    if (!color) return false;
    const normalizedColor = color.toUpperCase();
    
    // Основные зеленые цвета
    const greenColors = [
      '#00FF00', '#00ff00', // ярко-зеленый
      '#92D050', '#92d050', // светло-зеленый
      '#00B050', '#00b050', // темно-зеленый
      '#00AC4A', '#00ac4a', // темно-зеленый
      '#C6E0B4', '#c6e0b4', // очень светло-зеленый
      '#008000', '#90EE90', // стандартные зеленые
      '#98FB98', '#00FA9A', // светло-зеленые
      '#32CD32', '#7CFC00', // ярко-зеленые
      '#ADFF2F', '#9AFF9A', // светло-зеленые
      '#228B22', '#006400', // темно-зеленые
      '#8FBC8F', '#F0FFF0', // бледно-зеленые
      '#E6FFE6', '#F5FFF5'  // очень светлые зеленые
    ];
    
    if (greenColors.includes(normalizedColor)) {
      return true;
    }
    
    // Проверяем RGB значения (для любых оттенков зеленого)
    if (normalizedColor.startsWith('#') && normalizedColor.length === 7) {
      const r = parseInt(normalizedColor.substr(1, 2), 16);
      const g = parseInt(normalizedColor.substr(3, 2), 16);
      const b = parseInt(normalizedColor.substr(5, 2), 16);
      
      // Цвет считается зеленым, если:
      // 1. Зеленая составляющая больше красной и синей
      // 2. Зеленая составляющая больше определенного порога
      return g > r && g > b && g > 100;
    }
    
    return false;
  };
  
  // Функция для фильтрации строк по цвету
  const filterRowsByColor = (rows: any[][], colors: Map<string, string>, filter: 'all' | 'exclude_green' | 'only_green'): any[][] => {
    console.log(`Filtering ${rows.length} rows with filter: ${filter}`);
    console.log('Colors map:', colors);
    
    const filteredRows = rows.filter((_, rowIndex) => {
      // Проверяем, есть ли зеленые ячейки в этой строке
      const cellsInRow = Array.from(colors.entries()).filter(([key]) => {
        const [r] = key.split('-').map(Number);
        return r === rowIndex;
      });
      
      const greenCellsInRow = cellsInRow.filter(([, color]) => isGreenColor(color));
      const hasGreenColor = greenCellsInRow.length > 0;
      
      if (hasGreenColor) {
        console.log(`Row ${rowIndex} has green cells:`, greenCellsInRow);
      }
      
      switch (filter) {
        case 'exclude_green':
          return !hasGreenColor;
        case 'only_green':
          return hasGreenColor;
        case 'all':
        default:
          return true;
      }
    });
    
    console.log(`After filtering: ${filteredRows.length} rows`);
    return filteredRows;
  };
  const findHeaderRow = (data: any[][]) => {
    // Ищем строку, которая содержит текстовые значения в многих ячейках
    for (let rowIndex = 0; rowIndex < Math.min(data.length, 10); rowIndex++) {
      const row = data[rowIndex];
      if (!Array.isArray(row)) continue;
      
      // Подсчитываем количество непустых текстовых ячеек
      const textCells = row.filter(cell => {
        if (!cell) return false;
        const cellStr = String(cell).trim();
        return cellStr.length > 0 && isNaN(Number(cell));
      });
      
      // Если в строке больше 3 текстовых ячеек, скорее всего это заголовки
      if (textCells.length >= 3) {
        console.log(`Found potential header row at index ${rowIndex}:`, row);
        return rowIndex;
      }
    }
    
    // Если не нашли, возвращаем первую строку
    return 0;
  };
  // Функция для автоматического сопоставления колонок с поддержкой иврита
  const autoMapColumns = (headers: string[]) => {
    const mappings = {
      drawingNumber: '',
      deadline: '',
      quantity: '',
      priority: ''
    };

    // Ищем подходящие колонки по ключевым словам (русский, английский, иврит)
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      
      // Номер чертежа / артикул / мкт
      if (!mappings.drawingNumber && (
        lowerHeader.includes('номер') || 
        lowerHeader.includes('чертеж') || 
        lowerHeader.includes('drawing') || 
        lowerHeader.includes('number') || 
        lowerHeader.includes('№') ||
        lowerHeader.includes('артикул') ||
        lowerHeader.includes('деталь') ||
        lowerHeader.includes('מקט') || // мкт (артикул на иврите)
        lowerHeader.includes('part') ||
        lowerHeader.includes('item')
      )) {
        mappings.drawingNumber = header;
      }
      
      // Дедлайн / срок поставки
      if (!mappings.deadline && (
        lowerHeader.includes('дедлайн') || 
        lowerHeader.includes('срок') || 
        lowerHeader.includes('deadline') || 
        lowerHeader.includes('дата') || 
        lowerHeader.includes('date') ||
        lowerHeader.includes('готовность') ||
        lowerHeader.includes('поставка') ||
        lowerHeader.includes('аспка') || // аспка (поставка на иврите)
        lowerHeader.includes('אספקה') || // аспака (поставка)
        lowerHeader.includes('delivery') ||
        lowerHeader.includes('due')
      )) {
        mappings.deadline = header;
      }
      
      // Количество
      if (!mappings.quantity && (
        lowerHeader.includes('количество') || 
        lowerHeader.includes('кол-во') || 
        lowerHeader.includes('кол') || 
        lowerHeader.includes('quantity') || 
        lowerHeader.includes('шт') ||
        lowerHeader.includes('qty') ||
        lowerHeader.includes('count') ||
        lowerHeader.includes('כמות') || // кмут (количество на иврите)
        lowerHeader.includes('amount')
      )) {
        mappings.quantity = header;
      }
      
      // Приоритет / статус
      if (!mappings.priority && (
        lowerHeader.includes('приоритет') || 
        lowerHeader.includes('priority') || 
        lowerHeader.includes('важность') || 
        lowerHeader.includes('срочность') ||
        lowerHeader.includes('status') ||
        lowerHeader.includes('статус') ||
        lowerHeader.includes('סטטוס') || // статус на иврите
        lowerHeader.includes('דחיפויות') // дхифуйот (приоритеты на иврите)
      )) {
        mappings.priority = header;
      }
    });

    return mappings;
  };

  // Обновляем данные при изменении цветового фильтра
  useEffect(() => {
    if (originalExcelData.length > 0 && cellColors.size > 0) {
      const filteredRows = filterRowsByColor(originalExcelData, cellColors, colorFilter);
      setExcelData(filteredRows);
    }
  }, [colorFilter, originalExcelData, cellColors]);
  
  // Функция для применения цветового фильтра к уже загруженным данным
  const applyColorFilter = () => {
    if (originalExcelData.length > 0) {
      const filteredRows = filterRowsByColor(originalExcelData, cellColors, colorFilter);
      setExcelData(filteredRows);
    }
  };
  
  const filteredOrders = orders.filter(order => 
    order.drawingNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const fileData = evt.target?.result;
        let workbook;
        
        // Чтение файла с поддержкой стилей
        if (fileData instanceof ArrayBuffer) {
          workbook = XLSX.read(fileData, { 
            type: 'array',
            cellStyles: true,
            cellHTML: true,
            cellNF: true,
            cellDates: true
          });
        } else {
          workbook = XLSX.read(fileData, { 
            type: 'binary',
            cellStyles: true,
            cellHTML: true,
            cellNF: true,
            cellDates: true
          });
        }
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        console.log('Worksheet object:', worksheet);
        console.log('Sample cell with style:', worksheet['A1']);
        
        // Получаем все данные как массив массивов
        const excelSheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
        
        // Анализируем цвета ячеек более детально
        const colors = new Map<string, string>();
        const uniqueColors = new Set<string>();
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        
        console.log('Analyzing colors in range:', range);
        
        for (let row = range.s.r; row <= range.e.r; row++) {
          for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];
          
          if (cell) {
          console.log(`Cell ${cellAddress}:`, {
          value: cell.v,
          style: cell.s,
          html: cell.h
          });
          
          const color = getCellColor(worksheet, row, col);
          if (color) {
          colors.set(`${row}-${col}`, color);
          uniqueColors.add(color);
          console.log(`Found color ${color} at ${cellAddress}`);
          }
          }
          }
        }
        
        console.log('Detected colors:', Array.from(uniqueColors));
        console.log('Cell colors map:', colors);
        
        console.log('Raw Excel data:', excelSheetData); // Отладочная информация
        
        if (excelSheetData.length > 0) {
          // Автоматически находим строку с заголовками
          const foundHeaderRowIndex = findHeaderRow(excelSheetData);
          console.log(`Using header row at index: ${foundHeaderRowIndex}`);
          
          // Получаем заголовки из найденной строки
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
          const headers: string[] = [];
          
          // Читаем заголовки из найденной строки
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: foundHeaderRowIndex, c: col });
            const cell = worksheet[cellAddress];
            
            if (cell) {
              let headerValue = '';
              if (cell.w) {
                headerValue = String(cell.w).trim();
              } else if (cell.v !== undefined && cell.v !== null) {
                headerValue = String(cell.v).trim();
              } else if (cell.h) {
                headerValue = String(cell.h).trim();
              }
              
              headers.push(headerValue || `Колонка ${col + 1}`);
            } else {
              headers.push(`Колонка ${col + 1}`);
            }
          }
          
          console.log('Extracted headers:', headers);
          
          // Также попробуем альтернативный способ - получим заголовки из массива данных
          if (excelSheetData[foundHeaderRowIndex]) {
            const rowHeaders = excelSheetData[foundHeaderRowIndex] as any[];
            rowHeaders.forEach((header, index) => {
              if (header && String(header).trim() && (!headers[index] || headers[index].startsWith('Колонка'))) {
                headers[index] = String(header).trim();
              }
            });
          }
          
          // Убираем пустые колонки в конце
          while (headers.length > 0 && 
                 (headers[headers.length - 1] === '' || headers[headers.length - 1].startsWith('Колонка'))) {
            const hasDataInColumn = excelSheetData.slice(foundHeaderRowIndex + 1).some(row => 
              Array.isArray(row) && row[headers.length - 1] !== null && 
              row[headers.length - 1] !== undefined && 
              String(row[headers.length - 1]).trim() !== ''
            );
            if (hasDataInColumn) break;
            headers.pop();
          }
          
          // Автоматически сопоставляем колонки
          const autoMappings = autoMapColumns(headers);
          console.log('Auto mappings:', autoMappings);
          setColumnMappings(autoMappings);
          
          // Получаем строки данных (исключая все строки до заголовков и сами заголовки)
          let rows = excelSheetData.slice(foundHeaderRowIndex + 1).filter(row => 
            Array.isArray(row) && row.some(cell => 
              cell !== null && cell !== undefined && String(cell).trim() !== ''
            )
          );
          
          // Применяем цветовой фильтр
          const adjustedColors = new Map<string, string>();
          colors.forEach((color, key) => {
            const [r] = key.split('-').map(Number);
            if (r > foundHeaderRowIndex) {
              adjustedColors.set(`${r - foundHeaderRowIndex - 1}-${key.split('-')[1]}`, color);
            }
          });
          
          const filteredRows = filterRowsByColor(rows as any[][], adjustedColors, colorFilter);
          console.log(`Original rows: ${rows.length}, Filtered rows: ${filteredRows.length}`);
          
          setCellColors(adjustedColors);
          setDetectedColors(Array.from(uniqueColors));
          setOriginalExcelData(rows); // Сохраняем оригинальные данные
          
          console.log('Filtered rows:', rows);
          console.log(`Skipped ${foundHeaderRowIndex} rows before headers`);
          
          if (headers.length === 0) {
            alert('Не удалось найти заголовки в файле. Убедитесь, что файл содержит строку с названиями колонок.');
            return;
          }
          
          setExcelHeaders(headers);
          setExcelData(filteredRows);
          setShowImportModal(true);
        } else {
          alert('Файл пустой или не содержит данных.');
        }
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        alert(`Ошибка чтения Excel файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      }
    };
    // Пробуем читать как ArrayBuffer для лучшей совместимости
    if (reader.readAsArrayBuffer) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const handleImport = () => {
    try {
      if (!Array.isArray(excelData) || excelData.length === 0) {
        alert(t('no_data_to_import'));
        return;
      }

      const importedOrders: any[] = [];
      const duplicates: any[] = [];
      const errors: any[] = [];

      excelData.forEach((row, index) => {
        // Check that row is an array
        if (!Array.isArray(row)) {
          console.warn(`Строка ${index} не является массивом:`, row);
          errors.push(`Строка ${index + 1}: некорректные данные`);
          return;
        }

        const drawingNumberIndex = excelHeaders.indexOf(columnMappings.drawingNumber);
        const deadlineIndex = excelHeaders.indexOf(columnMappings.deadline);
        const quantityIndex = excelHeaders.indexOf(columnMappings.quantity);
        const priorityIndex = excelHeaders.indexOf(columnMappings.priority);

        const drawingNumber = drawingNumberIndex >= 0 ? String(row[drawingNumberIndex] || '').trim() : '';
        
        // Пропускаем строки без номера чертежа
        if (!drawingNumber) {
          errors.push(`Строка ${index + 1}: отсутствует номер чертежа`);
          return;
        }
        
        // Проверяем на дубликат в существующих заказах
        if (orders.some(order => order.drawingNumber === drawingNumber)) {
          duplicates.push({
            row: index + 1,
            drawingNumber,
            reason: 'Заказ с этим номером чертежа уже существует'
          });
          return;
        }
        
        // Проверяем на дубликат в текущей порции импорта
        if (importedOrders.some(order => order.drawingNumber === drawingNumber)) {
          duplicates.push({
            row: index + 1,
            drawingNumber,
            reason: 'Дубликат в файле импорта'
          });
          return;
        }

        const order = {
          id: `imported-${Date.now()}-${index}`,
          drawingNumber,
          deadline: deadlineIndex >= 0 ? (() => {
            const dateValue = row[deadlineIndex];
            if (!dateValue) return new Date().toISOString();
            
            // If this is an Excel serial date number
            if (typeof dateValue === 'number') {
              const excelEpoch = new Date(1900, 0, -1);
              const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
              return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
            }
            
            // Attempt to parse as a string
            const parsedDate = new Date(dateValue);
            return isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
          })() : new Date().toISOString(),
          quantity: quantityIndex >= 0 ? (isNaN(Number(row[quantityIndex])) ? 0 : Number(row[quantityIndex])) : 0,
          priority: priorityIndex >= 0 ? (isNaN(Number(row[priorityIndex])) ? 0 : Number(row[priorityIndex])) : 0,
          operations: []
        };
        
        importedOrders.push(order);
      });

      // Отображаем статистику импорта
      let message = `Результаты импорта:\n\n`;
      message += `✅ Успешно импортировано: ${importedOrders.length} заказов\n`;
      
      if (duplicates.length > 0) {
        message += `⚠️ Пропущено дубликатов: ${duplicates.length}\n`;
        if (duplicates.length <= 5) {
          duplicates.forEach(dup => {
            message += `  • Строка ${dup.row}: ${dup.drawingNumber} (${dup.reason})\n`;
          });
        } else {
          message += `  • Полный список в консоли браузера\n`;
          console.log('Пропущенные дубликаты:', duplicates);
        }
      }
      
      if (errors.length > 0) {
        message += `❌ Ошибки: ${errors.length}\n`;
        if (errors.length <= 3) {
          errors.forEach(error => {
            message += `  • ${error}\n`;
          });
        } else {
          message += `  • Полный список в консоли браузера\n`;
          console.log('Ошибки импорта:', errors);
        }
      }

      // Добавляем только валидные заказы без дубликатов
      let successfulAdditions = 0;
      importedOrders.forEach(order => {
        if (addOrder(order)) {
          successfulAdditions++;
        }
      });

      // Очищаем состояние
      setShowImportModal(false);
      setColumnMappings({
        drawingNumber: '',
        deadline: '',
        quantity: '',
        priority: ''
      });
      setExcelData([]);
      setExcelHeaders([]);
      setOriginalExcelData([]);
      setCellColors(new Map());
      setDetectedColors([]);

      alert(message);
    } catch (error) {
      console.error('Error importing data:', error);
      alert(`Ошибка импорта: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
  };

  const handleTrashContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleTrashClick = (orderId: string) => {
    deleteOrder(orderId);
  };

  const handleDeleteAll = () => {
    if (filteredOrders.length === 0) {
      alert(t('no_orders_to_delete'));
      setContextMenu(null);
      return;
    }
    
    const countToDelete = filteredOrders.length;
    
    if (window.confirm(t('confirm_delete_all', { count: countToDelete }))) {
      filteredOrders.forEach(order => deleteOrder(order.id));
      setContextMenu(null);
      alert(t('deleted_orders', { count: countToDelete }));
    }
  };

  const handleSelectiveDelete = () => {
    if (filteredOrders.length === 0) {
      alert(t('no_orders_to_select'));
      setContextMenu(null);
      return;
    }
    setShowBulkDeleteModal(true);
    setContextMenu(null);
  };

  const handleBulkDelete = () => {
    if (selectedOrderIds.size === 0) return;
    
    const countToDelete = selectedOrderIds.size;
    
    if (window.confirm(t('confirm_delete_selected', { count: countToDelete }))) {
      selectedOrderIds.forEach(orderId => deleteOrder(orderId));
      setSelectedOrderIds(new Set());
      setShowBulkDeleteModal(false);
      alert(t('deleted_orders', { count: countToDelete }));
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrderIds);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrderIds(newSelected);
  };

  const selectAllOrders = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map(order => order.id)));
    }
  };



  useEffect(() => {
    if (contextMenu) {
      const handleClick = () => setContextMenu(null);
      const handleContextMenu = () => setContextMenu(null);
      
      document.addEventListener('click', handleClick);
      document.addEventListener('contextmenu', handleContextMenu);
      
      return () => {
        document.removeEventListener('click', handleClick);
        document.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, [contextMenu]);

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>{t('orders_list')}</h1>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('search_by_drawing')}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <label className="flex items-center justify-center md:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
          <Upload className="mr-2 h-5 w-5 text-gray-400" />
          <span>{t('import_excel')}</span>
          <input type="file" className="sr-only" onChange={handleFileUpload} accept=".xlsx, .xls" />
        </label>
      </div>
      
      <div className="mt-6">
        <OrderForm />
      </div>
      
      <div className="mt-8 mb-8">
        <SupabaseSync />
      </div>
      
      {filteredOrders.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">{t('existing_orders')}</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('drawing_number')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('deadline')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('quantity')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('priority')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('operations')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.drawingNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.deadline).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.priority}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.operations.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title={t('edit_caps')}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleTrashClick(order.id)}
                          onContextMenu={(e) => handleTrashContextMenu(e)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title={t('left_click_delete_right_click_bulk')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && filteredOrders.length > 0 && (
        <div 
          className="fixed bg-white shadow-lg border rounded-md py-1 z-50 min-w-48"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={handleDeleteAll}
            className="flex items-center w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors"
          >
            <Trash2 className="mr-2" size={16} />
            {t('delete_all_orders')} ({filteredOrders.length})
          </button>
          <hr className="my-1" />
          <button
            onClick={handleSelectiveDelete}
            className="flex items-center w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-600 transition-colors"
          >
            <Edit className="mr-2" size={16} />
            {t('selective_delete')}
          </button>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-96 overflow-hidden flex flex-col">
            <h2 className="text-xl font-bold mb-4">{t('selective_delete_orders')}</h2>
            
            {/* Statistics and "Select all" button */}
            <div className="mb-4 flex justify-between items-center">
              <button
                onClick={selectAllOrders}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {selectedOrderIds.size === filteredOrders.length ? t('cancel_select_all') : t('select_all')}
              </button>
              <span className="text-sm text-gray-600">
                {t('selected')}: <span className="font-semibold">{selectedOrderIds.size}</span> {t('of')} <span className="font-semibold">{filteredOrders.length}</span>
              </span>
            </div>
            
            {/* Scrollable order list */}
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md">
              <div className="p-4 space-y-3">
                {filteredOrders.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">
                    {t('no_orders_to_display')}
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <label key={order.id} className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedOrderIds.has(order.id) 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}>
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.has(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{order.drawingNumber}</div>
                        <div className="text-sm text-gray-500">
                          {t('count_label')} {order.quantity} | {t('priority_label')} {order.priority} | 
                          {t('deadline_label')} {new Date(order.deadline).toLocaleDateString()} | 
                          {t('operations_label')} {order.operations.length}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowBulkDeleteModal(false);
                  setSelectedOrderIds(new Set());
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                {t('cancel_caps')}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={selectedOrderIds.size === 0}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
                  selectedOrderIds.size === 0 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {t('delete_selected')} ({selectedOrderIds.size})
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Order Modal */}
      {editingOrder && (
        <EditOrderModal 
          isOpen={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          order={editingOrder}
        />
      )}
      
      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">{t('assign_columns_for_import')}</h2>
            
            {/* Цветовой фильтр */}
            {detectedColors.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-800 mb-3">🎨 Фильтр по цвету ячеек</h3>
                <div className="space-y-2">
                  <div className="text-xs text-blue-700 mb-2">Обнаружены цвета:</div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {detectedColors.map((color, index) => (
                      <div key={index} className="flex items-center space-x-1 text-xs">
                        <div 
                          className="w-4 h-4 border border-gray-300 rounded"
                          style={{ backgroundColor: color }}
                        ></div>
                        <span className="text-gray-600">{color}</span>
                        {isGreenColor(color) && <span className="text-green-600">(🟢)</span>}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="colorFilter"
                        value="all"
                        checked={colorFilter === 'all'}
                        onChange={(e) => setColorFilter(e.target.value as any)}
                        className="text-blue-600"
                      />
                      <span className="text-sm">📋 Импортировать все строки</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="colorFilter"
                        value="exclude_green"
                        checked={colorFilter === 'exclude_green'}
                        onChange={(e) => setColorFilter(e.target.value as any)}
                        className="text-blue-600"
                      />
                      <span className="text-sm">❌ Исключить зеленые строки</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="colorFilter"
                        value="only_green"
                        checked={colorFilter === 'only_green'}
                        onChange={(e) => setColorFilter(e.target.value as any)}
                        className="text-blue-600"
                      />
                      <span className="text-sm">✅ Только зеленые строки</span>
                    </label>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div className="text-xs text-gray-600">
                      Количество строк для импорта: <span className="font-semibold">{excelData.length}</span>
                    </div>
                    <button
                      onClick={applyColorFilter}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Применить фильтр
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('drawing_number_label')}</label>
                <select
                  className={`w-full border rounded-md px-3 py-2 ${
                    columnMappings.drawingNumber 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300'
                  }`}
                  value={columnMappings.drawingNumber}
                  onChange={(e) => setColumnMappings({...columnMappings, drawingNumber: e.target.value})}
                >
                  <option value="">{columnMappings.drawingNumber ? `Используется: ${columnMappings.drawingNumber}` : 'Выберите колонку'}</option>
                  {excelHeaders.map((header, index) => (
                    <option key={index} value={header}>
                      {header || `[Пустая колонка ${index + 1}]`}
                    </option>
                  ))}
                </select>
                {columnMappings.drawingNumber && (
                  <div className="text-xs text-green-600 mt-1">Автоматически выбрано: {columnMappings.drawingNumber}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('deadline_date_label')}</label>
                <select
                  className={`w-full border rounded-md px-3 py-2 ${
                    columnMappings.deadline 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300'
                  }`}
                  value={columnMappings.deadline}
                  onChange={(e) => setColumnMappings({...columnMappings, deadline: e.target.value})}
                >
                  <option value="">{columnMappings.deadline ? `Используется: ${columnMappings.deadline}` : 'Выберите колонку'}</option>
                  {excelHeaders.map((header, index) => (
                    <option key={index} value={header}>
                      {header || `[Пустая колонка ${index + 1}]`}
                    </option>
                  ))}
                </select>
                {columnMappings.deadline && (
                  <div className="text-xs text-green-600 mt-1">Автоматически выбрано: {columnMappings.deadline}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('quantity_label')}</label>
                <select
                  className={`w-full border rounded-md px-3 py-2 ${
                    columnMappings.quantity 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300'
                  }`}
                  value={columnMappings.quantity}
                  onChange={(e) => setColumnMappings({...columnMappings, quantity: e.target.value})}
                >
                  <option value="">{columnMappings.quantity ? `Используется: ${columnMappings.quantity}` : 'Выберите колонку'}</option>
                  {excelHeaders.map((header, index) => (
                    <option key={index} value={header}>
                      {header || `[Пустая колонка ${index + 1}]`}
                    </option>
                  ))}
                </select>
                {columnMappings.quantity && (
                  <div className="text-xs text-green-600 mt-1">Автоматически выбрано: {columnMappings.quantity}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('priority_label_full')}</label>
                <select
                  className={`w-full border rounded-md px-3 py-2 ${
                    columnMappings.priority 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300'
                  }`}
                  value={columnMappings.priority}
                  onChange={(e) => setColumnMappings({...columnMappings, priority: e.target.value})}
                >
                  <option value="">{columnMappings.priority ? `Используется: ${columnMappings.priority}` : 'Выберите колонку'}</option>
                  {excelHeaders.map((header, index) => (
                    <option key={index} value={header}>
                      {header || `[Пустая колонка ${index + 1}]`}
                    </option>
                  ))}
                </select>
                {columnMappings.priority && (
                  <div className="text-xs text-green-600 mt-1">Автоматически выбрано: {columnMappings.priority}</div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => {
                  setShowImportModal(false);
                  setExcelData([]);
                  setExcelHeaders([]);
                  setOriginalExcelData([]);
                  setCellColors(new Map());
                  setDetectedColors([]);
                  setColumnMappings({
                    drawingNumber: '',
                    deadline: '',
                    quantity: '',
                    priority: ''
                  });
                }}
              >
                {t('cancel_caps')}
              </button>
              <button
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                onClick={handleImport}
              >
                {t('import_caps')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}