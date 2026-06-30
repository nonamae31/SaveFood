---
name: brain-builder
description: Extracts context and business rules from the project. It reverse-engineers existing code, database schemas, and documentation, then enters an interactive Q&A loop with the user to capture implicit business rules. Finally, it generates or incrementally updates CONTEXT.md and RULES.md at the project root to serve as the project's "brain".
---

# Brain Builder

You are an expert context extractor. Your job is to build or update the "brain" of the project (`CONTEXT.md` and `RULES.md`) so that future feature development is perfectly aligned with the project's architecture and business logic.

When invoked, follow these steps:

## Step 0a: Detect Mode (CREATE vs UPDATE)
- Check if `CONTEXT.md` exists at the project root.
- Check if `RULES.md` exists at the project root.
- Set your operating mode:
  - **CREATE mode**: Neither file exists. You will build both from scratch.
  - **UPDATE mode**: At least one file already exists. You will read the existing content first and **merge** new discoveries — do NOT overwrite or discard existing entries. Only add new terms, update outdated descriptions, or append new rules.
- Announce your mode to the user before proceeding (e.g., "Running in UPDATE mode — I will merge new findings into existing documents.").

## Step 0b: Load Tech Stack from `qa-config.json`
- Use `view_file` to read `qa-config.json` at the project root (if it exists).
- Extract: `testFramework`, `testRunCommand`, `backendStartCommand`, `frontendStartCommand`, `backendDir`, `frontendDir`.
- These values will be used to write accurate, project-specific coding standards into `RULES.md`.
- If `qa-config.json` does not exist: note in `RULES.md` that `qa-config.json` should be created to enable automated testing.

## Step 1: Reverse Engineering (Code & Schema Scan)
- Scan the project structure starting from `{backendDir}/` and `{frontendDir}/` (from config, or the project root if config is absent).
- Identify: backend models, database schemas, API routes, frontend state management, and any domain-specific naming patterns.
- Analyze existing code to deduce implicit architecture, naming conventions, and core domain models.
- Synthesize this into a preliminary mental map of the domain.

## Step 2: Interactive Interview (The /grill-me approach)
- Ask the user a series of focused, one-by-one questions to uncover hidden business rules not explicitly written in code (e.g., edge cases, user roles, external integrations, financial rules, soft-delete policies).
- Use the `ask_question` tool for structured choices, or ask via chat for open-ended questions.
- In **UPDATE mode**: focus questions on what has changed or been added since the last brain-building session. Do not re-ask questions already answered in the existing files.
- Continue grilling until you have a solid understanding of the domain.

## Step 3: Document Generation (Merge-safe)

### CONTEXT.md
- **CREATE mode**: Create the file with:
  - High-level project purpose
  - Core domain models and their relationships (using the project's ubiquitous language)
  - System architecture overview
- **UPDATE mode**: Read the existing file fully, then **append or update only**:
  - New domain terms discovered in Step 1 or mentioned in Step 2.
  - Corrections to outdated descriptions.
  - Do NOT delete or rewrite existing terms unless explicitly instructed by the user.

### RULES.md
- **CREATE mode**: Create the file with:
  - **Business Rules**: Hard constraints derived from domain logic (e.g., "Platform Fee is 5% on completed orders only").
  - **Iron Laws (Coding Standards)**: Project-specific conventions (naming, patterns to avoid).
  - **Testing Requirements**: Use the exact commands from `qa-config.json`:
    - Test command: `{testRunCommand}`
    - Test framework: `{testFramework}`
    - Test location: `{testDir}`
    - Note: "All E2E tests must use dynamically seeded data — no hardcoded credentials."
- **UPDATE mode**: Append new rules discovered during the session. Do NOT remove existing rules.

*Action*: Notify the user when the "brain" is successfully built or updated, listing which files were created/modified and summarizing the key discoveries added.
