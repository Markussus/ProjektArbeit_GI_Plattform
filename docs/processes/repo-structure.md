# Repository Structure

## Overview

The repository is organized to clearly separate the application code from documentation and project-related artifacts.

---

## Top-Level Structure

```text
project-root/
  app/
  docs/
```

---

## app/

The `app` directory contains the complete source code of the web application.

This includes all implementation-related elements such as:

* frontend code
* application logic
* configuration files
* assets required to run the application

The internal structure of this directory is designed to support a modular and maintainable architecture, but is defined separately.

---

## docs/

The `docs` directory contains all non-code artifacts related to the project.

This includes:
* requirements and specifications (can also be done in gitlab)
* architectural decisions
* project management documentation
* meeting notes
* notes of AI usage
* presentation materials

The purpose of this separation is to keep the application code independent from documentation while still maintaining everything in a single repository.

---

## Goals of This Structure

* Clear separation between code and documentation
* Improved readability of the repository
* Support for structured project documentation