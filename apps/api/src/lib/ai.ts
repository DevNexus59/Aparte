// Pattern Strategy, miroir de lib/moderation.ts : une interface + un Noop
// de repli, pour que l'app tourne sans OPENAI_API_KEY (side-project, pas
// de facturation garantie). Les implémentations doivent être fail-open :
// une erreur (réseau, parsing, timeout) retourne toujours un tableau vide,
// jamais une exception qui remonterait à l'utilisateur.

import OpenAI from 'openai';
import { z } from 'zod';
import { StateValue } from '../entities/EmotionalState';
import { JournalType } from '../entities/JournalEntry';

export interface ConversationStarterContext {
  daysSinceLastMessage: number | null;
  otherPersonState: StateValue | null;
  myState: StateValue | null;
}

export interface JournalSuggestionContext {
  recentTypes: JournalType[];
  currentWeekPromptCategory: string | null;
}

export interface WeeklyPromptGenContext {
  existingTexts: string[];
  count: number;
}

export type PromptCategory = 'gratitude' | 'reconnect' | 'memory' | 'reflection' | 'general';

export interface GeneratedPrompt {
  text: string;
  category: PromptCategory;
}

export interface AIProvider {
  readonly name: string;
  conversationStarters(ctx: ConversationStarterContext): Promise<string[]>;
  journalSuggestions(ctx: JournalSuggestionContext): Promise<GeneratedPrompt[]>;
  weeklyPrompts(ctx: WeeklyPromptGenContext): Promise<GeneratedPrompt[]>;
}

export class NoopAIProvider implements AIProvider {
  readonly name = 'noop';
  async conversationStarters(): Promise<string[]> { return []; }
  async journalSuggestions(): Promise<GeneratedPrompt[]> { return []; }
  async weeklyPrompts(): Promise<GeneratedPrompt[]> { return []; }
}

// Bornes de coût/contenu : suggestions courtes, peu nombreuses.
const TIMEOUT_MS = 8000;
const MAX_TEXT_LEN = 280;
const MAX_SUGGESTIONS = 5;

const promptCategorySchema = z.enum(['gratitude', 'reconnect', 'memory', 'reflection', 'general']);

const generatedPromptsSchema = z.object({
  suggestions: z.array(z.object({
    text: z.string().min(1).max(MAX_TEXT_LEN),
    category: promptCategorySchema,
  })).max(MAX_SUGGESTIONS),
});

const conversationStartersSchema = z.object({
  suggestions: z.array(z.string().min(1).max(MAX_TEXT_LEN)).max(MAX_SUGGESTIONS),
});

// Prompts système figés côté serveur — jamais concaténés avec une donnée
// venant de la requête HTTP. Le contexte utilisateur (JSON) ne contient que
// des enums/nombres calculés côté serveur, jamais de texte libre.
const CONVERSATION_STARTER_SYSTEM_PROMPT = `Tu aides les membres d'une application de cercle social privé ("Aparté") à trouver une idée de message à envoyer à une personne de leur cercle.
Tu reçois un contexte JSON (nombre de jours depuis le dernier message, états émotionnels éventuels des deux personnes — valeurs possibles : need_to_talk, socially_tired, available, want_to_see).
Propose 1 à 3 phrases courtes, chaleureuses et naturelles en français, que la personne pourrait envoyer telles quelles. Ne mentionne jamais de nom propre. N'invente aucune information sur la personne au-delà du contexte fourni. Réponds uniquement avec un objet JSON de la forme { "suggestions": ["...", "..."] }.`;

const JOURNAL_SUGGESTION_SYSTEM_PROMPT = `Tu proposes des idées d'écriture pour le journal personnel d'une application de bien-être relationnel ("Aparté").
Tu reçois un contexte JSON (types d'entrées récemment écrites par l'utilisateur, catégorie de la question de la semaine en cours).
Propose 1 à 3 idées de sujets courts en français, variés (gratitude, souvenir, réflexion), en évitant de répéter les types récents si possible. Réponds uniquement avec le JSON demandé : un tableau "suggestions" d'objets { text, category }, où category vaut gratitude, reconnect, memory, reflection ou general.`;

const WEEKLY_PROMPT_SYSTEM_PROMPT = `Tu génères de nouvelles "questions de la semaine" pour une application de cercle social privé ("Aparté"), destinées à encourager la réflexion personnelle et le lien avec les proches.
Tu reçois la liste des questions déjà existantes (à ne pas dupliquer ni reformuler trivialement) et le nombre de nouvelles questions à générer.
Chaque question doit être courte (une phrase, en français, ton chaleureux et non culpabilisant), et classée dans une catégorie : gratitude, reconnect, memory ou reflection. Réponds uniquement avec le JSON demandé : un tableau "suggestions" d'objets { text, category }.`;

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model = 'gpt-4o-mini') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async conversationStarters(ctx: ConversationStarterContext): Promise<string[]> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 300,
        messages: [
          { role: 'system', content: CONVERSATION_STARTER_SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(ctx) },
        ],
        response_format: { type: 'json_object' },
      }, { signal: AbortSignal.timeout(TIMEOUT_MS) });

      const content = completion.choices[0]?.message?.content;
      if (!content) return [];
      return conversationStartersSchema.parse(JSON.parse(content)).suggestions;
    } catch {
      return [];
    }
  }

  async journalSuggestions(ctx: JournalSuggestionContext): Promise<GeneratedPrompt[]> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 400,
        messages: [
          { role: 'system', content: JOURNAL_SUGGESTION_SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(ctx) },
        ],
        response_format: { type: 'json_object' },
      }, { signal: AbortSignal.timeout(TIMEOUT_MS) });

      const content = completion.choices[0]?.message?.content;
      if (!content) return [];
      return generatedPromptsSchema.parse(JSON.parse(content)).suggestions;
    } catch {
      return [];
    }
  }

  async weeklyPrompts(ctx: WeeklyPromptGenContext): Promise<GeneratedPrompt[]> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 600,
        messages: [
          { role: 'system', content: WEEKLY_PROMPT_SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(ctx) },
        ],
        response_format: { type: 'json_object' },
      }, { signal: AbortSignal.timeout(TIMEOUT_MS) });

      const content = completion.choices[0]?.message?.content;
      if (!content) return [];
      return generatedPromptsSchema.parse(JSON.parse(content)).suggestions;
    } catch {
      return [];
    }
  }
}
