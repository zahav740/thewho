import React, { useState, useEffect } from 'react';
import IsraeliCalendar from '../utils/israeliCalendar';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface WorkingDaysCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WorkingDaysCalendarModal: React.FC<WorkingDaysCalendarModalProps> = ({ isOpen, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<{
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isWorkingDay: boolean;
    isSelected: boolean;
  }[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      generateCalendarDays();
    }
  }, [currentDate, isOpen]);

  const generateCalendarDays = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Первый день месяца и количество дней
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      
      // Первый день недели (воскресенье = 0)
      const firstDayWeekday = firstDayOfMonth.getDay();
      
      // Массив дней для отображения
      const days: {
        date: Date;
        isCurrentMonth: boolean;
        isToday: boolean;
        isWorkingDay: boolean;
        isSelected: boolean;
      }[] = [];
      
      // Добавляем дни предыдущего месяца (только рабочие дни)
      for (let i = firstDayWeekday - 1; i >= 0; i--) {
        const date = new Date(year, month, -i);
        
        // Пропускаем пятницы и субботы
        if (date.getDay() === 5 || date.getDay() === 6) {
          continue;
        }
        
        const isWorkingDay = await IsraeliCalendar.isWorkingDay(date);
        if (isWorkingDay) {
          days.push({
            date,
            isCurrentMonth: false,
            isToday: false,
            isWorkingDay: true,
            isSelected: selectedDate ? isSameDay(date, selectedDate) : false
          });
        }
      }
      
      // Добавляем дни текущего месяца (только рабочие дни)
      for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const date = new Date(year, month, day);
        
        // Пропускаем пятницы и субботы
        if (date.getDay() === 5 || date.getDay() === 6) {
          continue;
        }
        
        const isToday = isSameDay(date, new Date());
        const isWorkingDay = await IsraeliCalendar.isWorkingDay(date);
        
        if (isWorkingDay) {
          days.push({
            date,
            isCurrentMonth: true,
            isToday,
            isWorkingDay: true,
            isSelected: selectedDate ? isSameDay(date, selectedDate) : false
          });
        }
      }
      
      // Добавляем дни следующего месяца (только рабочие дни, чтобы заполнить последний ряд)
      if (days.length % 5 !== 0) {
        const remainingSlots = 5 - (days.length % 5);
        let nextDay = 1;
        let addedDays = 0;
        
        while (addedDays < remainingSlots) {
          const date = new Date(year, month + 1, nextDay);
          
          // Пропускаем пятницы и субботы
          if (date.getDay() !== 5 && date.getDay() !== 6) {
            const isWorkingDay = await IsraeliCalendar.isWorkingDay(date);
            if (isWorkingDay) {
              days.push({
                date,
                isCurrentMonth: false,
                isToday: false,
                isWorkingDay: true,
                isSelected: selectedDate ? isSameDay(date, selectedDate) : false
              });
              addedDays++;
            }
          }
          nextDay++;
        }
      }
      
      setCalendarDays(days);
    } catch (error) {
      console.error('Ошибка генерации календаря:', error);
    } finally {
      setLoading(false);
    }
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateClick = (day: typeof calendarDays[0]) => {
    setSelectedDate(day.date);
    setCalendarDays(prev => prev.map(d => ({
      ...d,
      isSelected: isSameDay(d.date, day.date)
    })));
  };

  const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт']; // Убираем Пт и Сб
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Календарь рабочих дней
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Отображаются только рабочие дни (исключены пятницы и субботы)
          </p>
        </div>

        <div className="px-6 py-4">
          {/* Навигация по месяцам */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <h2 className="text-xl font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Заголовки дней недели */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {weekDays.map(day => (
              <div key={day} className="text-center font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Сетка календаря */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Загрузка рабочих дней...</div>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {calendarDays.map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`
                    p-3 rounded-lg transition-all duration-200 border
                    ${day.isCurrentMonth 
                      ? 'text-gray-900 border-gray-200 hover:border-blue-300 hover:bg-blue-50' 
                      : 'text-gray-400 border-gray-100'
                    }
                    ${day.isToday ? 'bg-blue-100 border-blue-400 font-semibold' : ''}
                    ${day.isSelected ? 'bg-blue-500 text-white border-blue-600 font-semibold' : ''}
                  `}
                  title={`Рабочий день: ${day.date.toLocaleDateString('ru-RU', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}`}
                >
                  <div className="text-lg">
                    {day.date.getDate()}
                  </div>
                  <div className="text-xs mt-1 opacity-75">
                    {day.date.toLocaleDateString('ru-RU', { weekday: 'short' })}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Информация о выбранной дате */}
          {selectedDate && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">
                Выбранная дата:
              </h4>
              <p className="text-blue-700">
                {selectedDate.toLocaleDateString('ru-RU', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          {/* Статистика месяца */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              Статистика месяца:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Всего рабочих дней:</span>
                <span className="ml-2 font-semibold text-green-600">
                  {calendarDays.filter(d => d.isCurrentMonth).length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Пропущено выходных:</span>
                <span className="ml-2 font-semibold text-red-600">
                  {/* Подсчет пропущенных пятниц и суббот */}
                  {(() => {
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    let weekendDays = 0;
                    
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(year, month, day);
                      if (date.getDay() === 5 || date.getDay() === 6) {
                        weekendDays++;
                      }
                    }
                    
                    return weekendDays;
                  })()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Праздников:</span>
                <span className="ml-2 font-semibold text-orange-600">
                  {(() => {
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    let totalDays = 0;
                    let workingDays = calendarDays.filter(d => d.isCurrentMonth).length;
                    
                    // Считаем только рабочие дни недели (исключаем пятницу и субботу)
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(year, month, day);
                      if (date.getDay() !== 5 && date.getDay() !== 6) {
                        totalDays++;
                      }
                    }
                    
                    return Math.max(0, totalDays - workingDays);
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkingDaysCalendarModal;