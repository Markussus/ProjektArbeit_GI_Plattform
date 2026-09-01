// fallow-ignore-file unused-file
/**
 * ============================================================================
 * Fallow Topic Filter Script
 * ============================================================================
 * Ausführen aus dem `app/`-Ordner:
 *
 *   node scripts/fallow-filter.mjs --[tm|dnf|encoding|fa|mm|ns|rl|java|shared|rest|all]
 *
 * ----------------------------------------------------------------------------
 * 1. MODULE & TOPIC FLAGS (inkl. zugehöriger Unit- & E2E-Tests):
 * ----------------------------------------------------------------------------
 *   FundamentalsCS:
 *     --tm | --turing | --turing-machine   -> TuringMachine
 *     --dnf                                -> Dnf
 *     --encoding                           -> Encoding
 *     --fa | --finite-automata             -> FiniteAutomata
 *     --mm | --moore-mealy                 -> MooreMealy
 *     --ns | --number-systems              -> NumberSystems
 *     --rl | --regular-languages           -> RegularLanguages
 *
 *   Programming1:
 *     --java                               -> Java
 *
 *   Komponenten & Rest:
 *     --shared                             -> Shared Components (src/components/shared/ & tests/unit_tests/shared/)
 *     --rest | --other                     -> Rest der Seite (weder Topic noch Shared)
 *     --all | -a                           -> Gesamte Codebase (alle Findings)
 *
 *   Generisch per Name / Liste:
 *     -t, --topic <name1,name2,...>        -> z. B. --topic=TuringMachine,shared
 *
 * ----------------------------------------------------------------------------
 * 2. ANALYSE-FILTER (OPTIONAL KOMBINIERBAR):
 * ----------------------------------------------------------------------------
 *     --dead-code | --check                -> Nur Dead Code & Circular Imports
 *     --dupes | --duplicates               -> Nur Code-Duplikate / Klone
 *     --health | --complexity              -> Nur Komplexität & Refactor-Targets
 *
 * ----------------------------------------------------------------------------
 * 3. AUSGABE- & KONTROLL-OPTIONEN:
 * ----------------------------------------------------------------------------
 *     -l, --list | --list-topics           -> Tabellarische Übersicht aller Topics
 *     -s, --summary                        -> Nur Zusammenfassungs-Zahlen
 *     --json                               -> JSON-Rohdaten-Ausgabe
 *     --fail-on-issues                     -> Exit Code 1 wenn Issues vorhanden sind
 *     --no-color                           -> Farbausgabe deaktivieren
 *     -h, --help                           -> Hilfemenü anzeigen
 *
 * ----------------------------------------------------------------------------
 * 4. BEISPIELE FÜR ERLAUBTE KOMBINATIONEN:
 * ----------------------------------------------------------------------------
 *   # Einzelnes Modul (inkl. Tests):
 *   node scripts/fallow-filter.mjs --tm
 *   node scripts/fallow-filter.mjs --shared
 *   node scripts/fallow-filter.mjs --rest
 *
 *   # Mehrere Module kombinieren (z. B. TuringMachine + Shared):
 *   node scripts/fallow-filter.mjs --tm --shared
 *   node scripts/fallow-filter.mjs --dnf --fa --rl
 *
 *   # Modul + Filter auf nur Dead Code:
 *   node scripts/fallow-filter.mjs --tm --dead-code
 *
 *   # Modul + Filter auf nur Duplikate:
 *   node scripts/fallow-filter.mjs --shared --dupes
 *
 *   # Modul + JSON Ausgabe:
 *   node scripts/fallow-filter.mjs --tm --json
 *
 *   # Modul + CI-Prüfung (bricht bei Fehlern ab):
 *   node scripts/fallow-filter.mjs --tm --fail-on-issues
 * ============================================================================
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");

function hasProjectMarker(dir) {
  return (
    fs.existsSync(path.join(dir, ".git")) ||
    fs.existsSync(path.join(dir, ".idea"))
  );
}

function findProjectRoot(startDir) {
  let curr = startDir;
  while (curr && curr !== path.dirname(curr)) {
    if (hasProjectMarker(curr)) return curr;
    curr = path.dirname(curr);
  }
  return startDir;
}

const projectRoot = findProjectRoot(appRoot);

// ANSI Color helper
const useColor =
  process.stdout.isTTY &&
  !process.argv.includes("--no-color") &&
  process.env.NO_COLOR === undefined;

const colors = {
  reset: useColor ? "\x1b[0m" : "",
  bold: useColor ? "\x1b[1m" : "",
  dim: useColor ? "\x1b[2m" : "",
  red: useColor ? "\x1b[31m" : "",
  green: useColor ? "\x1b[32m" : "",
  yellow: useColor ? "\x1b[33m" : "",
  blue: useColor ? "\x1b[34m" : "",
  magenta: useColor ? "\x1b[35m" : "",
  cyan: useColor ? "\x1b[36m" : "",
  gray: useColor ? "\x1b[90m" : "",
  bgRed: useColor ? "\x1b[41m\x1b[37m" : "",
  bgYellow: useColor ? "\x1b[43m\x1b[30m" : "",
  bgBlue: useColor ? "\x1b[44m\x1b[37m" : "",
};

function normalizePath(p) {
  if (!p) return "";
  return p.replace(/\\/g, "/").replace(/^\.\//, "");
}

function fallback(val, def) {
  return val !== undefined && val !== null ? val : def;
}

function hasValue(v) {
  return v !== undefined && v !== null && v !== "";
}

function isSpecialPath(filePath) {
  if (!filePath || typeof filePath !== "string") return true;
  if (filePath.startsWith("package:") || filePath === "project") return true;
  return !filePath.includes(".");
}

function resolveProjectPath(filePath) {
  if (isSpecialPath(filePath)) return filePath || "";
  const absPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(appRoot, filePath);

  const rel = path.relative(projectRoot, absPath);
  return normalizePath(rel) || normalizePath(filePath);
}

function formatPosition(line, col) {
  if (!hasValue(line)) return "";
  if (hasValue(col)) return `:${line}:${col}`;
  return `:${line}`;
}

/**
 * Format a file path and line/col into a standard CLI link recognized by
 * VS Code, WebStorm (JetBrains), Zed, and modern terminal emulators.
 */
