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

/**
 * Discover all topics in FundamentalsCS and Programming1, plus shared components,
 * and build comprehensive path prefixes including source code, unit tests, and e2e tests.
 */
function discoverTopics() {
  const topics = new Map();

  function scanFolder(parentDir, categoryLabel) {
    const fullParent = path.join(appRoot, parentDir);
    if (!fs.existsSync(fullParent)) return;

    const entries = fs.readdirSync(fullParent, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const folderName = entry.name;
        const relPath = `${parentDir}/${folderName}/`;
        const kebab = folderName
          .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
          .toLowerCase();
        const lower = folderName.toLowerCase();
        const capitalLetters =
          folderName.match(/[A-Z]/g)?.join("").toLowerCase() || "";

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

        // Custom well-known shorthands
        if (folderName === "TuringMachine") {
          aliases.add("turing");
          aliases.add("--turing");
        }

        const catLower = categoryLabel.toLowerCase();
        const pathPrefixes = [
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
          `tests/unit_tests/${folderName.toLowerCase()}/`,

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
          `tests/e2e/${folderName.toLowerCase()}.spec.`,
          `tests/e2e/${folderName.toLowerCase()}.test.`,
        ];

        topics.set(folderName.toLowerCase(), {
          id: folderName.toLowerCase(),
          displayName: `${categoryLabel} / ${folderName}`,
          shortName: folderName,
          primaryFlag,
          relPath,
          category: categoryLabel,
          aliases: Array.from(aliases),
          pathPrefixes,
        });
      }
    }
  }

  scanFolder("src/pages/FundamentalsCS", "FundamentalsCS");
  scanFolder("src/pages/Programming1", "Programming1");

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

/**
 * Parse CLI arguments into filter options.
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const selectedTopicKeys = new Set();
  let showRest = false;
  let showAll = false;
  let listOnly = false;
  let jsonOutput = false;
  let summaryOnly = false;
  let failOnIssues = false;
  let analysisFilter = null; // 'dead-code' | 'dupes' | 'health' | null (all)

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--list" || arg === "--list-topics" || arg === "-l") {
      listOnly = true;
      continue;
    }

    if (arg === "--json") {
      jsonOutput = true;
      continue;
    }

    if (arg === "--summary" || arg === "--summary-only") {
      summaryOnly = true;
      continue;
    }

    if (arg === "--fail-on-issues") {
      failOnIssues = true;
      continue;
    }

    if (arg === "--all" || arg === "-a") {
      showAll = true;
      continue;
    }

    if (
      arg === "--rest" ||
      arg === "--other" ||
      arg === "rest" ||
      arg === "other"
    ) {
      showRest = true;
      continue;
    }

    if (arg === "--dead-code" || arg === "--check") {
      analysisFilter = "dead-code";
      continue;
    }

    if (arg === "--dupes" || arg === "--duplicates") {
      analysisFilter = "dupes";
      continue;
    }

    if (arg === "--health" || arg === "--complexity") {
      analysisFilter = "health";
      continue;
    }

    if (arg === "--no-color") {
      continue;
    }

    if (arg.startsWith("--topic=")) {
      const topicVals = arg.slice("--topic=".length).split(",");
      for (const t of topicVals) resolveTopicArg(t, selectedTopicKeys);
      continue;
    }

    if (arg === "--topic" || arg === "-t") {
      const nextArg = args[++i];
      if (nextArg) {
        const topicVals = nextArg.split(",");
        for (const t of topicVals) resolveTopicArg(t, selectedTopicKeys);
      }
      continue;
    }

    // Direct flag matching (e.g. --turing-machine, --tm, --shared, --java)
    let matched = false;
    for (const [key, meta] of discoveredTopics.entries()) {
      if (
        meta.aliases.includes(arg) ||
        meta.aliases.includes(arg.toLowerCase())
      ) {
        selectedTopicKeys.add(key);
        matched = true;
        break;
      }
    }

    if (!matched) {
      if (!arg.startsWith("-")) {
        resolveTopicArg(arg, selectedTopicKeys);
      } else {
        console.error(
          `${colors.yellow}Warning: Unknown argument "${arg}". Run with --help for options.${colors.reset}`,
        );
      }
    }
  }

  function resolveTopicArg(rawName, targetSet) {
    const trimmed = rawName.trim().toLowerCase();
    if (trimmed === "rest" || trimmed === "other") {
      showRest = true;
      return;
    }
    if (trimmed === "all") {
      showAll = true;
      return;
    }

    let found = false;
    for (const [key, meta] of discoveredTopics.entries()) {
      if (
        key === trimmed ||
        meta.shortName.toLowerCase() === trimmed ||
        meta.aliases.some((a) => a.replace(/^--/, "").toLowerCase() === trimmed)
      ) {
        targetSet.add(key);
        found = true;
        break;
      }
    }

    if (!found) {
      console.error(
        `${colors.red}Error: Unknown topic "${rawName}". Use --list to view available topics.${colors.reset}`,
      );
      process.exit(1);
    }
  }

  return {
    selectedTopicKeys: Array.from(selectedTopicKeys),
    showRest,
    showAll,
    listOnly,
    jsonOutput,
    summaryOnly,
    failOnIssues,
    analysisFilter,
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

/**
 * Execute fallow and parse JSON report safely across OS platforms without shell deprecation warnings.
 */
