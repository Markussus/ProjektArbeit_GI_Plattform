import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");

const moduleCatalogDataFile = path.join(
  appRoot,
  "src",
  "data",
  "moduleCatalogData.ts",
);
const moduleCatalogFile = path.join(
  appRoot,
  "src",
  "data",
  "moduleCatalog.tsx",
);
const outputFile = path.join(appRoot, "lighthouserc.json");

const baseUrl = process.env.LHCI_BASE_URL ?? "http://127.0.0.1:4173";
const staticPaths = ["/", "/info", "/__lhci-not-found__"];
const pathPattern = /path:\s*["'`]([^"'`]+)["'`]/g;

function collectModuleCatalogPaths() {
  const targetFile = existsSync(moduleCatalogDataFile)
    ? moduleCatalogDataFile
    : moduleCatalogFile;
  const source = readFileSync(targetFile, "utf8");
  return Array.from(source.matchAll(pathPattern), (match) => match[1]);
}

function toUniqueUrls(paths) {
  const seen = new Set();
  const urls = [];

  for (const routePath of paths) {
    const url = `${baseUrl}${routePath}`;

    if (seen.has(url)) {
      continue;
    }

    seen.add(url);
    urls.push(url);
  }

  return urls;
}

const urls = toUniqueUrls([...staticPaths, ...collectModuleCatalogPaths()]);

const config = {
  ci: {
    collect: {
      url: urls,
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
        onlyCategories: ["performance"],
        chromeFlags:
          "--no-sandbox --user-data-dir=./.lighthouseci/chrome-profile",
      },
    },
    assert: {
      assertMatrix: [
        {
          matchingUrlPattern: ".*java-programming.*",
          aggregationMethod: "median",
          assertions: {
            "largest-contentful-paint": ["error", { maxNumericValue: 5000 }],
          },
        },
        {
          matchingUrlPattern: "^((?!java-programming).)*$",
          aggregationMethod: "median",
          assertions: {
            "largest-contentful-paint": ["error", { maxNumericValue: 1400 }],
          },
        },
      ],
    },
  },
};

writeFileSync(outputFile, `${JSON.stringify(config, null, 2)}\n`, "utf8");

console.log(
  `Synced lighthouserc.json with ${urls.length} URLs from moduleCatalog.`,
);
