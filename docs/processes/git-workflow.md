# Git Workflow

## Overview

This project follows a structured Git workflow to ensure code quality, traceability, and stable project states.

The repository uses two main long-lived branches:

-   `main` – stable, production-ready states
-   `development` – active integration branch for ongoing work

All development work is performed through short-lived feature branches.

------------------------------------------------------------------------

## Branch Strategy

### Main Branch (`main`)

-   Contains only stable and presentation-ready versions of the project
-   Represents milestones or validated intermediate results
-   Direct commits to `main` are not allowed

### Development Branch (`development`)

-   Central integration branch for all completed features
-   May contain work-in-progress but should remain functional at all times

### Feature Branches

-   Created from `development`

-   One branch per issue or work item

-   Naming convention:

    -   `develop/<workitem or issue id and name>`
    -   `fix/<short-description>`
    -   `docs/<short-description>`

Example:

```         
develop/80-initialize-vite-with-react-and-typescript
fix/import-parser
docs/git-workflow
```

------------------------------------------------------------------------

## Workflow Process

1.  Create or select an issue in GitLab
2.  Create a new branch from `development`
3.  Implement the feature or fix
4.  Commit changes with meaningful commit messages
5.  Open a Merge Request (MR) into `development`
6.  After approval, merge into `development`
7.  Periodically merge `development` into `main` for stable releases

------------------------------------------------------------------------

## Merge & Approval Rules

To ensure code quality and shared responsibility, the following rules apply:

### Merge into `development`

-   Requires **at least 1 approval**
-   Approval must come from **another team member**
-   The author of the MR cannot approve their own changes

### Merge into `main`

-   Requires **at least 2 approvals**
-   Approvals must come from **two different team members**
-   Only stable and reviewed code may be merged

------------------------------------------------------------------------

## Commit Guidelines

-   Each commit should be **small, focused, and meaningful**
-   Commit messages should clearly describe the change
-   Commit messages shall follow the conventional commit guidelines
-   If applicable, reference the related issue

Example:

```         
feat: add step-by-step simulation for Turing Machine
fix: handle invalid binary input
docs: update architecture description
```

------------------------------------------------------------------------

## Release Strategy

-   `main` is updated only when a stable state is reached
-   Each merge into `main` represents a **milestone or release candidate**
-   Use Git tags for important versions (e.g. `v0.1`, `v1.0`)

------------------------------------------------------------------------

## Goals of This Workflow

-   Maintain a stable `main` branch at all times
-   Enable parallel development through feature branches
-   Ensure code quality via reviews
-   Provide clear traceability between branches, issues, commits, and work items