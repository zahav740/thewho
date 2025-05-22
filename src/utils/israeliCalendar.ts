// Утилиты для работы с еврейским календарем и праздниками Израиля
// Использует Hebcal API: https://www.hebcal.com/home/195/jewish-calendar-rest-api

export interface HebcalEvent {
  title: string;
  date: string;
  hebrew?: string;
  category: string;
  subcat?: string;
  memo?: string;
  yomTov?: boolean;
  major?: boolean;
}

export interface HebcalResponse {
  title: string;
  date: string;
  location: {
    title: string;
    city: string;
    tzid: string;
    latitude: number;
    longitude: number;
    cc: string;
    country: string;
    admin1: string;
    asciiname: string;
    geo: string;
    zip: string;
    state: string;
  };
  range: {
    start: string;
    end: string;
  };
  items: HebcalEvent[];
}

export class IsraeliCalendar {
  private static cachedHolidays: Map<number, Date[]> = new Map();
  private static lastFetchTime: number = 0;
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 часа

  /**
   * Проверяет, является ли день выходным в Израиле
   * В Израиле выходные: пятница (после 14:00) и суббота (до захода солнца)
   */
  public static isWeekend(date: Date): boolean {
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    
    // Пятница после 14:00 - выходной
    if (dayOfWeek === 5 && hour >= 14) {
      return true;
    }
    
    // Суббота до 20:00 (примерное время захода солнца) - выходной
    if (dayOfWeek === 6 && hour < 20) {
      return true;
    }
    
    return false;
  }