function formatFileLink(filePath, line, col) {
  const base = resolveProjectPath(filePath);
  if (!base || !filePath.includes(".")) return base;
  return `${base}${formatPosition(line, col)}`;
}

function buildTopicPathPrefixes(folderName, categoryLabel, relPath) {
  const kebab = folderName.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  const lower = folderName.toLowerCase();
  const catLower = categoryLabel.toLowerCase();

  return [
    // Source folders
    relPath.toLowerCase(),
    `src/pages/${catLower}/${lower}/`,
    `src/pages/${catLower}/${kebab}/`,
    `src/pages/${lower}/`,
    `src/pages/${kebab}/`,

    // Unit tests (both categorized and top-level subfolders)
    `tests/unit_tests/${catLower}/${lower}/`,
    `tests/unit_tests/${catLower}/${kebab}/`,
    `tests/unit_tests/${lower}/`,
    `tests/unit_tests/${kebab}/`,
    `tests/unit_tests/${lower}/`,

    // Unit test standalone files
    `tests/unit_tests/${catLower}/${lower}.test.`,
    `tests/unit_tests/${catLower}/${kebab}.test.`,
    `tests/unit_tests/${catLower}/${lower}.spec.`,
    `tests/unit_tests/${catLower}/${kebab}.spec.`,
    `tests/unit_tests/${lower}.test.`,
    `tests/unit_tests/${kebab}.test.`,
    `tests/unit_tests/${lower}.spec.`,
    `tests/unit_tests/${kebab}.spec.`,

    // E2E spec folders
    `tests/e2e/specs/${catLower}/${lower}/`,
    `tests/e2e/specs/${catLower}/${kebab}/`,
    `tests/e2e/specs/${lower}/`,
    `tests/e2e/specs/${kebab}/`,

    // E2E root spec files
    `tests/e2e/${kebab}.spec.`,
    `tests/e2e/${lower}.spec.`,
    `tests/e2e/${kebab}.test.`,
    `tests/e2e/${lower}.test.`,
    `tests/e2e/${lower}.spec.`,
    `tests/e2e/${lower}.test.`,
  ];
}

function buildTopicAliases(folderName, kebab, lower) {
  const capitalLetters = (folderName.match(/[A-Z]/g) || [])
    .join("")
    .toLowerCase();
  const primaryFlag = `--${kebab}`;
  const aliases = new Set([
    folderName,
    lower,
    kebab,
    primaryFlag,
    `--${lower}`,
  ]);

  if (capitalLetters.length > 1) {
    aliases.add(capitalLetters);
    aliases.add(`--${capitalLetters}`);
  }

  if (folderName === "TuringMachine") {
    aliases.add("turing");
    aliases.add("--turing");
  }

  return { primaryFlag, aliases: Array.from(aliases) };
}

function registerTopicEntry(topics, folderName, categoryLabel, parentDir) {
  const relPath = `${parentDir}/${folderName}/`;
  const kebab = folderName.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  const lower = folderName.toLowerCase();
  const { primaryFlag, aliases } = buildTopicAliases(folderName, kebab, lower);
  const pathPrefixes = buildTopicPathPrefixes(
    folderName,
    categoryLabel,
    relPath,
  );

  topics.set(lower, {
    id: lower,
    displayName: `${categoryLabel} / ${folderName}`,
    shortName: folderName,
    primaryFlag,
    relPath,
    category: categoryLabel,
    aliases,
    pathPrefixes,
  });
}

