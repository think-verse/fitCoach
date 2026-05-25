import { zodToJsonSchema as _zodToJsonSchema } from "zod-to-json-schema";
import type { ZodTypeAny } from "zod";

/**
 * Wrapper around zod-to-json-schema that produces output compatible with the
 * Anthropic tool input_schema field (top-level "object" with properties).
 */
export function zodToJsonSchema(schema: ZodTypeAny): Record<string, unknown> {
  // Use the default (JSON Schema draft-07) target, NOT openApi3. The openApi3
  // target emits `nullable: true`, which Anthropic's tool-use validator rejects
  // (it requires JSON Schema draft 2020-12 — draft-07 output validates fine,
  // OpenAPI's `nullable` keyword does not).
  const result = _zodToJsonSchema(schema, {
    $refStrategy: "none",
  });
  // Strip the $schema key the library adds — Anthropic doesn't need it.
  if (typeof result === "object" && result !== null) {
    const { $schema: _drop, ...rest } = result as Record<string, unknown>;
    return rest;
  }
  return result as Record<string, unknown>;
}
