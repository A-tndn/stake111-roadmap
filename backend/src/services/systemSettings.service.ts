import prisma from '../db';
import logger from '../config/logger';

class SystemSettingsService {
  /**
   * Get current system settings (creates default if none exist)
   */
  async getSettings() {
    let settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          platformName: 'Shakti11',
          commissionStructure: {
            masterAdmin: 10,
            superMaster: 5,
            master: 3,
            agent: 2,
          },
        },
      });
      logger.info('Default system settings created');
    }

    return settings;
  }

  /**
   * Update system settings
   */
  async updateSettings(data: Partial<{
    platformName: string;
    platformLogo: string;
    welcomeBanner: string;
    maintenanceMode: boolean;
    registrationOpen: boolean;
    globalMinBet: number;
    globalMaxBet: number;
    globalMaxPayout: number;
    commissionStructure: any;
    autoSettlementEnabled: boolean;
    settlementFrequency: string;
    settlementDay: number;
    currency: string;
    currencySymbol: string;
    casinoEnabled: boolean;
    liveBettingEnabled: boolean;
    depositEnabled: boolean;
    withdrawalEnabled: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number;
    sessionTimeout: number;
    twoFactorRequired: boolean;
  }>, updatedBy: string) {
    const settings = await this.getSettings();

    const updated = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        ...data,
        updatedBy,
      },
    });

    logger.info(`System settings updated by ${updatedBy}: ${JSON.stringify(Object.keys(data))}`);
    return updated;
  }

  /**
   * Update commission structure
   */
  async updateCommissionStructure(structure: {
    masterAdmin: number;
    superMaster: number;
    master: number;
    agent: number;
  }, updatedBy: string) {
    const settings = await this.getSettings();

    return prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        commissionStructure: structure,
        updatedBy,
      },
    });
  }

  /**
   * Update betting limits
   */
  async updateBettingLimits(limits: {
    globalMinBet: number;
    globalMaxBet: number;
    globalMaxPayout: number;
  }, updatedBy: string) {
    const settings = await this.getSettings();

    return prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        ...limits,
        updatedBy,
      },
    });
  }

  /**
   * Toggle maintenance mode
   */
  async toggleMaintenanceMode(updatedBy: string) {
    const settings = await this.getSettings();

    return prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        maintenanceMode: !settings.maintenanceMode,
        updatedBy,
      },
    });
  }

  /**
   * Check if platform is in maintenance mode
   */
  async isMaintenanceMode(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.maintenanceMode;
  }
}

export default new SystemSettingsService();
