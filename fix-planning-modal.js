const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/PlanningModal/PlanningModalImproved.tsx');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Исправляем критическую ошибку с незакрытым тегом
  content = content.replace('</r>', '</r>');
  
  // Удаляем неиспользуемые переменные
  content = content.replace(
    'const [selectedOperation, setSelectedOperation] = useState<any>(null);\n  const [selectedOrder, setSelectedOrder] = useState<any>(null);\n  const [showOperationModal, setShowOperationModal] = useState(false);',
    '// Удалены неиспользуемые состояния'
  );
  
  content = content.replace(
    'const getMachineIcon = (type: string) => {\n    switch (type) {\n      case \'TURNING\':\n        return <ToolOutlined rotate={90} />;\n      default:\n        return <ToolOutlined />;\n    }\n  };',
    '// Удалена неиспользуемая функция getMachineIcon'
  );
  
  content = content.replace(
    'const machineTypeColor = getMachineTypeColor(selectedMachine.machineType);',
    '// Удалена неиспользуемая переменная machineTypeColor'
  );
  
  content = content.replace(
    'setSelectedOperation(null);\n    setSelectedOrder(null);\n    setShowOperationModal(false);',
    '// Очищены неиспользуемые состояния'
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Файл PlanningModalImproved.tsx исправлен');
} catch (error) {
  console.error('❌ Ошибка:', error.message);
}
