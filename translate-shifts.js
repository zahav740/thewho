const fs = require('fs');

const filePath = './src/pages/ShiftsPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace texts with translation keys
const replacements = [
  ['Номер чертежа', 't(\'drawing_number_short\')'],
  ['Тип наладки', 't(\'setup_type\')'],
  ['Операция', 't(\'operation_short\')'],
  ['Время наладки', 't(\'setup_time_label\')'],
  ['Оператор', 't(\'operator\')'],
  ['Выберите тип', 't(\'select_setup_type\')'],
  ['3-осевая', 't(\'3_axis\')'],
  ['4-осевая', 't(\'4_axis\')'],
  ['Удалить', 't(\'delete\')'],
  ['Дневная смена', 't(\'day_shift_section\')'],
  ['Выполненные операции', 't(\'completed_operations_section\')'],
  ['Добавить операцию', 't(\'add_operation_short\')'],
  ['Нет операций. Добавьте операцию, чтобы начать.', 't(\'no_operations_message\')'],
  ['Введите номер чертежа', 't(\'enter_drawing_number\')'],
  ['Введите название операции', 't(\'enter_operation_name\')'],
  ['Выберите операцию', 't(\'select_operation\')'],
  ['Выполнено единиц', 't(\'units_completed_short\')'],
  ['Затраченное время (мин)', 't(\'time_spent_short\')'],
  ['Операторы', 't(\'operators_short\')'],
  ['Выберите оператора', 't(\'select_operator\')'],
  ['Ночная смена', 't(\'night_shift_section\')'],
  ['Сохранить смены', 't(\'save_shifts_btn\')']
];

// Replace label texts with JSX expressions
replacements.forEach(([search, replace]) => {
  // For jsx text content
  content = content.replace(new RegExp(`"${search}"`, 'g'), `{${replace}}`);
  // For placeholders
  content = content.replace(new RegExp(`placeholder="${search}"`, 'g'), `placeholder={${replace}}`);
  // For string literals in JSX
  content = content.replace(new RegExp(`>${search}<`, 'g'), `>{${replace}}<`);
});

fs.writeFileSync(filePath, content);
console.log('Replacements completed!');
