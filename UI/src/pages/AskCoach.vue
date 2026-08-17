<template>
  <div class="container mt-4">
    <div class="row justify-content-center">
      <div class="col-md-10">
        <h1 class="mb-3">Ask Coach Anything</h1>

        <Card class="mb-3">
          <template #content>
            <div class="chat-messages">
              <div
                v-if="messages.length === 0"
                style="color: var(--p-text-muted-color)"
              >
                Ask Coach Frank about your roster, matchups, trades, or general strategy.
              </div>
              <div
                v-for="(message, index) in messages"
                :key="index"
                class="chat-message"
                :class="message.role"
              >
                <div class="chat-bubble">{{ message.content }}</div>
              </div>
              <div
                v-if="sendInProgress"
                class="chat-message assistant"
              >
                <div
                  class="chat-bubble"
                  style="color: var(--p-text-muted-color)"
                >
                  Coach Frank is thinking...
                </div>
              </div>
            </div>
          </template>
        </Card>

        <Message
          v-if="sendError"
          severity="error"
          class="mb-2"
        >
          {{ sendError }}
        </Message>

        <form
          class="d-flex gap-2"
          @submit.prevent="sendMessage"
        >
          <InputText
            v-model="draft"
            class="flex-grow-1"
            placeholder="Ask a question..."
            :disabled="sendInProgress"
          />
          <PrimeButton
            type="submit"
            label="Send"
            :loading="sendInProgress"
            :disabled="!draft.trim()"
          />
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ChatService } from "../service/ChatService";
import { TeamService } from "../service/TeamService";
import { ChatMessage } from "../types/Chat";
import { Team } from "../types/Team";
import { Card, Button as PrimeButton, InputText, Message } from "primevue";

interface componentData {
  messages: ChatMessage[];
  draft: string;
  sendInProgress: boolean;
  sendError: string | null;
  myteam: Team | null;
}

export default defineComponent({
  name: "AskCoach",
  components: {
    Card,
    PrimeButton,
    InputText,
    Message,
  },
  setup() {
    return {
      ChatService: new ChatService(),
      TeamService: new TeamService(),
    };
  },
  data(): componentData {
    return {
      messages: [],
      draft: '',
      sendInProgress: false,
      sendError: null,
      myteam: null,
    };
  },
  methods: {
    async loadTeam() {
      try {
        this.myteam = await this.TeamService.fetchMyTeam();
      } catch (error) {
        console.error("Error loading team for chat context:", error);
      }
    },
    async sendMessage() {
      const content = this.draft.trim();
      if (!content || this.sendInProgress) {
        return;
      }
      this.messages.push({ role: 'user', content });
      this.draft = '';
      try {
        this.sendInProgress = true;
        this.sendError = null;
        const reply = await this.ChatService.sendMessage(this.messages, this.myteam?.players ?? []);
        this.messages.push({ role: 'assistant', content: reply });
      } catch (error) {
        console.error("Error sending chat message:", error);
        this.sendError = "Coach Frank couldn't respond just now. Try again.";
      } finally {
        this.sendInProgress = false;
      }
    },
  },
  async mounted() {
    await this.loadTeam();
  },
});
</script>

<style scoped>
.chat-messages {
  max-height: 50vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chat-message {
  display: flex;
}

.chat-message.user {
  justify-content: flex-end;
}

.chat-message.assistant {
  justify-content: flex-start;
}

.chat-bubble {
  max-width: 75%;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  white-space: pre-wrap;
}

.chat-message.user .chat-bubble {
  background-color: var(--p-primary-color);
  color: var(--p-primary-contrast-color);
}

.chat-message.assistant .chat-bubble {
  background-color: var(--p-content-hover-background);
  color: var(--p-text-color);
}
</style>
