# Руководство по адаптивному дизайну

Этот документ описывает реализованную систему адаптивного дизайна для Production CRM.

## 📱 Обзор

Система включает в себя:
- **Адаптивный Layout** с поддержкой мобильных устройств
- **Responsive хуки** для определения размера экрана
- **Адаптивные компоненты** для сеток, контейнеров и действий
- **CSS переменные** для консистентного дизайна
- **Touch-friendly интерфейс** для мобильных устройств

## 🛠️ Компоненты

### useResponsive Hook

Хук для определения текущего размера экрана и устройства:

```typescript
import { useResponsive } from './hooks/useResponsive';

const MyComponent = () => {
  const screenInfo = useResponsive();
  
  return (
    <div>
      {screenInfo.isMobile ? 'Мобильная версия' : 'Десктопная версия'}
      <p>Ширина: {screenInfo.width}px</p>
      <p>Устройство: {screenInfo.isTablet ? 'Планшет' : 'Другое'}</p>
    </div>
  );
};
```

**Доступные свойства:**
- `width`, `height` - размеры экрана
- `xs`, `sm`, `md`, `lg`, `xl`, `xxl` - breakpoint флаги
- `isMobile`, `isTablet`, `isDesktop`, `isLargeScreen` - типы устройств

### ResponsiveGrid

Адаптивная сетка для отображения карточек:

```typescript
import { ResponsiveGrid } from './components/ResponsiveGrid';

<ResponsiveGrid
  minItemWidth={300}
  maxColumns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
>
  {items.map(item => <Card key={item.id}>{item.content}</Card>)}
</ResponsiveGrid>
```

### ResponsiveActions

Контейнер для кнопок и действий:

```typescript
import { ResponsiveActions } from './components/ResponsiveGrid';

<ResponsiveActions direction="auto" justify="space-between">
  <Button type="primary">Создать</Button>
  <Button>Обновить</Button>
</ResponsiveActions>
```

### ResponsiveContainer

Адаптивный контейнер с автоматическими отступами:

```typescript
import { ResponsiveContainer } from './components/ResponsiveGrid';

<ResponsiveContainer maxWidth={1200}>
  <h1>Заголовок</h1>
  <p>Контент автоматически адаптируется</p>
</ResponsiveContainer>
```

## 🎨 CSS Переменные

Система использует CSS переменные для консистентного дизайна:

```css
/* Отступы */
padding: var(--spacing-lg);
margin: var(--spacing-xl);

/* Шрифты */
font-size: var(--font-size-base);

/* Тени */
box-shadow: var(--shadow-md);

/* Скругления */
border-radius: var(--border-radius-lg);
```

### Utility классы

```css
/* Отступы */
.p-lg { padding: var(--spacing-lg); }
.m-xl { margin: var(--spacing-xl); }

/* Текст */
.text-lg { font-size: var(--font-size-lg); }

/* Видимость */
.hidden-md /* Скрыть на экранах меньше md */

/* Адаптивные флексы */
.flex-col-mobile /* Колонка на мобильных */
.flex-row-desktop /* Ряд на десктопе */
```

## 📏 Breakpoints

```css
xs: 0px      /* Очень маленькие экраны */
sm: 576px    /* Маленькие экраны */
md: 768px    /* Планшеты */
lg: 992px    /* Маленькие десктопы */
xl: 1200px   /* Десктопы */
xxl: 1600px  /* Большие экраны */
```

## 📱 Мобильная адаптация

### Layout особенности:
- **Мобильное меню** - Drawer вместо боковой панели
- **Touch-friendly** кнопки (минимум 44px)
- **Адаптивные отступы** - меньше на мобильных
- **Масштабируемые шрифты** - автоматическое изменение размера

### Оптимизация производительности:
- **Debounced resize** обработчики
- **Lazy loading** для больших компонентов
- **Минимизация перерисовок**

## 🔧 Рекомендации по использованию

### 1. Всегда используйте хук useResponsive
```typescript
const screenInfo = useResponsive();
const buttonSize = screenInfo.isMobile ? 'large' : 'middle';
```

### 2. Применяйте ResponsiveContainer для страниц
```typescript
<ResponsiveContainer>
  <ResponsiveActions>
    {/* Ваши кнопки */}
  </ResponsiveActions>
  <ResponsiveGrid>
    {/* Ваши карточки */}
  </ResponsiveGrid>
</ResponsiveContainer>
```

### 3. Используйте CSS переменные
```css
.my-component {
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
}
```

### 4. Тестируйте на разных устройствах
- Мобильные телефоны (320px+)
- Планшеты (768px+)
- Десктопы (1024px+)
- Большие экраны (1600px+)

## 🎯 Примеры использования

### Адаптивная страница:
```typescript
export const MyPage: React.FC = () => {
  const screenInfo = useResponsive();
  
  return (
    <ResponsiveContainer>
      <ResponsiveActions direction="auto">
        <Button 
          type="primary" 
          size={screenInfo.isMobile ? 'large' : 'middle'}
          style={{ width: screenInfo.isMobile ? '100%' : 'auto' }}
        >
          Действие
        </Button>
      </ResponsiveActions>
      
      <ResponsiveGrid minItemWidth={280}>
        {data.map(item => (
          <Card key={item.id}>
            <Title level={screenInfo.isMobile ? 4 : 3}>
              {item.title}
            </Title>
          </Card>
        ))}
      </ResponsiveGrid>
    </ResponsiveContainer>
  );
};
```

### Условное отображение:
```typescript
{screenInfo.isMobile ? (
  <MobileComponent />
) : (
  <DesktopComponent />
)}

{!screenInfo.isMobile && <AdvancedFeatures />}
```

## 🚀 Производительность

Система оптимизирована для:
- **Минимальные перерисовки** при изменении размера
- **Эффективное определение** типа устройства
- **Ленивая загрузка** тяжелых компонентов
- **Кэширование** вычислений размеров

## 📋 Чеклист для новых компонентов

- [ ] Использует useResponsive для адаптивности
- [ ] Применяет CSS переменные для отступов
- [ ] Touch-friendly на мобильных (минимум 44px)
- [ ] Тестирован на всех breakpoints
- [ ] Использует семантическую верстку
- [ ] Поддерживает keyboard navigation
- [ ] Оптимизирован для производительности

## 🐛 Устранение неполадок

### Проблема: Компоненты не адаптируются
**Решение:** Убедитесь что используете хук useResponsive

### Проблема: Медленная работа на мобильных
**Решение:** Проверьте использование debounced обработчиков

### Проблема: Неправильные отступы
**Решение:** Используйте CSS переменные вместо фиксированных значений

### Проблема: Сломанный layout на маленьких экранах
**Решение:** Проверьте минимальные размеры и overflow настройки

## 📚 Дополнительные ресурсы

- [Ant Design Responsive](https://ant.design/components/grid/)
- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Mobile First Design](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Responsive/Mobile_first)
