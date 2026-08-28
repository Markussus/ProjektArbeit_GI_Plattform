/**
 * Migration & Validation Script for i18n Restructuring
 *
 * Usage:
 *   node scripts/migrate-i18n.mjs --generate-mapping   # Generate/Refresh mapping.json based on rules
 *   node scripts/migrate-i18n.mjs --validate           # Validate mapping consistency without touching code
 *   node scripts/migrate-i18n.mjs --dry-run            # Preview code replacements and verify all keys
 *   node scripts/migrate-i18n.mjs --apply              # Execute migration on JSONs and source code
 *   node scripts/migrate-i18n.mjs --apply --split      # Execute migration, split files & update i18n config
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_DIR = path.resolve(ROOT_DIR, "src");
const TESTS_DIR = path.resolve(ROOT_DIR, "tests");
const I18N_DIR = path.resolve(SRC_DIR, "i18n");
const LOCALES_DIR = path.resolve(I18N_DIR, "locales");
const TYPES_DIR = path.resolve(SRC_DIR, "types");
const MAPPING_FILE = path.resolve(__dirname, "i18n-mapping.json");

// CLI arguments
const args = process.argv.slice(2);
const MODE_GENERATE = args.includes("--generate-mapping");
const MODE_VALIDATE = args.includes("--validate");
const MODE_DRY_RUN = args.includes("--dry-run");
const MODE_APPLY = args.includes("--apply");
const FLAG_SPLIT = args.includes("--split");

// -----------------------------------------------------------------------------
// Helper: Flatten nested JSON into dot-notation paths
// -----------------------------------------------------------------------------
function flattenObject(obj, prefix = "") {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

// -----------------------------------------------------------------------------
// Helper: Unflatten dot-notation paths into nested JSON
// -----------------------------------------------------------------------------
function unflattenObject(flatObj) {
  const result = {};
  for (const [key, value] of Object.entries(flatObj)) {
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part] || typeof current[part] !== "object") {
        current[part] = {};
      }
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

// -----------------------------------------------------------------------------
// Helper: Load JSON file safely
// -----------------------------------------------------------------------------
function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

// -----------------------------------------------------------------------------
// Rule-based Default Mapping Generator
// -----------------------------------------------------------------------------
function computeDefaultNewKey(oldKey) {
  // 1. Common / Shared sections
  if (oldKey.startsWith("common.")) return oldKey;
  if (
    oldKey.startsWith("trainingCenter.") ||
    oldKey.startsWith("app.") ||
    oldKey.startsWith("nav.") ||
    oldKey.startsWith("sidebar.") ||
    oldKey.startsWith("footer.") ||
    oldKey.startsWith("theme.") ||
    oldKey.startsWith("language.") ||
    oldKey.startsWith("tabs.") ||
    oldKey.startsWith("home.") ||
    oldKey.startsWith("legal.") ||
    oldKey.startsWith("documentation.") ||
    oldKey.startsWith("help.") ||
    oldKey.startsWith("info.") ||
    oldKey.startsWith("notFound.") ||
    oldKey.startsWith("modules.") ||
    oldKey.startsWith("exercise.") ||
    oldKey.startsWith("example.") ||
    oldKey.startsWith("difficulty.") ||
    oldKey.startsWith("simulation.")
  ) {
    return `common.${oldKey}`;
  }

  // 2. Shared Simulator validation panel
  if (oldKey.startsWith("simulator.validation.")) {
    return oldKey.replace(
      "simulator.validation.",
      "common.exerciseValidation.",
    );
  }

  // 3. Turing Machine (tm.* -> turing-machine.*)
  if (oldKey.startsWith("tm.")) {
    return oldKey.replace("tm.", "turing-machine.");
  }

  // 4. Finite Automata (automata.*, fa.*, grammar.* -> finite-automata.*)
  if (oldKey.startsWith("automata.")) {
    return oldKey.replace("automata.", "finite-automata.topic.");
  }
  if (oldKey.startsWith("fa.")) {
    return oldKey.replace("fa.", "finite-automata.");
  }
  if (oldKey.startsWith("grammar.")) {
    return oldKey.replace("grammar.", "finite-automata.grammar.");
  }

  // 5. Regular Languages (rl.* -> regular-languages.*)
  if (oldKey.startsWith("rl.")) {
    return oldKey.replace("rl.", "regular-languages.");
  }

  // 6. Number Systems (number.*, simulator.arithmetic.*, simulator.numbers.*, simulator.tabs.*)
  if (oldKey.startsWith("number.")) {
    return oldKey.replace("number.", "number-systems.");
  }
  if (oldKey.startsWith("simulator.arithmetic.")) {
    return oldKey.replace(
      "simulator.arithmetic.",
      "number-systems.simulator.arithmetic.",
    );
  }
  if (oldKey.startsWith("simulator.numbers.")) {
    return oldKey.replace(
      "simulator.numbers.",
      "number-systems.simulator.numbers.",
    );
  }
  if (oldKey.startsWith("simulator.tabs.")) {
    return oldKey.replace("simulator.tabs.", "number-systems.simulator.tabs.");
  }

  // 7. Moore / Mealy (moore.* -> moore-mealy.*)
  if (oldKey.startsWith("moore.")) {
    return oldKey.replace("moore.", "moore-mealy.");
  }

  // 8. DNF (dnf.* -> dnf.*)
  if (oldKey.startsWith("dnf.")) {
    return oldKey;
  }

  // 9. Encoding (encoding.*, simulator.encoding.* -> encoding.*)
  if (oldKey.startsWith("encoding.")) {
    return oldKey;
  }
  if (oldKey.startsWith("simulator.encoding.")) {
    return oldKey.replace("simulator.encoding.", "encoding.simulator.");
  }

  // 10. Java Programming (java.* -> java-programming.*)
  if (oldKey.startsWith("java.")) {
    return oldKey.replace("java.", "java-programming.");
  }

  return `unmapped.${oldKey}`;
}

// -----------------------------------------------------------------------------
// Known Dynamic Template Literal Prefix Mappings
// -----------------------------------------------------------------------------
const TEMPLATE_LITERAL_REPLACEMENTS = [
  { oldPattern: "difficulty.", newPattern: "common.difficulty." },
  { oldPattern: "tabs.", newPattern: "common.tabs." },
  {
    oldPattern: "simulator.encoding.group",
    newPattern: "encoding.simulator.group",
  },
  {
    oldPattern: "simulator.encoding.tabs.",
    newPattern: "encoding.simulator.tabs.",
  },
  {
    oldPattern: "simulator.numbers.unit",
    newPattern: "number-systems.simulator.numbers.unit",
  },
  {
    oldPattern: "simulator.tabs.",
    newPattern: "number-systems.simulator.tabs.",
  },
  {
    oldPattern: "fa.examples.categories.",
    newPattern: "finite-automata.examples.categories.",
  },
  {
    oldPattern: "fa.grammar.format.",
    newPattern: "finite-automata.grammar.format.",
  },
  { oldPattern: "fa.grammar.", newPattern: "finite-automata.grammar." },
  {
    oldPattern: "moore.exercises.validation.errors.",
    newPattern: "moore-mealy.exercises.validation.errors.",
  },
  {
    oldPattern: "moore.sim.validation.",
    newPattern: "moore-mealy.sim.validation.",
  },
  {
    oldPattern: "rl.examples.categories.",
    newPattern: "regular-languages.examples.categories.",
  },
  {
    oldPattern: "rl.exercises.categories.",
    newPattern: "regular-languages.exercises.categories.",
  },
  {
    oldPattern: "java.compilerStatus.",
    newPattern: "java-programming.compilerStatus.",
  },
  {
    oldPattern: "java.compilerStatusText.",
    newPattern: "java-programming.compilerStatusText.",
  },
  {
    oldPattern: "java.commandOverview.status.",
    newPattern: "java-programming.commandOverview.status.",
  },
  {
    oldPattern: "dnf.builder.exercise.simplificationStatus.",
    newPattern: "dnf.builder.exercise.simplificationStatus.",
  },
  {
    oldPattern: "dnf.builder.exercise.dnfStatus.",
    newPattern: "dnf.builder.exercise.dnfStatus.",
  },
  { oldPattern: "dnf.simulator.tabs.", newPattern: "dnf.simulator.tabs." },
  { oldPattern: "dnf.taskGroups.", newPattern: "dnf.taskGroups." },
];

// -----------------------------------------------------------------------------
// Validation Logic
// -----------------------------------------------------------------------------
function validateMapping(mapping, enFlat, deFlat) {
  const errors = [];
  const warnings = [];

  const enKeys = Object.keys(enFlat);
  const deKeys = Object.keys(deFlat);
  const mappingOldKeys = Object.keys(mapping);

  console.log("\n--- Validation Statistics ---");
  console.log(`EN total leaf keys:      ${enKeys.length}`);
  console.log(`DE total leaf keys:      ${deKeys.length}`);
  console.log(`Mapping registered keys: ${mappingOldKeys.length}`);

  // 1. Check if DE and EN have identical key sets
  const enSet = new Set(enKeys);
  const deSet = new Set(deKeys);
  for (const k of enKeys) {
    if (!deSet.has(k))
      warnings.push(`Key exists in EN but missing in DE: "${k}"`);
  }
  for (const k of deKeys) {
    if (!enSet.has(k))
      warnings.push(`Key exists in DE but missing in EN: "${k}"`);
  }

  // 2. Check if all keys exist in mapping
  for (const k of enKeys) {
    if (!mapping[k]) errors.push(`Unmapped EN key: "${k}"`);
  }
  for (const k of deKeys) {
    if (!mapping[k]) errors.push(`Unmapped DE key: "${k}"`);
  }

  // 3. Check for collisions (multiple old keys pointing to same new key)
  const targetMap = new Map();
  for (const [oldK, newK] of Object.entries(mapping)) {
    if (newK.startsWith("unmapped.")) {
      errors.push(`Key marked as unmapped: "${oldK}" -> "${newK}"`);
    }
    if (targetMap.has(newK)) {
      errors.push(
        `Collision! Both "${targetMap.get(newK)}" and "${oldK}" map to "${newK}"`,
      );
    } else {
      targetMap.set(newK, oldK);
    }
  }

  // Output warnings & errors
  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${warnings.length}):`);
    warnings.slice(0, 10).forEach((w) => console.log(`   ${w}`));
    if (warnings.length > 10)
      console.log(`   ... and ${warnings.length - 10} more`);
  }

  if (errors.length > 0) {
    console.error(`\n❌ Validation Failed with ${errors.length} errors:`);
    errors.slice(0, 20).forEach((e) => console.error(`   ${e}`));
    if (errors.length > 20)
      console.error(`   ... and ${errors.length - 20} more`);
    return false;
  }

  console.log(
    "\n✅ Validation passed cleanly! All keys mapped without collisions.",
  );
  return true;
}

// -----------------------------------------------------------------------------
// Source & Test Code Scanner & Replacer
// -----------------------------------------------------------------------------
function getAllCodeFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name !== "node_modules" &&
        entry.name !== ".git" &&
        entry.name !== "dist" &&
        entry.name !== "build"
      ) {
        getAllCodeFiles(fullPath, fileList);
      }
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function processSourceFiles(mapping, isDryRun) {
  // Collect both src and tests files
  const files = [...getAllCodeFiles(SRC_DIR), ...getAllCodeFiles(TESTS_DIR)];
  let totalReplacements = 0;
  const modifiedFiles = [];

  // Build sorted list of search-and-replace tokens (longer keys first to prevent partial substring matches)
  const replacementList = [];

  // 1. Leaf keys
  for (const [oldKey, newKey] of Object.entries(mapping)) {
    if (oldKey === newKey) continue;

    // Normal key: "old.key"
    replacementList.push({
      searchRegex: new RegExp(`(["'\`])${escapeRegExp(oldKey)}\\1`, "g"),
      replacement: `$1${newKey}$1`,
      oldKey,
      newKey,
    });

    // Handle Plural Base Keys (e.g., if oldKey is "literalCount_one", replace base "literalCount" in code)
    if (oldKey.endsWith("_one")) {
      const oldBase = oldKey.slice(0, -4);
      const newBase = newKey.endsWith("_one") ? newKey.slice(0, -4) : newKey;
      if (oldBase !== newBase) {
        replacementList.push({
          searchRegex: new RegExp(`(["'\`])${escapeRegExp(oldBase)}\\1`, "g"),
          replacement: `$1${newBase}$1`,
          oldKey: oldBase,
          newKey: newBase,
        });
      }
    }
  }

  // 2. Template literal prefixes
  for (const { oldPattern, newPattern } of TEMPLATE_LITERAL_REPLACEMENTS) {
    if (oldPattern !== newPattern) {
      replacementList.push({
        searchRegex: new RegExp(`\`${escapeRegExp(oldPattern)}\\$\{`, "g"),
        replacement: `\`${newPattern}\${`,
        oldKey: `\`${oldPattern}\${...}\``,
        newKey: `\`${newPattern}\${...}\``,
      });
    }
  }

  // Sort by oldKey length descending to avoid prefix collision
  replacementList.sort((a, b) => b.oldKey.length - a.oldKey.length);

  for (const filePath of files) {
    // Skip i18n locales definition files
    if (filePath.includes(path.join("i18n", "locales"))) continue;

    const originalContent = fs.readFileSync(filePath, "utf-8");
    let updatedContent = originalContent;
    let fileReplacements = 0;

    for (const item of replacementList) {
      const matches = updatedContent.match(item.searchRegex);
      if (matches) {
        fileReplacements += matches.length;
        updatedContent = updatedContent.replace(
          item.searchRegex,
          item.replacement,
        );
      }
    }

    if (fileReplacements > 0) {
      totalReplacements += fileReplacements;
      const relPath = path.relative(ROOT_DIR, filePath);
      modifiedFiles.push({ path: relPath, count: fileReplacements });

      if (!isDryRun) {
        fs.writeFileSync(filePath, updatedContent, "utf-8");
      }
    }
  }

  console.log(`\n--- Code Transformation Summary ---`);
  console.log(`Files modified:     ${modifiedFiles.length}`);
  console.log(`Total replacements: ${totalReplacements}`);
  if (modifiedFiles.length > 0) {
    console.log("\nSample modified files:");
    modifiedFiles
      .slice(0, 15)
      .forEach((f) => console.log(`  - ${f.path} (${f.count} replacements)`));
    if (modifiedFiles.length > 15)
      console.log(`  ... and ${modifiedFiles.length - 15} more files`);
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// -----------------------------------------------------------------------------
// JSON File Transformer (Single or Split)
// -----------------------------------------------------------------------------
function transformJson(sourceJson, mapping) {
  const flat = flattenObject(sourceJson);
  const newFlat = {};

  for (const [oldKey, value] of Object.entries(flat)) {
    const newKey = mapping[oldKey] || oldKey;
    newFlat[newKey] = value;
  }

  return unflattenObject(newFlat);
}

// Helper to convert hyphenated names to camelCase for variable imports
function toCamelCase(str) {
  return str.replace(/-([a-z0-9])/g, (_, g1) => g1.toUpperCase());
}

// Generates the updated i18n configuration files when splitting
function updateI18nConfigFiles(sections) {
  // 1. Generate src/i18n/index.ts
  const enImports = sections
    .map(
      (s) =>
        `import en${toCamelCase(s[0].toUpperCase() + s.slice(1))} from "./locales/en/${s}.json";`,
    )
    .join("\n");
  const deImports = sections
    .map(
      (s) =>
        `import de${toCamelCase(s[0].toUpperCase() + s.slice(1))} from "./locales/de/${s}.json";`,
    )
    .join("\n");

  // Uniformly put ALL keys in double quotes for consistent formatting
  const enResourceObj = sections
    .map(
      (s) => `    "${s}": en${toCamelCase(s[0].toUpperCase() + s.slice(1))},`,
    )
    .join("\n");
  const deResourceObj = sections
    .map(
      (s) => `    "${s}": de${toCamelCase(s[0].toUpperCase() + s.slice(1))},`,
    )
    .join("\n");

  const i18nIndexContent = `import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// English split translation modules
${enImports}

// German split translation modules
${deImports}

const en = {
${enResourceObj}
};

const de = {
${deResourceObj}
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
    },
    fallbackLng: "en",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
`;

  fs.writeFileSync(path.join(I18N_DIR, "index.ts"), i18nIndexContent, "utf-8");
  console.log("✅ Updated src/i18n/index.ts with merged split resources.");

  // 2. Generate src/types/i18next.d.ts
  const dtsImports = sections
    .map(
      (s) =>
        `import en${toCamelCase(s[0].toUpperCase() + s.slice(1))} from "@/i18n/locales/en/${s}.json";`,
    )
    .join("\n");
  const dtsResourceObj = sections
    .map(
      (s) =>
        `        "${s}": typeof en${toCamelCase(s[0].toUpperCase() + s.slice(1))};`,
    )
    .join("\n");

  const i18nTypesContent = `import "i18next";

${dtsImports}

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: {
${dtsResourceObj}
      };
    };
  }
}
`;

  fs.writeFileSync(
    path.join(TYPES_DIR, "i18next.d.ts"),
    i18nTypesContent,
    "utf-8",
  );
  console.log(
    "✅ Updated src/types/i18next.d.ts with merged split resource types.",
  );
}

function writeJsonFiles(transformedEn, transformedDe, splitFiles) {
  const enDir = path.join(LOCALES_DIR, "en");
  const deDir = path.join(LOCALES_DIR, "de");

  if (!splitFiles) {
    fs.writeFileSync(
      path.join(enDir, "translation.json"),
      JSON.stringify(transformedEn, null, 2) + "\n",
      "utf-8",
    );
    fs.writeFileSync(
      path.join(deDir, "translation.json"),
      JSON.stringify(transformedDe, null, 2) + "\n",
      "utf-8",
    );
    console.log(
      "\n✅ Successfully updated en/translation.json and de/translation.json",
    );
  } else {
    const sections = Object.keys(transformedEn);

    // Split mode: save each top-level key as its own file (e.g. common.json, dnf.json, ...)
    for (const [section, content] of Object.entries(transformedEn)) {
      const fileName = `${section}.json`;
      fs.writeFileSync(
        path.join(enDir, fileName),
        JSON.stringify(content, null, 2) + "\n",
        "utf-8",
      );
    }
    for (const [section, content] of Object.entries(transformedDe)) {
      const fileName = `${section}.json`;
      fs.writeFileSync(
        path.join(deDir, fileName),
        JSON.stringify(content, null, 2) + "\n",
        "utf-8",
      );
    }
    console.log(
      `\n✅ Successfully split locales into separate JSON files in locales/en/ and locales/de/`,
    );

    // Automatically update i18n configuration and TypeScript declarations to merge split files
    updateI18nConfigFiles(sections);
  }
}

// -----------------------------------------------------------------------------
// Main Controller
// -----------------------------------------------------------------------------
function main() {
  const enPath = path.join(LOCALES_DIR, "en", "translation.json");
  const dePath = path.join(LOCALES_DIR, "de", "translation.json");

  console.log("Loading translation files...");
  // Fallback: If translation.json doesn't exist (because --split already converted it), we can assemble from split files or load mapping directly
  let enRaw, deRaw;
  if (fs.existsSync(enPath) && fs.existsSync(dePath)) {
    enRaw = loadJson(enPath);
    deRaw = loadJson(dePath);
  }

  // 1. Generate Mapping Mode
  if (MODE_GENERATE) {
    if (!enRaw || !deRaw) {
      console.error(
        "❌ translation.json not found in locales/en or locales/de.",
      );
      process.exit(1);
    }
    const enFlat = flattenObject(enRaw);
    const deFlat = flattenObject(deRaw);
    console.log(`Generating default mapping rules to ${MAPPING_FILE}...`);
    const mapping = {};
    // Collect all unique keys from both languages
    const allKeys = Array.from(
      new Set([...Object.keys(enFlat), ...Object.keys(deFlat)]),
    ).sort();
    for (const key of allKeys) {
      mapping[key] = computeDefaultNewKey(key);
    }
    fs.writeFileSync(
      MAPPING_FILE,
      JSON.stringify(mapping, null, 2) + "\n",
      "utf-8",
    );
    console.log(`✅ Mapping file created with ${allKeys.length} keys.`);
    validateMapping(mapping, enFlat, deFlat);
    return;
  }

  // Load existing mapping file
  if (!fs.existsSync(MAPPING_FILE)) {
    console.error(`❌ Mapping file not found: ${MAPPING_FILE}`);
    console.error(
      "Run `node scripts/migrate-i18n.mjs --generate-mapping` first.",
    );
    process.exit(1);
  }

  const mapping = loadJson(MAPPING_FILE);

  // 2. Validate Mode
  if (MODE_VALIDATE) {
    if (!enRaw || !deRaw) {
      console.log(
        "✅ Using existing mapping without source translation.json (already split).",
      );
      return;
    }
    const enFlat = flattenObject(enRaw);
    const deFlat = flattenObject(deRaw);
    const isValid = validateMapping(mapping, enFlat, deFlat);
    if (!isValid) process.exit(1);
    return;
  }

  // 3. Dry Run Mode
  if (MODE_DRY_RUN) {
    console.log("=== DRY RUN MODE (No files will be changed) ===");
    if (enRaw && deRaw) {
      const enFlat = flattenObject(enRaw);
      const deFlat = flattenObject(deRaw);
      const isValid = validateMapping(mapping, enFlat, deFlat);
      if (!isValid) {
        console.error("\n❌ Aborting dry run due to validation errors.");
        process.exit(1);
      }
    }
    processSourceFiles(mapping, true);
    console.log(
      "\n💡 Dry run completed. Everything looks ready for `--apply`.",
    );
    return;
  }

  // 4. Apply Mode
  if (MODE_APPLY) {
    console.log("=== APPLY MODE (Modifying JSON files and source code) ===");
    if (enRaw && deRaw) {
      const enFlat = flattenObject(enRaw);
      const deFlat = flattenObject(deRaw);
      const isValid = validateMapping(mapping, enFlat, deFlat);
      if (!isValid) {
        console.error("\n❌ Aborting migration due to validation errors.");
        process.exit(1);
      }

      console.log("\n1. Transforming JSON translations...");
      const transformedEn = transformJson(enRaw, mapping);
      const transformedDe = transformJson(deRaw, mapping);
      writeJsonFiles(transformedEn, transformedDe, FLAG_SPLIT);
    }

    console.log("\n2. Updating source code and test files...");
    processSourceFiles(mapping, false);

    console.log("\n🎉 Migration completed successfully!");
    console.log(
      "👉 Next step: Run `npm test` or `npx tsc --noEmit` to verify type safety.",
    );
    return;
  }

  // Default: Show help
  console.log(`
i18n Migration Tool
-------------------
Available options:
  --generate-mapping   Generates/refreshes ${path.basename(MAPPING_FILE)}
  --validate           Validates current mapping against en/de files
  --dry-run            Simulates code replacements and prints statistics
  --apply              Executes migration on translations and source code
  --apply --split      Executes migration, splits JSON files & updates i18n config
`);
}

main();
