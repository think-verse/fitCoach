import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodToJsonSchema } from "./zod-to-json-schema";
import { enqueue } from "./queue";

// Two tiers: vision-critical work (photo analysis, weekly photo comparison) uses
// the stronger Sonnet model; text-only generation (workout, diet, coach chat)
// uses the cheaper Haiku. Both overridable via env.
export const VISION_MODEL =
  process.env.ANTHROPIC_VISION_MODEL ??
  process.env.ANTHROPIC_MODEL ??
  "claude-sonnet-4-6";
export const TEXT_MODEL =
  process.env.ANTHROPIC_TEXT_MODEL ?? "claude-haiku-4-5";

// Back-compat default.
export const DEFAULT_MODEL = VISION_MODEL;

export class AIConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIConfigError";
  }
}

/**
 * Build a system prompt with prompt caching enabled. `cache_control` is accepted
 * by the API at runtime but isn't in the SDK 0.32 TextBlockParam type, so we cast.
 */
function cachedSystem(
  text: string,
): Anthropic.Messages.MessageCreateParamsNonStreaming["system"] {
  return [
    { type: "text", text, cache_control: { type: "ephemeral" } },
  ] as unknown as Anthropic.Messages.MessageCreateParamsNonStreaming["system"];
}

let _client: Anthropic | null = null;
export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AIConfigError(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local — see README.",
    );
  }
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export interface StructuredOptions<T extends z.ZodTypeAny> {
  system: string;
  user: Anthropic.Messages.MessageParam["content"];
  schema: T;
  toolName: string;
  toolDescription: string;
  model?: string;
  maxTokens?: number;
  /** Optional — applies the queue's per-user fairness cap. */
  userId?: string;
}

/**
 * Force the model to produce structured output by giving it a single tool
 * whose input schema is the Zod schema we want. We require tool use, parse the
 * input, then validate with Zod for type safety.
 */
export async function generateStructured<T extends z.ZodTypeAny>(
  opts: StructuredOptions<T>,
): Promise<z.infer<T>> {
  const anthropic = getAnthropic();
  const jsonSchema = zodToJsonSchema(opts.schema);

  const response = await enqueue(() => anthropic.messages.create({
    model: opts.model ?? DEFAULT_MODEL,
    max_tokens: opts.maxTokens ?? 4096,
    // Cache the (static) system prompt — repeat calls within ~5 min reuse it at
    // ~10% of the input cost. Big win for the parallel per-day workout calls.
    system: cachedSystem(opts.system),
    tools: [
      {
        name: opts.toolName,
        description: opts.toolDescription,
        input_schema: jsonSchema as Anthropic.Messages.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: opts.toolName },
    messages: [{ role: "user", content: opts.user }],
  }), opts.userId);

  const toolBlock = response.content.find(
    (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use",
  );
  if (!toolBlock) {
    throw new Error("AI response did not include a tool_use block.");
  }
  return opts.schema.parse(toolBlock.input);
}

/** Plain text completion (for the coach chat conversational reply). */
export async function generateText(opts: {
  system: string;
  messages: Anthropic.Messages.MessageParam[];
  model?: string;
  maxTokens?: number;
  userId?: string;
}): Promise<string> {
  const anthropic = getAnthropic();
  const response = await enqueue(() => anthropic.messages.create({
    model: opts.model ?? DEFAULT_MODEL,
    max_tokens: opts.maxTokens ?? 1024,
    system: cachedSystem(opts.system),
    messages: opts.messages,
  }), opts.userId);
  return response.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}
