import { zodToJsonSchema as _zodToJsonSchema } from "zod-to-json-schema";
import type { ZodTypeAny } from "zod";

/**
 * Wrapper around zod-to-json-schema that produces output compatible with the
 * Anthropic tool input_schema field (top-level "object" with properties).
 */
export function zodToJsonSchema(schema: ZodTypeAny): Record<string, unknown> {
  const result = _zodToJsonSchema(schema, {
    $refStrategy: "none",
    target: "openApi3",
  });
  // Strip the $schema key the library adds — Anthropic doesn't need it.
  if (typeof result === "object" && result !== null) {
    const { $schema: _drop, ...rest } = result as Record<string, unknown>;
    return rest;
  }
  return result as Record<string, unknown>;
}
