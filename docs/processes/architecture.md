# Architecture

## Purpose

This document describes the current structure of the application and the intended dependency direction.

The project follows this separation:

* shared UI and shared page shells live in `components/shared`
* central module/topic registration lives in `data`
* module-owned pages and topic-owned educational content stay in `pages/<ModuleName>/...`
* hooks, store, router, and i18n remain cross-cutting infrastructure

They are intentionally kept as thin topic binding files, even though they mostly forward into shared components.

## Source Structure

```text
app/src/
  components/shared/              # reusable UI and reusable page shells
  data/                           # central registries and route-backed metadata
  hooks/                          # reusable state logic
  i18n/                           # i18n bootstrap and locale resources
  layouts/                        # top-level layouts
  pages/                          # route pages and topic-owned content
  router/                         # router setup
  store/                          # small global UI state
  types/                          # shared domain and typing helpers
```

Topic-owned content currently lives under:

```text
app/src/pages/<ModuleName>/<Topic>/
  components/
    ExercisesTab.tsx              # topic-owned binding for exercises
    SimulationTab.tsx             # topic-owned binding for simulation
    OverviewTab.tsx               # topic-specific overview UI
    ExamplesTab.tsx               # topic-specific examples UI
  exercises/
    index.ts                      # topic exercise definitions
  <Topic>Page.tsx                 # topic route page
```

## Responsibilities

### `components/shared`

This folder contains generic UI and reusable page-level shells.

Examples:

* `Header`, `Footer`, `Sidebar`
* `PageIntro`, `InfoCardGrid`, `ExerciseCard`, `TabNavigation`
* `SimulationWorkspace`
* `ModuleOverviewPage`
* `ModuleTopicPage`
* `TopicExercisesTab`
* `TopicSimulationTab`

These components are shared across multiple topics or routes.

Important routing-related detail:

* shared shells like `ModuleTopicPage` are not lazy-loaded on their own
* tabs inside a topic page are imported normally by the topic page
* lazy loading currently happens at page level, not at tab level

### `data`

This folder contains centralized registration and lookup data.

Current file:

* `app/src/data/moduleCatalog.tsx`

It is the single source of truth for:

* module metadata
* topic metadata
* route elements
* navigation lookups
* lazy-loaded module and topic page elements

Although the registry contains `ReactElement`s, it is still configuration/registration and therefore belongs in `data`, not in a topic page folder.

Current implementation detail:

* module and topic pages are registered as `React.lazy(...)` elements inside `moduleCatalog.tsx`
* this keeps module/topic registration centralized while still splitting page bundles by route
* `moduleCatalog.tsx` intentionally has an inline `react-refresh/only-export-components` eslint disable because it mixes config exports with lazy component declarations

### `pages`

Each topic folder owns the content that is truly specific to that topic.

Examples:

* overview text structure
* example content
* exercise definitions
* topic-specific simulation binding

The `ExercisesTab.tsx` and `SimulationTab.tsx` files stay here on purpose.

Reason:

* this gives each topic one explicit place to bind shared shells to topic content
* future topic-specific simulation logic can be added there without changing shared architecture
* the wrapper location makes ownership obvious

### `types`

Shared types live centrally in `types`.

Current examples:

* `app/src/types/exercise.ts`
* `app/src/types/i18n.ts`

This avoids the wrong dependency direction where feature or domain types are derived from UI component files.

## Shared Topic Pattern

All topics use the same shared shell:

* `app/src/components/shared/ModuleTopicPage/ModuleTopicPage.tsx`

That shell owns:

* intro rendering
* tab state
* exercise selection
* "open in simulation" flow
* simulation focus mode

But the topic folder still owns the bindings:

* `components/ExercisesTab.tsx`
* `components/SimulationTab.tsx`

So the shared orchestration is centralized without removing the topic-level integration points.

## Shared Module Overview Pattern

Module landing pages use:

* `app/src/components/shared/ModuleOverviewPage/ModuleOverviewPage.tsx`

This component renders:

* intro
* topic list
* links generated from the central registry

## Simulation Architecture

The simulation frame lives in:

* `app/src/components/shared/SimulationWorkspace/SimulationWorkspace.tsx`

It now accepts `children`.

That means a topic-specific simulation can be passed from:

* `app/src/pages/<ModuleName>/<Topic>/components/SimulationTab.tsx`

Current intended flow:

1. the topic wrapper receives the shared simulation props
2. it forwards them to `TopicSimulationTab`
3. it may optionally provide topic-specific simulation UI as `children`
4. `SimulationWorkspace` renders the shared frame and the topic-specific child area

This keeps the simulator slot topic-owned without duplicating the common layout.

## Exercise Architecture

Exercise definitions live per topic in:

* `app/src/pages/<ModuleName>/<Topic>/exercises/index.ts`

The shared exercise rendering lives in:

* `app/src/components/shared/TopicExercisesTab/TopicExercisesTab.tsx`

The topic-specific wrapper remains in:

* `app/src/pages/<ModuleName>/<Topic>/components/ExercisesTab.tsx`

This is intentional because the topic still owns the decision of which exercise list is bound into the shared renderer.

## Internationalization

Translations live in:

