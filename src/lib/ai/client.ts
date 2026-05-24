import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodToJsonSchema } from "./zod-to-json-schema";

export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

export class AIConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIConfigError";
  }
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

  const response = await anthropic.messages.create({
    model: opts.model ?? DEFAULT_MODEL,
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.system,
    tools: [
      {
        name: opts.toolName,
        description: opts.toolDescription,
        input_schema: jsonSchema as Anthropic.Messages.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: opts.toolName },
    messages: [{ role: "user", content: opts.user }],
  });

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
}): Promise<string> {
  const anthropic = getAnthropic();
  const response = await anthropic.messages.create({
    model: opts.model ?? DEFAULT_MODEL,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.system,
    messages: opts.messages,
  });
  return response.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}
