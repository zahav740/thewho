interface WebhookSyncOptions {
  enabled?: boolean;
  webhookUrl?: string;
  onOrderAdd?: boolean;
  onOrderUpdate?: boolean;
  onOrderDelete?: boolean;
}

export const useWebhookSync = (options: WebhookSyncOptions = {}) => {
  const sendWebhookNotification = async (
    eventType: 'order_added' | 'order_updated' | 'order_deleted' | 'data_sync',
    data: any
  ) => {
    // Проверяем, включена ли автоматическая отправка
    const autoWebhookEnabled = localStorage.getItem('autoWebhook') === 'true';
    const webhookUrl = options.webhookUrl || localStorage.getItem('webhookUrl');
    
    if (!webhookUrl || (!options.enabled && !autoWebhookEnabled)) return;

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

  // Отправка полной синхронизации данных
  const syncAllData = async (orders: any) => {
    await sendWebhookNotification('data_sync', {
      orders,
      totalOrders: orders.length,
      lastUpdated: new Date().toISOString()
    });
  };

  // Отправка конкретного заказа
  const sendOrderWebhook = async (
    eventType: 'order_added' | 'order_updated' | 'order_deleted',
    order: any
  ) => {
    await sendWebhookNotification(eventType, {
      order,
      totalOrders: 1
    });
  };

  return {
    sendOrderWebhook,
    syncAllData,
    sendWebhookNotification
  };
};
