# GI Learning Platform

## Overview

This project provides a modern, web-based learning and practice platform for the courses **"Grundlagen Informatik" (Fundamentals of Computer Science)** at THWS.
The application enables students to understand complex theoretical and practical concepts through interactive tools, responsive visualizations, step-by-step simulation, and immediate feedback.

The platform is designed to be modular, extensible, and completely client-driven, with a consistent user interface across all learning modules.
---

## Key Highlights & Architectural Features

* **Zero-Backend Architecture:** 100% Client-Only Single-Page Application (SPA). Zero hosting costs, good scalability, and strict Privacy by Design (DSGVO-compliant)
* **In-Browser Java Compilation & Execution:** Java compilation and execution directly in the browser via WebAssembly (TeaVM) running inside an isolated Web Worker.
* **Interactive Simulators:** Turing machines, finite automata (DFA/NFA), Mealy/Moore machines, regular languages, DNF/KV maps, and encoding/Huffman trees.
* **Portable Offline Releases:** Fully functional offline launcher scripts (`start.cmd`, `start.sh`, `serve.py`) for offline self-study.

---

## Repository Structure

The repository is structured to separate application source code, scientific documentation, process guides, and deployment tooling:

```text
project-root/
├── app/          # Full web application source code (React 19, TypeScript, Vite 8)
├── docs/         # Scientific thesis (LaTeX), presentations, and process documentation
│   ├── documentation/   # Final academic thesis in LaTeX (THWS template)
│   ├── presentation/    # Slide decks (LaTeX Beamer & PPTX)
│   ├── feedback/        # Given feedback
│   └── processes/       # Technical architecture, workflows, and handover guides
└── deployment/   # Standalone release packager and offline HTTP server
```

For detailed architectural justifications of this split, see `docs/processes/repo-structure.md`

---

## Quickstart & Local Development

### Prerequisites

* **Node.js:** `>= 22.12.0` (LTS, see `app/.nvmrc`)
* **npm:** `>= 11.10.0`

### Installation & First Run

```bash
# 1. Switch to the app directory
cd app

# 2. Install dependencies (respects min-release-age=7 security rule)
npm ci

# 3. Prepare Java WebAssembly compiler assets (Required once)
npm run prepare:java-compiler

# 4. Start local development server with HMR
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Essential Commands

* `npm test` – Run domain and unit tests with Vitest.
* `npm run e2e-test` – Run Playwright end-to-end tests against a production build.
* `npm run build` – Create an optimized production bundle in `app/dist`.
* `npm run pre:commit:check` – Lint, check formatting, and verify production preview.
* `npm run pipeline:local` – Execute the complete multi-stage CI pipeline locally.

For detailed developer onboarding, see `docs/processes/onboarding-dev-guide.md`

---

## Process & Handover Documentation

All detailed architectural and process documentation is centrally maintained in `docs/processes/`

---

## License

MIT License

Copyright (c) 2026 Markus Nöth, Richard Schröder, Enrico Ebert, Duy Tan Pham, Kristian Popov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.