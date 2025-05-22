import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

const WebhookSync = () => {
  const { orders, isSyncing, syncError, lastSync } = useApp();
  const previousOrdersRef = useRef<any[]>([]);

  const sendWebhook = async (eventType: string, data: any) => {
    const autoWebhookEnabled = localStorage.getItem('autoWebhook') === 'true';
    const webhookUrl = localStorage.getItem('webhookUrl');
    
    if (!autoWebhookEnabled || !webhookUrl) return;

    try {
      const payload = {
        eventType,
        timestamp: new Date().toISOString(),
        source: 'TheWho App',
        environment: window.location.hostname,
        data
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn(`Webhook failed: ${response.status} ${response.statusText}`);
      } else {
        console.log(`✅ Webhook sent: ${eventType}`);
      }
    } catch (error) {
      console.error('❌ Webhook error:', error);
    }
  };

  useEffect(() => {
    // Пропускаем первый рендер
    if (previousOrdersRef.current.length === 0 && orders.length > 0) {
      previousOrdersRef.current = orders;
      return;
    }

    const previousOrders = previousOrdersRef.current;
    
    // Проверяем добавленные заказы
    orders.forEach(order => {
      const existed = previousOrders.find(prev => prev.id === order.id);
      if (!existed) {
        sendWebhook('order_added', { order, totalOrders: orders.length });
      } else {
        // Проверяем обновленные заказы (сравниваем JSON)
        if (JSON.stringify(existed) !== JSON.stringify(order)) {
          sendWebhook('order_updated', { order, totalOrders: orders.length });
        }
      }
    });

    // Проверяем удаленные заказы
    previousOrders.forEach(prevOrder => {
      const exists = orders.find(order => order.id === prevOrder.id);
      if (!exists) {
        sendWebhook('order_deleted', { order: prevOrder, totalOrders: orders.length });
      }
    });

    previousOrdersRef.current = orders;
  }, [orders]);

  // Отслеживаем состояние синхронизации
  useEffect(() => {
    if (syncError) {
      sendWebhook('sync_error', { 
        error: syncError, 
        timestamp: Date.now(),
        totalOrders: orders.length 
      });
    }
  }, [syncError, orders.length]);

  useEffect(() => {
    if (lastSync && !isSyncing) {
      sendWebhook('sync_completed', { 
        syncTime: lastSync,
        totalOrders: orders.length,
        timestamp: Date.now()
      });
    }
  }, [lastSync, isSyncing, orders.length]);

  return null; // Этот компонент не рендерит ничего
};

export default WebhookSync;
