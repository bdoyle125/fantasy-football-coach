import express, { type Request, type Response, type NextFunction, type Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { getTeamForOwner } from './service-functions/getTeamForOwner';
import { getMatchupForOwner } from './service-functions/getMatchupForOwner';
import { getActiveLeagueSettings, setActiveLeague } from './repositories/settingsRepository';
import { isSupabaseConfigured } from './db/supabaseClient';
import { getSleeperState } from './service-functions/getSleeperState';
import { getWeeklyStatsForRoster } from './service-functions/getWeeklyStatsContext';
import { getSeasonStatsForRoster } from './service-functions/getSeasonStatsContext';
import { getProjectionsForRoster } from './service-functions/getPlayerProjection';
import { getDefenseRankingsWithFallback } from './service-functions/getDefenseRankings';
import { getInjuryStatuses } from './service-functions/getInjuryStatuses';
import { getPlayerDetail } from './service-functions/getPlayerDetail';
import { computeTeamStrength, computePlayerToWatch } from './service-functions/computeDashboardInsights';
import {
  WEEKLY_SYSTEM_PROMPT,
  SEASON_SYSTEM_PROMPT,
  MATCHUP_SYSTEM_PROMPT,
  buildWeeklyRosterContextText,
  buildSeasonRosterContextText,
  buildMatchupContextText,
} from './service-functions/buildCoachContext';

dotenv.config();

class Server {
  public readonly app: Application;
  private openAiClient: OpenAI;
  private port: number = Number(process.env.PORT) || 5000;

  constructor() {
    this.app = express();
    this.openAiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private configureRoutes() {
    this.app.get('/', (req: Request, res: Response) => {
      if (!process.env.SLEEPER_LEAGUE_ID || !process.env.SLEEPER_OWNER_ID) {
        console.log('Sleeper League ID or Owner ID not set in environment variables.');
      }
      res.send('Fantasy Football Coach API is running');
    });

    this.app.post('/api/openai-test', async (req: Request, res: Response) => {
      try {
        const response = await this.openAiClient.chat.completions.create({
          model: 'gpt-5-mini',
          messages: [{ role: 'user', content: 'Write a one-sentence fantasy football tip.' }],
        });

        if (!response.choices || response.choices.length === 0) {
          return res.status(500).json({ error: 'No response from OpenAI API' });
        }
        res.json({ tip: response.choices[0]!.message?.content });
      } catch (error) {
        console.error('Error communicating with OpenAI API:', error);
        res.status(500).json({ error: 'Error communicating with OpenAI API' });
      }
    });

    this.app.get('/api/myteam', async (req: Request, res: Response) => {
      try {
        let settings = null;
        if (isSupabaseConfigured()) {
          settings = await getActiveLeagueSettings();
        }
        let leagueId: string | undefined;
        let ownerId: string | undefined;
        if (settings) {
          if (settings.provider !== 'sleeper') {
            return res.status(501).json({ error: `Provider "${settings.provider}" is not supported yet` });
          }
          leagueId = settings.providerLeagueId;
          ownerId = settings.providerOwnerId;
        } else {
          console.warn('No active league in Supabase; falling back to SLEEPER_LEAGUE_ID/SLEEPER_OWNER_ID.');
          leagueId = process.env.SLEEPER_LEAGUE_ID;
          ownerId = process.env.SLEEPER_OWNER_ID;
        }
        if (!leagueId || !ownerId) {
          return res.status(400).json({ error: 'Missing Sleeper league or owner ID in database or environment variables' });
        }
        const myTeam = await getTeamForOwner(leagueId, ownerId);
        res.json(myTeam);
      } catch (error) {
        console.error('Error fetching team data:', error);
        res.status(500).json({ error: 'Error fetching team data' });
      }
    });

    this.app.get('/api/matchup', async (req: Request, res: Response) => {
      try {
        let settings = null;
        if (isSupabaseConfigured()) {
          settings = await getActiveLeagueSettings();
        }
        let leagueId: string | undefined;
        let ownerId: string | undefined;
        if (settings) {
          if (settings.provider !== 'sleeper') {
            return res.status(501).json({ error: `Provider "${settings.provider}" is not supported yet` });
          }
          leagueId = settings.providerLeagueId;
          ownerId = settings.providerOwnerId;
        } else {
          console.warn('No active league in Supabase; falling back to SLEEPER_LEAGUE_ID/SLEEPER_OWNER_ID.');
          leagueId = process.env.SLEEPER_LEAGUE_ID;
          ownerId = process.env.SLEEPER_OWNER_ID;
        }
        if (!leagueId || !ownerId) {
          return res.status(400).json({ error: 'Missing Sleeper league or owner ID in database or environment variables' });
        }
        const state = await getSleeperState();
        const matchup = await getMatchupForOwner(leagueId, ownerId, state);
        res.json(matchup);
      } catch (error) {
        console.error('Error fetching matchup data:', error);
        res.status(500).json({ error: 'Error fetching matchup data' });
      }
    });

    this.app.get('/api/settings', async (req: Request, res: Response) => {
      try {
        const settings = await getActiveLeagueSettings();
        if (!settings) {
          return res.status(404).json({ error: 'No active league configured' });
        }
        res.json(settings);
      } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Error fetching settings' });
      }
    });

    this.app.put('/api/settings', async (req: Request, res: Response) => {
      try {
        const { provider, providerLeagueId, providerOwnerId, leagueName } = req.body;
        if (provider !== 'sleeper' && provider !== 'espn') {
          return res.status(400).json({ error: 'provider must be "sleeper" or "espn"' });
        }
        if (typeof providerLeagueId !== 'string' || !providerLeagueId) {
          return res.status(400).json({ error: 'providerLeagueId is required' });
        }
        if (typeof providerOwnerId !== 'string' || !providerOwnerId) {
          return res.status(400).json({ error: 'providerOwnerId is required' });
        }
        const settings = await setActiveLeague({
          provider,
          providerLeagueId,
          providerOwnerId,
          ...(typeof leagueName === 'string' ? { leagueName } : {}),
        });
        res.json(settings);
      } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Error updating settings' });
      }
    });

    this.app.get('/api/player/:playerId', async (req: Request, res: Response) => {
      try {
        const playerId = req.params.playerId;
        if (!playerId) {
          return res.status(400).json({ error: 'playerId is required' });
        }
        const state = await getSleeperState();
        const playerDetail = await getPlayerDetail(playerId, state);
        res.json({ playerData: playerDetail });
      } catch (error) {
        console.error('Error fetching player details:', error);
        res.status(500).json({ error: 'Error fetching player details' });
      }
    });

    this.app.get('/api/leagues', async (req: Request, res: Response) => {
      try {
        const leaguesRes = await fetch(`https://api.sleeper.app/v1/user/${process.env.SLEEPER_OWNER_ID}/leagues/nfl/${new Date().getFullYear() - 1}`); // TODO: handle accessing year for current season
        const leaguesData = await leaguesRes.json();
        res.json({ leagues: leaguesData });
      } catch (error) {
        console.error('Error fetching leagues data:', error);
        res.status(500).json({ error: 'Error fetching leagues data' });
      }
    });

    this.app.post('/api/analyze-team', async (req: Request, response: Response) => {
      try {
        // Deserialize players from request body
        const players = req.body.players;
        if (!players || !Array.isArray(players)) {
          return response.status(400).json({ error: 'Invalid players data' });
        }

        const validPlayers = players.filter((p: any) => p && p.id);
        const playerIds: string[] = validPlayers.map((p: any) => p.id);
        const state = await getSleeperState();
        const [statsMap, injuryMap, projectionMap, defenseRankings] = await Promise.all([
          getSeasonStatsForRoster(playerIds, state),
          getInjuryStatuses(playerIds),
          getProjectionsForRoster(playerIds, state),
          getDefenseRankingsWithFallback(state),
        ]);
        const contextText = buildSeasonRosterContextText(validPlayers, statsMap, injuryMap, projectionMap, defenseRankings);

        const prompt = `Analyze the following fantasy football players and provide suggestions for improving the team:\n\n${contextText}\n\nProvide specific recommendations.`;
        const aiResponse = await this.openAiClient.chat.completions.create({
          model: 'gpt-5-mini',
          messages: [
            { role: 'system', content: SEASON_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
        });
        if (!aiResponse.choices || aiResponse.choices.length === 0 || !aiResponse.choices[0]?.message?.content) {
          return response.status(500).json({ error: 'No valid response from OpenAI API' });
        }
        response.json({ analysis: aiResponse.choices[0].message.content });
      } catch (error) {
        console.error('Error analyzing team:', error);
        response.status(500).json({ error: 'Error analyzing team' });
      }
    });

    this.app.post('/api/start-or-bench', async (req: Request, response: Response) => {
      try {
        const { player, roster } = req.body;
        if (!player || !player.name) {
          return response.status(400).json({ error: 'Invalid player data' });
        }
        if (!roster || !Array.isArray(roster)) {
          return response.status(400).json({ error: 'Invalid roster data' });
        }

        const validRoster = roster.filter((p: any) => p && p.id);
        const rosterIds: string[] = validRoster.map((p: any) => p.id);
        const state = await getSleeperState();
        const [weeklyStatsMap, projectionMap, defenseRankings, injuryMap] = await Promise.all([
          getWeeklyStatsForRoster(rosterIds, state),
          getProjectionsForRoster(rosterIds, state),
          getDefenseRankingsWithFallback(state),
          getInjuryStatuses(rosterIds),
        ]);
        const contextText = buildWeeklyRosterContextText(validRoster, weeklyStatsMap, projectionMap, defenseRankings, injuryMap);

        const prompt = `Here is the full roster:\n\n${contextText}\n\nShould ${player.name} (${player.position || 'Unknown Position'}) be started or benched this week? Consider the depth at their position elsewhere on the roster. Respond with a clear "Start" or "Bench" verdict followed by a brief explanation.`;

        const aiResponse = await this.openAiClient.chat.completions.create({
          model: 'gpt-5-mini',
          messages: [
            { role: 'system', content: WEEKLY_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
        });

        if (!aiResponse.choices || aiResponse.choices.length === 0 || !aiResponse.choices[0]?.message?.content) {
          return response.status(500).json({ error: 'No valid response from OpenAI API' });
        }
        response.json({ recommendation: aiResponse.choices[0].message.content });
      } catch (error) {
        console.error('Error generating start/bench recommendation:', error);
        response.status(500).json({ error: 'Error generating start/bench recommendation' });
      }
    });

    this.app.post('/api/dashboard-insights', async (req: Request, response: Response) => {
      try {
        const players = req.body.players;
        if (!players || !Array.isArray(players)) {
          return response.status(400).json({ error: 'Invalid players data' });
        }

        const validPlayers = players.filter((p: any) => p && p.id);
        const playerIds: string[] = validPlayers.map((p: any) => p.id);
        const state = await getSleeperState();
        const [seasonStatsMap, projectionMap, defenseRankings, injuryMap] = await Promise.all([
          getSeasonStatsForRoster(playerIds, state),
          getProjectionsForRoster(playerIds, state),
          getDefenseRankingsWithFallback(state),
          getInjuryStatuses(playerIds),
        ]);

        const teamStrength = computeTeamStrength(validPlayers, seasonStatsMap);
        const playerToWatch = computePlayerToWatch(validPlayers, projectionMap, defenseRankings, injuryMap);

        response.json({ teamStrength, playerToWatch });
      } catch (error) {
        console.error('Error computing dashboard insights:', error);
        response.status(500).json({ error: 'Error computing dashboard insights' });
      }
    });

    this.app.post('/api/matchup-preview', async (req: Request, response: Response) => {
      try {
        const { myTeam, opponentTeam } = req.body;
        if (!myTeam || !Array.isArray(myTeam.players) || myTeam.players.length === 0) {
          return response.status(400).json({ error: 'Invalid myTeam data' });
        }
        if (!opponentTeam || !Array.isArray(opponentTeam.players) || opponentTeam.players.length === 0) {
          return response.status(400).json({ error: 'Invalid opponentTeam data' });
        }

        const validMyTeamPlayers = myTeam.players.filter((p: any) => p && p.id);
        const validOpponentTeamPlayers = opponentTeam.players.filter((p: any) => p && p.id);
        const combinedPlayerIds: string[] = [...validMyTeamPlayers, ...validOpponentTeamPlayers].map((p: any) => p.id);
        const state = await getSleeperState();
        const [weeklyStatsMap, projectionMap, defenseRankings, injuryMap] = await Promise.all([
          getWeeklyStatsForRoster(combinedPlayerIds, state),
          getProjectionsForRoster(combinedPlayerIds, state),
          getDefenseRankingsWithFallback(state),
          getInjuryStatuses(combinedPlayerIds),
        ]);
        const contextText = buildMatchupContextText(
          myTeam.name || 'Your Team',
          validMyTeamPlayers,
          opponentTeam.name || 'Opponent Team',
          validOpponentTeamPlayers,
          weeklyStatsMap,
          projectionMap,
          defenseRankings,
          injuryMap,
        );

        const prompt = `Here is this week's head-to-head fantasy matchup:\n\n${contextText}\n\nPreview this matchup and predict a winner.`;

        const aiResponse = await this.openAiClient.chat.completions.create({
          model: 'gpt-5-mini',
          messages: [
            { role: 'system', content: MATCHUP_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
        });

        if (!aiResponse.choices || aiResponse.choices.length === 0 || !aiResponse.choices[0]?.message?.content) {
          return response.status(500).json({ error: 'No valid response from OpenAI API' });
        }
        response.json({ preview: aiResponse.choices[0].message.content });
      } catch (error) {
        console.error('Error generating matchup preview:', error);
        response.status(500).json({ error: 'Error generating matchup preview' });
      }
    });

  }

  private configureErrorHandling() {
    this.app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
      console.error('Unhandled error:', err);
      if (res.headersSent) {
        return next(err);
      }
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`Server is running on port ${this.port}`);
    });
  }
}

export function createApp(): Application {
  return new Server().app;
}

if (require.main === module) {
  const server = new Server();
  server.start();
}
