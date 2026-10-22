import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { legacyArticleSlugs } from "@/app/artikel/legacy-slug-redirects";
import { liveLangFor, carloPath } from "@/app/carlo/i18n";

const ARTIKEL_PREFIX = "/artikel/";

/**
 * Old Cockpit-era article links (`/artikel/<title-slug>`) are answered here
 * rather than in the route itself, because `cacheComponents` streams the page
 * shell as a 200 before `params` can even be read — a `redirect()` in the route
 * therefore only reaches the browser as a client-side navigation, which leaves
 * crawlers on an empty 200. Middleware runs before any of that, so these get a
 * real 308.
 *
 * Only the one-segment form is handled: the table is keyed by `title_slug`, and
 * `/artikel/<id>/<slug>` never needs redirecting.
 */
function legacyArticleTarget(pathname: string): string | undefined {
  if (!pathname.startsWith(ARTIKEL_PREFIX)) return undefined;
  const segment = pathname.slice(ARTIKEL_PREFIX.length);
  if (!segment) return undefined;
  // Plenty of legacy slugs contain umlauts, spaces or even a leading space
  // ("plan-für-lockdown", "Was im Herzen ist"), so they arrive percent-encoded.
  return legacyArticleSlugs[segment] ?? legacyArticleSlugs[decode(segment)];
}

function decode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    // Malformed percent-encoding: keep the raw value, which simply won't match.
    return segment;
  }
}

// Link previews (WhatsApp, Signal, ...) should show the German page whatever language the crawler sends.
const PREVIEW_CRAWLER =
  /facebookexternalhit|facebot|whatsapp|telegrambot|signal|twitterbot|slackbot|discordbot|linkedinbot|googlebot|bingbot/i;

function liveTarget(request: NextRequest): string {
  if (PREVIEW_CRAWLER.test(request.headers.get("user-agent") ?? "")) {
    return carloPath("de");
  }
  return carloPath(liveLangFor(request.headers.get("accept-language")));
}

// /api/internal/* existed only for the WhatsApp assistant, which reached it
// in-cluster and was gated by a Traefik middleware blocking external access
// (see deploy/helm/templates/ingress-block-internal.yaml). That network
// boundary doesn't exist on Vercel, so block these routes at the app layer
// instead now that the WhatsApp deployment is being retired.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/internal")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (pathname === "/carlo" || pathname === "/live") {
    const url = request.nextUrl.clone();
    url.pathname = liveTarget(request);
    // 307, not 308: browsers cache permanent redirects, and the language must stay a per-visit choice.
    const response = NextResponse.redirect(url, 307);
    response.headers.set("Vary", "Accept-Language, User-Agent");
    return response;
  }

  const target = legacyArticleTarget(pathname);
  if (target) {
    const url = request.nextUrl.clone();
    url.pathname = `${ARTIKEL_PREFIX}${target}`;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/internal/:path*", "/artikel/:slug", "/carlo", "/live"],
};
