import { useState, useEffect } from 'react';
import { MACHINES, NIGHT_OPERATOR } from '../types';
import { useApp } from '../context/AppContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { CirclePlus, X, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DrawingNumberAutocomplete from '../components/DrawingNumberAutocomplete';
import i18n from '../i18n';

export default function ShiftsPage() {
  const { t } = useTranslation();
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [shiftDate, setShiftDate] = useState<Date>(new Date());
  const { operators, orders, addShift, addSetup } = useApp();
  
  // Функция для перевода имени оператора
  const translateOperatorName = (name: string): string => {
    // Используем i18n для определения текущего языка
    const currentLanguage = (i18n?.language || 'ru').toLowerCase();

    // Если язык русский, возвращаем русские имена
    if (currentLanguage === 'ru') {
      // Для русского языка - возвращаем русские версии имен
      if (name.toLowerCase().includes('daniel')) return 'Даниэль';
      if (name.toLowerCase().includes('slava')) return 'Слава';
      if (name.toLowerCase().includes('andrey')) return 'Андрей';
      if (name.toLowerCase().includes('denis')) return 'Денис';
      if (name.toLowerCase().includes('kirill')) return 'Кирилл';
      if (name.toLowerCase().includes('arkady')) return 'Аркадий';
      
      // Если имя уже на русском, оставляем как есть
      return name;
    }
    
    // Для английского языка - переводим на английский
    // Прямое сравнение для полных совпадений
    if (name === "Даниель" || name === "Даниэль") return "Daniel";
    if (name === "Слава" || name === "Славик") return "Slava";
    if (name === "Андрей") return "Andrey";
    if (name === "Денис") return "Denis";
    if (name === "Кирилл") return "Kirill";
    if (name === "Аркадий") return "Arkady";

    // Для частичных совпадений проверяем нижний регистр
    const lowercaseName = name.toLowerCase();
    if (lowercaseName.includes('дани') || lowercaseName.includes('дэниэл')) return "Daniel";
    if (lowercaseName.includes('слав')) return "Slava";
    if (lowercaseName.includes('андрей')) return "Andrey";
    if (lowercaseName.includes('денис')) return "Denis";
    if (lowercaseName.includes('кирилл')) return "Kirill";
    if (lowercaseName.includes('аркадий')) return "Arkady";
    
    // Для английских имен - вернуть как есть
    return name;
  };
  
  // Устанавливаем операторов дневной смены
  const [dayShiftOperators, setDayShiftOperators] = useState<string[]>(() => {
    if (Array.isArray(operators) && operators.length > 0) {
      return operators
        .filter(op => op && (typeof op === 'string' || (op as any).name))
        .map(op => typeof op === 'string' ? op : (op as any).name || 'Unknown');
    }
    return ["Operator 1", "Operator 2"];
  });
  const [dayShiftOperations, setDayShiftOperations] = useState<
    { operationId: string; drawingNumber: string; completedUnits: number; timeSpent: number; operators: string[] }[]
  >([]);
  const [nightShiftOperations, setNightShiftOperations] = useState<
    { operationId: string; drawingNumber: string; completedUnits: number; timeSpent: number; operators: string[] }[]
  >([]);
  
  const [setups, setSetups] = useState<{
    drawingNumber: string;
    setupType: string;
    operationNumber: number;
    timeSpent: number;
    operator: string;
    startTime: string;
  }[]>([]);

  const handleMachineSelect = (machine: string) => {
    setSelectedMachine(machine);
    // Reset other fields when changing machine
    setDayShiftOperations([]);
    setNightShiftOperations([]);
    setSetups([]);
  };


  const handleAddDayOperation = () => {
    setDayShiftOperations([...dayShiftOperations, { operationId: '', drawingNumber: '', completedUnits: 0, timeSpent: 0, operators: [] }]);
  };

  const handleAddNightOperation = () => {
    const translatedNightOperator = t('night_operator');
    setNightShiftOperations([...nightShiftOperations, { operationId: '', drawingNumber: '', completedUnits: 0, timeSpent: 0, operators: [translatedNightOperator] }]);
  };

  const handleDayOperationChange = (index: number, field: string, value: any) => {
    const updatedOperations = [...dayShiftOperations];
    updatedOperations[index] = { ...updatedOperations[index], [field]: value };
    setDayShiftOperations(updatedOperations);
  };

  const handleNightOperationChange = (index: number, field: string, value: any) => {
    const updatedOperations = [...nightShiftOperations];
    updatedOperations[index] = { ...updatedOperations[index], [field]: value };
    setNightShiftOperations(updatedOperations);
  };

  const handleRemoveDayOperation = (index: number) => {
    const updatedOperations = [...dayShiftOperations];
    updatedOperations.splice(index, 1);
    setDayShiftOperations(updatedOperations);
  };

  const handleRemoveNightOperation = (index: number) => {
    const updatedOperations = [...nightShiftOperations];
    updatedOperations.splice(index, 1);
    setNightShiftOperations(updatedOperations);
  };
  
  const handleAddSetup = () => {
    setSetups([...setups, {
      drawingNumber: '',
      setupType: '',
      operationNumber: 1,
      timeSpent: 0,
      operator: operators[0] || '',
      startTime: ''
    }]);
  };
  
  const handleRemoveSetup = (index: number) => {
    const updatedSetups = [...setups];
    updatedSetups.splice(index, 1);
    setSetups(updatedSetups);
  };
  
  const handleSetupChange = (index: number, field: string, value: any) => {
    const updatedSetups = [...setups];
    updatedSetups[index] = { ...updatedSetups[index], [field]: value };
    setSetups(updatedSetups);
  };
  

  const handleAddOperatorToShiftOperation = (operationIndex: number, isNight: boolean, operator: string) => {
    if (isNight) {
      const updatedOperations = [...nightShiftOperations];
      const currentOperators = updatedOperations[operationIndex].operators || [];
      if (!currentOperators.includes(operator)) {
        updatedOperations[operationIndex].operators = [...currentOperators, operator];
        setNightShiftOperations(updatedOperations);
      }
    } else {
      const updatedOperations = [...dayShiftOperations];
      const currentOperators = updatedOperations[operationIndex].operators || [];
      if (!currentOperators.includes(operator)) {
        updatedOperations[operationIndex].operators = [...currentOperators, operator];
        setDayShiftOperations(updatedOperations);
      }
    }
  };
  
  const handleRemoveOperatorFromShiftOperation = (operationIndex: number, isNight: boolean, operator: string) => {
    if (isNight) {
      const updatedOperations = [...nightShiftOperations];
      updatedOperations[operationIndex].operators = updatedOperations[operationIndex].operators.filter(op => op !== operator);
      setNightShiftOperations(updatedOperations);
    } else {
      const updatedOperations = [...dayShiftOperations];
      updatedOperations[operationIndex].operators = updatedOperations[operationIndex].operators.filter(op => op !== operator);
      setDayShiftOperations(updatedOperations);
    }
  };

  const handleSaveShift = () => {
    if (!selectedMachine) return;

    // Create the setups
    setups.forEach(setup => {
      addSetup({
        id: `setup-${Date.now()}-${Math.random()}`,
        drawingNumber: setup.drawingNumber,
        setupType: setup.setupType,
        operationNumber: setup.operationNumber,
        timeSpent: setup.timeSpent,
        operator: setup.operator,
        startTime: setup.startTime,
        date: shiftDate.toISOString(),
        machine: selectedMachine
      });
    });

    // Day shift
    if (dayShiftOperations.length > 0) {
      addShift({
        id: `day-${Date.now()}`,
        date: shiftDate.toISOString(),
        machine: selectedMachine,
        isNight: false,
        operators: dayShiftOperators,
        operations: dayShiftOperations
      });
    }

    // Night shift
    if (nightShiftOperations.length > 0) {
      const translatedNightOperator = t('night_operator');
      addShift({
        id: `night-${Date.now()}`,
        date: shiftDate.toISOString(),
        machine: selectedMachine,
        isNight: true,
        operators: [translatedNightOperator],
        operations: nightShiftOperations
      });
    }

    // Reset form
    setDayShiftOperations([]);
    setNightShiftOperations([]);
    setSetups([]);
    alert(t('shifts_saved'));
  };

  // Get all operations for the selected machine
  const availableOperations = orders.flatMap(order => {
    return order.operations
      .filter(op => op.machine === selectedMachine)
      .map(op => ({
        id: op.id,
        label: `${order.drawingNumber} - ${t('operation_short')} #${op.sequenceNumber}`
      }));
  });
  
  // Обновление dayShiftOperators при изменении operators
  useEffect(() => {
    if (Array.isArray(operators) && operators.length > 0) {
      const stringOperators = operators
        .filter(op => op && (typeof op === 'string' || (op as any).name))
        .map(op => typeof op === 'string' ? op : (op as any).name || 'Unknown');
      setDayShiftOperators(stringOperators);
    }
  }, [operators]);

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>{t('shift_tracking')}</h1>
      
      {!selectedMachine ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MACHINES.map((machine) => (
            <button
              key={machine}
              onClick={() => handleMachineSelect(machine)}
              className="bg-white hover:bg-blue-50 border border-gray-200 rounded-lg p-6 text-center shadow-sm transition-colors"
            >
              <h2 className="text-xl font-medium">{machine}</h2>
              <p className="text-gray-500 mt-2">{t('click_to_select_operator')}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">{selectedMachine}</h2>
            <button
              onClick={() => setSelectedMachine(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              {t('back_to_list')}
            </button>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('date_label')}</label>
            <DatePicker
              selected={shiftDate}
              onChange={(date) => setShiftDate(date || new Date())}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              dateFormat="dd.MM.yyyy"
            />
          </div>
          
          {/* Setup Section */}
          <div className="mb-6 border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{t('setup_section')}</h3>
              <button
                onClick={handleAddSetup}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <CirclePlus size={16} className="mr-1" />
                {t('add_setup_btn')}
              </button>
            </div>
            
            {setups.length === 0 ? (
              <div className="text-gray-500 text-center py-4">
                {t('no_setups_message')}
              </div>
            ) : (
              <div className="space-y-4">
                {setups.map((setup, index) => (
                  <div key={index} className="grid grid-cols-[200px_150px_80px_100px_120px_150px_60px] gap-4 bg-gray-50 p-3 rounded-md items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('drawing_number_label')}</label>
                      <DrawingNumberAutocomplete
                        value={setup.drawingNumber}
                        onChange={(value) => handleSetupChange(index, 'drawingNumber', value)}
                        placeholder={t('enter_drawing_number')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('setup_type_label')}</label>
                      <select
                        value={setup.setupType}
                        onChange={(e) => handleSetupChange(index, 'setupType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">{t('select_type_label')}</option>
                        <option value="3-axis">{t('3_axis')}</option>
                        <option value="4-axis">{t('4_axis')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('operation_label')}</label>
                      <input
                        type="number"
                        value={setup.operationNumber}
                        onChange={(e) => handleSetupChange(index, 'operationNumber', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ width: '60px' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('setup_start_time_label')}</label>
                      <input
                        type="time"
                        value={setup.startTime}
                        onChange={(e) => handleSetupChange(index, 'startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('setup_time_minutes_label')}</label>
                      <input
                        type="number"
                        value={setup.timeSpent}
                        onChange={(e) => handleSetupChange(index, 'timeSpent', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ width: '80px' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('operator_label')}</label>
                      <select
                        value={setup.operator}
                        onChange={(e) => handleSetupChange(index, 'operator', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {operators.map((op, opIdx) => {
                          const operatorName = typeof op === 'string' ? op : (op as any)?.name || 'Unknown';
                          const operatorKey = `operator_${operatorName.toLowerCase()}`;
                          return (
                            <option key={`setup-operator-${opIdx}-${operatorName}`} value={operatorName}>
                              {translateOperatorName(operatorName)}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleRemoveSetup(index)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title={t('delete_label')}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Day Shift */}
          <div className="mb-6 border-t pt-4">
            <h3 className="text-lg font-medium mb-4">{t('day_shift')}</h3>
            
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-md font-medium">{t('completed_operations')}</h4>
                <button
                  onClick={handleAddDayOperation}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <CirclePlus size={16} className="mr-1" />
                  {t('add_operation_short')}
                </button>
              </div>
              
              {dayShiftOperations.length === 0 ? (
                <div className="text-gray-500 text-center py-4">
                  {t('no_operations')}
                </div>
              ) : (
                <div className="space-y-4">
                  {dayShiftOperations.map((operation, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_60px] gap-4 mb-3 items-end">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('drawing_number_label')}</label>
                          <DrawingNumberAutocomplete
                            value={operation.drawingNumber}
                            onChange={(value) => handleDayOperationChange(index, 'drawingNumber', value)}
                            placeholder={t('enter_drawing_number')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('operation_label')}</label>
                          {availableOperations.length === 0 ? (
                            <input
                              type="text"
                              value={operation.operationId}
                              onChange={(e) => handleDayOperationChange(index, 'operationId', e.target.value)}
                              placeholder={t('enter_operation_name')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <select
                              value={operation.operationId}
                              onChange={(e) => handleDayOperationChange(index, 'operationId', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">{t('select_operation')}</option>
                              {availableOperations.map((op, opIdx) => (
                                <option key={`available-day-${opIdx}-${op.id}`} value={op.id}>{op.label}</option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('units_completed_short')}</label>
                          <input
                            type="number"
                            value={operation.completedUnits}
                            onChange={(e) => handleDayOperationChange(index, 'completedUnits', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('time_spent_short')}</label>
                          <input
                            type="number"
                            value={operation.timeSpent}
                            onChange={(e) => handleDayOperationChange(index, 'timeSpent', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleRemoveDayOperation(index)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            title={t('delete_label')}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('operators_short')}</label>
                        <div className="flex items-center gap-2 mb-2">
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAddOperatorToShiftOperation(index, false, e.target.value);
                                e.target.value = '';
                              }
                            }}
                          >
                            <option value="">{t('select_operator_from_list')}</option>
                            {dayShiftOperators.filter(op => 
                              !operation.operators?.includes(op)
                            ).map((op, opIdx) => {
                              const operatorName = typeof op === 'string' ? op : String(op);
                              const operatorKey = `operator_${operatorName.toLowerCase()}`;
                              return (
                            <option key={`day-select-${opIdx}-${operatorName}`} value={operatorName}>
                              {translateOperatorName(operatorName)}
                            </option>
                              );
                            })}
                          </select>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {operation.operators?.map((op, opIndex) => {
                            const operatorName = typeof op === 'string' ? op : String(op);
                            const operatorKey = `operator_${operatorName.toLowerCase()}`;
                            return (
                              <div key={`day-op-${index}-${opIndex}-${operatorName}`} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                                <span>{translateOperatorName(operatorName)}</span>
                              <button 
                                onClick={() => handleRemoveOperatorFromShiftOperation(index, false, op)}
                                className="ml-2 text-blue-600 hover:text-blue-800"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Night Shift */}
          <div className="mb-6 border-t pt-4">
            <h3 className="text-lg font-medium mb-4">{t('night_shift')}</h3>
            
            <div className="mb-4">
              <h4 className="text-md font-medium mb-2">{t('operator_label')}</h4>
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full inline-block">
                {t('night_operator')}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-md font-medium">{t('completed_operations')}</h4>
                <button
                  onClick={handleAddNightOperation}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <CirclePlus size={16} className="mr-1" />
                  {t('add_operation_short')}
                </button>
              </div>
              
              {nightShiftOperations.length === 0 ? (
                <div className="text-gray-500 text-center py-4">
                  {t('no_operations')}
                </div>
              ) : (
                <div className="space-y-4">
                  {nightShiftOperations.map((operation, index) => (
                    <div key={index} className="grid grid-cols-[1fr_1fr_1fr_1fr_60px] gap-4 bg-gray-50 p-3 rounded-md items-end">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('drawing_number_label')}</label>
                        <DrawingNumberAutocomplete
                          value={operation.drawingNumber}
                          onChange={(value) => handleNightOperationChange(index, 'drawingNumber', value)}
                          placeholder={t('enter_drawing_number')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('operation_label')}</label>
                        {availableOperations.length === 0 ? (
                          <input
                            type="text"
                            value={operation.operationId}
                            onChange={(e) => handleNightOperationChange(index, 'operationId', e.target.value)}
                            placeholder={t('enter_operation_name')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <select
                            value={operation.operationId}
                            onChange={(e) => handleNightOperationChange(index, 'operationId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">{t('select_operation')}</option>
                            {availableOperations.map((op, opIdx) => (
                              <option key={`available-night-${opIdx}-${op.id}`} value={op.id}>{op.label}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('units_completed_short')}</label>
                        <input
                          type="number"
                          value={operation.completedUnits}
                          onChange={(e) => handleNightOperationChange(index, 'completedUnits', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('time_spent_short')}</label>
                        <input
                          type="number"
                          value={operation.timeSpent}
                          onChange={(e) => handleNightOperationChange(index, 'timeSpent', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleRemoveNightOperation(index)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title={t('delete_label')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t pt-4 flex justify-end">
            <button
              onClick={handleSaveShift}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {t('save_shifts_btn')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
