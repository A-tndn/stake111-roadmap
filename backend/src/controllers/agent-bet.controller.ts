import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Agent Bet Controller
 * Handles betting operations for agents using raw SQL queries
 * on the agent_bets table (created outside of Prisma migrations).
 */

// ============================================
// PLACE AGENT BET (Standard Bookmaker)
// ============================================
export const placeAgentBet = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).user?.id;
    if (!agentId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { matchId, betType, betOn, amount, odds, description, isBack } = req.body;

    // Verify match exists and betting is open
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    if (match.bettingLocked) {
      return res.status(400).json({ success: false, message: 'Betting is locked for this match' });
    }

    // Check agent balance
    const agent = await prisma.agent.findFirst({ where: { userId: agentId } });
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    const agentBalance = Number(agent.balance);
    if (agentBalance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ${agentBalance}, Required: ${amount}`,
      });
    }

    // Calculate potential win/loss
    const potentialWin = isBack ? amount * (odds - 1) : amount;
    const liability = isBack ? amount : amount * (odds - 1);

    // Create agent bet using raw SQL
    const betResult = await prisma.$queryRawUnsafe(`
      INSERT INTO agent_bets (id, agent_id, match_id, bet_type, bet_on, amount, odds, potential_win, liability, description, is_back, status, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', NOW(), NOW())
      RETURNING id, agent_id, match_id, bet_type, bet_on, amount, odds, potential_win, liability, description, is_back, status, created_at
    `, agentId, matchId, betType, betOn, amount, odds, potentialWin, liability, description || null, isBack !== false);

    // Deduct from agent balance
    await prisma.agent.update({
      where: { id: agent.id },
      data: { balance: { decrement: liability } },
    });

    return res.status(201).json({
      success: true,
      message: 'Bet placed successfully',
      data: Array.isArray(betResult) ? betResult[0] : betResult,
    });
  } catch (error: any) {
    console.error('Error placing agent bet:', error);

    // If table doesn't exist, provide helpful message
    if (error.code === '42P01') {
      return res.status(500).json({
        success: false,
        message: 'Agent bets table not initialized. Please run the migration.',
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to place bet',
    });
  }
};

// ============================================
// PLACE AGENT FANCY BET
// ============================================
export const placeAgentFancyBet = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).user?.id;
    if (!agentId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { matchId, fancyMarketId, betOn, amount, odds, runValue, description, isBack } = req.body;

    // Verify match exists
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    if (match.bettingLocked) {
      return res.status(400).json({ success: false, message: 'Betting is locked for this match' });
    }

    // Check agent balance
    const agent = await prisma.agent.findFirst({ where: { userId: agentId } });
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    const agentBalance = Number(agent.balance);
    if (agentBalance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ${agentBalance}, Required: ${amount}`,
      });
    }

    // Calculate potential win/loss for fancy bets
    const potentialWin = isBack ? (amount * odds) / 100 : amount;
    const liability = isBack ? amount : (amount * odds) / 100;

    // Create fancy bet using raw SQL
    const betResult = await prisma.$queryRawUnsafe(`
      INSERT INTO agent_bets (id, agent_id, match_id, bet_type, bet_on, amount, odds, potential_win, liability, run_value, fancy_market_id, description, is_back, status, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, 'FANCY', $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING', NOW(), NOW())
      RETURNING id, agent_id, match_id, bet_type, bet_on, amount, odds, potential_win, liability, run_value, description, is_back, status, created_at
    `, agentId, matchId, betOn, amount, odds, potentialWin, liability, runValue, fancyMarketId || null, description || null, isBack !== false);

    // Deduct from agent balance
    await prisma.agent.update({
      where: { id: agent.id },
      data: { balance: { decrement: liability } },
    });

    return res.status(201).json({
      success: true,
      message: 'Fancy bet placed successfully',
      data: Array.isArray(betResult) ? betResult[0] : betResult,
    });
  } catch (error: any) {
    console.error('Error placing agent fancy bet:', error);

    if (error.code === '42P01') {
      return res.status(500).json({
        success: false,
        message: 'Agent bets table not initialized. Please run the migration.',
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to place fancy bet',
    });
  }
};

// ============================================
// GET AGENT BETS (with filters)
// ============================================
export const getAgentBets = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).user?.id;
    if (!agentId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { matchId, status, limit = 50, offset = 0 } = req.query;

    let whereClause = `WHERE agent_id = $1`;
    const params: any[] = [agentId];
    let paramIndex = 2;

    if (matchId) {
      whereClause += ` AND match_id = $${paramIndex}`;
      params.push(matchId);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const bets = await prisma.$queryRawUnsafe(`
      SELECT ab.*, m.name as match_name, m.team1, m.team2, m.status as match_status
      FROM agent_bets ab
      LEFT JOIN matches m ON ab.match_id = m.id
      ${whereClause}
      ORDER BY ab.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, ...params, Number(limit), Number(offset));

    const countResult: any[] = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total FROM agent_bets ${whereClause}
    `, ...params);

    return res.json({
      success: true,
      data: {
        bets,
        total: Number(countResult[0]?.total || 0),
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error: any) {
    console.error('Error fetching agent bets:', error);

    if (error.code === '42P01') {
      return res.json({
        success: true,
        data: { bets: [], total: 0, limit: 50, offset: 0 },
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch bets',
    });
  }
};

// ============================================
// GET AGENT BETS BY MATCH
// ============================================
export const getAgentBetsByMatch = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).user?.id;
    if (!agentId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { matchId } = req.params;

    if (!matchId) {
      return res.status(400).json({ success: false, message: 'matchId is required' });
    }

    const bets = await prisma.$queryRawUnsafe(`
      SELECT ab.*, m.name as match_name, m.team1, m.team2
      FROM agent_bets ab
      LEFT JOIN matches m ON ab.match_id = m.id
      WHERE ab.agent_id = $1 AND ab.match_id = $2
      ORDER BY ab.created_at DESC
    `, agentId, matchId);

    // Calculate summary
    const allBets = Array.isArray(bets) ? bets : [];
    const totalStaked = allBets.reduce((sum: number, b: any) => sum + Number(b.amount || 0), 0);
    const totalLiability = allBets.reduce((sum: number, b: any) => sum + Number(b.liability || 0), 0);
    const pendingBets = allBets.filter((b: any) => b.status === 'PENDING').length;
    const wonBets = allBets.filter((b: any) => b.status === 'WON').length;
    const lostBets = allBets.filter((b: any) => b.status === 'LOST').length;

    return res.json({
      success: true,
      data: {
        bets: allBets,
        summary: {
          totalBets: allBets.length,
          totalStaked,
          totalLiability,
          pendingBets,
          wonBets,
          lostBets,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching agent bets by match:', error);

    if (error.code === '42P01') {
      return res.json({
        success: true,
        data: {
          bets: [],
          summary: { totalBets: 0, totalStaked: 0, totalLiability: 0, pendingBets: 0, wonBets: 0, lostBets: 0 },
        },
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch bets for match',
    });
  }
};
