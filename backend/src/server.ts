import express, { type Request, type Response, type Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { getTeamForOwner } from './getTeamForOwner';

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
            console.log('LeagueID:', process.env.SLEEPER_LEAGUE_ID);
            console.log('OwnerID:', process.env.SLEEPER_OWNER_ID);
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

        this.app.post('/api/myteam', async (req: Request, res: Response) => {
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

    }

    public start(): void {
        this.app.listen(this.port, () => {
            console.log(`Server is running on port ${this.port}`);
        });
    }
}

const server = new Server();
server.start();
