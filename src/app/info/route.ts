import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Serves the AesthetixAI sales page at /info.
 *
 * The markup lives in ./template.html (a full standalone HTML document, kept
 * out of /public so it isn't served raw as a static asset). Its stylesheet,
 * script and images are static files in public/info/ and are referenced with
 * absolute /info/... paths:
 *   public/info/styles.css   page styles (fonts load from ./assets/fonts)
 *   public/info/main.js      page behaviour + owner CONFIG (PayPal link, spots, video)
 *   public/info/assets/**    images and fonts
 * Those are served by Next's static handler, unaffected by this route (which
 * only matches /info exactly).
 *
 * Demo mode: /info?preview=1 turns on the sample-data countdown, viewer badge
 * and buyer pop-ups. Regular visitors to /info never see them.
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
