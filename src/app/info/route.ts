import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Serves the self-contained AesthetixAI sales page at /info.
 *
 * The markup lives in ./template.html (a full standalone HTML document, kept
 * out of /public so it isn't served raw as a static asset). The PayPal checkout
 * link is hardcoded directly in the markup, so this route just reads and returns
 * the file as-is.
 *
 * Images are referenced as /info/<name>.(png|jpg) and served statically from
 * public/info/ — unaffected by this route (which only matches /info exactly).
 */
export const dynamic = "force-static";

export async function GET() {
  const templatePath = path.join(process.cwd(), "src", "app", "info", "template.html");
  const html = await readFile(templatePath, "utf8");

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
