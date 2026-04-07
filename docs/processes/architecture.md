# Architecture

## Purpose

This document explains the architectural structure of the application, the reasons behind the chosen abstractions, and the expected extension workflow for new topics, exercises, and languages.

The main architectural goal is modularity without unnecessary abstraction.

## Goals

The architecture is designed to support:

* modular learning topics
* consistent layouts and interaction patterns
* low coupling between routing, navigation, and topic content
* clear separation between reusable UI, orchestration logic, and educational content
* scalable internationalization
* straightforward extension with new topics and future modules

## Design Principles

The project follows these principles:

* single source of truth for registrations and configuration
* content stays close to the topic that owns it
* shared behavior is abstracted once and reused
* presentational UI is separated from domain content
* user-facing text belongs to i18n resources, not to reusable components
* abstractions are introduced only when they remove real duplication or reduce coupling

## Source Structure

```text
app/src/
  components/shared/              # generic reusable UI building blocks
  features/modules/               # shared module-specific orchestration
  hooks/                          # reusable state logic
  i18n/                           # language bootstrap and language registry
  layouts/                        # top-level route layouts
  pages/                          # route pages and topic-owned content
  router/                         # top-level router setup
  store/                          # global cross-cutting UI state
```

Topic-owned content currently lives under:

```text
app/src/pages/FundamentalsCS/<Topic>/
  components/                     # topic-specific UI/content blocks
  exercises/                      # exercise definitions for this topic
  <Topic>Page.tsx                 # route page bound to the shared topic shell
```

## Layers And Responsibilities

### Shared UI Layer

`components/shared/` contains UI that is generic and not owned by one specific learning topic.

Examples:

* header, footer, sidebar
* page intro blocks
* card grids
* exercise cards
* simulation workspace
* tab navigation

These components may receive translated content or translated domain objects, but should not contain topic-specific educational text.

### Module Feature Layer

`features/modules/` contains shared orchestration for learning modules and topics.

Examples:

* module catalog
* module overview page shell
* topic page shell
* generic exercises tab renderer
* generic simulation tab renderer

This layer exists because the application has repeated module and topic behavior that should not be reimplemented per topic.

### Topic Layer

Each topic folder owns its educational content and topic-specific UI.

Examples:

* overview text and concept presentation
* example content
* simulator wrapper configuration
* exercise definitions

This keeps educational content close to the owning domain and avoids creating a large unrelated central content directory.

## Standardized Page Patterns

The application uses explicit shared page patterns to keep the UI and architecture consistent.

### Topic Pages

All topics use the same interaction shell:

* page intro
* tab navigation
* overview
* exercises
* examples
* simulation

This shell is implemented in:

* `app/src/features/modules/ModuleTopicPage.tsx`

Reason:

* all topics share the same interaction model
* local topic folders should focus on content, not repeated state orchestration
* the shell keeps tab handling, exercise selection, and simulation focus behavior consistent

### Module Overview Pages

Module landing pages use a shared overview pattern implemented in:

* `app/src/features/modules/ModuleOverviewPage.tsx`

Reason:

* module pages repeat the same structure: intro plus topic list
* topic navigation should be generated from the same data model used by the router and sidebar
* this ensures that every module overview behaves consistently

### Informational Pages

Documentation and support-like pages use shared presentational building blocks:

* `app/src/components/shared/PageIntro/PageIntro.tsx`
* `app/src/components/shared/InfoCardGrid/InfoCardGrid.tsx`

Reason:

* these pages share layout structure but not module-specific behavior
* a full "one generic page for everything" abstraction would be too broad
* small composable UI abstractions give reuse without hiding intent

## Module Catalog

The central source of truth for registered learning modules is:

* `app/src/features/modules/catalog.tsx`

The catalog defines:

* module metadata
* topic metadata
* route elements for topics
* lookup logic for the current module

This prevents duplicated registration across:

* router configuration
* sidebar navigation
* header context
* module overview pages

### Why This Was Chosen

Without a central catalog, every new topic would need to be wired manually in multiple unrelated files.

With the catalog:

* registration is localized
* navigation stays consistent
* route setup is less error-prone
* the architecture is easier to explain and justify

## Routing

Top-level routing remains in:

* `app/src/router/index.tsx`

Topic routes are generated from the module catalog instead of being manually duplicated in the router.

This makes the router simpler and reduces the risk of missing a route when a new topic is added.

## Exercise Content Model

Exercise data is stored per topic in:

* `app/src/pages/FundamentalsCS/<Topic>/exercises/index.ts`

These files contain structured exercise definitions:

* translation keys for title
* translation keys for description
* difficulty
* icon

The shared rendering logic lives in:

* `app/src/features/modules/TopicExercisesTab.tsx`

### Why Exercises Were Extracted

Before the refactor, exercise definitions lived directly inside UI components.

That caused two problems:

* educational content and rendering logic were mixed together
* the same rendering structure was repeated in every topic

The current structure is preferable because:

* exercises are now topic content, not component implementation detail
* rendering is reused centrally
* translation keys stay consistent with the i18n strategy

### Why One File Per Topic Is Currently Preferred

Each topic currently has a small, closely related set of exercises.

Because of that, one `exercises/index.ts` file per topic is the best tradeoff:

* easy to find
* low file overhead
* no unnecessary fragmentation

If one topic later grows significantly, the `exercises/` folder can be split further, for example:

```text
exercises/
  basics.ts
  conversions.ts
  advanced.ts
  index.ts
```

That split should only happen when the topic size justifies it.

## Internationalization

All user-facing text should live in:

* `app/src/i18n/locales/de/translation.json`
* `app/src/i18n/locales/en/translation.json`

This includes:

* page headings
* shared component labels
* exercise titles and descriptions
* simulator empty states
* control labels

Best practice in this project:

* store translation keys inside topic content definitions
* translate at the UI boundary
* avoid hardcoded display strings in shared components

## Language Handling

The supported languages are registered centrally in:

* `app/src/i18n/languages.ts`

The language UI is implemented as a dropdown in:

* `app/src/components/shared/LanguageSelect/LanguageSelect.tsx`

### Why A Dropdown Was Chosen

The previous implementation was a toggle between two languages.

That works only as long as exactly two languages exist.

A dropdown is a better architectural choice because:

* it scales to more languages without redesign
* it makes the current language explicit
* it keeps the control stable when more locales are added later

## Global State

Global state is intentionally small and reserved for cross-cutting UI concerns.

Current shared state:

* theme selection
* sidebar collapsed state

Topic-specific interaction state stays local to the topic page shell unless there is a clear reason to share it globally.

This keeps the store focused and avoids unnecessary coupling between unrelated pages.

## How To Add A New Topic

Recommended workflow:

1. Create the topic folder under `app/src/pages/FundamentalsCS/<Topic>/`.
2. Add topic-specific components in `components/`.
3. Add exercise definitions in `exercises/index.ts`.
4. Create `<Topic>Page.tsx` and bind the topic to `ModuleTopicPage`.
5. Register the topic once in `app/src/features/modules/catalog.tsx`.
6. Add all required translation keys in both locale files.

Minimal page example:

```tsx
import { ModuleTopicPage } from "@/features/modules/ModuleTopicPage";
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

Minimal catalog registration:

```tsx
{
  id: "example-topic",
  titleKey: "example.title",
  descriptionKey: "example.description",
  path: "/fundamentals-cs/example-topic",
  icon: SomeIcon,
  accent: "blue",
  element: <ExampleTopicPage />,
}
```

## How To Add New Exercises To A Topic

Recommended workflow:

1. Open `app/src/pages/FundamentalsCS/<Topic>/exercises/index.ts`.
2. Add a new exercise definition object.
3. Add the corresponding translation keys in `de` and `en`.
4. Do not change the shared exercise renderer unless the behavior itself must change for all topics.

Example:

```ts
{
  titleKey: "example.exercise5",
  descriptionKey: "example.exercise5Desc",
  difficulty: "medium",
  icon: SomeIcon,
}
```

Then add:

* `example.exercise5`
* `example.exercise5Desc`

to both translation files.

## How To Add A New Language

Recommended workflow:

1. Create a new locale file under `app/src/i18n/locales/`.
2. Register the locale in `app/src/i18n/index.ts`.
3. Add the language code to `app/src/i18n/languages.ts`.
4. Ensure the translations required by shared components are present.

Because the language selector uses the centralized supported language list, the dropdown will then expose the new language automatically.

## Tradeoffs And Boundaries

The current structure intentionally keeps topics under `pages/FundamentalsCS/` because the project currently represents one course family with multiple topics.

This is a pragmatic choice for the current scope because it balances:

* readability
* low refactor risk
* modularity
* maintainability

If the application later expands into multiple separate course families, a broader structure such as `pages/<ModuleFamily>/...` or a more feature-centric multi-module organization may become worthwhile.

## Summary Of The Main Architectural Decisions

The most important decisions are:

* one central module catalog for routing and navigation
* one shared topic shell for all learning topics
* one shared module overview shell for all module landing pages
* topic-local exercise definitions with shared rendering
* reusable page intro and info-grid components for consistent informational layouts
* centralized language registry with a dropdown-based language selector

These decisions were chosen because they increase consistency and modularity while keeping the structure understandable for a student project.