function scanFolderForTopics(parentDir, categoryLabel, topics) {
  const fullParent = path.join(appRoot, parentDir);
  if (!fs.existsSync(fullParent)) return;

  const entries = fs.readdirSync(fullParent, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      registerTopicEntry(topics, entry.name, categoryLabel, parentDir);
    }
  }
}

/**
 * Discover all topics in FundamentalsCS and Programming1, plus shared components,
 * and build comprehensive path prefixes including source code, unit tests, and e2e tests.
 */
function discoverTopics() {
  const topics = new Map();

  scanFolderForTopics("src/pages/FundamentalsCS", "FundamentalsCS", topics);
  scanFolderForTopics("src/pages/Programming1", "Programming1", topics);

  // Shared components & shared tests
  topics.set("shared", {
    id: "shared",
    displayName: "Shared Components (src/components/shared)",
    shortName: "Shared Components",
    primaryFlag: "--shared",
    relPath: "src/components/shared/",
    category: "Components",
    aliases: ["shared", "components-shared", "--shared", "-s"],
    pathPrefixes: [
      "src/components/shared/",
      "tests/unit_tests/shared/",
      "tests/e2e/specs/shared/",
      "tests/e2e/shared.spec.",
      "tests/e2e/shared.test.",
      "tests/unit_tests/shared.spec.",
      "tests/unit_tests/shared.test.",
    ],
  });

  return topics;
}

const discoveredTopics = discoverTopics();

function matchTopicKey(meta, key, trimmed) {
  if (key === trimmed || meta.shortName.toLowerCase() === trimmed) return true;
  return meta.aliases.some(
    (a) => a.replace(/^--/, "").toLowerCase() === trimmed,
  );
}

function findMatchingTopicKey(trimmed) {
  for (const [key, meta] of discoveredTopics.entries()) {
    if (matchTopicKey(meta, key, trimmed)) return key;
  }
  return null;
}

function resolveSingleTopic(rawName, targetSet, state) {
  const trimmed = rawName.trim().toLowerCase();
  if (trimmed === "rest" || trimmed === "other") {
    state.showRest = true;
    return;
  }
  if (trimmed === "all") {
    state.showAll = true;
    return;
  }

  const matched = findMatchingTopicKey(trimmed);
  if (matched) {
    targetSet.add(matched);
    return;
  }

  console.error(
    `${colors.red}Error: Unknown topic "${rawName}". Use --list to view available topics.${colors.reset}`,
  );
  process.exit(1);
}

function resolveTopicList(rawList, targetSet, state) {
  const topicVals = rawList.split(",");
  for (const t of topicVals) {
    resolveSingleTopic(t, targetSet, state);
  }
}

const FLAG_HANDLERS = {
  "--help": () => {
    printHelp();
    process.exit(0);
  },
  "-h": () => {
    printHelp();
    process.exit(0);
  },
  "--list": (s) => {
    s.listOnly = true;
  },
  "--list-topics": (s) => {
    s.listOnly = true;
  },
  "-l": (s) => {
    s.listOnly = true;
  },
  "--json": (s) => {
    s.jsonOutput = true;
  },
  "--summary": (s) => {
    s.summaryOnly = true;
  },
  "--summary-only": (s) => {
    s.summaryOnly = true;
  },
  "--fail-on-issues": (s) => {
    s.failOnIssues = true;
  },
  "--all": (s) => {
    s.showAll = true;
  },
  "-a": (s) => {
    s.showAll = true;
  },
  "--rest": (s) => {
    s.showRest = true;
  },
  "--other": (s) => {
    s.showRest = true;
  },
  rest: (s) => {
    s.showRest = true;
  },
  other: (s) => {
    s.showRest = true;
  },
  "--dead-code": (s) => {
    s.analysisFilter = "dead-code";
  },
  "--check": (s) => {
    s.analysisFilter = "dead-code";
  },
  "--dupes": (s) => {
    s.analysisFilter = "dupes";
  },
  "--duplicates": (s) => {
    s.analysisFilter = "dupes";
  },
  "--health": (s) => {
    s.analysisFilter = "health";
  },
  "--complexity": (s) => {
    s.analysisFilter = "health";
  },
  "--no-color": () => {},
};

function handleStandardFlag(arg, state) {
  const handler = FLAG_HANDLERS[arg];
  if (!handler) return false;
  handler(state);
  return true;
}

function matchDirectTopicAlias(arg, targetSet) {
  const lowerArg = arg.toLowerCase();
  for (const [key, meta] of discoveredTopics.entries()) {
    if (meta.aliases.includes(arg) || meta.aliases.includes(lowerArg)) {
      targetSet.add(key);
      return true;
    }
  }
  return false;
}

