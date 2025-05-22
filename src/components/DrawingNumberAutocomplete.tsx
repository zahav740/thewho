import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';

interface DrawingNumberAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  showDuplicateWarning?: boolean;
}

export default function DrawingNumberAutocomplete({
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required = false,
  showDuplicateWarning = true
}: DrawingNumberAutocompleteProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { getAllDrawingNumbers, getOrderByDrawingNumber, hasOrderWithDrawingNumber } = useApp();
  
  // Проверяем, является ли текущий номер чертежа дубликатом
  const isDuplicate = useMemo(() => {
    return showDuplicateWarning && value && hasOrderWithDrawingNumber(value);
  }, [value, hasOrderWithDrawingNumber, showDuplicateWarning]);
  
  // Используем useMemo для мемоизации существующих номеров чертежей
  const existingDrawingNumbers = useMemo(() => getAllDrawingNumbers(), [getAllDrawingNumbers]);
  
  // Примеры номеров чертежей для новых заказов
  const exampleSuggestions = useMemo(() => [
    'DWG-001-2025',
    'DWG-002-2025', 
    'DWG-003-2025',
    'PART-A001',
    'PART-A002',
    'PART-B001',
    'ASSEMBLY-2025-001',
    'ASSEMBLY-2025-002',
    'BRACKET-001',
    'BRACKET-002',
    'HOUSING-001',
    'HOUSING-002',
    'COVER-001',
    'COVER-002'
  ], []);
  
  // Объединяем существующие номера с примерами и убираем дубликаты
  const suggestions = useMemo(() => {
    const allSuggestions = [
      ...existingDrawingNumbers,
      ...exampleSuggestions.filter(example => !existingDrawingNumbers.includes(example))
    ];
    return allSuggestions;
  }, [existingDrawingNumbers, exampleSuggestions]);

  useEffect(() => {
    if (value) {
      const filtered = suggestions.filter(item =>
        item.toLowerCase().includes(value.toLowerCase())
      );
      
      // Сортируем: сначала существующие номера, потом новые
      const sortedFiltered = filtered.sort((a, b) => {
        const aExists = existingDrawingNumbers.includes(a);
        const bExists = existingDrawingNumbers.includes(b);
        
        if (aExists && !bExists) return -1;
        if (!aExists && bExists) return 1;
        
        // Если оба существуют или оба новые, сортируем по алфавиту
        return a.localeCompare(b);
      });
      
      setFilteredSuggestions(sortedFiltered);
      setIsOpen(sortedFiltered.length > 0);
      setHighlightedIndex(-1);
    } else {
      setFilteredSuggestions([]);
      setIsOpen(false);
    }
  }, [value, suggestions, existingDrawingNumbers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
          handleSuggestionClick(filteredSuggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleInputFocus = () => {
    if (value && filteredSuggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Задержка чтобы успел сработать клик по предложению
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
      onBlur?.();
    }, 150);
  };

  const clearValue = () => {
    onChange('');
    inputRef.current?.focus();
  };

  // Эффект для прокрутки к выделенному элементу
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder || t('enter_drawing_number')}
          required={required}
          className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 ${
            error || isDuplicate
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 focus:ring-blue-500'
          }`}
          autoComplete="off"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {value && (
            <button
              type="button"
              onClick={clearValue}
              className="p-1 hover:bg-gray-100 rounded-full mr-1"
              tabIndex={-1}
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
          <ChevronDown 
            size={16} 
            className={`text-gray-400 transform transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </div>

      {/* Список предложений */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredSuggestions.length > 0 ? (
            <div>
              {/* Счетчик результатов */}
              <div className="px-3 py-1 text-xs text-gray-500 bg-gray-50 border-b">
                {t('found_results')}: {filteredSuggestions.length}
              </div>
              <ul ref={listRef} className="py-1">
                {filteredSuggestions.map((suggestion, index) => (
                  <li
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                      index === highlightedIndex ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    {(() => {
                      const existingOrder = getOrderByDrawingNumber(suggestion);
                      return (
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between">
                            <div>
                              {/* Подсветка совпадающей части */}
                              {suggestion.split(new RegExp(`(${value})`, 'gi')).map((part, i) => (
                                <span
                                  key={i}
                                  className={
                                    part.toLowerCase() === value.toLowerCase() 
                                      ? 'font-semibold bg-yellow-200' 
                                      : ''
                                  }
                                >
                                  {part}
                                </span>
                              ))}
                            </div>
                            {existingOrder && (
                              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full ml-2">
                                {t('exists')}
                              </span>
                            )}
                          </div>
                          {existingOrder && (
                            <div className="text-xs text-gray-500 mt-1">
                              {t('quantity_label')}: {existingOrder.quantity} | {t('priority_label')}: {existingOrder.priority} | {t('operations_label')}: {existingOrder.operations.length}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </li>
                ))}
              </ul>
            </div>
          ) : value ? (
            <div className="px-3 py-4 text-center text-gray-500">
              <div className="text-sm">{t('no_results')}</div>
              <div className="text-xs mt-1">
                {t('check_spelling')}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Отображение ошибки и предупреждения о дубликате */}
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
      {!error && isDuplicate && (
        <p className="text-red-500 text-sm mt-1 flex items-center">
          <span className="mr-1">⚠️</span>
          {t('duplicate_warning')}
        </p>
      )}
    </div>
  );
}