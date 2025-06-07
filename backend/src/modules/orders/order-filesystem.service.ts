/**
 * @file: order-filesystem.service.ts
 * @description: Сервис для управления файловой системой заказов
 * @dependencies: fs, path
 * @created: 2025-06-07
 */
import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';

export interface OrderFileSystemData {
  order: any;
  operations: any[];
  shifts?: any[];
  planning?: any;
  history?: any[];
  metadata: any;
}

@Injectable()
export class OrderFileSystemService {
  private readonly logger = new Logger(OrderFileSystemService.name);
  private readonly ordersPath: string;

  constructor() {
    // Попробуем несколько вариантов пути
    const possiblePaths = [
      join(process.cwd(), 'uploads', 'orders'),
      join(__dirname, '..', '..', '..', '..', 'uploads', 'orders'),
      resolve('uploads', 'orders'),
      'C:\\Users\\kasuf\\Downloads\\TheWho\\production-crm\\uploads\\orders'
    ];
    
    this.ordersPath = possiblePaths[0]; // По умолчанию
    this.logger.log(`OrderFileSystemService initialized with path: ${this.ordersPath}`);
    this.logger.log(`Current working directory: ${process.cwd()}`);
    this.logger.log(`__dirname: ${__dirname}`);
    
    this.ensureOrdersDirectory();
  }

  /**
   * Обеспечить существование папки orders
   */
  private async ensureOrdersDirectory() {
    try {
      await fs.access(this.ordersPath);
      this.logger.log(`SUCCESS: Orders directory exists at: ${this.ordersPath}`);
      
      // Проверим содержимое
      const items = await fs.readdir(this.ordersPath);
      this.logger.log(`Found ${items.length} items in directory: ${items.join(', ')}`);
      
    } catch (error) {
      this.logger.error(`ERROR: Cannot access orders directory at: ${this.ordersPath}`);
      this.logger.error('Error details:', error.message);
      
      // Попробуем другие пути
      const possiblePaths = [
        join(process.cwd(), 'uploads', 'orders'),
        join(__dirname, '..', '..', '..', '..', 'uploads', 'orders'),
        resolve('uploads', 'orders'),
        'C:\\Users\\kasuf\\Downloads\\TheWho\\production-crm\\uploads\\orders'
      ];
      
      for (const testPath of possiblePaths) {
        try {
          await fs.access(testPath);
          this.logger.log(`FOUND alternative path: ${testPath}`);
          // Обновляем путь
          (this as any).ordersPath = testPath;
          return;
        } catch {
          this.logger.log(`Path not found: ${testPath}`);
        }
      }
      
      // Если ни один путь не найден, создаем папку
      await fs.mkdir(this.ordersPath, { recursive: true });
      this.logger.log(`Created orders directory: ${this.ordersPath}`);
    }
  }

  /**
   * Создать новую версию заказа
   */
  async createOrderVersion(drawingNumber: string, orderData: OrderFileSystemData): Promise<string> {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const versionPath = join(this.ordersPath, drawingNumber, timestamp);
    
    // Создаем структуру папок
    await this.createOrderDirectoryStructure(versionPath);
    
    // Сохраняем файлы
    await this.saveOrderFiles(versionPath, orderData);
    
    this.logger.log(`Создана версия заказа ${drawingNumber} в ${versionPath}`);
    return timestamp;
  }

  /**
   * Обновить заказ (создать новую версию с временной меткой)
   */
  async updateOrderVersion(drawingNumber: string, orderData: OrderFileSystemData): Promise<string> {
    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
    const versionPath = join(this.ordersPath, drawingNumber, timestamp);
    
    // Создаем структуру папок
    await this.createOrderDirectoryStructure(versionPath);
    
    // Сохраняем файлы
    await this.saveOrderFiles(versionPath, orderData);
    
    // Обновляем latest_version.json в корне заказа
    await this.updateLatestVersionPointer(drawingNumber, timestamp);
    
    this.logger.log(`Обновлена версия заказа ${drawingNumber} в ${versionPath}`);
    return timestamp;
  }

