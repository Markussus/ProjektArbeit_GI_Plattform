/**
 * Single source of truth for the public deployment base URL.
 * Change ONLY this value when the app is deployed somewhere else.
 * Examples:
 *   "/"                                  -> https://example.de/
 *   "/gi_learningtool/"                  -> https://example.de/gi_learningtool/
 *   "https://lernen.example.de/"          -> dedicated subdomain/root
 *   "https://example.de/gi_learningtool/" -> full URL with subpath
 *
 * An empty string is treated as "/".
 * Keep "./" out of this SPA setup: BrowserRouter needs a stable pathname base.
 */
export const DEPLOYMENT_BASE_URL = "/gi_learningtool/";