function processTopicArg(arg, i, args, selectedTopicKeys, state) {
  if (arg.startsWith("--topic=")) {
    resolveTopicList(arg.slice("--topic=".length), selectedTopicKeys, state);
    return i;
  }
  if (arg === "--topic" || arg === "-t") {
    const nextArg = args[i + 1];
    if (nextArg) {
      resolveTopicList(nextArg, selectedTopicKeys, state);
      return i + 1;
    }
  }
  return i;
}

function processCustomArg(arg, selectedTopicKeys, state) {
  if (matchDirectTopicAlias(arg, selectedTopicKeys)) return;
  if (!arg.startsWith("-")) {
    resolveSingleTopic(arg, selectedTopicKeys, state);
  } else {
    console.error(
      `${colors.yellow}Warning: Unknown argument "${arg}". Run with --help for options.${colors.reset}`,
    );
  }
}

/**
 * Parse CLI arguments into filter options.
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const selectedTopicKeys = new Set();
  const state = {
    showRest: false,
    showAll: false,
    listOnly: false,
    jsonOutput: false,
    summaryOnly: false,
    failOnIssues: false,
    analysisFilter: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (handleStandardFlag(arg, state)) continue;

    const nextI = processTopicArg(arg, i, args, selectedTopicKeys, state);
    if (nextI !== i) {
      i = nextI;
      continue;
    }

    processCustomArg(arg, selectedTopicKeys, state);
  }

  return {
    selectedTopicKeys: Array.from(selectedTopicKeys),
    showRest: state.showRest,
    showAll: state.showAll,
    listOnly: state.listOnly,
    jsonOutput: state.jsonOutput,
    summaryOnly: state.summaryOnly,
    failOnIssues: state.failOnIssues,
    analysisFilter: state.analysisFilter,
  };
}

function printHelp() {
  console.log(`
${colors.bold}${colors.cyan}Fallow Topic Filter CLI${colors.reset}
Filter and inspect fallow analysis findings by topic, shared components, or rest of the project.
(Findings automatically include topic source code, unit tests, and e2e test cases).

${colors.bold}USAGE:${colors.reset}
  node scripts/fallow-filter.mjs [TOPIC_FLAGS] [OPTIONS]
  npm run fallow:filter -- [TOPIC_FLAGS] [OPTIONS]

${colors.bold}TOPIC FLAGS (includes source + test files):${colors.reset}
  ${colors.green}--turing-machine, --turing, --tm${colors.reset}    FundamentalsCS / TuringMachine
  ${colors.green}--dnf${colors.reset}                              FundamentalsCS / Dnf
  ${colors.green}--encoding${colors.reset}                         FundamentalsCS / Encoding
  ${colors.green}--finite-automata, --fa${colors.reset}            FundamentalsCS / FiniteAutomata
  ${colors.green}--moore-mealy, --mm${colors.reset}                FundamentalsCS / MooreMealy
  ${colors.green}--number-systems, --ns${colors.reset}             FundamentalsCS / NumberSystems
  ${colors.green}--regular-languages, --rl${colors.reset}          FundamentalsCS / RegularLanguages
  ${colors.green}--java${colors.reset}                             Programming1 / Java
  ${colors.green}--shared${colors.reset}                           Shared Components (src/components/shared & tests/unit_tests/shared)
  ${colors.green}--rest, --other${colors.reset}                    Rest of the site (everything not in a topic or shared)
  ${colors.green}--all, -a${colors.reset}                          All findings across the entire codebase

${colors.bold}GENERIC TOPIC SELECTION:${colors.reset}
  ${colors.green}-t, --topic <name,...>${colors.reset}             Select topic by name (e.g. -t TuringMachine,shared)

${colors.bold}ANALYSIS TYPE FILTERS:${colors.reset}
  ${colors.yellow}--dead-code, --check${colors.reset}              Only show unused files, exports, types, cycles, etc.
  ${colors.yellow}--dupes, --duplicates${colors.reset}             Only show duplicate code clones
  ${colors.yellow}--health, --complexity${colors.reset}            Only show cognitive/cyclomatic complexity & hotspots

${colors.bold}OUTPUT & CONTROL OPTIONS:${colors.reset}
  ${colors.cyan}-l, --list, --list-topics${colors.reset}          List all topics with finding counts
  ${colors.cyan}-s, --summary${colors.reset}                      Show only the summary counts for the selected scope
  ${colors.cyan}--json${colors.reset}                             Output raw filtered findings in JSON format
  ${colors.cyan}--fail-on-issues${colors.reset}                    Exit with code 1 if issues are found
  ${colors.cyan}--no-color${colors.reset}                          Disable colored terminal output
  ${colors.cyan}-h, --help${colors.reset}                         Show this help message

${colors.bold}EXAMPLES:${colors.reset}
  # Inspect Turing Machine findings (source + tests):
  node scripts/fallow-filter.mjs --turing-machine

  # Inspect shared components:
  node scripts/fallow-filter.mjs --shared

  # Inspect both Turing Machine and Shared:
  node scripts/fallow-filter.mjs --tm --shared

  # Inspect the rest of the project:
  node scripts/fallow-filter.mjs --rest

  # Show overview table of all topics:
  node scripts/fallow-filter.mjs --list
`);
}

function resolveFallowCommand() {
  const nodeBinDir = path.dirname(process.execPath);
  const npxCli =
    process.platform === "win32"
      ? path.join(nodeBinDir, "node_modules", "npm", "bin", "npx-cli.js")
      : null;

  if (npxCli) {
    return { cmd: process.execPath, args: [npxCli, "fallow", "-f", "json"] };
  }
  return {
    cmd: process.platform === "win32" ? "npx.cmd" : "npx",
    args: ["fallow", "-f", "json"],
  };
}

function parseFallowJsonOutput(rawOut, stderr) {
  const jsonStart = rawOut.indexOf("{");
  if (jsonStart === -1) {
    console.error(
      `${colors.red}Fallow did not produce JSON output.${colors.reset}`,
    );
    if (stderr) console.error(stderr);
    process.exit(1);
  }

  try {
    return JSON.parse(rawOut.slice(jsonStart));
  } catch (err) {
    console.error(
      `${colors.red}Failed to parse fallow JSON output: ${err.message}${colors.reset}`,
    );
    process.exit(1);
  }
}

/**
 * Execute fallow and parse JSON report safely across OS platforms without shell deprecation warnings.
 */
