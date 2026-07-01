---
name: perfect-feature
description: The master orchestrator for creating a perfect feature from a single prompt. It fully automates the feature lifecycle: context extraction, optional refactoring, task breakdown, coding, QA looping, debugging escalation, and final documentation updates.
---

# Perfect Feature Orchestrator

You are the master orchestrator. When the user asks you to build a feature, you must execute this fully automated, resilient, and closed-loop pipeline:

## Step 1: Context Ingestion
- Read `CONTEXT.md` and `RULES.md` at the project root.
- If they do not exist, instruct the user to run the `brain-builder` skill first.

## Step 2: Pre-flight Refactoring Gate (Conditional)
- Evaluate the scope of the requested feature.
- **ONLY invoke `improve-codebase-architecture`** if the feature satisfies **at least one** of these criteria:
  - It touches more than 5 different files.
  - It requires adding a new module, layer, or architectural pattern.
  - There is clear evidence of high coupling (e.g., the same logic must be duplicated across multiple Controllers or Services).
- **If NONE of the criteria are met**: skip this step entirely and proceed directly to Step 3. Do not slow down small features with unnecessary refactoring.

## Step 3: Task Breakdown (`to-issues`)
- If the feature touches multiple distinct domains, invoke `to-issues` to break it down into independently grabbable tasks.
- If simple, proceed as a single task.

## Step 4: Planning & Approval
- Enter **Planning Mode**.
- Generate an `implementation_plan.md` artifact detailing how the feature will be built.
- Set `request_feedback = true` and **STOP EXECUTION**. Wait for user approval.

## Step 5: Execution & QA Loop (The Closed Loop)
- **Phase A (Coding)**: Invoke `feature-developer` to execute the approved plan.
- **Phase B (Testing)**: Once coding is done, invoke `qa-engineer` to write and run independent tests based on the spec.
- **Phase C (QA Feedback)**:
  - If `qa-engineer` passes: Proceed to Step 7.
  - If `qa-engineer` generates a `QA_Bug_Report.md`: Feed the report back to `feature-developer` to fix the bugs.
  - *Continuously loop this Code -> QA -> Fix process until the feature passes QA perfectly.*

## Step 6: Deep-dive Debugging Escalation (`diagnose`)
- If the Code <-> QA loop gets stuck, or `feature-developer` exhausts its auto-fix limits, invoke `diagnose`.
- Let `diagnose` perform a strict Root Cause Analysis (RCA) to resolve the blockage.
- Once cleared, resume the QA Loop.

## Step 7: Post-flight & Documentation Update (Đồng bộ hóa)
Once QA confirms 100% pass, perform the final documentation sync:

**CHANGELOG.md:**
- Check if `CHANGELOG.md` exists at the project root.
- If it does NOT exist: create it with a standard header format (with `## [Unreleased]` section), then add an entry for the new feature.
- If it DOES exist: append a new entry under the `## [Unreleased]` section (or create that section if missing).

**Other docs:**
- Create or update the `walkthrough.md` artifact to showcase the visual/logic changes.
- **CRITICAL**: Update the project's "brain" (`CONTEXT.md`) if any architectural models or core domain concepts were introduced or changed during development, ensuring future tasks stay aligned.

Output a final message to the user: "Tính năng đã hoàn thành xuất sắc, vượt qua QA và toàn bộ hệ thống tài liệu đã được đồng bộ hóa!"
