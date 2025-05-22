import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { shiftService } from '../../services/shiftService';
import { MACHINES } from '../../types';

const ShiftsList = () => {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ machine: '', isNight: null });
  
  useEffect(() => {
    loadShifts();
  }, []);
  
  const loadShifts = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const data = await shiftService.getShifts();
      setShifts(data);
    } catch (err) {
      console.error('Error loading shifts', err);
      setError('Ошибка загрузки данных о сменах');
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredShifts = () => {
    return shifts.filter(shift => {
      const matchesMachine = !filter.machine || shift.machine === filter.machine;
      const matchesShiftType = filter.isNight === null || shift.isNight === filter.isNight;
      return matchesMachine && matchesShiftType;
    });
  };
  
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy');
    } catch (err) {
      return dateString;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Учет смен</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          onClick={() => navigate('/shifts/new')}
        >
          Добавить смену
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Фильтры</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Станок</label>
            <select
              className="w-full px-3 py-2 border rounded-lg"
              value={filter.machine}
              onChange={(e) => setFilter({ ...filter, machine: e.target.value })}
            >
              <option value="">Все станки</option>
              {MACHINES.map(machine => (
                <option key={machine} value={machine}>{machine}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Тип смены</label>
            <select
              className="w-full px-3 py-2 border rounded-lg"
              value={filter.isNight === null ? '' : filter.isNight ? 'night' : 'day'}
              onChange={(e) => {
                const value = e.target.value;
                setFilter({ 
                  ...filter, 
                  isNight: value === '' ? null : value === 'night'
                });
              }}
            >
              <option value="">Все смены</option>
              <option value="day">Дневные (8:00-16:00)</option>
              <option value="night">Ночные (16:00-8:00)</option>
            </select>
          </div>
        </div>
      </div>
      
      {filteredShifts().length === 0 ? (
        <div className="bg-gray-100 p-6 rounded-lg text-center">
          <p className="text-gray-700">Смены не найдены</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShifts().map(shift => (
            <div key={shift.id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className={`px-4 py-3 ${shift.isNight ? 'bg-indigo-600' : 'bg-blue-500'} text-white`}>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{shift.machine}</h3>
                  <span className="px-2 py-1 rounded bg-opacity-25 bg-white text-sm">
                    {shift.isNight ? 'Ночная смена' : 'Дневная смена'}
                  </span>
                </div>
                <p className="text-sm">{formatDate(shift.date)}</p>
              </div>
              
              <div className="p-4">
                <div className="mb-3">
                  <h4 className="font-medium text-gray-700">Операторы:</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {shift.operators.map((operator, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-sm">
                        {operator}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mb-3">
                  <h4 className="font-medium text-gray-700">Выполнено операций: {shift.operations?.length || 0}</h4>
                  {shift.operations && shift.operations.length > 0 && (
                    <ul className="mt-1 space-y-1">
                      {shift.operations.map((op, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex justify-between">
                          <span>{op.drawingNumber}</span>
                          <span>{op.completedUnits} шт.</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700">Выполнено наладок: {shift.setups?.length || 0}</h4>
                  {shift.setups && shift.setups.length > 0 && (
                    <ul className="mt-1 space-y-1">
                      {shift.setups.map((setup, idx) => (
                        <li key={idx} className="text-sm text-gray-600">
                          {setup.drawingNumber} - {setup.setupType}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              
              <div className="px-4 py-3 bg-gray-50 text-right">
                <button
                  className="text-blue-500 hover:text-blue-700 font-medium"
                  onClick={() => navigate(`/shifts/${shift.id}`)}
                >
                  Подробнее
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShiftsList;
