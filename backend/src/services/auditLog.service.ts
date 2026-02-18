import prisma from '../db';
import logger from '../config/logger';

interface AuditLogData {
  userId?: string;
  userType?: string;
  username?: string;
  action: string;
  resource: string;
  resourceId?: string;
  module?: string;
  changes?: any;
  previousData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
  status?: string;
  errorMessage?: string;
}

class AuditLogService {
  /**
   * Create an audit log entry
   */
  async log(data: AuditLogData) {
    try {
      return await prisma.auditLog.create({ data });
    } catch (error: any) {
      // Don't let audit logging failure break the main operation
      logger.error(`Failed to create audit log: ${error.message}`, { data });
      return null;
    }
  }

  /**
   * Log a user action (convenience method)
   */
  async logAction(
    userId: string,
    userType: string,
    username: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: { changes?: any; previousData?: any; newData?: any; module?: string },
    request?: { ip?: string; userAgent?: string; method?: string; path?: string }
  ) {
    return this.log({
      userId,
      userType,
      username,
      action,
      resource,
      resourceId,
      module: details?.module,
      changes: details?.changes,
      previousData: details?.previousData,
      newData: details?.newData,
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
      requestMethod: request?.method,
      requestPath: request?.path,
      status: 'SUCCESS',
    });
  }

  /**
   * Log a failed action
   */
  async logFailure(
    userId: string | undefined,
    action: string,
    resource: string,
    errorMessage: string,
    request?: { ip?: string; userAgent?: string; method?: string; path?: string }
  ) {
    return this.log({
      userId,
      action,
      resource,
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
      requestMethod: request?.method,
      requestPath: request?.path,
      status: 'FAILED',
      errorMessage,
    });
  }

  /**
   * Get audit logs with filters
   */
  async getLogs(filters: {
    userId?: string;
    userType?: string;
    action?: string;
    resource?: string;
    module?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      userId, userType, action, resource, module, status,
      startDate, endDate, search,
      page = 1, limit = 50,
    } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (userType) where.userType = userType;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (module) where.module = module;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { resource: { contains: search, mode: 'insensitive' } },
        { resourceId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get audit logs for a specific resource
   */
  async getResourceLogs(resource: string, resourceId: string) {
    return prisma.auditLog.findMany({
      where: { resource, resourceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserLogs(userId: string, limit = 50) {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get distinct actions for filter dropdowns
   */
  async getDistinctActions() {
    const actions = await prisma.auditLog.findMany({
      select: { action: true },
      distinct: ['action'],
    });
    return actions.map((a) => a.action);
  }

  /**
   * Get distinct resources for filter dropdowns
   */
  async getDistinctResources() {
    const resources = await prisma.auditLog.findMany({
      select: { resource: true },
      distinct: ['resource'],
    });
    return resources.map((r) => r.resource);
  }
}

export default new AuditLogService();
