/**
 * @file: FixedProductionCalendar.tsx
 * @description: Исправленный современный календарь производства с разделением на фрезерные и токарные станки
 * @created: 2025-06-17
 * @updated: 2025-06-18 - Добавлено разделение станков по типам (фрезерные и токарные)
 */
import React, { useState, useEffect } from 'react';
import { Tabs } from 'antd';

interface CalendarProps {
  filter: {
    startDate: string;
    endDate: string;
    showWeekends?: boolean;
    showEfficiency?: boolean;
    showSetupTime?: boolean;
    viewMode?: 'detailed' | 'compact';
  };
}

// API для получения данных календаря
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';

const fetchCalendarData = async (startDate: string, endDate: string) => {
  try {
    console.log('🔄 Загрузка данных календаря из БД...');
    const response = await fetch(`${API_BASE_URL}/calendar?startDate=${startDate}&endDate=${endDate}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Данные календаря получены:', data);
      return data;
    } else {
      console.warn('⚠️ Backend вернул ошибку:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки календаря:', error);
    return null;
  }
};

const fetchMachineSummary = async (startDate: string, endDate: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/calendar/machine-summary?startDate=${startDate}&endDate=${endDate}`);
    const data = await response.json();
    return data.success ? data : null;
  } catch (error) {
    console.error('❌ Ошибка загрузки сводки станков:', error);
    return null;
  }
};

