---
name: feature-developer
description: Automates the end-to-end lifecycle of building a new feature. Takes a raw feature prompt, expands it into a strict specification, and drives a self-correcting loop of coding, terminal testing, and UI testing before providing a concise completion report. Use this whenever the user wants to build a new feature or component.
---

# Feature Developer Lifecycle

You are acting as a strict, automated feature development engine. Your goal is to guide the user's initial feature request through a complete lifecycle: from prompt expansion to coding, automated testing, and self-correction.

When this skill is invoked, follow these steps strictly in order:

## Step 1: Prompt Expansion (Planning)
Take the user's initial prompt and formulate a detailed, strict instruction set.
The detailed prompt MUST structure the work by defining:
- **Required Context**: Identify and read relevant project documentation (e.g., `CONTEXT.md`, `RULES.md`).
- **LOCKED_DIRECTORY**: Explicitly state the boundaries of where code can be created or modified.
- **Component/File Checklist**: A clear list of files to be created/modified.
- **Iron Laws (Rules)**: Reiterate the project's critical constraints from `RULES.md` if available.
- **Testability**: Ensure instructions include adding `data-testid` attributes to UI elements.

*Action*: Outline this plan and ensure you understand the boundaries before writing code.

## Step 2: Implementation (Code)
Implement the code exactly as planned.
- Confine all changes to the `LOCKED_DIRECTORY`.
- Write the necessary business logic, UI components, and test files.

## Step 3: Terminal Testing (Unit/Component/Lint)
Verify the code via terminal commands.
- **Read `qa-config.json`** at the project root to determine the correct test command (`testRunCommand`) and test directory (`testDir`).
- Run the project's tests using `{testRunCommand}` and run the linter if a lint script exists (e.g., `npm run lint`).
- If `qa-config.json` does not exist: skip automated tests, only run lint if a lint script is detectable from `package.json`.
- Analyze the terminal output for failures.

## Step 4: UI Testing (browser_subagent)
If the feature contains a UI surface, you MUST use the `browser_subagent` tool.
- **Before calling `browser_subagent`**: Read `qa-config.json` to get `frontendPort` and `frontendStartCommand`.
  - Probe `http://localhost:{frontendPort}` using `run_command`: `Invoke-WebRequest -Uri http://localhost:{frontendPort} -UseBasicParsing -ErrorAction SilentlyContinue`.
  - If NOT running: use `run_command` with `WaitMsBeforeAsync: 3000` to start `{frontendStartCommand}` inside `{frontendDir}/` as a **background task**. Wait at least 5 seconds before invoking `browser_subagent`.
  - If `qa-config.json` does not exist: warn the user that the dev server must be running manually before proceeding.
- Instruct the subagent to open the local development server URL (`{frontendBaseURL}` from config, or `http://localhost:5173` as default).
- Direct the subagent to interact with the UI using the `data-testid` attributes you implemented.
- Check the subagent's return report and screenshots to verify visual correctness and interaction flows.

## Step 5: Self-Correction Loop & Escalation
If errors occur during Step 3 or Step 4:
- Analyze the logs or subagent feedback.
- Apply a fix to the code.
- Re-run the failed tests.
- **LIMIT**: You must limit this auto-fix loop to a maximum of **3 attempts**.
- **ESCALATION**: If the tests still fail after 3 attempts, you MUST immediately invoke the `diagnose` skill. Let the `diagnose` skill perform a deep root cause analysis to fix the bug. Do not simply stop and ask the user unless `diagnose` also completely fails.

## Step 6: Reporting & Completion
Once all tests pass:
- Print a concise, short summary message in the chat.
- State clearly what was completed.
- List the specific files that were affected (created/modified).
- Do not create a large Artifact file for the report; a brief chat message is sufficient.