function runFallowJson() {
  const { cmd, args } = resolveFallowCommand();
  const result = spawnSync(cmd, args, {
    cwd: appRoot,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    shell: false,
  });

  if (result.error) {
    console.error(
      `${colors.red}Failed to execute fallow: ${result.error.message}${colors.reset}`,
    );
    process.exit(1);
  }

  return parseFallowJsonOutput(result.stdout || "", result.stderr);
}

function isTopicPrefixMatch(norm, meta) {
  return meta.pathPrefixes.some((prefix) =>
    norm.startsWith(prefix.toLowerCase()),
  );
}

function matchesAnyDiscoveredTopic(filePath) {
  for (const meta of discoveredTopics.values()) {
    if (testPathScope(filePath, meta.id)) return true;
  }
  return false;
}

/**
 * Check if a file path belongs to a specific topic, shared, or rest.
 */
function testPathScope(filePath, topicKey) {
  const norm = normalizePath(filePath).toLowerCase();
  if (!norm) return false;

  if (topicKey === "all") return true;
  if (topicKey === "rest") return !matchesAnyDiscoveredTopic(filePath);

  const topicMeta = discoveredTopics.get(topicKey);
  if (!topicMeta) return false;

  return isTopicPrefixMatch(norm, topicMeta);
}

function isIgnoredScriptFile(p) {
  const norm = normalizePath(p).toLowerCase();
  return norm.endsWith("scripts/fallow-filter.mjs");
}

function isPathMatching(p, filterKeys, showRest) {
  if (!p || isIgnoredScriptFile(p)) return false;
  if (showRest && testPathScope(p, "rest")) return true;
  return filterKeys.some((key) => testPathScope(p, key));
}

/**
 * Match a finding against active topic filters.
 */
function matchesFilters(paths, filterKeys, showRest, showAll) {
  const list = Array.isArray(paths) ? paths : [paths];
  if (showAll) {
    return list.some((p) => p && !isIgnoredScriptFile(p));
  }
  return list.some((p) => isPathMatching(p, filterKeys, showRest));
}

function getCircularFiles(item) {
  if (item.files) return item.files;
  if (item.edges) return item.edges.map((e) => e.path);
  return [];
}

function filterCheckItem(item, category, options) {
  const { selectedTopicKeys, showRest, showAll } = options;
  if (category === "circular_dependencies") {
    return matchesFilters(
      getCircularFiles(item),
      selectedTopicKeys,
      showRest,
      showAll,
    );
  }
  if (item.path) {
    return matchesFilters(item.path, selectedTopicKeys, showRest, showAll);
  }
  return Boolean(item.package_name && (showAll || showRest));
}

function filterCheckSection(check, options) {
  if (!check) return {};
  const result = {};
  for (const [category, items] of Object.entries(check)) {
    if (!Array.isArray(items)) continue;
    const filtered = items.filter((item) =>
      filterCheckItem(item, category, options),
    );
    if (filtered.length > 0) {
      result[category] = filtered;
    }
  }
  return result;
}

function filterCloneGroupList(cloneGroups, options) {
  return cloneGroups.filter((cg) => {
    const files = (cg.instances || []).map((inst) => inst.file);
    return matchesFilters(
      files,
      options.selectedTopicKeys,
      options.showRest,
      options.showAll,
    );
  });
}