  /**
   * Получить последнюю версию заказа
   */
  async getLatestOrderVersion(drawingNumber: string): Promise<OrderFileSystemData | null> {
    try {
      const orderPath = join(this.ordersPath, drawingNumber);
      const versions = await this.getOrderVersions(drawingNumber);
      
      if (versions.length === 0) {
        return null;
      }
      
      // Берем последнюю версию (отсортированы по дате)
      const latestVersion = versions[versions.length - 1];
      const versionPath = join(orderPath, latestVersion);
      
      return await this.loadOrderFiles(versionPath);
    } catch (error) {
      this.logger.error(`Ошибка получения заказа ${drawingNumber}:`, error);
      return null;
    }
  }

  /**
   * Получить конкретную версию заказа
   */
  async getOrderVersion(drawingNumber: string, version: string): Promise<OrderFileSystemData | null> {
    try {
      const versionPath = join(this.ordersPath, drawingNumber, version);
      return await this.loadOrderFiles(versionPath);
    } catch (error) {
      this.logger.error(`Ошибка получения версии ${version} заказа ${drawingNumber}:`, error);
      return null;
    }
  }

  /**
   * Получить список версий заказа
   */
  async getOrderVersions(drawingNumber: string): Promise<string[]> {
    try {
      const orderPath = join(this.ordersPath, drawingNumber);
      const items = await fs.readdir(orderPath);
      
      // Фильтруем только папки с датами
      const versions = [];
      for (const item of items) {
        const itemPath = join(orderPath, item);
        const stats = await fs.stat(itemPath);
        if (stats.isDirectory() && this.isValidVersionName(item)) {
          versions.push(item);
        }
      }
      
      // Сортируем по дате
      return versions.sort();
    } catch (error) {
      this.logger.error(`Ошибка получения версий заказа ${drawingNumber}:`, error);
      return [];
    }
  }

  /**
   * Сохранить данные смен
   */
  async saveShiftData(drawingNumber: string, version: string, shiftsData: any[]): Promise<void> {
    const shiftsPath = join(this.ordersPath, drawingNumber, version, 'shifts', 'shifts_records.json');
    await this.ensureDirectoryExists(join(this.ordersPath, drawingNumber, version, 'shifts'));
    await fs.writeFile(shiftsPath, JSON.stringify(shiftsData, null, 2));
    this.logger.log(`Сохранены данные смен для ${drawingNumber} v${version}`);
  }

  /**
   * Сохранить данные планирования
   */
  async savePlanningData(drawingNumber: string, version: string, planningData: any): Promise<void> {
    const planningPath = join(this.ordersPath, drawingNumber, version, 'planning', 'planning_results.json');
    await this.ensureDirectoryExists(join(this.ordersPath, drawingNumber, version, 'planning'));
    await fs.writeFile(planningPath, JSON.stringify(planningData, null, 2));
    this.logger.log(`Сохранены данные планирования для ${drawingNumber} v${version}`);
  }

  /**
   * Создать структуру папок для версии заказа
   */
  private async createOrderDirectoryStructure(versionPath: string): Promise<void> {
    const subFolders = [
      'operations',
      'shifts', 
      'planning',
      'documents',
      'history',
      'exports',
      'analysis'
    ];
    
    await fs.mkdir(versionPath, { recursive: true });
    
    for (const folder of subFolders) {
      await fs.mkdir(join(versionPath, folder), { recursive: true });
    }
  }

  /**
   * Сохранить файлы заказа
   */
  private async saveOrderFiles(versionPath: string, data: OrderFileSystemData): Promise<void> {
    // Основная информация о заказе
    await fs.writeFile(
      join(versionPath, 'order.json'),
      JSON.stringify(data.order, null, 2)
    );

    // Операции
    await fs.writeFile(
      join(versionPath, 'operations', 'operations.json'),
      JSON.stringify(data.operations, null, 2)
    );

    // Метаданные
    await fs.writeFile(
      join(versionPath, 'metadata.json'),
      JSON.stringify(data.metadata, null, 2)
    );

    // Дополнительные данные если есть
    if (data.shifts) {
      await fs.writeFile(
        join(versionPath, 'shifts', 'shifts_records.json'),
        JSON.stringify(data.shifts, null, 2)
      );
    }

    if (data.planning) {
      await fs.writeFile(
        join(versionPath, 'planning', 'planning_results.json'),
        JSON.stringify(data.planning, null, 2)
      );
    }

    if (data.history) {
      await fs.writeFile(
        join(versionPath, 'history', 'order_history.json'),
        JSON.stringify(data.history, null, 2)
      );
    }
  }

