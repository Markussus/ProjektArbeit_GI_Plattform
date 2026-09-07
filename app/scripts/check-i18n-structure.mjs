import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

const localesRoot = resolve("src/i18n/locales");
const [sourceLanguage, targetLanguage] = process.argv.slice(2);

if (!sourceLanguage || !targetLanguage) {
  console.error(
    "Usage: node scripts/check-i18n-structure.mjs <source-language> <target-language>",
  );
  process.exit(2);
}

function valueType(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function placeholders(value) {
  if (typeof value !== "string") return [];
  return [...value.matchAll(/{{\s*([^},\s]+)(?:[^}]*)}}/g)]
    .map((match) => match[1])
    .sort();
}

function extractStructure(value, path = "$", entries = []) {
  const type = valueType(value);
  const entry = { path, type };

  if (type === "array") entry.length = value.length;
  if (type === "string") entry.placeholders = placeholders(value);
  entries.push(entry);

  if (type === "object") {
    for (const key of Object.keys(value).sort()) {
      extractStructure(value[key], `${path}.${key}`, entries);
    }
  } else if (type === "array") {
    value.forEach((item, index) => {
      extractStructure(item, `${path}[${index}]`, entries);
    });
  }

  return entries;
}

async function extractLanguage(language) {
  const directory = join(localesRoot, language);
  const files = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();
  const structure = {};

  for (const file of files) {
    const content = await readFile(join(directory, file), "utf8");
    structure[file] = extractStructure(JSON.parse(content));
  }

  return { language, files, structure };
}

function compare(source, target) {
  const problems = [];
  const sourceFiles = new Set(source.files);
  const targetFiles = new Set(target.files);

  for (const file of source.files) {
    if (!targetFiles.has(file)) problems.push(`Missing file: ${file}`);
  }
  for (const file of target.files) {
    if (!sourceFiles.has(file)) problems.push(`Unexpected file: ${file}`);
  }

  for (const file of source.files.filter((name) => targetFiles.has(name))) {
    const expected = new Map(
      source.structure[file].map((entry) => [entry.path, entry]),
    );
    const actual = new Map(
      target.structure[file].map((entry) => [entry.path, entry]),
    );

    for (const [path, expectedEntry] of expected) {
      const actualEntry = actual.get(path);
      if (!actualEntry) {
        problems.push(`${file}: missing key ${path}`);
        continue;
      }
      if (actualEntry.type !== expectedEntry.type) {
        problems.push(
          `${file}: ${path} has type ${actualEntry.type}, expected ${expectedEntry.type}`,
        );
      }
      if (
        expectedEntry.length !== undefined &&
        actualEntry.length !== expectedEntry.length
      ) {
        problems.push(
          `${file}: ${path} has array length ${actualEntry.length}, expected ${expectedEntry.length}`,
        );
      }
      if (
        expectedEntry.placeholders &&
        JSON.stringify(actualEntry.placeholders) !==
          JSON.stringify(expectedEntry.placeholders)
      ) {
        problems.push(
          `${file}: ${path} has placeholders ${JSON.stringify(actualEntry.placeholders)}, expected ${JSON.stringify(expectedEntry.placeholders)}`,
        );
      }
    }

    for (const path of actual.keys()) {
      if (!expected.has(path)) problems.push(`${file}: unexpected key ${path}`);
    }
  }

  return problems;
}

let temporaryDirectory;

try {
  const source = await extractLanguage(sourceLanguage);
  temporaryDirectory = await mkdtemp(join(tmpdir(), "i18n-structure-"));
  const manifestPath = join(
    temporaryDirectory,
    `${basename(sourceLanguage)}-structure.json`,
  );
  await writeFile(manifestPath, `${JSON.stringify(source, null, 2)}\n`, "utf8");
  console.log(`Extracted ${sourceLanguage} structure to ${manifestPath}`);

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const target = await extractLanguage(targetLanguage);
  const problems = compare(manifest, target);

  if (problems.length > 0) {
    console.error(
      `Structure check failed for ${sourceLanguage} -> ${targetLanguage}:`,
    );
    problems.forEach((problem) => console.error(`- ${problem}`));
    process.exitCode = 1;
  } else {
    const keyCount = Object.values(source.structure).reduce(
      (total, entries) =>
        total + entries.filter((entry) => entry.type === "string").length,
      0,
    );
    console.log(
      `Structure check passed: ${sourceLanguage} and ${targetLanguage} contain the same ${source.files.length} files and ${keyCount} translation keys.`,
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true });
}
