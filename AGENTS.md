Use the `playwright` MCP server for browser-based exploration, navigation, UI verification, and selector discovery whenever the task involves interacting with the running web application.

Prefer Playwright MCP over ad hoc assumptions when validating page state, routes, language switching, theme switching, dialogs, or visible UI behavior.

When writing or updating end-to-end tests, use Playwright MCP first to inspect the live UI and confirm stable selectors such as `data-testid` before finalizing the test code.

