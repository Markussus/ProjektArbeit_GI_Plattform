# Tech Stack

This document summarizes the current tech stack of the GI Learning Platform based on the code.

## Overview

The project is currently a frontend-only single-page application.

Main stack:

* React 19
* TypeScript 5
* Vite 8
* React Router 7
* i18next + react-i18next
* Zustand
* Tailwind CSS 4
* Lucide React

Currently not part of the system:

* no backend
* no database
* no API integration
* no SSR/SSG
* no automated test framework

## Runtime and Tooling

* Node.js `22` is defined in `app/.nvmrc`.
* `npm` is used as package manager.
* Vite is used for development, build, and preview.
* TypeScript is used across the whole frontend with strict compiler settings.
* ESLint and Prettier are configured for code quality and formatting.

Relevant files:

* `app/package.json`
* `app/vite.config.ts`
* `app/tsconfig.app.json`
* `app/eslint.config.js`
* `app/prettier.config.cjs`

## Frontend Architecture

### React

React is the core UI technology. The application is built from reusable components, layouts, and pages.

Used in:

* `app/src/main.tsx`
* `app/src/App.tsx`
* `app/src/components`
* `app/src/layouts`
* `app/src/pages`

### React Router

Routing is handled on the client with `createBrowserRouter`.

Used in:

* `app/src/router/index.tsx`
* `app/src/App.tsx`

Routes for learning topics are generated from the central module registry in `app/src/data/moduleCatalog.tsx`. This avoids duplicating route definitions in multiple places.

### TypeScript

TypeScript is used for all application code and shared interfaces.

Important uses:

* shared types in `app/src/types`
* module and topic definitions in `app/src/data/moduleCatalog.tsx`
* typed translation keys in `app/src/types/i18n.ts` and `app/src/types/i18next.d.ts`

## UI and Styling

### Tailwind CSS

Tailwind CSS is the main styling system. It is combined with CSS variables for theming and semantic design tokens.

Used in:

* `app/src/index.css`
* `app/tailwind.config.js`
* `app/vite.config.ts`

The project includes:

* light and dark themes
* semantic color variables
* module-specific accent colors
* utility-based component styling

### Fonts and Icons

* `@fontsource-variable/geist` is used for typography.
* `lucide-react` is used for icons in navigation, cards, exercises, and controls.

### shadcn / design-system setup

The repository contains shadcn-related setup in `app/components.json` and imports `shadcn/tailwind.css` in `app/src/index.css`.

Current state:

* shadcn styling is prepared
* custom shared components are used instead of generated shadcn UI components

## Internationalization

Internationalization is a built-in part of the architecture.

Used libraries:

* `i18next`
* `react-i18next`
* `i18next-browser-languagedetector`

Used in:

* `app/src/i18n/index.ts`
* `app/src/i18n/languages.ts`
* `app/src/i18n/locales/de/translation.json`
* `app/src/i18n/locales/en/translation.json`

The app currently supports:

* German
* English

Language detection uses browser settings and `localStorage`.

## State Management

Global state is intentionally kept small and is managed with Zustand.

Used in:

* `app/src/store/themeStore.ts`
* `app/src/store/uiStore.ts`

Current global state includes:

* theme selection
* sidebar collapsed state

Most feature state remains local in React components and hooks, for example tab state, selected exercises, and simulation focus mode.

## Content and Module Structure

The project uses a clear split between shared UI and topic-specific content.

Shared infrastructure:

* `app/src/components/shared`
* `app/src/layouts`
* `app/src/router`
* `app/src/store`
* `app/src/i18n`

Topic-specific content:

* `app/src/pages/FundamentalsCS/<Topic>`

The central file `app/src/data/moduleCatalog.tsx` acts as the single source of truth for:

* learning modules
* topics
* paths
* icons
* rendered page elements

This supports a modular structure and makes new topics easier to add.

## Current Limitations

The current implementation is intentionally simple:

* all content is stored in the frontend
* there are no HTTP requests in the current `src` code
* there is no persistence beyond browser storage
* simulation areas are structurally prepared, but not yet backed by complex logic

## Installed but Not Actively Used in `src`

Some dependencies exist in `app/package.json` but are not currently used directly in the application code:

* `class-variance-authority`
* `radix-ui`
