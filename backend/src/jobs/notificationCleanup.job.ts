import cron from 'node-cron';
import notificationService from '../services/notification.service';
import logger from '../config/logger';

/**
 * Clean up old read notifications.
 * Runs daily at 3:00 AM — deletes read notifications older than 30 days.
 */
export function startNotificationCleanupJob() {
  cron.schedule('0 3 * * *', async () => {
    try {
      logger.info('[CronJob] Running notification cleanup...');
      const result = await notificationService.cleanupOldNotifications(30);
      logger.info(`[CronJob] Notification cleanup complete: ${result.count} removed`);
    } catch (err) {
      logger.error('[CronJob] Notification cleanup failed:', err);
    }
  });

  logger.info('[CronJob] Notification cleanup job scheduled (daily at 3:00 AM)');
}