function filterDupesSection(dupes, options) {
  if (!dupes?.clone_groups) return { clone_groups: [] };
  return { clone_groups: filterCloneGroupList(dupes.clone_groups, options) };
}

function filterArrayByPath(arr, options) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((item) =>
    matchesFilters(
      item.path,
      options.selectedTopicKeys,
      options.showRest,
      options.showAll,
    ),
  );
}

function filterHealthSection(health, options) {
  if (!health) return { findings: [], targets: [], large_functions: [] };
  return {
    findings: filterArrayByPath(health.findings, options),
    targets: filterArrayByPath(health.targets, options),
    large_functions: filterArrayByPath(health.large_functions, options),
  };
}

/**
 * Filter fallow data according to options.
 */
function filterReport(fallowData, options) {
  const filter = options.analysisFilter;
  const includeCheck = !filter || filter === "dead-code";
  const includeDupes = !filter || filter === "dupes";
  const includeHealth = !filter || filter === "health";

  return {
    kind: fallowData.kind,
    version: fallowData.version,
    check: includeCheck ? filterCheckSection(fallowData.check, options) : {},
    dupes: includeDupes
      ? filterDupesSection(fallowData.dupes, options)
      : { clone_groups: [] },
    health: includeHealth
      ? filterHealthSection(fallowData.health, options)
      : { findings: [], targets: [], large_functions: [] },
  };
}

function safeArrayLength(arr) {
  return Array.isArray(arr) ? arr.length : 0;
}

function countCheckFindings(check) {
  if (!check) return 0;
  let count = 0;
  for (const items of Object.values(check)) {
    count += safeArrayLength(items);
  }
  return count;
}

/**
 * Count total findings in a filtered report.
 */
function countFindings(report) {
  const checkCount = countCheckFindings(report?.check);
  const dupesCount = safeArrayLength(report?.dupes?.clone_groups);
  const healthFindings = safeArrayLength(report?.health?.findings);
  const healthTargets = safeArrayLength(report?.health?.targets);
  const healthCount = healthFindings + healthTargets;
  const largeFuncCount = safeArrayLength(report?.health?.large_functions);

  return {
    checkCount,
    dupesCount,
    healthCount,
    largeFuncCount,
    total: checkCount + dupesCount + healthCount,
  };
}

/**
 * Format category names nicely.
 */
function formatCategoryName(cat) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function createScopeReport(fallowData, keys, showRest, showAll) {
  return filterReport(fallowData, {
    selectedTopicKeys: keys,
    showRest,
    showAll,
    analysisFilter: null,
  });
}

function buildTopicRows(fallowData) {
  const rows = [];
  for (const [key, meta] of discoveredTopics.entries()) {
    const counts = countFindings(
      createScopeReport(fallowData, [key], false, false),
    );
    rows.push({
      topic: meta.displayName,
      flag: meta.primaryFlag,
      deadCode: counts.checkCount,
      dupes: counts.dupesCount,
      health: counts.healthCount,
      total: counts.total,
    });
  }

  const restCounts = countFindings(
    createScopeReport(fallowData, [], true, false),
  );
  rows.push({
    topic: "Rest of site (non-topic & non-shared)",
    flag: "--rest",
    deadCode: restCounts.checkCount,
    dupes: restCounts.dupesCount,
    health: restCounts.healthCount,
    total: restCounts.total,
  });

  return rows;
}

function getRowTotalColor(total) {
  if (total <= 0) return colors.green;
  return total > 15 ? colors.red : colors.yellow;
}

function printTopicTableRow(row) {
  const totalColor = getRowTotalColor(row.total);
  console.log(
    `${row.topic.padEnd(45)} ${colors.cyan}${row.flag.padEnd(20)}${colors.reset} ${String(row.deadCode).padStart(9)} ${String(row.dupes).padStart(7)} ${String(row.health).padStart(8)} ${totalColor}${String(row.total).padStart(8)}${colors.reset}`,
  );
}

/**
 * Print topic list with finding counts.
 */
function printTopicList(fallowData) {
  console.log(
    `\n${colors.bold}${colors.cyan}=== Available Topics & Fallow Finding Counts ===${colors.reset}\n`,
  );
  console.log(
    `${colors.bold}${"Topic / Area".padEnd(45)} ${"CLI Flag".padEnd(20)} ${"DeadCode".padStart(9)} ${"Dupes".padStart(7)} ${"Health".padStart(8)} ${"Total".padStart(8)}${colors.reset}`,
  );
  console.log("-".repeat(101));

  const rows = buildTopicRows(fallowData);
  for (const row of rows) {
    printTopicTableRow(row);
  }

  const allCounts = countFindings(
    createScopeReport(fallowData, [], false, true),
  );
  console.log("-".repeat(101));
  console.log(
    `${colors.bold}${"ALL (Entire Codebase)".padEnd(45)} ${"--all".padEnd(20)} ${String(allCounts.checkCount).padStart(9)} ${String(allCounts.dupesCount).padStart(7)} ${String(allCounts.healthCount).padStart(8)} ${String(allCounts.total).padStart(8)}${colors.reset}\n`,
  );
}

