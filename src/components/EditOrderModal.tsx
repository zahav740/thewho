import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { MACHINES, Order, Operation, OPERATION_TYPES, MACHINE_CAPABILITIES } from '../types';
import { FileText, Plus, Trash2, Upload, X, AlertCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useApp } from '../context/AppContext';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

export default function EditOrderModal({ isOpen, onClose, order }: EditOrderModalProps) {
  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm<Partial<Order>>();
  const [operations, setOperations] = useState<Partial<Operation>[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const { updateOrder, hasOrderWithDrawingNumber } = useApp();

  // Проверка совместимости станка и операции
  const isMachineCompatible = (machineType: string, operationType: string): boolean => {
    const machine = MACHINE_CAPABILITIES.find(m => m.name === machineType);
    if (!machine) return true; // Если станок не выбран, не ограничиваем
    
    switch (operationType) {
      case '3-axis':
        return machine.supports3Axis && machine.supportsMilling;
      case '4-axis':
        return machine.supports4Axis && machine.supportsMilling;
      case 'milling':
        return machine.supportsMilling;
      case 'turning':
        return machine.supportsTurning;
      default:
        return true;
    }
  };

  // Получение сообщения о несовместимости
  const getIncompatibilityMessage = (machineType: string, operationType: string): string => {
    const machine = MACHINE_CAPABILITIES.find(m => m.name === machineType);
    if (!machine) return '';
    
    if (machine.type === 'turning' && (operationType === '3-axis' || operationType === '4-axis' || operationType === 'milling')) {
      return 'Токарные станки не могут выполнять фрезерные операции';
    }
    if (machine.type === 'milling' && operationType === 'turning') {
      return 'Фрезерные станки не могут выполнять токарные операции';
    }
    if (!machine.supports4Axis && operationType === '4-axis') {
      return 'Станок не поддерживает 4-координатную обработку';
    }
    return '';
  };

  // Initialize form with order data
  useEffect(() => {
    if (isOpen && order) {
      setValue('drawingNumber', order.drawingNumber);
      setValue('deadline', order.deadline);
      setValue('quantity', order.quantity);
      setValue('priority', order.priority);
      setOperations(order.operations || []);
      setPdfPreview(order.pdfUrl || null);
    }
  }, [isOpen, order, setValue]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setOperations([]);
      setPdfFile(null);
      setPdfPreview(null);
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const handleAddOperation = () => {
    setOperations([
      ...operations, 
      { 
        sequenceNumber: operations.length + 1,
        operationType: "milling",
        estimatedTime: 0,
        status: "pending" 
      }
    ]);
  };

  const handleRemoveOperation = (index: number) => {
    const updatedOperations = [...operations];
    updatedOperations.splice(index, 1);
    
    // Update sequence numbers
    const reorderedOperations = updatedOperations.map((op, idx) => ({
      ...op,
      sequenceNumber: idx + 1
    }));
    
    setOperations(reorderedOperations);
  };

  const handleUpdateOperation = (index: number, field: string, value: any) => {
    const updatedOperations = [...operations];
    updatedOperations[index] = {
      ...updatedOperations[index],
      [field]: value
    };
    setOperations(updatedOperations);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPdfPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: Partial<Order>) => {
    const newDrawingNumber = data.drawingNumber || '';
    
    // Проверяем на дубликаты (только если номер чертежа был изменен)
    if (newDrawingNumber !== order.drawingNumber && hasOrderWithDrawingNumber(newDrawingNumber)) {
      alert(`⚠️ Заказ с номером чертежа "${newDrawingNumber}" уже существует!\nИспользуйте другой номер чертежа.`);
      return;
    }
    
    const updatedOrder: Partial<Order> = {
      drawingNumber: newDrawingNumber,
      deadline: data.deadline || '',
      quantity: data.quantity || 0,
      priority: data.priority || 1,
      pdfUrl: pdfPreview || order.pdfUrl,
      operations: operations.map((op, index) => ({
        id: op.id || `op-${Date.now()}-${index}`,
        orderId: order.id,
        sequenceNumber: op.sequenceNumber || index + 1,
        machine: op.machine,
        operationType: op.operationType || "milling",
        estimatedTime: op.estimatedTime || 0,
        status: op.status || "pending",
        operators: op.operators || [],
        completedUnits: op.completedUnits,
        actualTime: op.actualTime
      }))
    };
    
    updateOrder(order.id, updatedOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Редактировать заказ</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Номер чертежа</label>
            <input
            {...register('drawingNumber', { required: 'Обязательное поле' })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.drawingNumber
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.drawingNumber && <p className="text-red-500 text-sm mt-1">{errors.drawingNumber.message}</p>}
          </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата дедлайна</label>
              <Controller
                control={control}
                name="deadline"
                render={({ field }) => (
                  <DatePicker
                    selected={field.value ? new Date(field.value) : null}
                    onChange={(date) => field.onChange(date?.toISOString())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dateFormat="dd.MM.yyyy"
                  />
                )}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Количество</label>
              <input
                type="number"
                {...register('quantity', { required: 'Обязательное поле', min: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 - Высокий</option>
                <option value={2}>2 - Средний</option>
                <option value={3}>3 - Низкий</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Загрузка PDF</label>
            <div className="mt-1 flex items-center">
              <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                <Upload className="mr-2 h-5 w-5 text-gray-400" />
                <span>Выбрать файл</span>
                <input type="file" className="sr-only" onChange={handlePdfUpload} accept=".pdf" />
              </label>
              <span className="ml-3">{pdfFile?.name}</span>
            </div>
            
            {pdfPreview && (
              <div className="mt-4">
                <div className="flex items-center text-blue-600 mb-2">
                  <FileText className="mr-2" />
                  <span>PDF файл загружен</span>
                </div>
                <div className="border rounded-md bg-gray-50 p-2">
                  {pdfPreview.startsWith('data:') ? (
                    <iframe
                      src={pdfPreview}
                      className="w-full h-96 border rounded"
                      title="PDF Preview"
                    />
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-gray-600">Для полного просмотра откройте файл в новой вкладке</p>
                      <a 
                        href={pdfPreview} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <FileText className="mr-1 h-4 w-4" />
                        Открыть PDF
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Операции</h3>
              <button
                type="button"
                onClick={handleAddOperation}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="mr-2 h-4 w-4" />
                Добавить операцию
              </button>
            </div>
            
            {operations.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                Нет операций. Добавьте первую операцию.
              </div>
            )}
            
            {operations.map((operation, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Операция #{operation.sequenceNumber}</h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveOperation(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Станок</label>
                    <select
                      value={operation.machine || ''}
                      onChange={(e) => {
                        const newMachine = e.target.value;
                        handleUpdateOperation(index, 'machine', newMachine);
                        
                        // Если станок несовместим с текущей операцией, показываем предупреждение
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        operation.machine && operation.operationType && !isMachineCompatible(operation.machine, operation.operationType)
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <option value="">Выберите станок</option>
                      {MACHINES.map((machine) => {
                        const machineData = MACHINE_CAPABILITIES.find(m => m.name === machine);
                        const isCompatible = !operation.operationType || isMachineCompatible(machine, operation.operationType);
                        return (
                          <option key={machine} value={machine}>
                            {machine} {machineData?.type === 'turning' ? '(Токарный)' : '(Фрезерный)'}
                            {!isCompatible && ' - Несовместимо'}
                          </option>
                        );
                      })}
                    </select>
                    {operation.machine && operation.operationType && !isMachineCompatible(operation.machine, operation.operationType) && (
                      <div className="flex items-center mt-1 text-red-600 text-xs">
                        <AlertCircle size={14} className="mr-1" />
                        {getIncompatibilityMessage(operation.machine, operation.operationType)}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Тип операции</label>
                    <select
                      value={operation.operationType || 'milling'}
                      onChange={(e) => {
                        const newOperationType = e.target.value;
                        handleUpdateOperation(index, 'operationType', newOperationType);
                        
                        // Если операция несовместима с текущим станком, очищаем выбор станка
                        if (operation.machine && !isMachineCompatible(operation.machine, newOperationType)) {
                          handleUpdateOperation(index, 'machine', '');
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {OPERATION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {OPERATION_TYPES.find(t => t.value === operation.operationType)?.description}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Расчетное время (мин)</label>
                    <input
                      type="number"
                      value={operation.estimatedTime || 0}
                      onChange={(e) => handleUpdateOperation(index, 'estimatedTime', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Сохранить изменения
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