  /**
   * Загрузить файлы заказа
   */
  private async loadOrderFiles(versionPath: string): Promise<OrderFileSystemData> {
    const order = await this.loadJsonFile(join(versionPath, 'order.json'));
    const operations = await this.loadJsonFile(join(versionPath, 'operations', 'operations.json'));
    const metadata = await this.loadJsonFile(join(versionPath, 'metadata.json'));

    // Дополнительные данные (если есть)
    const shifts = await this.loadJsonFile(join(versionPath, 'shifts', 'shifts_records.json'), true);
    const planning = await this.loadJsonFile(join(versionPath, 'planning', 'planning_results.json'), true);
    const history = await this.loadJsonFile(join(versionPath, 'history', 'order_history.json'), true);

    return {
      order,
      operations,
      metadata,
      shifts,
      planning,
      history
    };
  }

  /**
   * Загрузить JSON файл
   */
  private async loadJsonFile(filePath: string, optional: boolean = false): Promise<any> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if (optional) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Обновить указатель на последнюю версию
   */
  private async updateLatestVersionPointer(drawingNumber: string, version: string): Promise<void> {
    const pointerPath = join(this.ordersPath, drawingNumber, 'latest_version.json');
    const pointerData = {
      latest_version: version,
      updated_at: new Date().toISOString()
    };
    await fs.writeFile(pointerPath, JSON.stringify(pointerData, null, 2));
  }

  /**
   * Проверить валидность имени версии
   */
  private isValidVersionName(name: string): boolean {
    // Проверяем формат YYYY-MM-DD или YYYY-MM-DD_HH-MM
    const datePattern = /^\d{4}-\d{2}-\d{2}(_\d{2}-\d{2})?$/;
    return datePattern.test(name);
  }

  /**
   * Обеспечить существование директории
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Получить все заказы
   */
  async getAllOrders(): Promise<string[]> {
    try {
      this.logger.log(`Getting all orders from: ${this.ordersPath}`);
      const items = await fs.readdir(this.ordersPath);
      this.logger.log(`Found ${items.length} items in orders directory: ${items.join(', ')}`);
      
      const orders = [];
      
      for (const item of items) {
        const itemPath = join(this.ordersPath, item);
        const stats = await fs.stat(itemPath);
        this.logger.log(`Item ${item}: isDirectory=${stats.isDirectory()}`);
        if (stats.isDirectory()) {
          orders.push(item);
        }
      }
      
      this.logger.log(`Found ${orders.length} order directories: ${orders.join(', ')}`);
      return orders;
    } catch (error) {
      this.logger.error('Ошибка получения списка заказов:', error);
      return [];
    }
  }

  /**
   * Экспортировать заказ из БД в файловую систему
   */
  async exportOrderFromDatabase(orderData: any, operationsData: any[]): Promise<string> {
    this.logger.log(`Exporting order ${orderData.drawing_number || orderData.drawingNumber} to filesystem`);
    
    const fileSystemData: OrderFileSystemData = {
      order: orderData,
      operations: operationsData,
      metadata: {
        version: '1.0',
        created_at: orderData.createdAt,
        updated_at: orderData.updatedAt,
        changes_summary: 'Экспорт из базы данных',
        data_source: 'database_export',
        export_date: new Date().toISOString()
      }
    };

    const drawingNumber = orderData.drawing_number || orderData.drawingNumber;
    this.logger.log(`Creating version for order: ${drawingNumber}`);
    
    return await this.createOrderVersion(drawingNumber, fileSystemData);
  }
}