  /**
   * Получает список еврейских праздников для указанного года
   */
  public static async getHolidaysForYear(year: number): Promise<Date[]> {
    // Проверяем кэш
    const cachedHolidays = this.cachedHolidays.get(year);
    const now = Date.now();
    
    if (cachedHolidays && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return cachedHolidays;
    }

    try {
      // Параметры для Hebcal API
      const params = new URLSearchParams({
        v: '1',
        cfg: 'json',
        maj: 'on',      // Только основные праздники
        min: 'off',     // Исключаем второстепенные события
        nx: 'off',      // Исключаем Рош Ходеш
        mf: 'off',      // Исключаем постные дни
        nh: 'off',      // Исключаем современные израильские праздники
        mod: 'on',      // Включаем современные праздники (День независимости и т.д.)
        s: 'off',       // Исключаем шаббат (он уже учтен в isWeekend)
        c: 'off',       // Исключаем свечи
        geo: 'city',
        city: 'Jerusalem', // Иерусалим как базовый город
        year: year.toString()
      });

      // Используем CORS proxy для обхода ограничений
      const apiUrl = `https://www.hebcal.com/hebcal?${params}`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;
      
      console.log(`Попытка загрузить праздники для ${year} года...`);
      
      // Попробуем сначала прямое обращение
      let response;
      try {
        response = await fetch(apiUrl, {
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        });
      } catch (corsError) {
        console.log('Прямое обращение к API заблокировано CORS, используем proxy...');
        response = await fetch(proxyUrl);
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      let data: HebcalResponse;
      
      // Проверяем, использовался ли proxy
      const responseData = await response.json();
      if (responseData.contents) {
        // Ответ от proxy
        data = JSON.parse(responseData.contents);
      } else {
        // Прямой ответ
        data = responseData;
      }
      
      // Фильтруем только религиозные праздники и государственные выходные
      const holidays = data.items
        .filter(item => {
          // Включаем основные религиозные праздники
          if (item.yomTov || item.major) return true;
          
          // Включаем современные израильские праздники
          if (item.category === 'modern' || item.category === 'il') {
            const title = item.title.toLowerCase();
            return title.includes('independence') || 
                   title.includes('memorial') || 
                   title.includes('holocaust') ||
                   title.includes('יום העצמאות') ||
                   title.includes('יום הזיכרון') ||
                   title.includes('יום השואה');
          }
          
          return false;
        })
        .map(item => new Date(item.date))
        .filter(date => !isNaN(date.getTime())); // Убираем недействительные даты

      // Сохраняем в кэш
      this.cachedHolidays.set(year, holidays);
      this.lastFetchTime = now;

      console.log(`✅ Успешно загружено ${holidays.length} праздников для ${year} года`);
      holidays.forEach(holiday => {
        console.log(`  - ${holiday.toLocaleDateString('ru-RU')}`);
      });
      
      return holidays;
    } catch (error) {
      console.error('⚠️ Ошибка загрузки праздников:', error);
      
      // Возвращаем базовый набор праздников, если API недоступен
      const fallbackHolidays = this.getFallbackHolidays(year);
      this.cachedHolidays.set(year, fallbackHolidays);
      return fallbackHolidays;
    }
  }

  /**
   * Базовый набор праздников для случая, когда API недоступен
   */
  private static getFallbackHolidays(year: number): Date[] {
    // Основные праздники с фиксированными датами (приблизительно)
    const fallbackHolidays = [
      // Рош ха-Шана (примерно сентябрь-октябрь)
      new Date(year, 8, 15), // 15 сентября (примерно)
      new Date(year, 8, 16), // 16 сентября (примерно)
      
      // Йом Кипур (через ~10 дней после Рош ха-Шана)
      new Date(year, 8, 25), // 25 сентября (примерно)
      
      // Песах (примерно март-апрель)
      new Date(year, 3, 5),  // 5 апреля (примерно)
      new Date(year, 3, 6),  // 6 апреля (примерно)
      new Date(year, 3, 11), // 11 апреля (примерно)
      new Date(year, 3, 12), // 12 апреля (примерно)
      
      // Шавут (примерно май-июнь)
      new Date(year, 4, 25), // 25 мая (примерно)
      
      // Современные израильские праздники
      new Date(year, 3, 18), // День памяти жертв Холокоста (27 нисана)
      new Date(year, 3, 25), // День памяти павших (4 ияра)
      new Date(year, 3, 26), // День независимости (5 ияра)
    ];

    console.log(`Используются резервные праздники для ${year} года`);
    return fallbackHolidays;
  }

  /**
   * Проверяет, является ли указанная дата праздником
   */
  public static async isHoliday(date: Date): Promise<boolean> {
    const year = date.getFullYear();
    const holidays = await this.getHolidaysForYear(year);
    
    return holidays.some(holiday => 
      holiday.getFullYear() === date.getFullYear() &&
      holiday.getMonth() === date.getMonth() &&
      holiday.getDate() === date.getDate()
    );
  }

  /**
   * Проверяет, является ли дата рабочим днем в Израиле
   */
  public static async isWorkingDay(date: Date): Promise<boolean> {
    // Проверяем выходные дни
    if (this.isWeekend(date)) {
      return false;
    }

    // Проверяем праздники
    const isHoliday = await this.isHoliday(date);
    return !isHoliday;
  }

  /**
   * Получает следующий рабочий день
   */
  public static async getNextWorkingDay(date: Date): Promise<Date> {
    let nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    while (!(await this.isWorkingDay(nextDay))) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
  }

  /**
   * Рассчитывает рабочие часы между двумя датами
   */
  public static async calculateWorkingHours(startDate: Date, endDate: Date): Promise<number> {
    let totalHours = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      if (await this.isWorkingDay(current)) {
        // В Израиле стандартный рабочий день:
        // Воскресенье-четверг: 8:00-16:00 (8 часов)
        // Пятница: 8:00-14:00 (6 часов) если это рабочий день
        const dayOfWeek = current.getDay();
        
        if (dayOfWeek >= 0 && dayOfWeek <= 4) { // Воскресенье-четверг
          totalHours += 8;
        } else if (dayOfWeek === 5) { // Пятница
          totalHours += 6;
        }
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    return totalHours;
  }

  /**
   * Очищает кэш праздников
   */
  public static clearCache(): void {
    this.cachedHolidays.clear();
    this.lastFetchTime = 0;
  }
}

// Экспорт для использования в планировании
export default IsraeliCalendar;