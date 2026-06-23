import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Serves the self-contained AesthetixAI sales page at /info.
 *
 * The markup lives in ./template.html (a full standalone HTML document, kept
 * out of /public so the un-injected version is never served raw). At build we
 * read it and swap the `__PAYPAL_CHECKOUT_URL__` token for the real checkout
 * link from the environment — so the payment link is configured via .env, not
 * by editing markup. Set NEXT_PUBLIC_PAYPAL_CHECKOUT_URL and rebuild to update.
 *
 * Screenshots are referenced as /info/<name>.png and served statically from
 * public/info/ — unaffected by this route (which only matches /info exactly).
 */
export const dynamic = "force-static";

export async function GET() {
  const templatePath = path.join(process.cwd(), "src", "app", "info", "template.html");
  const template = await readFile(templatePath, "utf8");

  const checkoutUrl = process.env.NEXT_PUBLIC_PAYPAL_CHECKOUT_URL?.trim() || "#";
  const html = template.split("__PAYPAL_CHECKOUT_URL__").join(checkoutUrl);

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
