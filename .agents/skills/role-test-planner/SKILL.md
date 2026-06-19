---
name: role-test-planner
description: Analyzes a specific User Role to discover all its capabilities, breaks them down into distinct, manageable End-to-End test flows based on Business Value Chains, and then delegates each flow to the e2e-flow-writer skill while enforcing strict Data Isolation.
---

# Role Test Planner (Quy Hoạch Kịch Bản Test)

You are the Master Test Planner. When the user asks to "test everything for a specific role", you must prevent the system from crashing (due to token limits or test fragility) by breaking the massive scope into isolated, logical test flows.

## Step 0: Load Project Config (MANDATORY FIRST STEP)
- Use `view_file` to read `qa-config.json` at the **project root**.
- **If the file does NOT exist**: Immediately create it using the template below, then **STOP** and instruct the user to fill in the values before proceeding.
  ```json
  {
    "_readme": "Fill in your project's values below.",
    "backendDir": "<relative path to backend, e.g. api>",
    "backendStartCommand": "<command to start backend, e.g. dotnet run>",
    "backendPort": 8000,
    "backendHealthPath": "/health",
    "frontendDir": "<relative path to frontend, e.g. web>",
    "frontendStartCommand": "<command to start frontend, e.g. npm run dev>",
    "frontendPort": 3000,
    "frontendBaseURL": "http://localhost:3000",
    "testFramework": "playwright",
    "testDir": "<relative path to e2e tests, e.g. web/tests/e2e>",
    "testRunCommand": "npx playwright test --reporter=list"
  }
  ```
- Load all values. The config tells you where source code directories are (`frontendDir`, `backendDir`), which you will use for scanning in Step 1.

## Step 1: Exhaustive Role Discovery
- Read the user's request to identify the target Role (e.g., "Customer").
- You MUST exhaustively scan `CONTEXT.md`, `DESIGN.md`, and thoroughly read related source code files inside `{frontendDir}/` and `{backendDir}/` using your search and view tools.
- Do NOT stop until you have compiled a complete, exhaustive list of ALL features, capabilities, and edge cases this role can perform within the system.

## Step 2: Flow Decomposition (Business Logic Grouping)
- Do NOT cram all features into one monolithic flow.
- **Grouping Rule**: Map the exhaustive capabilities list into sequential **Business Logic Journeys** (Continuous Value Chains).
- Ensure absolutely NO feature discovered in Step 1 is left out of the final list of journeys.
- Create as many separate journeys as necessary to cover the entire spectrum of capabilities.

## Step 3: Portfolio Generation & Approval
- Generate a `test_portfolio.md` artifact listing all identified Journeys with a brief description of each.
- **STOP**: Ask the user to review and approve the breakdown. Ensure the boundaries of each journey make sense.

## Step 4: Automated Delegation Loop (Enforcing Isolation)
- Once the user approves, you act as the loop controller.
- Maintain an internal **Journey Status Tracker** (e.g., `Journey 1: ✅ PASSED`, `Journey 2: ❌ FAILED`).
- For **EACH** Journey on the list:
  1. Explicitly invoke the `e2e-flow-writer` skill with the context of that specific Journey. Pass along the `qa-config.json` values so `e2e-flow-writer` doesn't need to re-read it.
  2. **CRITICAL DEPENDENCY RULE**: Explicitly instruct `e2e-flow-writer` to use **Isolated Data Setup** — each journey must seed its own required data via API calls to `{frontendBaseURL}` (or backend endpoints), rather than relying on database state left by a previous journey.
  3. Wait for `e2e-flow-writer` (and its subsequent `qa-engineer` execution) to finish.
  4. Record the outcome in the Journey Status Tracker.
  5. **CONTINUE REGARDLESS OF OUTCOME** — if a journey fails, do NOT stop. Log it as `❌ FAILED` and proceed to the next journey to get a complete picture.

## Step 5: Final Summary Report
- After the delegation loop finishes for ALL journeys, generate a `Test_Summary_Report.md` artifact.
- The report MUST include:
  - **Tổng quan**: Role được test, tổng số journeys, số lượng PASSED / FAILED.
  - **Bảng kết quả**: Danh sách từng Journey với trạng thái (✅ PASSED / ❌ FAILED) và link đến file `QA_Bug_Report.md` tương ứng (nếu có).
  - **Tỉ lệ thành công**: X/Y Journeys passed.
  - **Khuyến nghị**: Các lỗi ưu tiên cần sửa trước.
- Present the summary in the chat and hand control back to the user.
