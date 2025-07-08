/**
 * Экстренное исправление для OrdersService
 * Запустите этот скрипт, если появляется ошибка 400 при обращении к /api/orders
 */

// ВРЕМЕННОЕ ИСПРАВЛЕНИЕ: замените метод findAll в OrdersService на этот код

async findAll(filterDto?: OrdersFilterDto): Promise<{
  data: EnrichedOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  this.logger.log(`Fetching all orders with filter: ${JSON.stringify(filterDto)}`);

  try {
    let query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.operations', 'operation');

    // БЕЗОПАСНАЯ проверка колонки isDeleted
    let hasSoftDeleteColumn = false;
    try {
      // Пробуем сделать запрос с isDeleted
      await this.orderRepository.query('SELECT "isDeleted" FROM orders LIMIT 1');
      hasSoftDeleteColumn = true;
      this.logger.log('✅ Soft delete columns found');
    } catch (error) {
      this.logger.warn('⚠️ Soft delete columns not found - using legacy mode');
    }

    // Применяем фильтр только если колонка существует
    if (hasSoftDeleteColumn) {
      query = query.where('(order.isDeleted IS NULL OR order.isDeleted = false)');
    }

    // Остальные фильтры
    if (filterDto?.search) {
      const searchCondition = hasSoftDeleteColumn ? 'andWhere' : 'where';
      query = query[searchCondition](
        '(order.drawingNumber ILIKE :search OR order.workType ILIKE :search)',
        { search: `%${filterDto.search}%` },
      );
    }

    if (filterDto?.priority) {
      const priorityNum = parseInt(filterDto.priority, 10);
      if (!isNaN(priorityNum)) {
        query = query.andWhere('order.priority = :priority', { priority: priorityNum });
      }
    }

    query = query
      .orderBy('order.createdAt', 'DESC')
      .addOrderBy('operation.operationNumber', 'ASC');

    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 10;
    const skip = (page - 1) * limit;
    query = query.skip(skip).take(limit);

    const [orders, total] = await query.getManyAndCount();
    this.logger.log(`Found ${orders.length} orders out of ${total}`);

    const enrichedOrders = orders.map((order) => this.enrichOrder(order));
    return {
      data: enrichedOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (error) {
    this.logger.error(`Error fetching orders: ${error.message}`, error.stack);
    throw new InternalServerErrorException('Ошибка получения заказов');
  }
}

// Также замените метод findOne:

async findOne(id: string): Promise<EnrichedOrder> {
  this.logger.log(`Fetching order with ID ${id}`);

  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    throw new BadRequestException(`Некорректный ID заказа: ${id}`);
  }

  try {
    let whereCondition: any = { id: numericId };
    
    // Проверяем наличие колонки isDeleted
    try {
      await this.orderRepository.query('SELECT "isDeleted" FROM orders LIMIT 1');
      // Колонка существует, добавляем фильтр
      whereCondition = { id: numericId, isDeleted: false };
    } catch (error) {
      // Колонка не существует, используем только id
    }

    const order = await this.orderRepository.findOne({
      where: whereCondition,
      relations: ['operations'],
    });

    if (!order) {
      throw new NotFoundException(`Заказ с ID ${id} не найден`);
    }

    this.logger.log(`Found order ${order.drawingNumber} with ${order.operations?.length || 0} operations`);
    return this.enrichOrder(order);
  } catch (error) {
    this.logger.error(`Error fetching order ${id}: ${error.message}`, error.stack);
    throw error;
  }
}
