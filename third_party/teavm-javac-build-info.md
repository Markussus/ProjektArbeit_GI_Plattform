# teavm-javac provenance and artifact information

This project uses the browser-based Java compiler module based on:

https://github.com/konsoletyper/teavm-javac

Upstream source commit:
`7e4a44cf521694a4e326e33850dd8aec165eb5c9`

Official pinned artifact set:

```text
https://teavm.org/playground/3/
```

## Artifact preparation in this project

The frontend project does not build `teavm-javac` from source during application builds. Instead, it downloads the official pre-built compiler artifacts and cryptographically verifies each file against a pinned SHA-256 hash in `app/scripts/teavm-javac-artifacts.mjs`:

```text
compiler.wasm
compiler.wasm-runtime.js
compile-classlib-teavm.bin
runtime-classlib-teavm.bin
worker.js
```

## Upstream build reference

For reference, upstream `teavm-javac` distributions can be built from source using:

```bash
./gradlew :compiler:build :compiler:createDist
```

On Windows:

```bat
gradlew.bat :compiler:build :compiler:createDist
```

The compiler module contains OpenJDK javac and TeaVM compiler components.
No OpenJDK source files are modified by this project.
