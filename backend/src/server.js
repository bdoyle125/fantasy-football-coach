"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const openai_1 = __importDefault(require("openai"));
const getTeamForOwner_1 = require("./getTeamForOwner");
dotenv_1.default.config();
class Server {
    app;
    openAiClient;
    port = Number(process.env.PORT) || 5000;
    constructor() {
        this.app = (0, express_1.default)();
        this.openAiClient = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.configureMiddleware();
        this.configureRoutes();
    }
    configureMiddleware() {
        this.app.use((0, cors_1.default)());
        this.app.use(express_1.default.json());
    }
    configureRoutes() {
        this.app.get('/', (req, res) => {
            res.send('Fantasy Football Coach API is running');
        });
        this.app.post('/api/openai-test', async (req, res) => {
            try {
                const response = await this.openAiClient.chat.completions.create({
                    model: 'gpt-5-mini',
                    messages: [{ role: 'user', content: 'Write a one-sentence fantasy football tip.' }],
                });
                if (!response.choices || response.choices.length === 0) {
                    return res.status(500).json({ error: 'No response from OpenAI API' });
                }
                res.json({ tip: response.choices[0].message?.content });
            }
            catch (error) {
                res.status(500).json({ error: 'Error communicating with OpenAI API' });
            }
        });
        this.app.post('/api/myteam', async (req, res) => {
            try {
                const myPlayers = await (0, getTeamForOwner_1.getTeamForOwner)(Number(process.env.LEAGUE_ID), Number(process.env.OWNER_ID));
                res.json({ players: myPlayers });
            }
            catch (error) {
                console.error('Error fetching team data:', error);
                res.status(500).json({ error: 'Error fetching team data' });
            }
        });
    }
    start() {
        this.app.listen(this.port, () => {
            console.log(`Server is running on port ${this.port}`);
        });
    }
}
const server = new Server();
server.start();
//# sourceMappingURL=server.js.map