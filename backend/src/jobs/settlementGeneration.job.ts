import cron from 'node-cron';
import settlementService from '../services/settlement.service';
import { emitSettlementGenerated } from '../utils/socketEmitter';
import logger from '../config/logger';

/**
 * Weekly settlement generation job.
 * Runs every Sunday at midnight (00:00).
 * Generates settlement records for all active agents based on the past week's activity.
 */
export function startWeeklySettlementJob() {
  // Every Sunday at 00:00
  cron.schedule('0 0 * * 0', async () => {
    try {
      logger.info('[CronJob] Running weekly settlement generation...');

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setHours(0, 0, 0, 0);

      const periodStart = new Date(periodEnd);
      periodStart.setDate(periodStart.getDate() - 7);

      const results = await settlementService.generateAllSettlements(periodStart, periodEnd);

      const succeeded = results.filter((r) => r.status === 'success').length;
      const failed = results.filter((r) => r.status === 'failed').length;

      logger.info(
        `[CronJob] Weekly settlements generated: ${succeeded} success, ${failed} failed out of ${results.length}`
      );

      // Notify master admin about generated settlements
      for (const result of results) {
        if (result.status === 'success' && result.settlementId) {
          emitSettlementGenerated({
            settlementId: result.settlementId,
            agentId: result.agentId,
            agentName: '',
            amount: '0',
          });
        }
      }
    } catch (error: any) {
      logger.error(`[CronJob] Weekly settlement generation failed: ${error.message}`);
    }
  });

  logger.info('[CronJob] Weekly settlement generation scheduled (Sunday 00:00)');
}

/**
 * Monthly settlement summary job.
 * Runs on the 1st of every month at 01:00.
 * Generates monthly settlement summaries for accounting/reporting.
 */
export function startMonthlySettlementJob() {
  // 1st of every month at 01:00
  cron.schedule('0 1 1 * *', async () => {
    try {
      logger.info('[CronJob] Running monthly settlement generation...');

      const now = new Date();
      const periodEnd = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const periodStart = new Date(periodEnd);
      periodStart.setMonth(periodStart.getMonth() - 1);

      const results = await settlementService.generateAllSettlements(periodStart, periodEnd);

      const succeeded = results.filter((r) => r.status === 'success').length;
      const failed = results.filter((r) => r.status === 'failed').length;

      logger.info(
        `[CronJob] Monthly settlements generated: ${succeeded} success, ${failed} failed out of ${results.length}`
      );
    } catch (error: any) {
      logger.error(`[CronJob] Monthly settlement generation failed: ${error.message}`);
    }
  });

  logger.info('[CronJob] Monthly settlement generation scheduled (1st of month, 01:00)');
}
