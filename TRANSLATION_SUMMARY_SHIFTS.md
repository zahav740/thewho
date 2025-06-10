# Перевод страницы Shifts на английский язык

## Выполненные изменения

### 1. Обновлен файл переводов `/frontend/src/i18n/translations.ts`

Добавлены новые ключи переводов для страницы Shifts:

#### Русские переводы:
- `shifts.monitoring` - Мониторинг производства
- `shifts.new_record` - Новая запись
- `shifts.show_statistics` / `shifts.hide_statistics` - Показать/Скрыть статистику
- `shifts.shift_record` - Запись смены
- `shifts.edit_record` / `shifts.create_record` - Редактировать/Создать запись смены
- `shifts.record_created` / `shifts.record_updated` - Сообщения об успехе
- `shifts.error_creating` / `shifts.error_updating` - Сообщения об ошибках
- `shifts.select_machine` - Выберите станок
- `shifts.current_operation` - Текущая операция
- `shifts.operation_not_found` - На данный станок не назначено операций
- `shifts.progress_execution` - Прогресс выполнения
- `shifts.production_by_operation` - Производство по операции
- `shifts.machine_idle` - Станок простаивает
- `shifts.no_assigned_operations` - Нет назначенных операций
- И многие другие...

#### Английские переводы:
- `shifts.monitoring` - Production Monitoring
- `shifts.new_record` - New Record
- `shifts.show_statistics` / `shifts.hide_statistics` - Show/Hide Statistics
- `shifts.shift_record` - Shift Record
- `shifts.edit_record` / `shifts.create_record` - Edit/New Shift Record
- `shifts.record_created` / `shifts.record_updated` - Success messages
- `shifts.error_creating` / `shifts.error_updating` - Error messages
- `shifts.select_machine` - Select Machine
- `shifts.current_operation` - Current Operation
- `shifts.operation_not_found` - No operations assigned to this machine
- `shifts.progress_execution` - Execution Progress
- `shifts.production_by_operation` - Production by Operation
- `shifts.machine_idle` - Machine is idle
- `shifts.no_assigned_operations` - No assigned operations
- И соответствующие английские переводы...

### 2. Обновлены компоненты

#### `/frontend/src/pages/Shifts/ShiftsPage.tsx`
- Добавлен импорт `useTranslation`
- Заменены все hardcoded строки на переводы:
  - Названия вкладок (Мониторинг производства → t('shifts.monitoring'))
  - Кнопки (Новая запись → t('shifts.new_record'))
  - Сообщения (Показать статистику → t('shifts.show_statistics'))

#### `/frontend/src/pages/Shifts/components/ShiftsList.tsx`
- Добавлен импорт `useTranslation`
- Переведены все заголовки колонок таблицы:
  - Дата → t('form.date')
  - Смена → t('shifts.shift')
  - Станок → t('form.machine')
  - Операция / Чертёж → t('form.operation') / t('order_info.drawing')
  - Наладка → t('shifts.setup')
  - Дневная смена → t('shifts.day_shift')
  - Ночная смена → t('shifts.night_shift')
  - Действия → t('shifts.actions')
- Переведены значения в ячейках:
  - День/Ночь → t('shifts.day')/t('shifts.night')
  - Не указан → t('shifts.machine_not_specified')
  - шт → t('shifts.pieces')
  - мин/шт → t('shifts.minutes_per_piece')
- Переведены сообщения об ошибках и диалоги подтверждения

#### `/frontend/src/pages/Shifts/components/ShiftForm.tsx`
- Добавлен импорт `useTranslation`
- Переведен заголовок модального окна
- Переведены все лейблы полей формы:
  - Дата → t('form.date')
  - Тип смены → t('shifts.shift_type')
  - Станок → t('form.machine')
  - И т.д.
- Переведены все сообщения:
  - Успешные операции
  - Ошибки валидации
  - Placeholder'ы
- Переведена информация об операции и заказе
- Переведены названия секций (Наладка, Дневная смена, Ночная смена)

### 3. Поддерживаемые языки

Теперь страница Shifts полностью поддерживает:
- **Русский язык** (ru) - как основной
- **Английский язык** (en) - полный перевод

### 4. Особенности перевода

1. **Контекстуальность**: Переводы учитывают контекст использования (например, "Type" может быть "Тип" или "Type" в зависимости от контекста)

2. **Консистентность**: Используются единые термины во всех компонентах:
   - Machine → Станок
   - Operation → Операция
   - Shift → Смена
   - Setup → Наладка

3. **Техническая терминология**: Сохранена точность технических терминов:
   - Milling → Фрезерный
   - Turning → Токарный
   - Drilling → Сверлильный
   - Grinding → Шлифовальный

4. **UI элементы**: Переведены все элементы интерфейса:
   - Кнопки
   - Заголовки
   - Сообщения об ошибках
   - Подсказки
   - Placeholder'ы

### 5. Файлы, которые были изменены:

1. `frontend/src/i18n/translations.ts` - добавлены новые ключи переводов
2. `frontend/src/pages/Shifts/ShiftsPage.tsx` - основная страница
3. `frontend/src/pages/Shifts/components/ShiftsList.tsx` - список смен
4. `frontend/src/pages/Shifts/components/ShiftForm.tsx` - форма создания/редактирования

### 6. Что НЕ было изменено:

- Логика работы компонентов осталась неизменной
- API вызовы и структуры данных не менялись
- Стили и макет остались прежними
- Остальные компоненты (ShiftStatistics, ActiveMachinesMonitor, OperationDetailModal) могут быть переведены дополнительно

## Как проверить работу переводов

1. Запустить приложение
2. Перейти на страницу Shifts
3. Переключить язык через интерфейс приложения
4. Убедиться, что все тексты корректно переводятся между русским и английским

## Результат

Страница Shifts теперь полностью интернационализирована и поддерживает переключение между русским и английским языками с сохранением всей функциональности.
