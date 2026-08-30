const JAVA_COMPILER_ASSET_BASE = "/java/compiler";

export const JAVA_COMPILER_ASSET_URLS = {
  compilerWasm: `${JAVA_COMPILER_ASSET_BASE}/compiler.wasm`,
  compilerRuntime: `${JAVA_COMPILER_ASSET_BASE}/compiler.wasm-runtime.js`,
  compileClasslib: `${JAVA_COMPILER_ASSET_BASE}/compile-classlib-teavm.bin`,
  runtimeClasslib: `${JAVA_COMPILER_ASSET_BASE}/runtime-classlib-teavm.bin`,
  upstreamWorker: `${JAVA_COMPILER_ASSET_BASE}/worker.js`,
} as const;
