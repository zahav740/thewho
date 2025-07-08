/**
 * @file: orders.service.FIXED.ts
 * @description: Безопасная версия OrdersService с проверкой наличия колонок soft delete
 * @created: 2025-07-08
 */

// Добавьте этот метод в начало OrdersService после конструктора:

/**
 * Безопасный метод findAll с проверкой наличия колонки isDeleted
 */
async findAllSafe(filterDto?: OrdersFilterDto): Promise<{
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

    // Безопасная проверка наличия колонки isDeleted
    try {
      // Пробуем добавить условие с isDeleted
      const testQuery = this.orderRepository
        .createQueryBuilder('order')
        .select('order.id')
        .where('(order.isDeleted IS NULL OR order.isDeleted = :isDeleted)', { isDeleted: false })
        .limit(1);
      
      await testQuery.getRawOne();
      
      // Если ошибки не было, колонка существует
      query = query.where('(order.isDeleted IS NULL OR order.isDeleted = :isDeleted)', { isDeleted: false });
      this.logger.log('✅ Using soft delete filter');
    } catch (error) {
      // Колонка не существует, используем обычную логику
      this.logger.warn('⚠️ Soft delete columns not found, using legacy mode');
    }

    // Остальные фильтры
    if (filterDto?.search) {
      query = query.andWhere(
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

// Замените текущий метод findAll на этот:
