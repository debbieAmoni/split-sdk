# Contributing to split-sdk

Thank you for your interest in contributing to StellarSplit! This repo is part of the [Drips Wave Program](https://drips.network/wave) — a monthly open-source bounty program run by the Stellar Development Foundation.

## Before You Start

**Do not begin coding until you have been assigned to an issue by a maintainer.**

1. Browse [open issues](../../issues) and find one labelled `good first issue` or matching your skill level.
2. Comment on the issue: "I'd like to work on this."
3. Wait for a maintainer to assign you. Only then should you fork and start coding.

## Workflow

### 1. Fork & Clone

```bash
git clone https://github.com/<your-username>/split-sdk.git
cd split-sdk
npm install
```

### 2. Create a Branch

```
fix/issue-NUMBER-short-description
feat/issue-NUMBER-short-description
```

```bash
git checkout -b fix/issue-42-short-description
```

### 3. Make Your Changes

- Write clean, well-typed TypeScript.
- Add or update tests in `test/`.
- Run `npm test` — all tests must pass.
- Run `npm run lint` — TypeScript must compile without errors.

### 4. Commit

Use conventional commits:

```
fix: handle undefined return from freighter signTransaction (#42)
feat: add retry logic to _submitTx (#7)
```

### 5. Open a Pull Request

- Title: concise, under 70 characters.
- Description: what changed, why, and how you tested it.
- Reference the issue: `Closes #42`

## Code Standards

- All exported functions and classes must have JSDoc comments.
- No `any` types unless absolutely necessary — document why.
- Keep functions small and focused.

## Questions?

Open a [Discussion](../../discussions) or ask in the issue thread.
