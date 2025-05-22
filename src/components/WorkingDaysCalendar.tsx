import React, { useState, useEffect } from 'react';
import IsraeliCalendar from '../utils/israeliCalendar';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface WorkingDaysCalendarProps {
  className?: string;
}

const WorkingDaysCalendar: React.FC<WorkingDaysCalendarProps> = ({ className = '' }) => {
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
    generateCalendarDays();
  }, [currentDate]);

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
      
      // Даты для отображения (включая дни предыдущего и следующего месяца)
      const days: {
        date: Date;
        isCurrentMonth: boolean;
        isToday: boolean;
        isWorkingDay: boolean;
        isSelected: boolean;
      }[] = [];
      
      // Добавляем дни предыдущего месяца
      for (let i = firstDayWeekday - 1; i >= 0; i--) {
        const date = new Date(year, month, -i);
        const isWorkingDay = await IsraeliCalendar.isWorkingDay(date);
        days.push({
          date,
          isCurrentMonth: false,
          isToday: false,
          isWorkingDay,
          isSelected: selectedDate ? isSameDay(date, selectedDate) : false
        });
      }
      
      // Добавляем дни текущего месяца
      for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const date = new Date(year, month, day);
        const isToday = isSameDay(date, new Date());
        const isWorkingDay = await IsraeliCalendar.isWorkingDay(date);
        days.push({
          date,
          isCurrentMonth: true,
          isToday,
          isWorkingDay,
          isSelected: selectedDate ? isSameDay(date, selectedDate) : false
        });
      }
      
      // Добавляем дни следующего месяца для заполнения сетки (42 дня = 6 недель)
      const remainingDays = 42 - days.length;
      for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(year, month + 1, day);
        const isWorkingDay = await IsraeliCalendar.isWorkingDay(date);
        days.push({
          date,
          isCurrentMonth: false,
          isToday: false,
          isWorkingDay,
          isSelected: selectedDate ? isSameDay(date, selectedDate) : false
        });
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
    if (day.isWorkingDay) {
      setSelectedDate(day.date);
      setCalendarDays(prev => prev.map(d => ({
        ...d,
        isSelected: isSameDay(d.date, day.date)
      })));
    }
  };

  const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      {/* Заголовок календаря */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">
            Рабочие дни
          </h3>
        </div>
      </div>

      {/* Навигация по месяцам */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-1 hover:bg-gray-100 rounded"
          disabled={loading}
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
        
        <span className="text-sm font-medium text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-1 hover:bg-gray-100 rounded"
          disabled={loading}
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Заголовки дней недели */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-xs font-medium text-gray-500 text-center p-1">
            {day}
          </div>
        ))}
      </div>

      {/* Сетка календаря */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-sm text-gray-500">Загрузка...</div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const isWeekend = day.date.getDay() === 5 || day.date.getDay() === 6;
            
            return (
              <button
                key={index}
                onClick={() => handleDateClick(day)}
                disabled={!day.isWorkingDay}
                className={`
                  p-2 text-xs rounded transition-colors relative
                  ${day.isCurrentMonth 
                    ? (day.isWorkingDay 
                        ? 'text-gray-900 hover:bg-blue-50' 
                        : 'text-gray-300 cursor-not-allowed')
                    : 'text-gray-400'
                  }
                  ${day.isToday ? 'bg-blue-100 border border-blue-300' : ''}
                  ${day.isSelected ? 'bg-blue-500 text-white' : ''}
                  ${!day.isWorkingDay && day.isCurrentMonth ? 'bg-red-50 border border-red-200' : ''}
                  ${isWeekend && day.isCurrentMonth ? 'italic' : ''}
                `}
                title={
                  day.isWorkingDay 
                    ? `Рабочий день: ${day.date.toLocaleDateString('ru-RU')}` 
                    : isWeekend 
                      ? `Выходной (шаббат): ${day.date.toLocaleDateString('ru-RU')}`
                      : `Праздник: ${day.date.toLocaleDateString('ru-RU')}`
                }
              >
                {day.date.getDate()}
                {isWeekend && day.isCurrentMonth && (
                  <div className="absolute top-0 right-0 w-1 h-1 bg-purple-400 rounded-full"></div>
                )}
                {!day.isWorkingDay && !isWeekend && day.isCurrentMonth && (
                  <div className="absolute top-0 right-0 w-1 h-1 bg-red-500 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Легенда */}
      <div className="mt-4 space-y-2 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-gray-600">Выбранный день</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
          <span className="text-gray-600">Сегодня</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-50 border border-red-200 rounded relative">
            <div className="absolute top-0 right-0 w-1 h-1 bg-purple-400 rounded-full"></div>
          </div>
          <span className="text-gray-600">Шаббат</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-50 border border-red-200 rounded relative">
            <div className="absolute top-0 right-0 w-1 h-1 bg-red-500 rounded-full"></div>
          </div>
          <span className="text-gray-600">Праздник</span>
        </div>
      </div>

      {/* Показываем выбранную дату */}
      {selectedDate && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-900">
            Выбранная дата:
          </div>
          <div className="text-sm text-blue-700">
            {selectedDate.toLocaleDateString('ru-RU', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkingDaysCalendar;