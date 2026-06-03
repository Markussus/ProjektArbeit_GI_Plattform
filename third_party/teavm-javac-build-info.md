# teavm-javac build information

This project builds its browser-based Java compiler module from:

https://github.com/konsoletyper/teavm-javac

Pinned teavm-javac commit:
7e4a44cf521694a4e326e33850dd8aec165eb5c9

Pinned published artifact set:

```text
https://teavm.org/playground/3/
```

Build command:

```bash
./gradlew :compiler:build :compiler:createDist
```

On Windows:

```bat
gradlew.bat :compiler:build :compiler:createDist
```

Generated distribution:

```text
compiler/build/distributions/dist.zip
```

Artifact preparation:

- The pinned `teavm-javac` source tree is cloned, fetched, checked out and built locally.
- The frontend compiler asset folder is then populated from the pinned published TeaVM playground artifact set at `https://teavm.org/playground/3/`.
- Each downloaded artifact is verified against a pinned SHA-256 hash in `app/scripts/prepare-teavm-javac.mjs`.

Files copied into the frontend Java compiler asset folder:

```text
compiler.wasm
compiler.wasm-runtime.js
compile-classlib-teavm.bin
runtime-classlib-teavm.bin
worker.js
```

The compiler module contains OpenJDK javac and TeaVM compiler components.

No OpenJDK source files are modified by this project.