export const FixedProductionCalendar: React.FC<CalendarProps> = ({ filter }) => {
  const [selectedOperation, setSelectedOperation] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'milling' | 'turning'>('all');

  useEffect(() => {
    loadData();
  }, [filter.startDate, filter.endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [calendar, summary] = await Promise.all([
        fetchCalendarData(filter.startDate, filter.endDate),
        fetchMachineSummary(filter.startDate, filter.endDate)
      ]);
      
      if (calendar) {
        setCalendarData(calendar);
      } else {
        setCalendarData(null);
      }
      
      if (summary) {
        setSummaryData(summary);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  // Фильтруем станки по типам
  const getFilteredMachines = () => {
    if (!calendarData?.machineSchedules) return [];
    
    switch (activeTab) {
      case 'milling':
        return calendarData.machineSchedules.filter((machine: any) => 
          machine.machineType === 'MILLING' || machine.machineType === 'milling' || 
          machine.machineType.toLowerCase().includes('milling') ||
          machine.machineName.toLowerCase().includes('фрез')
        );
      case 'turning':
        return calendarData.machineSchedules.filter((machine: any) => 
          machine.machineType === 'TURNING' || machine.machineType === 'turning' || 
          machine.machineType.toLowerCase().includes('turning') ||
          machine.machineName.toLowerCase().includes('токар')
        );
      default:
        return calendarData.machineSchedules;
    }
  };

  // Генерируем даты из полученного периода (ограничиваем 21 днем)
  const generateDatesFromData = () => {
    if (!calendarData || !calendarData.machineSchedules[0]?.days) {
      return [];
    }
    
    return calendarData.machineSchedules[0].days
      .filter((day: any) => day.isWorkingDay)
      .map((day: any) => new Date(day.date))
      .slice(0, 21);
  };

  const dates = generateDatesFromData();

  const getOperation = (machineId: number, date: Date) => {
    if (!calendarData?.machineSchedules) return null;
    
    const machine = calendarData.machineSchedules.find((m: any) => m.machineId === machineId);
    if (!machine) return null;
    
    const dateStr = date.toISOString().split('T')[0];
    const day = machine.days.find((d: any) => d.date === dateStr);
    
    if (!day) return null;
    
    if (day.completedShifts && day.completedShifts.length > 0) {
      const shift = day.completedShifts[0];
      return {
        ...shift,
        status: 'COMPLETED',
        progress: 100,
        type: 'completed'
      };
    }
    
    if (day.plannedOperation) {
      return {
        ...day.plannedOperation,
        status: day.plannedOperation.currentProgress?.progressPercent === 100 ? 'COMPLETED' : 'IN_PROGRESS',
        progress: day.plannedOperation.currentProgress?.progressPercent || 0,
        type: 'planned'
      };
    }
    
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#52c41a';
      case 'IN_PROGRESS': return '#1890ff';
      case 'PLANNED':
      case 'ASSIGNED': return '#faad14';
      case 'OVERDUE': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const getMachineTypeColor = (type: string) => {
    switch (type) {
      case 'MILLING': return '#1890ff';
      case 'TURNING': return '#52c41a';
      case 'DRILLING': return '#faad14';
      default: return '#722ed1';
    }
  };

  const getMachineTypeIcon = (type: string) => {
    switch (type) {
      case 'MILLING': return '🔧';
      case 'TURNING': return '⚙️';
      case 'DRILLING': return '⚡';
      default: return '🔧';
    }
  };

  const handleCellClick = (operation: any, machine: any, date: Date) => {
    if (operation) {
      setSelectedOperation({
        ...operation,
        machine,
        date: date.toLocaleDateString('ru-RU')
      });
      setModalVisible(true);
    }
  };

  const renderMachineCard = (machine: any) => {
    const workingDays = machine.days.filter((d: any) => d.isWorkingDay).slice(0, 21);
    const busyDays = workingDays.filter((d: any) => 
      (d.completedShifts && d.completedShifts.length > 0) || d.plannedOperation
    );
    const utilization = workingDays.length > 0 ? (busyDays.length / workingDays.length) * 100 : 0;

    return (
      <div
        key={machine.machineId}
        style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '16px',
          padding: '20px',
          margin: '16px',
          minWidth: '320px',
          border: `3px solid ${getMachineTypeColor(machine.machineType)}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Заголовок станка */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: getMachineTypeColor(machine.machineType),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              {getMachineTypeIcon(machine.machineType)}
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                {machine.machineName}
              </div>
              <div style={{ color: '#999', fontSize: '12px' }}>
                {machine.machineType === 'MILLING' ? 'Фрезерный станок' : 
                 machine.machineType === 'TURNING' ? 'Токарный станок' : 
                 machine.machineType}
              </div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: utilization > 80 ? '#ff4d4f' : utilization > 50 ? '#faad14' : '#52c41a',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {Math.round(utilization)}%
          </div>
        </div>

        {/* Текущая операция */}
        {machine.currentOperation && (
          <div style={{
            backgroundColor: 'rgba(24, 144, 255, 0.1)',
            border: '1px solid #1890ff',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ color: '#1890ff', fontWeight: 'bold', marginBottom: '4px' }}>
              ▶️ {machine.currentOperation.drawingNumber}
            </div>
            <div style={{
              backgroundColor: '#444',
              borderRadius: '10px',
              height: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${machine.currentOperation.progressPercent || 0}%`,
                height: '100%',
                backgroundColor: '#1890ff',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ color: '#999', fontSize: '11px', marginTop: '4px' }}>
              {machine.currentOperation.completedQuantity || 0}/{machine.currentOperation.totalQuantity || 0}
            </div>
          </div>
        )}

        {/* Мини-календарь */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          marginBottom: '16px'
        }}>
          {workingDays.map((day: any, index: number) => {
            const date = new Date(day.date);
            const operation = getOperation(machine.machineId, date);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={day.date}
                onClick={() => operation && handleCellClick(operation, machine, date)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: operation ? getStatusColor(operation.status) : '#444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: operation ? 'pointer' : 'default',
                  border: isToday ? '2px solid #fff' : 'none',
                  fontSize: '10px',
                  color: 'white',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (operation) {
                    (e.target as HTMLElement).style.transform = 'scale(1.1)';
                    (e.target as HTMLElement).style.zIndex = '10';
                  }
                }}
                onMouseLeave={(e) => {
                  if (operation) {
                    (e.target as HTMLElement).style.transform = 'scale(1)';
                    (e.target as HTMLElement).style.zIndex = '1';
                  }
                }}
                title={`${date.toLocaleDateString('ru-RU')} - ${operation ? operation.drawingNumber || 'Операция' : 'Свободен'}`}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>

        {/* Статистика */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          fontSize: '12px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#1890ff', fontWeight: 'bold', fontSize: '16px' }}>
              {Math.round(utilization)}%
            </div>
            <div style={{ color: '#999' }}>Загрузка</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#52c41a', fontWeight: 'bold', fontSize: '16px' }}>
              {busyDays.length}/{workingDays.length}
            </div>
            <div style={{ color: '#999' }}>Дней в работе</div>
          </div>
        </div>

        {/* Индикатор онлайн статуса */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: machine.currentOperation ? '#52c41a' : '#999',
          boxShadow: machine.currentOperation ? '0 0 10px #52c41a' : 'none'
        }} />
      </div>
    );
  };

  // Получаем статистику по типам станков
  const getStatsForType = (type: 'milling' | 'turning') => {
    if (!calendarData?.machineSchedules) return { total: 0, active: 0, utilization: 0 };

    const machines = calendarData.machineSchedules.filter((machine: any) => {
      if (type === 'milling') {
        return machine.machineType === 'MILLING' || machine.machineType === 'milling' || 
               machine.machineType.toLowerCase().includes('milling') ||
               machine.machineName.toLowerCase().includes('фрез');
      } else {
        return machine.machineType === 'TURNING' || machine.machineType === 'turning' || 
               machine.machineType.toLowerCase().includes('turning') ||
               machine.machineName.toLowerCase().includes('токар');
      }
    });

    const activeMachines = machines.filter((m: any) => m.currentOperation);
    const totalUtilization = machines.reduce((acc: number, machine: any) => {
      const workingDays = machine.days.filter((d: any) => d.isWorkingDay).slice(0, 21);
      const busyDays = workingDays.filter((d: any) => 
        (d.completedShifts && d.completedShifts.length > 0) || d.plannedOperation
      );
      return acc + (workingDays.length > 0 ? (busyDays.length / workingDays.length) * 100 : 0);
    }, 0);

    return {
      total: machines.length,
      active: activeMachines.length,
      utilization: machines.length > 0 ? Math.round(totalUtilization / machines.length) : 0
    };
  };

  const renderStatsHeader = () => {
    const millingStats = getStatsForType('milling');
    const turningStats = getStatsForType('turning');
    const filteredMachines = getFilteredMachines();

    return (
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #f0f0f0',
        padding: '20px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '32px',
              fontWeight: '600',
              color: '#1890ff',
              marginBottom: '4px'
            }}>
              {filteredMachines.length}
            </div>
            <div style={{ color: '#8c8c8c', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              ⚙️ Всего станков
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '32px',
              fontWeight: '600',
              color: '#52c41a',
              marginBottom: '4px'
            }}>
              {filteredMachines.filter((m: any) => m.currentOperation).length}
            </div>
            <div style={{ color: '#8c8c8c', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              ▶️ В работе
            </div>
          </div>

          {activeTab === 'all' && (
            <>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#1890ff',
                  marginBottom: '4px'
                }}>
                  🔧 {millingStats.total}
                </div>
                <div style={{ color: '#8c8c8c', fontSize: '12px' }}>
                  Фрезерных ({millingStats.active} работают)
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#52c41a',
                  marginBottom: '4px'
                }}>
                  ⚙️ {turningStats.total}
                </div>
                <div style={{ color: '#8c8c8c', fontSize: '12px' }}>
                  Токарных ({turningStats.active} работают)
                </div>
              </div>
            </>
          )}
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '32px',
              fontWeight: '600',
              color: '#faad14',
              marginBottom: '4px'
            }}>
              {activeTab === 'milling' ? millingStats.utilization :
               activeTab === 'turning' ? turningStats.utilization :
               summaryData?.summary?.averageUtilization || 0}%
            </div>
            <div style={{ color: '#8c8c8c', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              ⚡ Средняя загрузка
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '400px',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderRadius: '8px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #1890ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <div style={{ fontSize: '18px', color: '#666', fontWeight: '500' }}>
            Загрузка современного календаря...
          </div>
          <style>
            {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
          </style>
        </div>
      </div>
    );
  }

  if (!calendarData || !calendarData.machineSchedules?.length) {
    return (
      <div style={{
        minHeight: '400px',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderRadius: '8px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📊</div>
          <h2 style={{ color: '#262626', marginBottom: '12px' }}>Нет данных</h2>
          <p style={{ color: '#8c8c8c', marginBottom: '24px' }}>
            Нет активных станков или операций в выбранном периоде
          </p>
          <button
            onClick={loadData}
            style={{
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🔄 Обновить
          </button>
        </div>
      </div>
    );
  }

  const filteredMachines = getFilteredMachines();

  return (
    <div style={{
      backgroundColor: '#f5f5f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* Заголовок */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #f0f0f0',
        padding: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#262626',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              📅 Производственный календарь {
                activeTab === 'milling' ? '🔧 Фрезерные станки' :
                activeTab === 'turning' ? '⚙️ Токарные станки' :
                'Все станки'
              }
            </h3>
            {calendarData && (
              <div style={{ color: '#8c8c8c', fontSize: '14px' }}>
                {new Date(calendarData.period.startDate).toLocaleDateString('ru-RU')} - {new Date(calendarData.period.endDate).toLocaleDateString('ru-RU')}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'timeline' : 'grid')}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #d9d9d9',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#595959'
              }}
            >
              {viewMode === 'grid' ? '📊 Сетка' : '📈 Таймлайн'}
            </button>
            
            <button
              onClick={loadData}
              disabled={loading}
              style={{
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🔄 Обновить
            </button>
          </div>
        </div>

        {/* Табы для фильтрации */}
        <div style={{ marginTop: '20px' }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as 'all' | 'milling' | 'turning')}
            items={[
              {
                key: 'all',
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🏭 Все станки ({calendarData?.machineSchedules?.length || 0})
                  </span>
                ),
              },
              {
                key: 'milling',
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🔧 Фрезерные ({getStatsForType('milling').total})
                  </span>
                ),
              },
              {
                key: 'turning',
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚙️ Токарные ({getStatsForType('turning').total})
                  </span>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* Статистика */}
      {renderStatsHeader()}

      {/* Основной контент */}
      <div style={{
        padding: '20px'
      }}>
        {filteredMachines.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#8c8c8c'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>
              {activeTab === 'milling' ? '🔧' : activeTab === 'turning' ? '⚙️' : '🏭'}
            </div>
            <h3>Нет станков этого типа</h3>
            <p>В выбранном периоде нет {
              activeTab === 'milling' ? 'фрезерных' :
              activeTab === 'turning' ? 'токарных' :
              'активных'
            } станков</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '0'
          }}>
            {filteredMachines.map(renderMachineCard)}
          </div>
        ) : (
          <div style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
            Режим таймлайна в разработке
          </div>
        )}
      </div>

      {/* Легенда */}
      <div style={{
        backgroundColor: 'white',
        borderTop: '1px solid #f0f0f0',
        padding: '20px'
      }}>
        <div>
          <h4 style={{ marginBottom: '16px', color: '#262626' }}>Обозначения:</h4>
          <div style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            fontSize: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#52c41a', borderRadius: '2px' }}></div>
              Операция выполнена
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#1890ff', borderRadius: '2px' }}></div>
              В процессе выполнения
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#faad14', borderRadius: '2px' }}></div>
              Запланировано
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#444', borderRadius: '2px' }}></div>
              Станок свободен
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔧 Фрезерные станки
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚙️ Токарные станки
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно */}
      {modalVisible && selectedOperation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h3 style={{
                margin: 0,
                color: '#262626',
                fontSize: '20px',
                fontWeight: '600'
              }}>
                📋 Детали операции
              </h3>
              <button
                onClick={() => setModalVisible(false)}
                style={{
                  backgroundColor: '#f5f5f5',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#8c8c8c'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div style={{
                backgroundColor: '#fafafa',
                padding: '20px',
                borderRadius: '12px'
              }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#262626' }}>Общая информация</h4>
                <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#595959' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Чертеж:</strong> {selectedOperation.drawingNumber}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Операция:</strong> {selectedOperation.operationNumber}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Станок:</strong> {selectedOperation.machine?.machineName} ({selectedOperation.machine?.machineType === 'MILLING' ? 'Фрезерный' : 'Токарный'})
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Дата:</strong> {selectedOperation.date}
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: '#fafafa',
                padding: '20px',
                borderRadius: '12px'
              }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#262626' }}>Производство</h4>
                <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#595959' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Оператор:</strong> {selectedOperation.operatorName || selectedOperation.operator || 'Не назначен'}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Количество:</strong> {selectedOperation.completedQuantity || selectedOperation.quantityProduced || 0}/
                    {selectedOperation.totalQuantity || selectedOperation.remainingQuantity || 0} дет.
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Время:</strong> {selectedOperation.timePerPart || selectedOperation.estimatedTimePerPart || 0} мин/дет
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Наладка:</strong> {selectedOperation.setupTime || 0} мин
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#fafafa',
              padding: '20px',
              borderRadius: '12px'
            }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#262626' }}>Прогресс выполнения</h4>
              <div style={{
                backgroundColor: '#e6f7ff',
                borderRadius: '12px',
                height: '24px',
                overflow: 'hidden',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: `${selectedOperation.progress || 0}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #1890ff, #40a9ff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {selectedOperation.progress || 0}%
                </div>
              </div>
              <div style={{ fontSize: '14px', color: '#8c8c8c', textAlign: 'center' }}>
                {selectedOperation.completedQuantity || selectedOperation.quantityProduced || 0} из {selectedOperation.totalQuantity || selectedOperation.remainingQuantity || 0} деталей
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button
                onClick={() => setModalVisible(false)}
                style={{
                  backgroundColor: '#1890ff',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