function runFallowJson() {
  const nodeBinDir = path.dirname(process.execPath);
  const npxCli =
    process.platform === "win32"
      ? path.join(nodeBinDir, "node_modules", "npm", "bin", "npx-cli.js")
      : null;

  const cmd =
    process.platform === "win32" && !npxCli
      ? "npx.cmd"
      : npxCli
        ? process.execPath
        : "npx";
  const args = npxCli
    ? [npxCli, "fallow", "-f", "json"]
    : ["fallow", "-f", "json"];

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

  const rawOut = result.stdout || "";
  const jsonStart = rawOut.indexOf("{");
  if (jsonStart === -1) {
    console.error(
      `${colors.red}Fallow did not produce JSON output.${colors.reset}`,
    );
    if (result.stderr) console.error(result.stderr);
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
 * Check if a file path belongs to a specific topic, shared, or rest.
 */
function testPathScope(filePath, topicKey) {
  const norm = normalizePath(filePath).toLowerCase();
  if (!norm) return false;

  if (topicKey === "all") return true;

  if (topicKey === "rest") {
    // True if path is NOT in any discovered topic (including shared)
    for (const meta of discoveredTopics.values()) {
      if (testPathScope(filePath, meta.id)) {
        return false;
      }
    }
    return true;
  }

  const topicMeta = discoveredTopics.get(topicKey);
  if (!topicMeta) return false;

  return topicMeta.pathPrefixes.some((prefix) =>
    norm.startsWith(prefix.toLowerCase()),
  );
}

/**
 * Match a finding against active topic filters.
 */
function matchesFilters(paths, filterKeys, showRest, showAll) {
  if (showAll) return true;
  const list = Array.isArray(paths) ? paths : [paths];

  for (const p of list) {
    if (!p) continue;
    if (showRest && testPathScope(p, "rest")) return true;
    for (const key of filterKeys) {
      if (testPathScope(p, key)) return true;
    }
  }
  return false;
}

/**
 * Filter fallow data according to options.
 */
function filterReport(fallowData, options) {
  const { selectedTopicKeys, showRest, showAll, analysisFilter } = options;

  const filtered = {
    kind: fallowData.kind,
    version: fallowData.version,
    check: {},
    dupes: { clone_groups: [] },
    health: { findings: [], targets: [], large_functions: [] },
  };

  const includeCheck = !analysisFilter || analysisFilter === "dead-code";
  const includeDupes = !analysisFilter || analysisFilter === "dupes";
  const includeHealth = !analysisFilter || analysisFilter === "health";

  // Filter check
  if (includeCheck && fallowData.check) {
    for (const [category, items] of Object.entries(fallowData.check)) {
      if (!Array.isArray(items)) continue;

      const filteredItems = items.filter((item) => {
        if (category === "circular_dependencies") {
          const files =
            item.files || (item.edges ? item.edges.map((e) => e.path) : []);
          return matchesFilters(files, selectedTopicKeys, showRest, showAll);
        }
        if (item.path) {
          return matchesFilters(
            item.path,
            selectedTopicKeys,
            showRest,
            showAll,
          );
        }
        // Package-level findings (unused dependencies, etc.)
        if (item.package_name) {
          return showAll || showRest;
        }
        return false;
      });

      if (filteredItems.length > 0) {
        filtered.check[category] = filteredItems;
      }
    }
  }

  // Filter dupes
  if (includeDupes && fallowData.dupes?.clone_groups) {
    filtered.dupes.clone_groups = fallowData.dupes.clone_groups.filter((cg) => {
      const files = (cg.instances || []).map((inst) => inst.file);
      return matchesFilters(files, selectedTopicKeys, showRest, showAll);
    });
  }

  // Filter health
  if (includeHealth && fallowData.health) {
    if (Array.isArray(fallowData.health.findings)) {
      filtered.health.findings = fallowData.health.findings.filter((f) =>
        matchesFilters(f.path, selectedTopicKeys, showRest, showAll),
      );
    }
    if (Array.isArray(fallowData.health.targets)) {
      filtered.health.targets = fallowData.health.targets.filter((t) =>
        matchesFilters(t.path, selectedTopicKeys, showRest, showAll),
      );
    }
    if (Array.isArray(fallowData.health.large_functions)) {
      filtered.health.large_functions =
        fallowData.health.large_functions.filter((lf) =>
          matchesFilters(lf.path, selectedTopicKeys, showRest, showAll),
        );
    }
  }

  return filtered;
}

/**
 * Count total findings in a filtered report.
 */
function countFindings(report) {
  let checkCount = 0;
  for (const items of Object.values(report.check || {})) {
    if (Array.isArray(items)) checkCount += items.length;
  }
  const dupesCount = report.dupes?.clone_groups?.length || 0;
  const healthCount =
    (report.health?.findings?.length || 0) +
    (report.health?.targets?.length || 0);
  const largeFuncCount = report.health?.large_functions?.length || 0;

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

/**
 * Print topic list with finding counts.
 */
function printTopicList(fallowData) {
  console.log(
    `\n${colors.bold}${colors.cyan}=== Available Topics & Fallow Finding Counts ===${colors.reset}\n`,
  );

  const rows = [];

  for (const [key, meta] of discoveredTopics.entries()) {
    const report = filterReport(fallowData, {
      selectedTopicKeys: [key],
      showRest: false,
      showAll: false,
      analysisFilter: null,
    });
    const counts = countFindings(report);
    rows.push({
      topic: meta.displayName,
      flag: meta.primaryFlag,
      deadCode: counts.checkCount,
      dupes: counts.dupesCount,
      health: counts.healthCount,
      total: counts.total,
    });
  }

  // Rest
  const restReport = filterReport(fallowData, {
    selectedTopicKeys: [],
    showRest: true,
    showAll: false,
    analysisFilter: null,
  });
  const restCounts = countFindings(restReport);
  rows.push({
    topic: "Rest of site (non-topic & non-shared)",
    flag: "--rest",
    deadCode: restCounts.checkCount,
    dupes: restCounts.dupesCount,
    health: restCounts.healthCount,
    total: restCounts.total,
  });

  // Print table
  console.log(
    `${colors.bold}${"Topic / Area".padEnd(45)} ${"CLI Flag".padEnd(20)} ${"DeadCode".padStart(9)} ${"Dupes".padStart(7)} ${"Health".padStart(8)} ${"Total".padStart(8)}${colors.reset}`,
  );
  console.log("-".repeat(101));

  for (const row of rows) {
    const totalColor =
      row.total > 0
        ? row.total > 15
          ? colors.red
          : colors.yellow
        : colors.green;
    console.log(
      `${row.topic.padEnd(45)} ${colors.cyan}${row.flag.padEnd(20)}${colors.reset} ${String(row.deadCode).padStart(9)} ${String(row.dupes).padStart(7)} ${String(row.health).padStart(8)} ${totalColor}${String(row.total).padStart(8)}${colors.reset}`,
    );
  }

  const allCounts = countFindings(
    filterReport(fallowData, {
      selectedTopicKeys: [],
      showRest: false,
      showAll: true,
      analysisFilter: null,
    }),
  );
  console.log("-".repeat(101));
  console.log(
    `${colors.bold}${"ALL (Entire Codebase)".padEnd(45)} ${"--all".padEnd(20)} ${String(allCounts.checkCount).padStart(9)} ${String(allCounts.dupesCount).padStart(7)} ${String(allCounts.healthCount).padStart(8)} ${String(allCounts.total).padStart(8)}${colors.reset}\n`,
  );
}

/**
 * Render human readable filtered findings to console.
 */
function renderFilteredReport(report, options) {
  const counts = countFindings(report);

  // Header
  const activeLabels = [];
  if (options.showAll) {
    activeLabels.push("All Codebase");
  } else {
    for (const k of options.selectedTopicKeys) {
      const meta = discoveredTopics.get(k);
      if (meta) activeLabels.push(meta.displayName);
    }
    if (options.showRest) {
      activeLabels.push("Rest of Site (Non-topic & non-shared)");
    }
  }

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
    ` ${colors.bold}Total Issues:${colors.reset} ${counts.total > 0 ? colors.yellow + counts.total : colors.green + "0"} ${colors.dim}(Dead Code: ${counts.checkCount}, Duplication: ${counts.dupesCount}, Health: ${counts.healthCount})${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`,
  );

  if (counts.total === 0 && counts.largeFuncCount === 0) {
    console.log(
      `${colors.green}✔ No fallow issues found for the selected scope!${colors.reset}\n`,
    );
    return;
  }

  // 1. Dead Code / Check Findings
  if (Object.keys(report.check).length > 0) {
    console.log(
      `${colors.bold}${colors.yellow}▶ DEAD CODE & HYGIENE ISSUES (${counts.checkCount})${colors.reset}`,
    );
    console.log(
      `${colors.gray}────────────────────────────────────────────────────────────────────────${colors.reset}`,
    );

    for (const [category, items] of Object.entries(report.check)) {
      console.log(
        `\n ${colors.bold}${colors.magenta}[${formatCategoryName(category)}]${colors.reset} (${items.length})`,
      );

      for (const item of items) {
        if (category === "circular_dependencies") {
          console.log(
            `   ${colors.red}• Circular Dependency Cycle (${item.length || item.files?.length} files):${colors.reset}`,
          );
          const cycleFiles =
            item.files || (item.edges ? item.edges.map((e) => e.path) : []);
          for (let i = 0; i < cycleFiles.length; i++) {
            const f = cycleFiles[i];
            const isMatch = matchesFilters(
              f,
              options.selectedTopicKeys,
              options.showRest,
              options.showAll,
            );
            const marker = isMatch
              ? `${colors.bold}${colors.cyan}➔${colors.reset} `
              : `  `;
            console.log(
              `     ${marker}${isMatch ? colors.bold : colors.dim}${f}${colors.reset}`,
            );
          }
          continue;
        }

        const loc = item.line
          ? `:${item.line}${item.col ? `:${item.col}` : ""}`
          : "";
        const targetPath = item.path || item.package_name || "project";
        const symbol = item.export_name
          ? ` -> ${colors.cyan}${item.export_name}${colors.reset}`
          : "";

        console.log(
          `   ${colors.yellow}•${colors.reset} ${colors.bold}${targetPath}${loc}${colors.reset}${symbol}`,
        );

        if (item.actions && item.actions.length > 0) {
          const firstAction = item.actions[0];
          if (firstAction.description) {
            console.log(
              `     ${colors.dim}Fix: ${firstAction.description}${colors.reset}`,
            );
          }
        }
      }
    }
    console.log();
  }

  // 2. Code Duplication
  if (report.dupes?.clone_groups?.length > 0) {
    console.log(
      `${colors.bold}${colors.yellow}▶ CODE DUPLICATION CLONES (${report.dupes.clone_groups.length})${colors.reset}`,
    );
    console.log(
      `${colors.gray}────────────────────────────────────────────────────────────────────────${colors.reset}`,
    );

    for (let idx = 0; idx < report.dupes.clone_groups.length; idx++) {
      const cg = report.dupes.clone_groups[idx];
      console.log(
        `\n   ${colors.bold}Clone #${idx + 1}:${colors.reset} ${colors.yellow}${cg.line_count} lines, ${cg.token_count} tokens${colors.reset} across ${cg.instances?.length || 0} locations:`,
      );

      for (const inst of cg.instances || []) {
        const isMatch = matchesFilters(
          inst.file,
          options.selectedTopicKeys,
          options.showRest,
          options.showAll,
        );
        const marker = isMatch
          ? `${colors.bold}${colors.cyan}➔${colors.reset} `
          : `  `;
        console.log(
          `     ${marker}${isMatch ? colors.bold : colors.dim}${inst.file}:${inst.start_line}-${inst.end_line}${colors.reset}`,
        );
      }

      if (cg.actions && cg.actions[0]?.description) {
        console.log(
          `     ${colors.dim}Recommendation: ${cg.actions[0].description}${colors.reset}`,
        );
      }
    }
    console.log();
  }

  // 3. Health & Complexity
  const healthFindings = report.health?.findings || [];
  const targets = report.health?.targets || [];

  if (healthFindings.length > 0 || targets.length > 0) {
    console.log(
      `${colors.bold}${colors.yellow}▶ CODE HEALTH & COMPLEXITY FINDINGS (${healthFindings.length + targets.length})${colors.reset}`,
    );
    console.log(
      `${colors.gray}────────────────────────────────────────────────────────────────────────${colors.reset}`,
    );

    for (const f of healthFindings) {
      const sevColor = f.severity === "critical" ? colors.red : colors.yellow;
      console.log(
        `\n   ${sevColor}[${(f.severity || "warning").toUpperCase()}]${colors.reset} ${colors.bold}${f.path}:${f.line || 1}${colors.reset} in ${colors.cyan}${f.name || "anonymous"}${colors.reset}`,
      );
      console.log(
        `     ${colors.dim}Cognitive Complexity: ${f.cognitive ?? "?"}, Cyclomatic: ${f.cyclomatic ?? "?"}, CRAP: ${f.crap ?? "?"}, Lines: ${f.line_count ?? "?"}${colors.reset}`,
      );

      if (f.actions && f.actions[0]?.description) {
        console.log(
          `     ${colors.dim}Action: ${f.actions[0].description}${colors.reset}`,
        );
      }
    }

    for (const t of targets) {
      console.log(
        `\n   ${colors.magenta}[REFACTOR TARGET]${colors.reset} ${colors.bold}${t.path}${colors.reset} (Priority: ${t.priority}, Efficiency: ${t.efficiency})`,
      );
      if (t.recommendation) {
        console.log(
          `     ${colors.dim}Recommendation: ${t.recommendation}${colors.reset}`,
        );
      }
    }
    console.log();
  }
}

/**
 * Main function
 */
function main() {
  const options = parseArgs();

  const fallowData = runFallowJson();

  if (options.listOnly) {
    printTopicList(fallowData);
    process.exit(0);
  }

  const filtered = filterReport(fallowData, options);

  if (options.jsonOutput) {
    console.log(JSON.stringify(filtered, null, 2));
    process.exit(0);
  }

  renderFilteredReport(filtered, options);

  const counts = countFindings(filtered);
  if (options.failOnIssues && counts.total > 0) {
    process.exit(1);
  }
}

main();
