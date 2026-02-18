import cron from 'node-cron';
import prisma from '../db';
import betService from '../services/bet.service';
import logger from '../config/logger';

/**
 * Auto-settle completed matches that haven't been settled yet.
 * Runs every 5 minutes, looking for matches with status COMPLETED but isSettled=false.
 *
 * This handles the case where a match result comes in from the cricket API
 * and the match is marked COMPLETED but bets haven't been settled yet.
 */
export function startBetSettlementJob() {
  // Every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      logger.info('[CronJob] Running bet settlement check...');

      const unsettledMatches = await prisma.match.findMany({
        where: {
          status: 'COMPLETED',
          isSettled: false,
          matchWinner: { not: null },
        },
        select: {
          id: true,
          name: true,
          matchWinner: true,
          team1Score: true,
          team2Score: true,
          _count: { select: { bets: true } },
        },
      });

      if (unsettledMatches.length === 0) {
        logger.debug('[CronJob] No unsettled matches found');
        return;
      }

      logger.info(`[CronJob] Found ${unsettledMatches.length} unsettled match(es)`);

      for (const match of unsettledMatches) {
        try {
          if (match._count.bets === 0) {
            // No bets to settle, just mark as settled
            await prisma.match.update({
              where: { id: match.id },
              data: { isSettled: true, settledAt: new Date(), settledBy: 'AUTO_CRON' },
            });
            logger.info(`[CronJob] Match ${match.id} (${match.name}) marked settled (no bets)`);
            continue;
          }

          const result = {
            winner: match.matchWinner!,
            team1Score: match.team1Score,
            team2Score: match.team2Score,
          };

          const settlement = await betService.settleMatchBets(match.id, result, 'AUTO_CRON');
          logger.info(
            `[CronJob] Match ${match.id} settled: ${settlement.settledCount}/${settlement.totalBets} bets, payout: ${settlement.totalPayout}`
          );
        } catch (error: any) {
          logger.error(`[CronJob] Failed to settle match ${match.id}: ${error.message}`);
        }
      }
    } catch (error: any) {
      logger.error(`[CronJob] Bet settlement job failed: ${error.message}`);
    }
  });

  logger.info('[CronJob] Bet settlement job scheduled (every 5 minutes)');
}

/**
 * Auto-void bets for matches that have been cancelled.
 * Runs every 10 minutes.
 */
export function startBetVoidJob() {
  cron.schedule('*/10 * * * *', async () => {
    try {
      const cancelledMatches = await prisma.match.findMany({
        where: {
          status: 'CANCELLED',
          isSettled: false,
        },
        select: { id: true, name: true },
      });

      if (cancelledMatches.length === 0) return;

      logger.info(`[CronJob] Found ${cancelledMatches.length} cancelled unsettled match(es)`);

      for (const match of cancelledMatches) {
        try {
          const result = await betService.voidMatchBets(match.id, 'Match cancelled - auto void');
          logger.info(`[CronJob] Voided ${result.refundedCount} bets for cancelled match ${match.id}`);
        } catch (error: any) {
          logger.error(`[CronJob] Failed to void bets for match ${match.id}: ${error.message}`);
        }
      }
    } catch (error: any) {
      logger.error(`[CronJob] Bet void job failed: ${error.message}`);
    }
  });

  logger.info('[CronJob] Bet void job scheduled (every 10 minutes)');
}
