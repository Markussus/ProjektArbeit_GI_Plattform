# Personal Notes – Markus

## Work Done

* Improved the prototype further
* Refined and adjusted parts of the architecture
* Contributed new ideas and simplifications where needed
* Simplified certain components to improve usability and structure

---

## Decisions

* What was decided?
    - Use translation files to manage and structure questions across multiple languages
    - Continue using AI-supported tools for prototyping and development

* Why?
    - Translation files allow scalable support for multiple language versions
    - AI tools significantly speed up UI generation, prototyping, and coding

---

## Problems & Solutions

* Problem:
    - Inconsistent setup and build target issues
    - Open questions regarding video integration and architectural planning
    - Unclear structure for storing and managing questions

* Solution:
    - Move towards a consistent setup configuration
    - Clarify architecture decisions step by step
    - Use translation files to manage multiple versions of questions per language

---

## AI Usage (optional)

* Tool / Prompt:
    - ChatGPT by OpenAI
    - Stitch by Google
    - Figma (with imported UI prototype from Stitch)
    - Codex (ChatGPT plugin in WebStorm)

* Result / Insight:
    - AI tools accelerated development and prototyping significantly
    - UI prototypes could be generated and transferred into Figma efficiently
    - However, results are sometimes inconsistent or not aligned with best practices
    - Some outputs require manual correction or reinterpretation

---

## Next Steps

* Clean up and refine the architecture
* Gather feedback on the first version
* Implement concrete logic (e.g., Turing machine simulator)

---

## GitLab Test Strategy Ideas

* For GitLab CI, a good first version would be:
    - `npm ci`
    - `npm run lint`
    - `npm run format:check`
    - `npm run build`

* Why?
    - Checks if the project installs cleanly
    - Checks code style and formatting
    - Checks if the whole app still builds

* Prettier in GitLab:
    - Better to use `format:check` and not auto-format in CI
    - Auto-formatting should happen locally, CI should only fail if formatting is wrong

* For the simulator parts, I should not test only by clicking around in the UI
    - Better to test the actual logic separately
    - For example: input, transitions, output, halt/reset behavior

* Possible simulator test ideas:
    - Turing machine: movement, symbol replacement, next state, halt condition
    - Finite automata: accepted/rejected input, correct state sequence
    - Moore/Mealy: correct output behavior
    - Number systems: correct conversions and invalid input handling
    - DNF: truth tables and expected expressions

* Good next step later:
    - Add `Vitest` for logic tests
    - Maybe later `React Testing Library` for UI/component tests
    - First focus on testing the simulator logic, not the full UI