function getActiveLabels(options) {
  if (options.showAll) return ["All Codebase"];
  const labels = [];
  for (const k of options.selectedTopicKeys) {
    const meta = discoveredTopics.get(k);
    if (meta) labels.push(meta.displayName);
  }
  if (options.showRest) {
    labels.push("Rest of Site (Non-topic & non-shared)");
  }
  return labels;
}

function renderReportHeader(options, counts) {
  const activeLabels = getActiveLabels(options);
  const totalIssuesStr =
    counts.total > 0 ? colors.yellow + counts.total : colors.green + "0";

  console.log(
    `\n${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`,
  );
  console.log(
    `${colors.bold} Fallow Filter Report:${colors.reset} ${colors.green}${activeLabels.join(", ") || "None selected"}${colors.reset}`,
  );
  if (options.analysisFilter) {
    console.log(
      ` ${colors.bold}Filter Type:${colors.reset} ${colors.yellow}${options.analysisFilter}${colors.reset}`,
    );
  }
  console.log(
    ` ${colors.bold}Total Issues:${colors.reset} ${totalIssuesStr} ${colors.dim}(Dead Code: ${counts.checkCount}, Duplication: ${counts.dupesCount}, Health: ${counts.healthCount})${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`,
  );
}

function renderCircularCycleItem(item, options) {
  const cycleFiles = getCircularFiles(item);
  const cycleLen = item.length || cycleFiles.length;
  console.log(
    `   ${colors.red}• Circular Dependency Cycle (${cycleLen} files):${colors.reset}`,
  );
  for (const f of cycleFiles) {
    const isMatch = matchesFilters(
      f,
      options.selectedTopicKeys,
      options.showRest,
      options.showAll,
    );
    const marker = isMatch
      ? `${colors.bold}${colors.cyan}➔${colors.reset} `
      : `  `;
    const fileLink = formatFileLink(f);
    console.log(
      `     ${marker}${isMatch ? colors.bold : colors.dim}${fileLink}${colors.reset}`,
    );
  }
}

function renderStandardCheckItem(item) {
  const targetPath = item.path || item.package_name || "project";
  const targetLink = formatFileLink(targetPath, item.line, item.col);
  const symbol = item.export_name
    ? ` -> ${colors.cyan}${item.export_name}${colors.reset}`
    : "";

  console.log(
    `   ${colors.yellow}•${colors.reset} ${colors.bold}${targetLink}${colors.reset}${symbol}`,
  );

  const actionDesc = item.actions?.[0]?.description;
  if (actionDesc) {
    console.log(`     ${colors.dim}Fix: ${actionDesc}${colors.reset}`);
  }
}

function renderCheckCategoryItems(category, items, options) {
  console.log(
    `\n ${colors.bold}${colors.magenta}[${formatCategoryName(category)}]${colors.reset} (${items.length})`,
  );

  for (const item of items) {
    if (category === "circular_dependencies") {
      renderCircularCycleItem(item, options);
    } else {
      renderStandardCheckItem(item);
    }
  }
}

function renderCheckSection(check, checkCount, options) {
  if (Object.keys(check).length === 0) return;

  console.log(
    `${colors.bold}${colors.yellow}▶ DEAD CODE & HYGIENE ISSUES (${checkCount})${colors.reset}`,
  );
  console.log(
    `${colors.gray}────────────────────────────────────────────────────────────────────────${colors.reset}`,
  );

  for (const [category, items] of Object.entries(check)) {
    renderCheckCategoryItems(category, items, options);
  }
  console.log();
}

function formatLineSpan(startLine, endLine) {
  if (endLine && endLine !== startLine) {
    return ` ${colors.dim}(lines ${startLine}–${endLine})${colors.reset}`;
  }
  return "";
}

function renderCloneInstance(inst, options) {
  const isMatch = matchesFilters(
    inst.file,
    options.selectedTopicKeys,
    options.showRest,
    options.showAll,
  );
  const marker = isMatch
    ? `${colors.bold}${colors.cyan}➔${colors.reset} `
    : `  `;
  const instLink = formatFileLink(inst.file, inst.start_line);
  const lineSpan = formatLineSpan(inst.start_line, inst.end_line);

  console.log(
    `     ${marker}${isMatch ? colors.bold : colors.dim}${instLink}${colors.reset}${lineSpan}`,
  );
}

