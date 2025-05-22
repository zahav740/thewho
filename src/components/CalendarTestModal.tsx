import React, { useState, useEffect } from 'react';
import IsraeliCalendar from '../utils/israeliCalendar';
import { Calendar, Clock, Star } from 'lucide-react';

interface CalendarTestProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalendarTestModal: React.FC<CalendarTestProps> = ({ isOpen, onClose }) => {
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [testDate, setTestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateResult, setDateResult] = useState<{
    isWeekend: boolean;
    isHoliday: boolean;
    isWorkingDay: boolean;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHolidays();
    }
  }, [isOpen]);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const currentHolidays = await IsraeliCalendar.getHolidaysForYear(currentYear);
      setHolidays(currentHolidays);
    } catch (error) {
      console.error('Ошибка загрузки праздников:', error);
    } finally {
      setLoading(false);
    }
  };

  const testSelectedDate = async () => {
    const date = new Date(testDate);
    
    const isWeekend = IsraeliCalendar.isWeekend(date);
    const isHoliday = await IsraeliCalendar.isHoliday(date);
    const isWorkingDay = await IsraeliCalendar.isWorkingDay(date);
    
    setDateResult({
      isWeekend,
      isHoliday,
      isWorkingDay
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Тестирование израильского календаря
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Загрузка праздников */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Праздники {new Date().getFullYear()} года
            </h4>
            
            {loading ? (
              <div className="text-gray-500">Загрузка праздников...</div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {holidays.length > 0 ? (
                  holidays.map((holiday, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-700 border-b pb-1">
                      <Star className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="font-medium">
                        {holiday.toLocaleDateString('ru-RU', { 
                          day: 'numeric', 
                          month: 'long',
                          weekday: 'short'
                        })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">Праздники не загружены</div>
                )}
              </div>
            )}
            
            <button
              onClick={loadHolidays}
              disabled={loading}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Загрузка...' : 'Обновить праздники'}
            </button>
          </div>

          {/* Тестирование даты */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Тестирование конкретной даты
            </h4>
            
            <div className="flex items-center gap-4 mb-4">
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={testSelectedDate}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Проверить дату
              </button>
            </div>

            {dateResult && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">
                  Результат для {new Date(testDate).toLocaleDateString('ru-RU', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    weekday: 'long'
                  })}:
                </h5>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      Выходной день: 
                      <span className={`ml-1 font-medium ${dateResult.isWeekend ? 'text-red-600' : 'text-green-600'}`}>
                        {dateResult.isWeekend ? 'Да' : 'Нет'}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      Праздник:
                      <span className={`ml-1 font-medium ${dateResult.isHoliday ? 'text-red-600' : 'text-green-600'}`}>
                        {dateResult.isHoliday ? 'Да' : 'Нет'}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      Рабочий день:
                      <span className={`ml-1 font-medium ${dateResult.isWorkingDay ? 'text-green-600' : 'text-red-600'}`}>
                        {dateResult.isWorkingDay ? 'Да' : 'Нет'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Информация о рабочих днях */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Рабочий график в Израиле
            </h4>
            <div className="bg-blue-50 p-4 rounded-lg text-sm">
              <div className="space-y-2">
                <div><strong>Рабочие дни:</strong></div>
                <div>• Воскресенье - четверг: 8:00 - 16:00 (8 часов)</div>
                <div>• Пятница: 8:00 - 14:00 (6 часов)</div>
                <div><strong>Выходные:</strong></div>
                <div>• Пятница после 14:00</div>
                <div>• Суббота до 20:00 (примерно)</div>
                <div>• Еврейские праздники</div>
                <div>• Израильские государственные праздники</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarTestModal;