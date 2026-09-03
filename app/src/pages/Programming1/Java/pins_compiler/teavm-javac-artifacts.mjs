/**
 * Official pinned artifact set for the TeaVM browser Java compiler.
 *
 * Source: TeaVM Playground v3 (https://teavm.org/playground/3/)
 * Upstream project: https://github.com/konsoletyper/teavm-javac
 */

export const COMPILER_ARTIFACT_BASE_URL = "https://teavm.org/playground/3";

export const COMPILER_ARTIFACTS = Object.freeze([
  {
    fileName: "compiler.wasm",
    sha256: "7f3828e4b7bddf5504dadebfc4016e40f4441e15ee0519071781813ba2ed3a4c",
    description:
      "Browser-fähiges WebAssembly-Modul mit OpenJDK-javac und TeaVM-Compiler",
  },
  {
    fileName: "compiler.wasm-runtime.js",
    sha256: "9ff6a6771f698be00ab9d5c7b46d904350a8d4115dc0b409553f31ed66688a55",
    description:
      "TeaVM WebAssembly GC Runtime-Loader für compiler.wasm und app.wasm",
  },
  {
    fileName: "compile-classlib-teavm.bin",
    sha256: "e80ae10423a39290c5f20b6bb6da34d21c3ad0a75cd8dbdda4998d2813045e15",
    description:
      "Java-Klassenbibliotheksdefinitionen für den javac-Kompiliervorgang",
  },
  {
    fileName: "runtime-classlib-teavm.bin",
    sha256: "ea670e71967eda93828cb894c1741a8ed2e94b3422eb99cb9eccec0de67daaa8",
    description:
      "Implementierungen der TeaVM-Java-Laufzeitbibliothek für das Zielmodul",
  },
  {
    fileName: "worker.js",
    sha256: "20045d5e753b14774e0b6ee65541cff6a15f6747813227ed665152613f08810a",
    description:
      "Offizieller Web-Worker-Einstiegspunkt für compiler.wasm und Klassenbibliotheken",
  },
]);
