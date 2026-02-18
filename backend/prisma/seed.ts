import { PrismaClient, UserRole, UserStatus, AgentType, MatchStatus, MatchType, Permission, CasinoGameType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // ============================================
  // 1. SYSTEM SETTINGS
  // ============================================
  console.log('Creating system settings...');
  const existingSettings = await prisma.systemSettings.findFirst();
  if (!existingSettings) {
    await prisma.systemSettings.create({
      data: {
        platformName: 'Shakti11',
        welcomeBanner: 'Welcome to Shakti11 - The Ultimate Cricket Betting Platform!',
        commissionStructure: {
          masterAdmin: 10,
          superMaster: 5,
          master: 3,
          agent: 2,
        },
        globalMinBet: 10,
        globalMaxBet: 100000,
        globalMaxPayout: 500000,
        currency: 'INR',
        currencySymbol: '₹',
      },
    });
  }

  // ============================================
  // 2. CONFIGURATIONS (legacy — kept for compat)
  // ============================================
  console.log('Creating configurations...');
  const configs = [
    { key: 'PLATFORM_NAME', value: 'Shakti11', category: 'general', description: 'Platform display name' },
    { key: 'PLATFORM_COMMISSION', value: '0.2', category: 'commission', description: 'Platform commission percentage' },
    { key: 'AGENT_COMMISSION', value: '1.0', category: 'commission', description: 'Agent commission percentage' },
    { key: 'MASTER_AGENT_COMMISSION', value: '0.5', category: 'commission', description: 'Master Agent commission percentage' },
    { key: 'SUPER_MASTER_COMMISSION', value: '0.3', category: 'commission', description: 'Super Master commission percentage' },
    { key: 'MIN_BET_AMOUNT', value: '10', category: 'limits', description: 'Minimum bet amount' },
    { key: 'MAX_BET_AMOUNT', value: '100000', category: 'limits', description: 'Maximum bet amount' },
    { key: 'DEFAULT_CREDIT_LIMIT', value: '10000', category: 'limits', description: 'Default credit limit for new players' },
    { key: 'MAINTENANCE_MODE', value: 'false', category: 'general', description: 'Maintenance mode status' },
    { key: 'ALLOW_NEW_REGISTRATIONS', value: 'true', category: 'general', description: 'Allow new user registrations' },
  ];

  for (const config of configs) {
    await prisma.configuration.upsert({
      where: { key: config.key },
      update: config,
      create: config,
    });
  }

  // ============================================
  // 3. MASTER ADMIN
  // ============================================
  console.log('Creating master admin...');
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  await prisma.user.upsert({
    where: { username: 'masteradmin' },
    update: {},
    create: {
      username: 'masteradmin',
      email: 'master@shakti11.com',
      password: hashedPassword,
      displayName: 'Master Administrator',
      role: UserRole.MASTER_ADMIN,
      status: UserStatus.ACTIVE,
      balance: 0,
      creditLimit: 0,
      hierarchyPath: 'M0001',
      level: 0,
    },
  });

  // Keep the existing super admin too
  await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      email: 'admin@shakti11.com',
      password: hashedPassword,
      displayName: 'Super Administrator',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      balance: 0,
      creditLimit: 0,
      hierarchyPath: 'M0002',
      level: 0,
    },
  });

  // ============================================
  // 4. AGENTS (3-tier hierarchy)
  // ============================================

  // All permissions for Super Master
  const allPermissions: Permission[] = [
    'CAN_CREATE_CLIENTS', 'CAN_MANAGE_DEPOSITS', 'CAN_MANAGE_WITHDRAWALS',
    'CAN_VIEW_REPORTS', 'CAN_MANAGE_MATCHES', 'CAN_SETTLE_BETS',
    'CAN_ACCESS_CASINO', 'CAN_CREATE_SUB_AGENTS', 'CAN_MANAGE_ODDS',
    'CAN_VIEW_AUDIT_LOGS',
  ];

  // Limited permissions for regular agent
  const agentPermissions: Permission[] = [
    'CAN_CREATE_CLIENTS', 'CAN_MANAGE_DEPOSITS', 'CAN_MANAGE_WITHDRAWALS',
    'CAN_VIEW_REPORTS',
  ];

  console.log('Creating super master agent...');
  const superMaster = await prisma.agent.upsert({
    where: { username: 'supermaster1' },
    update: {},
    create: {
      username: 'supermaster1',
      email: 'supermaster@shakti11.com',
      phone: '+919999999991',
      password: await bcrypt.hash('SuperMaster@123', 10),
      displayName: 'Super Master Agent 1',
      agentType: AgentType.SUPER_MASTER,
      status: UserStatus.ACTIVE,
      balance: 1000000,
      creditLimit: 5000000,
      riskDeposit: 500000,
      commissionRate: 5,
      sportSharePercent: 10,
      permissions: allPermissions,
      hierarchyPath: 'M0001/SM001',
      level: 1,
      kycVerified: true,
      kycVerifiedAt: new Date(),
      totalClients: 0,
      activeClients: 0,
    },
  });

  console.log('Creating master agent...');
  const masterAgent = await prisma.agent.upsert({
    where: { username: 'master1' },
    update: {},
    create: {
      username: 'master1',
      email: 'master@shakti11.com',
      phone: '+919999999992',
      password: await bcrypt.hash('Master@123', 10),
      displayName: 'Master Agent 1',
      agentType: AgentType.MASTER,
      status: UserStatus.ACTIVE,
      parentAgentId: superMaster.id,
      balance: 500000,
      creditLimit: 2000000,
      commissionRate: 3,
      sportSharePercent: 5,
      permissions: allPermissions,
      hierarchyPath: 'M0001/SM001/MA001',
      level: 2,
      kycVerified: true,
      kycVerifiedAt: new Date(),
    },
  });

  console.log('Creating regular agent...');
  const regularAgent = await prisma.agent.upsert({
    where: { username: 'agent1' },
    update: {},
    create: {
      username: 'agent1',
      email: 'agent@shakti11.com',
      phone: '+919999999993',
      password: await bcrypt.hash('Agent@123', 10),
      displayName: 'Agent 1',
      agentType: AgentType.AGENT,
      status: UserStatus.ACTIVE,
      parentAgentId: masterAgent.id,
      balance: 100000,
      creditLimit: 500000,
      commissionRate: 2,
      sportSharePercent: 2,
      permissions: agentPermissions,
      hierarchyPath: 'M0001/SM001/MA001/A001',
      level: 3,
      kycVerified: true,
      kycVerifiedAt: new Date(),
    },
  });

  // Second agent (under same master)
  await prisma.agent.upsert({
    where: { username: 'agent2' },
    update: {},
    create: {
      username: 'agent2',
      email: 'agent2@shakti11.com',
      phone: '+919999999994',
      password: await bcrypt.hash('Agent@123', 10),
      displayName: 'Agent 2',
      agentType: AgentType.AGENT,
      status: UserStatus.ACTIVE,
      parentAgentId: masterAgent.id,
      balance: 80000,
      creditLimit: 300000,
      commissionRate: 2,
      sportSharePercent: 2,
      permissions: agentPermissions,
      hierarchyPath: 'M0001/SM001/MA001/A002',
      level: 3,
      kycVerified: true,
      kycVerifiedAt: new Date(),
    },
  });

  // ============================================
  // 5. PLAYERS
  // ============================================
  console.log('Creating sample players...');
  const accountTypes = ['STANDARD', 'NOC', 'PREMIUM', 'VIP', 'STANDARD'];

  for (let i = 1; i <= 5; i++) {
    await prisma.user.upsert({
      where: { username: `player${i}` },
      update: {},
      create: {
        username: `player${i}`,
        email: `player${i}@example.com`,
        phone: `+91888888888${i}`,
        password: await bcrypt.hash('Player@123', 10),
        displayName: `Player ${i}`,
        role: UserRole.PLAYER,
        status: UserStatus.ACTIVE,
        agentId: regularAgent.id,
        balance: 5000 + (i * 1000),
        creditLimit: 10000 + (i * 5000),
        sportSharePercent: 2,
        accountType: accountTypes[i - 1],
        matchLimit: 50000,
        sessionLimit: 25000,
        minBet: 10,
        maxBet: 50000,
        hierarchyPath: `M0001/SM001/MA001/A001/C${String(i).padStart(3, '0')}`,
        level: 4,
      },
    });
  }

  // Update agent client counts
  await prisma.agent.update({
    where: { id: regularAgent.id },
    data: { totalClients: 5, activeClients: 5 },
  });

  // ============================================
  // 6. MATCHES (with odds)
  // ============================================
  console.log('Creating sample matches...');
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const matches = [
    {
      name: 'India vs Australia - 1st T20I',
      shortName: 'IND vs AUS',
      matchType: MatchType.T20,
      venue: 'Wankhede Stadium',
      city: 'Mumbai',
      country: 'India',
      team1: 'India',
      team2: 'Australia',
      tournament: 'ICC Mens T20 World Cup 2026',
      startTime: new Date(now.getTime() - 30 * 60 * 1000), // Started 30 min ago
      status: MatchStatus.LIVE,
      team1BackOdds: 1.85,
      team1LayOdds: 1.87,
      team2BackOdds: 2.10,
      team2LayOdds: 2.12,
      drawBackOdds: 15.0,
      drawLayOdds: 16.0,
      team1Score: '156/4 (16.2)',
      team2Score: '',
    },
    {
      name: 'Pakistan vs England - 2nd ODI',
      shortName: 'PAK vs ENG',
      matchType: MatchType.ODI,
      venue: 'National Stadium',
      city: 'Karachi',
      country: 'Pakistan',
      team1: 'Pakistan',
      team2: 'England',
      tournament: 'Pakistan vs England ODI Series 2026',
      startTime: tomorrow,
      status: MatchStatus.UPCOMING,
      team1BackOdds: 2.20,
      team1LayOdds: 2.25,
      team2BackOdds: 1.70,
      team2LayOdds: 1.73,
      drawBackOdds: 12.0,
      drawLayOdds: 13.0,
    },
    {
      name: 'South Africa vs New Zealand - 3rd Test',
      shortName: 'SA vs NZ',
      matchType: MatchType.TEST,
      venue: 'Newlands',
      city: 'Cape Town',
      country: 'South Africa',
      team1: 'South Africa',
      team2: 'New Zealand',
      tournament: 'SA vs NZ Test Series 2026',
      startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      status: MatchStatus.UPCOMING,
      team1BackOdds: 1.65,
      team1LayOdds: 1.68,
      team2BackOdds: 2.50,
      team2LayOdds: 2.55,
      drawBackOdds: 4.50,
      drawLayOdds: 4.70,
    },
    {
      name: 'Mumbai Indians vs Chennai Super Kings',
      shortName: 'MI vs CSK',
      matchType: MatchType.T20,
      venue: 'Wankhede Stadium',
      city: 'Mumbai',
      country: 'India',
      team1: 'Mumbai Indians',
      team2: 'Chennai Super Kings',
      tournament: 'IPL 2026',
      startTime: nextWeek,
      status: MatchStatus.UPCOMING,
      team1BackOdds: 1.90,
      team1LayOdds: 1.93,
      team2BackOdds: 1.95,
      team2LayOdds: 1.98,
    },
    {
      name: 'Royal Challengers Bangalore vs Kolkata Knight Riders',
      shortName: 'RCB vs KKR',
      matchType: MatchType.T20,
      venue: 'M. Chinnaswamy Stadium',
      city: 'Bangalore',
      country: 'India',
      team1: 'Royal Challengers Bangalore',
      team2: 'Kolkata Knight Riders',
      tournament: 'IPL 2026',
      startTime: new Date(nextWeek.getTime() + 24 * 60 * 60 * 1000),
      status: MatchStatus.UPCOMING,
      team1BackOdds: 2.05,
      team1LayOdds: 2.08,
      team2BackOdds: 1.80,
      team2LayOdds: 1.83,
    },
  ];

  for (const matchData of matches) {
    const existing = await prisma.match.findFirst({
      where: { name: matchData.name },
    });
    if (!existing) {
      await prisma.match.create({ data: matchData });
    }
  }

  // ============================================
  // 7. CASINO GAMES
  // ============================================
  console.log('Creating casino games...');
  const casinoGames = [
    {
      gameName: 'Teen Patti 20-20',
      gameType: CasinoGameType.TEEN_PATTI,
      description: 'Classic Indian card game with a 20-20 twist',
      rules: 'Place your bet on Player A or Player B. Three cards are dealt to each. The hand with the highest ranking wins.',
      minBet: 50,
      maxBet: 50000,
      rtp: 97.0,
      houseEdge: 3.0,
      sortOrder: 1,
    },
    {
      gameName: 'Indian Poker',
      gameType: CasinoGameType.INDIAN_POKER,
      description: '3-card poker with Indian rules',
      rules: 'Bet on Player A or Player B. Cards are revealed one at a time. Best 3-card hand wins.',
      minBet: 50,
      maxBet: 50000,
      rtp: 96.5,
      houseEdge: 3.5,
      sortOrder: 2,
    },
    {
      gameName: 'Hi-Lo',
      gameType: CasinoGameType.HI_LO,
      description: 'Predict if the next card is higher or lower',
      rules: 'A card is revealed. Predict if the next card will be Higher, Lower, or Exact. Exact pays 13x!',
      minBet: 10,
      maxBet: 25000,
      rtp: 96.0,
      houseEdge: 4.0,
      sortOrder: 3,
    },
    {
      gameName: 'Coin Flip',
      gameType: CasinoGameType.COIN_FLIP,
      description: 'Simple 50/50 coin flip game',
      rules: 'Choose Heads or Tails. A coin is flipped. If you guess correctly, you win 1.95x your bet.',
      minBet: 10,
      maxBet: 100000,
      rtp: 97.5,
      houseEdge: 2.5,
      sortOrder: 4,
    },
    {
      gameName: 'Dice Roll',
      gameType: CasinoGameType.DICE_ROLL,
      description: 'Predict the dice outcome - Over or Under',
      rules: 'Two dice are rolled. Predict if the total will be Over 7, Under 7, or Lucky 7 (6x payout).',
      minBet: 10,
      maxBet: 50000,
      rtp: 96.0,
      houseEdge: 4.0,
      sortOrder: 5,
    },
    {
      gameName: 'Andar Bahar',
      gameType: CasinoGameType.ANDAR_BAHAR,
      description: 'Traditional Indian card game',
      rules: 'A joker card is placed. Bet on Andar (left) or Bahar (right). Cards are dealt alternately until a match is found.',
      minBet: 50,
      maxBet: 50000,
      rtp: 97.0,
      houseEdge: 3.0,
      sortOrder: 6,
    },
  ];

  for (const game of casinoGames) {
    const existing = await prisma.casinoGame.findFirst({
      where: { gameName: game.gameName },
    });
    if (!existing) {
      await prisma.casinoGame.create({ data: game });
    }
  }

  // ============================================
  // DONE
  // ============================================
  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('─────────────────────────────────────');
  console.log('Master Admin:      masteradmin / Admin@123');
  console.log('Super Admin:       superadmin / Admin@123');
  console.log('Super Master:      supermaster1 / SuperMaster@123');
  console.log('Master Agent:      master1 / Master@123');
  console.log('Agent 1:           agent1 / Agent@123');
  console.log('Agent 2:           agent2 / Agent@123');
  console.log('Players:           player1-5 / Player@123');
  console.log('─────────────────────────────────────');
  console.log('\n📊 Data Created:');
  console.log('- 5 matches (1 live, 4 upcoming) with odds');
  console.log('- 6 casino games');
  console.log('- 4 agents in hierarchy');
  console.log('- 5 players under agent1');
  console.log('- System settings configured');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
