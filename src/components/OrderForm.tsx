import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useForm, Controller } from 'react-hook-form';
import { MACHINES, Order, Operation, OPERATION_TYPES, MACHINE_CAPABILITIES } from '../types';
import { FileText, Plus, Trash2, Upload, AlertCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useApp } from '../context/AppContext';
import DrawingNumberAutocomplete from './DrawingNumberAutocomplete';
import { useTranslation } from 'react-i18next';

export default function OrderForm() {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation();
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<Partial<Order>>();
  const [operations, setOperations] = useState<Partial<Operation>[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const { addOrder } = useApp();

  // Check machine and operation compatibility
  const isMachineCompatible = (machineType: string, operationType: string): boolean => {
    const machine = MACHINE_CAPABILITIES.find(m => m.name === machineType);
    if (!machine) return true; // If no machine selected, don't restrict
    
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

  // Get incompatibility message
  const getIncompatibilityMessage = (machineType: string, operationType: string): string => {
    const machine = MACHINE_CAPABILITIES.find(m => m.name === machineType);
    if (!machine) return '';
    
    if (machine.type === 'turning' && (operationType === '3-axis' || operationType === '4-axis' || operationType === 'milling')) {
      return t('turning_milling_incompatible');
    }
    if (machine.type === 'milling' && operationType === 'turning') {
      return t('milling_turning_incompatible');
    }
    if (!machine.supports4Axis && operationType === '4-axis') {
      return t('no_4axis_support');
    }
    return '';
  };

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
        localStorage.setItem('pdfPreview', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: Partial<Order>) => {
    // Создаем UUID для заказа заранее, чтобы использовать его для операций
    const orderId = uuidv4();
    
    const newOrder: Order = {
      id: orderId,
      drawingNumber: data.drawingNumber || '',
      name: data.drawingNumber || '', // Используем drawingNumber в качестве имени
      clientName: data.clientName || data.drawingNumber || '', // Используем clientName или drawingNumber
      deadline: data.deadline || '',
      quantity: data.quantity || 0,
      priority: data.priority || 1,
      pdfUrl: pdfPreview || undefined,
      operations: operations.map((op, index) => ({
        id: uuidv4(),
        orderId: orderId, // Используем ID заказа
        sequenceNumber: op.sequenceNumber || index + 1,
        machine: op.machine,
        operationType: op.operationType || "milling",
        estimatedTime: op.estimatedTime || 0,
        status: "pending",
        operators: []
      }))
    };
    
    // Проверяем результат добавления
    const wasAdded = addOrder(newOrder);
    
    if (wasAdded) {
      // Успешно добавлено - очищаем форму
      reset();
      setOperations([]);
      setPdfFile(null);
      setPdfPreview(null);
      
      // Показываем успешное сообщение
      alert(`✅ Заказ "${newOrder.drawingNumber}" успешно добавлен!`);
    } else {
      // Не удалось добавить (дубликат номера чертежа)
      alert(`⚠️ Заказ с номером чертежа "${newOrder.drawingNumber}" уже существует!\nИспользуйте другой номер чертежа или отредактируйте существующий заказ.`);
    }
  };

  // Load PDF preview from localStorage on mount
  useEffect(() => {
    const savedPreview = localStorage.getItem('pdfPreview');
    if (savedPreview) {
      setPdfPreview(savedPreview);
    }
  }, []);

  // Функция для переключения видимости формы
  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Кнопка для открытия/скрытия формы */}
      <div 
        onClick={toggleFormVisibility}
        className="w-full flex justify-between items-center font-semibold text-xl mb-4 cursor-pointer hover:bg-gray-50 p-3 rounded-md transition-colors border border-transparent hover:border-gray-200 select-none"
      >
        <h2>{t('add_order_title')}</h2>
        <span className="flex items-center justify-center w-8 h-8 text-blue-600 bg-blue-50 rounded-full transition-colors hover:bg-blue-100">
          {isFormVisible ? '▲' : '▼'}
        </span>
      </div>
      
      {/* Форма добавления заказа (скрываемая) */}
      <div 
        ref={formRef} 
        className={`transition-all duration-300 ease-in-out ${isFormVisible ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}
      >

      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('drawing_number_label')}</label>
            <Controller
              control={control}
              name="drawingNumber"
              rules={{ required: t('drawing_number_required') }}
              render={({ field }) => (
                <DrawingNumberAutocomplete
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.drawingNumber?.message}
                  required
                />
              )}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя клиента</label>
            <input
              type="text"
              {...register('clientName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите имя клиента"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('deadline_date_label')}</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('quantity_label')}</label>
            <input
              type="number"
              {...register('quantity', { required: t('quantity_required'), min: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('priority_label_full')}</label>
            <select
              {...register('priority')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>{t('priority_1_high')}</option>
              <option value={2}>{t('priority_2_medium')}</option>
              <option value={3}>{t('priority_3_low')}</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('pdf_upload')}</label>
          <div className="mt-1 flex items-center">
            <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
              <Upload className="mr-2 h-5 w-5 text-gray-400" />
              <span>{t('select_file_label')}</span>
              <input type="file" className="sr-only" onChange={handlePdfUpload} accept=".pdf" />
            </label>
            <span className="ml-3">{pdfFile?.name}</span>
          </div>
          
          {pdfPreview && (
            <div className="mt-4">
              <div className="flex items-center text-blue-600 mb-2">
                <FileText className="mr-2" />
                <span>{t('pdf_uploaded_success')}</span>
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
                    <p className="text-gray-600">{t('pdf_preview_open_new_tab')}</p>
                    <a 
                      href={pdfPreview} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <FileText className="mr-1 h-4 w-4" />
                      {t('open_pdf')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{t('operations_section')}</h3>
            <button
              type="button"
              onClick={handleAddOperation}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('add_operation_btn')}
            </button>
          </div>
          
          {operations.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              {t('no_operations_message')}
            </div>
          )}
          
          {operations.map((operation, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-md mb-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">{t('operation_number')}{operation.sequenceNumber}</h4>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('machine')}</label>
                  <select
                    value={operation.machine || ''}
                    onChange={(e) => {
                      const newMachine = e.target.value;
                      handleUpdateOperation(index, 'machine', newMachine);
                      
                      // If machine is incompatible with current operation, mark as general operation
                      if (newMachine && operation.operationType && !isMachineCompatible(newMachine, operation.operationType || 'milling')) {
                        // Don't block, but show warning
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      operation.machine && operation.operationType && !isMachineCompatible(operation.machine, operation.operationType)
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <option value="">{t('select_machine_label')}</option>
                    {MACHINES.map((machine) => {
                      const machineData = MACHINE_CAPABILITIES.find(m => m.name === machine);
                      const isCompatible = !operation.operationType || isMachineCompatible(machine, operation.operationType);
                      return (
                        <option key={machine} value={machine}>
                          {machine} {machineData?.type === 'turning' ? t('turning_machine') : t('milling_machine')}
                          {!isCompatible && t('incompatible_suffix')}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('operation_type_label')}</label>
                  <select
                    value={operation.operationType || 'milling'}
                    onChange={(e) => {
                      const newOperationType = e.target.value;
                      handleUpdateOperation(index, 'operationType', newOperationType);
                      
                      // If operation is incompatible with current machine, clear machine selection
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('estimated_time_label')}</label>
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
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('save_order_btn')}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
