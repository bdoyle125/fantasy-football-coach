import { ChatMessage } from "../types/Chat";
import { Player } from "../../../backend/types/Player";
import { extractApiErrorMessage } from "../utils/apiError";

export class ChatService {
    async sendMessage(messages: ChatMessage[], players: Player[]): Promise<string> {
        const api = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${api}api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages, players }),
        });
        if (!response.ok) {
            throw new Error(await extractApiErrorMessage(response, 'Failed to get a response from Coach Frank'));
        }
        const data = await response.json();
        return data.reply;
    }
}
