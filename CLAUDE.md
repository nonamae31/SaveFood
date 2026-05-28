# SaveFood — Agent Instructions

This repository contains **SaveFood**, a web application composed of a C# backend (`SaveFoodBackend`) and a React/TypeScript/Vite frontend (`frontend`).

## Build and Run Commands

- **Backend**: `dotnet build`, `dotnet run` inside `SaveFoodBackend/`
- **Frontend**: `npm install`, `npm run dev` inside `frontend/`

## Agent skills

### Issue tracker

Issues and PRDs live in the repo's GitHub Issues, using the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Using standard default labels for canonical triage roles. See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context repository structure (e.g. SaveFoodBackend and frontend). See `docs/agents/domain.md`.
