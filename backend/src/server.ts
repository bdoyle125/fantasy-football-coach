import express, { type Request, type Response, type Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { getTeamForOwner } from './service-functions/getTeamForOwner';

dotenv.config();

class Server {
    private app: Application;
    private openAiClient: OpenAI;
    private port: number = Number(process.env.PORT) || 5000;

    constructor() {
        this.app = express();
        this.openAiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.configureMiddleware();
        this.configureRoutes();
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
                res.json({  tip: response.choices[0]!.message?.content });
            } catch (error) {
                res.status(500).json({ error: 'Error communicating with OpenAI API' });
            }
        });

        this.app.get('/api/myteam', async (req: Request, res: Response) => {
            try {
                if (!process.env.SLEEPER_LEAGUE_ID || !process.env.SLEEPER_OWNER_ID) {
                    return res.status(400).json({ error: 'Missing Sleeper league or owner ID in environment variables' });
                }
                const myPlayers = await getTeamForOwner(process.env.SLEEPER_LEAGUE_ID, process.env.SLEEPER_OWNER_ID);
                res.json({ players: myPlayers });
            } catch (error) {
                console.error('Error fetching team data:', error);
                res.status(500).json({ error: 'Error fetching team data' });
            }
        });

        this.app.get('/api/player/:playerId', async (req: Request, res: Response) => {
            try {
                const playerId = req.params.playerId;
                const playerResponse = await fetch(`https://api.sleeper.app/stats/nfl/player/${playerId}?season_type=regular&season=${new Date().getFullYear()}`);
                if (!playerResponse.ok) {
                    return res.status(500).json({ error: 'Failed to fetch player stats from Sleeper API' });
                }
                const playerData = await playerResponse.json();
                res.json({ playerData: playerData });
            } catch (error) {
                return res.status(500).json({ error: 'Exception occurred while fetching player stats from Sleeper API' });
            }
        });

        this.app.post('/api/analyze-team', async (req: Request, response: Response) => {
            try {
                // Deserialize players from request body
                const players = req.body.players;
                if (!players || !Array.isArray(players)) {
                    return response.status(500).json({ error: 'Invalid players data' });
                }
                const playerDescriptions = players.map((p: any) => {
                    return `${p.name} (${p.position || 'Unknown Position'}) from ${p.team || 'Unknown Team'} with stats: ${JSON.stringify(p.stats)}`;
                }).join('\n');

                const prompt = `Analyze the following fantasy football players and provide suggestions for improving the team:\n\n${playerDescriptions}\n\nProvide specific recommendations.`;
                const aiResponse = await this.openAiClient.chat.completions.create({
                    model: 'gpt-5-mini',
                    messages: [{ role: 'user', content: prompt }],
                });
                if (!aiResponse.choices || aiResponse.choices.length === 0 || !aiResponse.choices[0]?.message?.content) {
                    return response.status(500).json({ error: 'No valid response from OpenAI API' });
                }
                response.json({ analysis: aiResponse.choices[0].message.content });
            } catch (error) {
                response.status(400).json({ error: 'Error analyzing team' });
            }
        });

    }

    public start(): void {
        this.app.listen(this.port, () => {
            console.log(`Server is running on port ${this.port}`);
        });
    }
}

const server = new Server();
server.start();
