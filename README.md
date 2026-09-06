# GI Learning Platform

## Overview

This project provides a modern, web-based learning and practice platform for the courses **"Grundlagen Informatik" (Fundamentals of Computer Science)** and **"Programmieren 1" (Programming 1)** at THWS.
The application enables students to understand complex theoretical and practical concepts through interactive tools, responsive visualizations, step-by-step simulation, and immediate feedback.

The platform is designed to be modular, extensible, and completely client-driven, with a consistent user interface across all learning modules.

---

## Key Highlights & Architectural Features

* **Zero-Backend Architecture:** 100% Client-Only Single-Page Application (SPA). Zero hosting costs, infinite scalability, and strict Privacy by Design (DSGVO-compliant).
* **In-Browser Java Compilation & Execution:** Full OpenJDK `javac` compilation and execution directly in the browser via WebAssembly (TeaVM) running inside an isolated Web Worker.
* **Interactive Simulators:** Turing machines, finite automata (DFA/NFA), Mealy/Moore machines, regular languages, DNF/KV maps, and encoding/Huffman trees.
* **Behavior-Based Validation:** Exercises test student solutions dynamically with immediate feedback and counterexamples instead of brittle syntax checks.
* **Comprehensive Testing Suite:** Vitest unit/domain tests, Playwright E2E tests, and automated Lighthouse CI audits.
* **Portable Offline Releases:** Fully functional offline launcher scripts (`start.cmd`, `start.sh`, `serve.py`) for offline self-study or exam preparation.

---

## Repository Structure

The repository is structured to separate application source code, scientific documentation, process guides, and deployment tooling:

```text
project-root/
├── app/          # Full web application source code (React 19, TypeScript, Vite 8)
├── docs/         # Scientific thesis (LaTeX), presentations, and process documentation
│   ├── documentation/   # Final academic thesis in LaTeX (THWS template)
│   ├── presentation/    # Slide decks (LaTeX Beamer & PPTX)
│   └── processes/       # Technical architecture, workflows, and handover guides
└── deployment/   # Standalone release packager and offline HTTP server
```

For detailed architectural justifications of this split, see [`docs/processes/repo-structure.md`](file:///C:/Projekte/fix_projektarbeit_gi_plattform/docs/processes/repo-structure.md).

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

For detailed developer onboarding, see [`docs/processes/onboarding-dev-guide.md`](file:///C:/Projekte/fix_projektarbeit_gi_plattform/docs/processes/onboarding-dev-guide.md).

---

## Process & Handover Documentation

All detailed architectural and process documentation is centrally maintained in [`docs/processes/`](file:///C:/Projekte/fix_projektarbeit_gi_plattform/docs/processes/README.md):

* **[Architecture Guide](file:///C:/Projekte/fix_projektarbeit_gi_plattform/docs/processes/architecture.md):** Clean architecture layers, Web Worker isolation, state management, and lazy loading.
* **[New Module & Topic Guide](file:///C:/Projekte/fix_projektarbeit_gi_plattform/docs/processes/new-module-guide.md):** Step-by-step instructions with code templates to add new modules and topics.
* **[Repository Structure Guide](file:///C:/Projekte/fix_projektarbeit_gi_plattform/docs/processes/repo-structure.md):** Architectural rationale for monorepo and directory organization.
* **[Tech Stack Summary](file:///C:/Projekte/fix_projektarbeit_gi_plattform/docs/processes/tecstack.md):** Full overview of frameworks, libraries, and QA tooling based on `package.json`.
* **[Git Workflow](file:///C:/Projekte/fix_projektarbeit_gi_plattform/docs/processes/git-workflow.md):** Branching model, merge request rules, approvals, and conventional commit guidelines.
* **[Handover & Maintenance Checklist](file:///C:/Projekte/fix_projektarbeit_gi_plattform/docs/processes/handover-checklist.md):** Handover readiness, hosting requirements, media hosting, and extension ideas.

---

## License

MIT License

Copyright (c) 2026 Markus Nöth, Richard Schröder, Enrico Ebert, Duy Tan Pham, Kristian Popov