function renderCloneGroup(cg, idx, options) {
  const instanceCount = safeArrayLength(cg.instances);
  console.log(
    `\n   ${colors.bold}Clone #${idx + 1}:${colors.reset} ${colors.yellow}${cg.line_count} lines, ${cg.token_count} tokens${colors.reset} across ${instanceCount} locations:`,
  );

  for (const inst of cg.instances || []) {
    renderCloneInstance(inst, options);
  }

  const rec = cg.actions?.[0]?.description;
  if (rec) {
    console.log(`     ${colors.dim}Recommendation: ${rec}${colors.reset}`);
  }
}

function renderDupesSection(dupes, options) {
  if (!dupes?.clone_groups || dupes.clone_groups.length === 0) return;

  console.log(
    `${colors.bold}${colors.yellow}▶ CODE DUPLICATION CLONES (${dupes.clone_groups.length})${colors.reset}`,
  );
  console.log(
    `${colors.gray}────────────────────────────────────────────────────────────────────────${colors.reset}`,
  );

  for (let idx = 0; idx < dupes.clone_groups.length; idx++) {
    renderCloneGroup(dupes.clone_groups[idx], idx, options);
  }
  console.log();
}

function getSeverityColor(sev) {
  return sev === "critical" ? colors.red : colors.yellow;
}

function formatHealthMetrics(f) {
  const cog = fallback(f.cognitive, "?");
  const cyc = fallback(f.cyclomatic, "?");
  const crap = fallback(f.crap, "?");
  const lines = fallback(f.line_count, "?");
  return `Cognitive Complexity: ${cog}, Cyclomatic: ${cyc}, CRAP: ${crap}, Lines: ${lines}`;
}

function renderHealthFindingItem(f) {
  const sevColor = getSeverityColor(f.severity);
  const sevLabel = String(fallback(f.severity, "warning")).toUpperCase();
  const lineNum = fallback(f.line, 1);
  const healthLink = formatFileLink(f.path, lineNum);
  const funcName = fallback(f.name, "anonymous");

  console.log(
    `\n   ${sevColor}[${sevLabel}]${colors.reset} ${colors.bold}${healthLink}${colors.reset} in ${colors.cyan}${funcName}${colors.reset}`,
  );
  console.log(`     ${colors.dim}${formatHealthMetrics(f)}${colors.reset}`);

  const actionDesc = f.actions?.[0]?.description;
  if (actionDesc) {
    console.log(`     ${colors.dim}Action: ${actionDesc}${colors.reset}`);
  }
}

function renderTargetItem(t) {
  const targetLink = formatFileLink(t.path);
  console.log(
    `\n   ${colors.magenta}[REFACTOR TARGET]${colors.reset} ${colors.bold}${targetLink}${colors.reset} (Priority: ${t.priority}, Efficiency: ${t.efficiency})`,
  );
  if (t.recommendation) {
    console.log(
      `     ${colors.dim}Recommendation: ${t.recommendation}${colors.reset}`,
    );
  }
}

function renderHealthSection(health) {
  const healthFindings = health?.findings || [];
  const targets = health?.targets || [];
  const totalHealth = healthFindings.length + targets.length;

  if (totalHealth === 0) return;

  console.log(
    `${colors.bold}${colors.yellow}▶ CODE HEALTH & COMPLEXITY FINDINGS (${totalHealth})${colors.reset}`,
  );
  console.log(
    `${colors.gray}────────────────────────────────────────────────────────────────────────${colors.reset}`,
  );

  for (const f of healthFindings) {
    renderHealthFindingItem(f);
  }

  for (const t of targets) {
    renderTargetItem(t);
  }
  console.log();
}

/**
 * Render human readable filtered findings to console.
 */
function renderFilteredReport(report, options) {
  const counts = countFindings(report);

  renderReportHeader(options, counts);

  if (counts.total === 0 && counts.largeFuncCount === 0) {
    console.log(
      `${colors.green}✔ No fallow issues found for the selected scope!${colors.reset}\n`,
    );
    return;
  }

  renderCheckSection(report.check, counts.checkCount, options);
  renderDupesSection(report.dupes, options);
  renderHealthSection(report.health);
}

function handleOutputMode(options, fallowData, filtered) {
  if (options.listOnly) {
    printTopicList(fallowData);
    process.exit(0);
  }

  if (options.jsonOutput) {
    console.log(JSON.stringify(filtered, null, 2));
    process.exit(0);
  }
}

/**
 * Main function
 */
function main() {
  const options = parseArgs();
  const fallowData = runFallowJson();
  const filtered = filterReport(fallowData, options);

  handleOutputMode(options, fallowData, filtered);
  renderFilteredReport(filtered, options);

  const counts = countFindings(filtered);
  if (options.failOnIssues && counts.total > 0) {
    process.exit(1);
  }
}

main();
