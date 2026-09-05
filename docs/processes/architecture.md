The topic-specific wrapper remains in:

* `app/src/pages/<ModuleName>/<Topic>/components/ExercisesTab.tsx`

This is intentional because the topic still owns the decision of which exercise list is bound into the shared renderer.

## Internationalization

Translations are organized in split modular JSON files per topic:

* `app/src/i18n/locales/de/<topic-name>.json`
* `app/src/i18n/locales/en/<topic-name>.json`
* Common shared strings: `app/src/i18n/locales/de/common.json` and `en/common.json`

All topic translation modules are registered and bundled into namespaces in:

* `app/src/i18n/index.ts`

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

* `app/src/data/moduleCatalog.tsx` via `learningRoutes`

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
* sidebar collapsed state (`app/src/stores/sidebarStore.ts`)

Topic-specific state stays local to the shared topic shell and topic hooks unless there is a real need to globalize it.

## How To Add A New Module

Recommended workflow:

1. **Create module folder:** Create `app/src/pages/<ModuleName>/`.
2. **Create landing page:** Create `<ModuleName>Page.tsx` rendering `<ModuleOverviewPage moduleId="<module-id>" />`.
3. **Register module metadata:** In `app/src/data/moduleCatalogData.ts`, add a new entry to `learningModules` with `id`, `titleKey`, `descriptionKey`, `path`, `icon`, and an empty `topics: []` array.
4. **Register lazy component:** In `app/src/data/moduleCatalog.tsx`, import `<ModuleName>Page` via `lazy(...)` and add it to `modulePageElements`.
5. **Add translations:** Add `titleKey` and `descriptionKey` to `app/src/i18n/locales/de/common.json` and `en/common.json` (or a dedicated module translation file registered in `app/src/i18n/index.ts`).

Minimal module page pattern:

```tsx
import { ModuleOverviewPage } from "@/components/shared/ModuleOverviewPage/ModuleOverviewPage";

export function ExampleModulePage() {
  return <ModuleOverviewPage moduleId="example-module" />;
}
```

Important note:

* the module only becomes visible in home navigation, header, sidebar, and router after it is added to `moduleCatalogData.ts` and `moduleCatalog.tsx`
* `router/index.tsx` automatically consumes `learningRoutes`, so no manual route entry is needed in the router itself

## How To Add A New Topic

Recommended workflow:

1. **Create topic directory:** Create `app/src/pages/<ModuleName>/<TopicName>/`.
2. **Add tab components:** Add `components/OverviewTab.tsx`, `components/ExamplesTab.tsx`, `components/ExercisesTab.tsx`, and `components/SimulationTab.tsx`.
3. **Add exercises:** Define topic exercises in `exercises/index.ts`.
4. **Create topic page:** Create `<TopicName>Page.tsx` using `ModuleTopicPage`.
5. **Register storage ID:** In `app/src/data/topicStorageIds.ts`, add a unique numeric storage ID to `TOPIC_STORAGE_IDS` (e.g. `exampleTopic: 9`).
6. **Register metadata:** In `app/src/data/moduleCatalogData.ts`, append a `ModuleTopicDefinition` to the respective module's `topics` array with `id`, `storageId`, `titleKey`, `descriptionKey`, `path`, `icon`, `accent`, and `tutorialVideoUrl`.
7. **Register lazy component:** In `app/src/data/moduleCatalog.tsx`, import `<TopicName>Page` via `lazy(...)` and register it in `topicPageElements`.
8. **Add topic translation files:** Create `app/src/i18n/locales/de/<topic-name>.json` and `app/src/i18n/locales/en/<topic-name>.json` containing all topic-specific strings, tabs, and exercise descriptions.
9. **Register in i18n bundle:** In `app/src/i18n/index.ts`, import both JSON files and mount them into the `de` and `en` resource objects under the `<topic-name>` namespace.

Minimal topic page pattern:

```tsx
import { ModuleTopicPage } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { ExamplesTab } from "./components/ExamplesTab";
import { ExercisesTab } from "./components/ExercisesTab";
import { OverviewTab } from "./components/OverviewTab";
