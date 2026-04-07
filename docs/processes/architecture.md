# Architecture

## Goals

The architecture is designed to support:

* modular learning topics
* consistent navigation and interaction patterns
* low coupling between routing, navigation, and topic content
* clear separation between reusable UI, page orchestration, and educational content
* straightforward extension with new topics and future modules

## Architectural Principles

The project follows these principles:

* single source of truth for module and topic registration
* shared orchestration for repeated page flows
* feature-local content close to the owning topic
* reusable UI components in a shared layer
* user-facing text in i18n resources, not hardcoded in UI components

## Source Structure

```text
app/src/
  components/shared/              # reusable presentational building blocks
  features/modules/               # shared module architecture and orchestration
  hooks/                          # reusable state logic
  layouts/                        # route layouts
  pages/                          # route-level pages and topic-specific content
  router/                         # route registration
  store/                          # global UI and theme state
  i18n/                           # translations and i18n bootstrap
```

Topic-specific content currently lives under:

```text
app/src/pages/FundamentalsCS/<Topic>/
  components/                     # topic-specific UI blocks
  exercises/                      # exercise definitions for the topic
  <Topic>Page.tsx                 # route page wiring into the shared topic shell
```

## Layers And Responsibilities

### Shared UI

`components/shared/` contains generic UI that is not tied to a specific topic.

Examples:

* header, footer, sidebar
* exercise cards
* simulation workspace
* page headers
* tab navigation

These components may receive translated text or translated domain objects, but should not contain topic-specific content.

### Module Feature Layer

`features/modules/` contains the shared architecture for learning topics.

Key responsibilities:

* central module catalog
* route generation for topics
* module lookup for shared navigation
* shared topic page orchestration
* reusable rendering for topic exercises and simulations

Key files:

* `app/src/features/modules/catalog.tsx`
* `app/src/features/modules/ModuleTopicPage.tsx`
* `app/src/features/modules/TopicExercisesTab.tsx`
* `app/src/features/modules/TopicSimulationTab.tsx`

### Topic Layer

Each topic folder owns its educational content and topic-specific UI.

This includes:

* overview content
* examples content
* simulator wrapper
* exercise metadata in `exercises/`

This keeps the content close to the domain it belongs to while reusing the same interaction shell across topics.

## Module Catalog

The central source of truth for registered learning modules is:

* `app/src/features/modules/catalog.tsx`

The catalog defines:

* module metadata
* topic metadata
* topic route elements
* lookup logic used by navigation components

This prevents duplicated registration across:

* router configuration
* sidebar navigation
* header state
* module overview pages

## Routing

Top-level routing remains in `app/src/router/index.tsx`.

Topic routes are generated from the module catalog instead of being manually duplicated in the router.

This means that registering a new topic is primarily a catalog change instead of a multi-file wiring task.

## Topic Page Shell

All topic pages share the same interaction flow:

* page header
* tab navigation
* overview
* exercises
* examples
* simulation

This orchestration is implemented once in:

* `app/src/features/modules/ModuleTopicPage.tsx`

The topic page itself only binds the correct content components into that shell.

This avoids duplicated state handling for:

* active tab
* selected exercise
* opening exercises in simulation
* simulation focus mode

## Exercise Content Model

Exercise data is stored per topic in dedicated files under the topic folder:

* `app/src/pages/FundamentalsCS/<Topic>/exercises/index.ts`

These files contain structured exercise definitions such as:

* translation keys for title and description
* icon
* difficulty

The UI translation and rendering happens in the shared module layer.

This is intentional because:

* exercises are topic content, not shared UI
* translation keys still remain centralized in i18n files
* the same rendering behavior can be reused across all topics

One file per topic is currently preferred over one file per exercise because the exercise sets are small and strongly related. If a topic grows significantly, this can later be split into multiple files inside the same `exercises/` folder.

## Internationalization

All user-facing text should live in:

* `app/src/i18n/locales/de/translation.json`
* `app/src/i18n/locales/en/translation.json`

This includes:

* labels in shared components
* simulator empty states
* exercise titles and descriptions
* page headings

Best practice for this project:

* store translation keys in content definitions
* translate at the UI boundary
* avoid hardcoded display strings in reusable components

## Global State

Global state is intentionally small and only used for cross-cutting UI concerns.

Current shared state:

* theme selection
* sidebar collapsed state

Topic-specific interaction state remains local to the topic page shell unless there is a clear need to share it globally.

## Extension Path

To add a new topic, the recommended workflow is:

1. Create the topic folder in `pages/FundamentalsCS/`.
2. Add topic-specific overview, examples, and simulation wrapper components.
3. Add the exercise definitions in `exercises/index.ts`.
4. Create the route page that renders `ModuleTopicPage`.
5. Register the topic once in `features/modules/catalog.tsx`.
6. Add all required translation keys.

This keeps extension work localized and reduces the risk of inconsistent wiring.

## Current Tradeoffs

The current architecture intentionally keeps topics under `pages/FundamentalsCS/` because the project currently consists of one academic module with multiple topics.

If the application later grows into multiple course families, a future refactor to a broader `features/<module>/<topic>/` structure may become worthwhile.

For the current project scope, the existing layout is a pragmatic balance between:

* clarity for the team
* low refactor risk
* modularity
* maintainability