* `app/src/i18n/locales/de/translation.json`
* `app/src/i18n/locales/en/translation.json`

Shared translation key typing lives in:

* `app/src/types/i18n.ts`

This is used for:

* module titles and descriptions
* topic titles and descriptions
* exercise translation keys
* simulation empty-state keys

The goal is to pass typed translation keys instead of untyped `string` values wherever possible.

## Routing

Top-level routing remains in:

* `app/src/router/index.tsx`

Topic routes are generated from:

* `app/src/data/moduleCatalog.tsx`

This avoids duplicate registration across router, sidebar, header, and module overview pages.

Current lazy-loading behavior:

* `HomePage`, `DocumentationPage`, `HelpPage`, and `NotFoundPage` are lazy-loaded directly in `router/index.tsx`
* module pages and topic pages are lazy-loaded in `moduleCatalog.tsx`
* topic tabs are not lazy-loaded
* `MainLayout` provides the shared `Suspense` boundary for route content

Important constraint:

* if a new top-level route is added directly in `router/index.tsx`, it should follow the same page-level lazy pattern unless there is a strong reason not to

## Global State

Global state remains intentionally small.

Current shared state:

* theme
* sidebar collapsed state

Topic-specific state stays local to the shared topic shell and topic hooks unless there is a real need to globalize it.

## How To Add A New Module

Recommended workflow:

1. Create a new module folder like `app/src/pages/<ModuleName>/`.
2. Create a module landing page like `<ModuleName>Page.tsx` that renders `ModuleOverviewPage`.
3. Create one folder per topic inside that module folder.
4. Register the module page lazily in `app/src/data/moduleCatalog.tsx`.
5. Register the module and all of its topics in `app/src/data/moduleCatalog.tsx`.
6. For each topic, point the `element` field to the lazy-loaded topic page component.
7. Add all required translation keys in both locale files.

Minimal module page pattern:

```tsx
import { ModuleOverviewPage } from "@/components/shared/ModuleOverviewPage/ModuleOverviewPage";

export function ExampleModulePage() {
  return <ModuleOverviewPage moduleId="example-module" />;
}
```

Important note:

* the module only becomes visible in home navigation, header, sidebar, and router after it is added to `moduleCatalog.tsx`
* `router/index.tsx` already consumes `learningRoutes`, so no extra manual route entry is needed there
* the module page component itself should remain a thin page wrapper; the lazy registration happens in `moduleCatalog.tsx`, not inside the page file
* when adding the module page to `moduleCatalog.tsx`, follow the existing `const ExamplePage = lazy(async () => ({ default: ... }))` pattern instead of importing the page eagerly

## How To Add A New Topic

Recommended workflow:

1. Create `app/src/pages/<ModuleName>/<Topic>/`.
2. Add topic-specific overview and examples in `components/`.
3. Add `components/ExercisesTab.tsx` and `components/SimulationTab.tsx`.
4. Add exercise definitions in `exercises/index.ts`.
5. Create `<Topic>Page.tsx` using the shared `ModuleTopicPage`.
6. Import the tab components normally inside `<Topic>Page.tsx`.
7. Register the topic page lazily in `app/src/data/moduleCatalog.tsx`.
8. Register the topic in the correct module entry inside `app/src/data/moduleCatalog.tsx`.
9. Add all required translation keys in both locale files.

Minimal page pattern:

```tsx
import { ModuleTopicPage } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { ExamplesTab } from "./components/ExamplesTab";
import { ExercisesTab } from "./components/ExercisesTab";
import { OverviewTab } from "./components/OverviewTab";
import { SimulationTab } from "./components/SimulationTab";

export function ExampleTopicPage() {
  return (
    <ModuleTopicPage
      titleKey="example.title"
      descriptionKey="example.description"
      overviewTab={OverviewTab}
      exercisesTab={ExercisesTab}
      examplesTab={ExamplesTab}
      simulationTab={SimulationTab}
    />
  );
}
```

Important note:

* the topic route, sidebar entry, header/module lookup, and module overview link are all derived from `moduleCatalog.tsx`
* that means the topic should be registered there exactly once, with the final `path`, `icon`, `accent`, and `element`
* `OverviewTab`, `ExercisesTab`, `ExamplesTab`, and `SimulationTab` are intentionally imported eagerly by the topic page; do not add per-tab lazy loading unless that architecture decision changes explicitly
* the topic page itself is the lazy boundary for that topic, not the individual tab files

## Lazy Loading Rules

The current rule set is intentionally simple:

* lazy-load full pages
* do not lazy-load topic tabs
* keep `router/index.tsx` responsible for top-level standalone pages
* keep `moduleCatalog.tsx` responsible for lazy-loaded module and topic pages
* keep `main.tsx` and `App.tsx` simple; i18n bootstraps normally and is not deferred

This gives route-based splitting without adding extra moving parts inside each topic.

## Summary

The important architectural decisions are:

* central module registry in `data/moduleCatalog.tsx`
* shared shells in `components/shared`
* module and topic ownership kept inside `pages/<ModuleName>/...`
* topic-local exercise definitions
* typed translation keys instead of ad-hoc string casts where possible

This keeps the codebase explicit, easier to navigate, and easier to extend without hiding topic ownership.
