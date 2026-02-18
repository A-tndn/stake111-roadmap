import prisma from '../db';
import { MatchStatus, MatchType } from '@prisma/client';
import cricketApiService from './cricketApi.service';
import logger from '../config/logger';

class MatchService {
  async syncMatches() {
    try {
      const currentMatches = await cricketApiService.getCurrentMatches();

      for (const apiMatch of currentMatches) {
        const existingMatch = await prisma.match.findFirst({
          where: { cricketApiId: apiMatch.id },
        });

        const formatScore = (innings: any[]) => {
          if (!innings || innings.length === 0) return null;
          return innings
            .map((inn: any) => `${inn.r}/${inn.w} (${inn.o})`)
            .join(' & ');
        };

        const team1Innings = apiMatch.score?.filter((_: any, i: number) => i % 2 === 0) || [];
        const team2Innings = apiMatch.score?.filter((_: any, i: number) => i % 2 !== 0) || [];

        const matchData: any = {
          cricketApiId: apiMatch.id,
          name: apiMatch.name,
          shortName: `${apiMatch.teams[0]} vs ${apiMatch.teams[1]}`,
          matchType: this.mapMatchType(apiMatch.matchType),
          venue: apiMatch.venue || 'TBA',
          team1: apiMatch.teams[0],
          team2: apiMatch.teams[1],
          team1Logo: apiMatch.teamInfo?.find((t: any) => t.name === apiMatch.teams[0])?.img || null,
          team2Logo: apiMatch.teamInfo?.find((t: any) => t.name === apiMatch.teams[1])?.img || null,
          tournament: this.extractTournament(apiMatch.name) || 'Unknown',
          startTime: new Date(apiMatch.dateTimeGMT),
          status: this.mapMatchStatus(apiMatch),
          team1Score: formatScore(team1Innings),
          team2Score: formatScore(team2Innings),
          lastSyncedAt: new Date(),
        };

        if (existingMatch) {
          await prisma.match.update({
            where: { id: existingMatch.id },
            data: matchData,
          });
        } else {
          await prisma.match.create({
            data: matchData,
          });
        }
      }

      logger.info(`Synced ${currentMatches.length} matches`);
      return { synced: currentMatches.length };
    } catch (error: any) {
      logger.error('Match sync failed:', error.message);
      throw error;
    }
  }

  async updateMatchScores() {
    try {
      const matches = await prisma.match.findMany({
        where: {
          status: {
            in: [MatchStatus.LIVE, MatchStatus.UPCOMING],
          },
        },
      });

      let updated = 0;

      for (const match of matches) {
        if (!match.cricketApiId) continue;

        try {
          const scoreData = await cricketApiService.getMatchScore(match.cricketApiId);

          const updateData: any = {
            lastSyncedAt: new Date(),
          };

          if (scoreData.score && scoreData.score.length > 0) {
            const formatScore = (innings: any[]) => {
              if (!innings || innings.length === 0) return null;
              return innings
                .map((inn: any) => `${inn.r}/${inn.w} (${inn.o})`)
                .join(' & ');
            };
            // Group scores by team (team1 = odd innings index 0,2; team2 = even 1,3)
            const team1Innings = scoreData.score.filter((_: any, i: number) => i % 2 === 0);
            const team2Innings = scoreData.score.filter((_: any, i: number) => i % 2 !== 0);
            updateData.team1Score = formatScore(team1Innings);
            updateData.team2Score = formatScore(team2Innings);
          }

          if (scoreData.status === 'completed') {
            updateData.status = MatchStatus.COMPLETED;
            updateData.endTime = new Date();

            if (scoreData.result) {
              updateData.matchWinner = this.extractWinner(scoreData.result);
            }
          } else if (scoreData.status === 'started') {
            updateData.status = MatchStatus.LIVE;
          }

          await prisma.match.update({
            where: { id: match.id },
            data: updateData,
          });

          updated++;
        } catch (error: any) {
          logger.error(`Failed to update match ${match.id}:`, error.message);
        }
      }

      logger.info(`Updated scores for ${updated} matches`);
      return { updated };
    } catch (error: any) {
      logger.error('Score update failed:', error.message);
      throw error;
    }
  }

  async getMatches(filters: {
    status?: MatchStatus;
    matchType?: MatchType;
    tournament?: string;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.matchType) where.matchType = filters.matchType;
    if (filters.tournament) where.tournament = { contains: filters.tournament };

    return await prisma.match.findMany({
      where,
      orderBy: { startTime: 'asc' },
      take: filters.limit || 50,
    });
  }

  async getMatchById(id: string) {
    return await prisma.match.findUnique({
      where: { id },
      include: {
        bets: {
          select: {
            id: true,
            betType: true,
            amount: true,
            status: true,
          },
        },
      },
    });
  }

  private mapMatchType(type: string): MatchType {
    const typeMap: Record<string, MatchType> = {
      test: MatchType.TEST,
      odi: MatchType.ODI,
      t20: MatchType.T20,
      t10: MatchType.T10,
      hundred: MatchType.HUNDRED,
    };

    return typeMap[type.toLowerCase()] || MatchType.T20;
  }

  private mapMatchStatus(match: any): MatchStatus {
    if (match.matchEnded) return MatchStatus.COMPLETED;
    if (match.matchStarted) return MatchStatus.LIVE;
    return MatchStatus.UPCOMING;
  }

  private extractTournament(matchName: string): string {
    // Match name format: "Team1 vs Team2, 21st Match, Group A, ICC Men's T20 World Cup 2026"
    // Extract everything after the last comma-separated segment that looks like a tournament
    const parts = matchName.split(', ');
    // Tournament name is usually the last part(s)
    if (parts.length >= 3) {
      // Find the first part that looks like a tournament/series name (not a match number/group)
      for (let i = parts.length - 1; i >= 1; i--) {
        const part = parts[i];
        if (
          part.includes('Trophy') ||
          part.includes('Cup') ||
          part.includes('League') ||
          part.includes('Series') ||
          part.includes('Championship') ||
          part.includes('Tournament') ||
          part.includes('Premier') ||
          part.includes('IPL') ||
          part.includes('ICC') ||
          part.includes('Asia') ||
          /20\d{2}/.test(part)
        ) {
          return parts.slice(i).join(', ');
        }
      }
      // Fallback: return last part
      return parts[parts.length - 1];
    }
    return parts.length > 1 ? parts[parts.length - 1] : matchName;
  }

  private extractWinner(result: string): string | null {
    const match = result.match(/^(\w+)\s+won/i);
    return match ? match[1] : null;
  }
}

export default new MatchService();
