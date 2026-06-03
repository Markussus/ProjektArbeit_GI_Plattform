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

* Pipeline Setup:
    - Set up the Raspberry Pi as a self-hosted CI runner machine
    - Installed and configured Docker on the Raspberry Pi
    - Installed GitLab Runner on the Raspberry Pi
    - Registered the GitLab Runner and connected it to the GitLab project
    - Configured the runner to use the Docker executor
    - Verified that the runner service is running correctly
    - Verified that the `gitlab-runner` user has access to Docker
    - Created the initial `.gitlab-ci.yml` pipeline configuration
    - Adjusted the pipeline to work with the project located in the `app/` subdirectory
    - Added a minimal `verify` job to confirm that the runner, Docker, Node.js, and npm work correctly
    - Added a `build` job to confirm that the frontend application builds successfully
    - Tested and debugged the pipeline until it ran successfully
    - Changed the Docker pull policy to `if-not-present` so the local image is reused instead of being pulled every time
    - Replaced the `node_modules` cache approach with a local npm cache (`app/.npm/`) for a smaller and more efficient dependency cache
    - Configured npm to use `npm ci --cache .npm --prefer-offline` so cached packages are reused whenever possible
    - Confirmed that the local GitLab Runner cache works without any external shared cache server
    - Successfully ran the pipeline end to end on the Raspberry Pi

---

## Short Note: Java compiler integration

* The Java simulator no longer uses the old custom Java transpiler.
* It now uses the TeaVM Java browser compiler pipeline based on `teavm-javac`.
* The React UI talks only to a Web Worker.
* Inside the worker, the pinned TeaVM browser compiler artifacts are loaded.
* Java source is compiled in the worker, converted to WebAssembly, and the generated WebAssembly is also executed in the worker.
* `stdout`, `stderr`, diagnostics, timeout, and stop events are sent back from the worker to the React UI.
* The compiler is preloaded when the Java page is opened, so the simulator is ready faster when the user switches to the simulation tab.

---

## Refactoring Ideas: Shared Exercise / Simulation UI

* Some parts of the Java programming page now follow the same interaction pattern as the Turing machine page.
* It makes sense to abstract the common UI parts, but not the simulator-specific logic.

* Good candidates for shared components:
    - `TopicExamplesTab`
        - Similar to the existing `TopicExercisesTab`
        - Shows selectable example cards
        - Expands the selected example
        - Provides an `Open in Simulation` action
        - Useful because examples should behave consistently across Java, Turing machine, and future topics
    - Shared simulation actions
        - Reusable action area for selected simulation items
        - Supports actions like `Load solution` and `Check solution`
        - The shared part should only render the buttons and layout
        - The actual load/check logic should stay inside the concrete simulator
    - `SolutionCheckDialog`
        - Shared popup/dialog for displaying validation results
        - Can show passed/failed rows, actual output, expected output, and status
        - Useful for Java now and potentially for other simulators later
        - The dialog should be generic; each simulator provides its own result rows

* Maybe useful later, but not urgent:
    - Shared scenario data model
        - Could define common fields like `id`, `kind`, `titleKey`, `descriptionKey`, and `definition`
        - Should be introduced carefully because Java scenarios contain code and validation cases, while Turing machine scenarios contain machine configurations
        - Keep simulator-specific payloads separate to avoid an over-generic model

* Preferred direction:
    - First extract `TopicExamplesTab`
    - Then extract a small shared simulation action area
    - Then extract `SolutionCheckDialog`
    - Only revisit a shared scenario model if a third topic needs the same pattern
