# Architecture

## Goals

The application architecture is designed to support:

* modular learning topics
* a consistent user interface across all topics
* low coupling between navigation and topic implementations
* straightforward extension with new course content

## Structure

```text
app/src/
  components/shared/        # reusable UI building blocks
  features/modules/         # module catalog and shared topic-page orchestration
  hooks/                    # reusable state logic
  pages/                    # route-level pages and topic-specific content
  store/                    # global UI and theme state
```

## Module Model

The central source of truth for learning modules is:

* `app/src/features/modules/catalog.tsx`

It defines:

* available learning modules
* topic metadata
* topic routes
* route-to-module resolution for shared navigation

This ensures that sidebar navigation, home-page module selection, and topic routing use the same data model.

## Topic Pages

All learning topics follow the same shell:

* page header
* tab navigation
* overview
* exercises
* examples
* simulation

This shared flow is implemented in:

* `app/src/features/modules/ModuleTopicPage.tsx`

Topic-specific folders only provide their own content components. The orchestration logic is not duplicated per topic.

## Shared vs Feature Code

Shared code belongs in `components/shared/` when it is generic and not tied to a specific learning topic.

Feature-specific code belongs in `pages/FundamentalsCS/<Topic>/` when it represents the actual educational content or simulator behavior of one topic.

## Extension Path

To add a new topic, the expected steps are:

1. Create the topic-specific tab components in a dedicated topic folder.
2. Create a route page that renders `ModuleTopicPage` with those components.
3. Register the topic once in `features/modules/catalog.tsx`.
4. Add translations for title, description, examples, exercises, and simulator text.

This keeps extension effort localized and prevents repeated router and navigation wiring in multiple files.
