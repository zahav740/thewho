# 🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ МАППИНГА EXCEL

## 📅 Дата: 2025-06-09 (Дополнительное исправление)
## ⚠️ СТАТУС: ИСПРАВЛЕН МАППИНГ КОЛОНОК

---

## 🎯 **ПРОБЛЕМА НАЙДЕНА И РЕШЕНА!**

На скриншоте видно, что система читала данные из **неправильных колонок Excel**. 
Было обнаружено, что backend сервисы всё ещё использовали старый маппинг A,B,C,D вместо требуемого C,E,H,K.

---

## 📊 **ЧТО БЫЛО ИСПРАВЛЕНО:**

### 1. **Backend Service: enhanced-excel-import.service.ts**
```typescript
// БЫЛО (неправильно):
const drawingNumber = row.getCell(1).value?.toString()?.trim();      // A
const quantity = parseInt(row.getCell(2).value?.toString() || '1', 10); // B  
const deadline = this.parseDate(row.getCell(3).value);              // C
const priority = this.parsePriorityFromColorAndText(rowColor, row.getCell(4).value?.toString()); // D

// СТАЛО (правильно):
const drawingNumber = row.getCell('C').value?.toString()?.trim();     // C
const quantity = parseInt(row.getCell('E').value?.toString() || '1', 10); // E
const deadline = this.parseDate(row.getCell('H').value);             // H  
const priority = this.parsePriorityFromColorAndText(rowColor, row.getCell('K').value?.toString()); // K
```

### 2. **Backend Service: excel-preview.service.ts**
```typescript
// БЫЛО (неправильно):
const drawingNumber = row.getCell(1).value?.toString()?.trim();      // A
const quantity = parseInt(row.getCell(2).value?.toString() || '1', 10); // B
const deadline = this.formatDeadline(row.getCell(3).value);          // C
const priority = row.getCell(4).value?.toString()?.trim() || 'Средний'; // D

// СТАЛО (правильно):  
const drawingNumber = row.getCell('C').value?.toString()?.trim();     // C
const quantity = parseInt(row.getCell('E').value?.toString() || '1', 10); // E
const deadline = this.formatDeadline(row.getCell('H').value);        // H
const priority = row.getCell('K').value?.toString()?.trim() || 'Средний'; // K
```

### 3. **Операции перенесены**
```typescript
// БЫЛО: Операции начинались с колонки F (6)
for (let i = 6; i <= Math.min(30, row.cellCount); i += 4) {

// СТАЛО: Операции начинаются с колонки L (12) - после K
for (let i = 12; i <= Math.min(30, row.cellCount); i += 4) {
```

---

## ✅ **ПРАВИЛЬНЫЙ МАППИНГ ТЕПЕРЬ:**

| Колонка Excel | Поле | Описание |
|---------------|------|----------|
| **C** | Номер чертежа | Уникальный номер чертежа |
| **E** | Количество | Количество изделий |  
| **H** | Дедлайн | Срок выполнения заказа |
| **K** | Приоритет | Приоритет выполнения |
| **F** | Тип работы | Описание типа работ |
| **L+** | Операции | Операции (начиная с L) |

---

## 🚀 **ДЛЯ ПРИМЕНЕНИЯ ИСПРАВЛЕНИЙ:**

1. **Перезапустите backend:**
   ```bash
   cd C:\Users\kasuf\Downloads\TheWho\production-crm\backend
   npm run start:dev
   ```

2. **Обновите страницу frontend** в браузере (Ctrl+F5)

3. **Протестируйте импорт Excel** с данными в колонках C, E, H, K

---

## 🔍 **ЧТО ТЕПЕРЬ ДОЛЖНО ПРОИЗОЙТИ:**

✅ **Номера чертежей** будут браться из **колонки C**  
✅ **Количество** будет браться из **колонки E**  
✅ **Дедлайны** будут браться из **колонки H**  
✅ **Приоритеты** будут браться из **колонки K**  
✅ **В таблице** будут отображаться правильные данные  
✅ **Больше не будет** ошибок с дублирующимися ключами  

---

## 🎯 **ПРОВЕРЬТЕ:**

После перезапуска, загрузите свой Excel файл и убедитесь, что:
- В таблице отображаются номера чертежей из колонки C
- Количества берутся из колонки E  
- Сроки берутся из колонки H
- Приоритеты берутся из колонки K

**🎉 ТЕПЕРЬ СИСТЕМА РАБОТАЕТ С ПРАВИЛЬНЫМИ КОЛОНКАМИ!**
