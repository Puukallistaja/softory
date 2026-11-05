---
name: spec
description: Sofactory grill-me spec interview. Use when the user wants to turn an idea, bug or improvement into a build spec, says "spec this", "grill me", or before /sf:build when no spec exists.
argument-hint: "[the ask or an improvement title]"
---

# Grill out a spec

Goal: a spec the builder can finish without asking anything, and the user agrees is what they want. Interview relentlessly but efficiently.

## How to interview

- **One question per `AskUserQuestion` call.** Each question comes with your suggested answer as the first option, labelled "<answer> (Recommended)", plus 1-3 real alternatives. Base the suggestion on the code and `.sofactory/brief.md`: read the relevant code before asking, and never ask what the code already answers.
- Ask in this order, skipping what is already clear: the outcome (what is true when done), who or what notices, scope edges (what is explicitly out), constraints (APIs to keep stable, performance, compatibility), acceptance flows (how we would show it works), and risk.
- Push on vague words. "Fast" → how fast, measured where. "Handle errors" → which errors, what the user sees.
- Stop when every acceptance flow is concrete enough that the verifier could run it. Usually 4-8 questions. Never more than 12; if you hit that, show the draft and ask what is still unclear.

## Risk tag

Tag `risk: edge` when the change touches concurrency, sync, caching, auth, payments, data migrations, browser flows, or anything the brief lists as weakly tested. Otherwise `routine`. Suggest the tag as a question with your reasoning; the user decides.

## Output

Write `.sofactory/specs/<slug>.yaml` in this format (same as the TypeScript harness):

```yaml
title: Merge offline edits on reconnect
goal: >
  One paragraph: the outcome, not the steps.
risk: edge            # routine | edge
constraints:
  - Keep the public API of src/feature.ts stable
acceptance:
  - id: offline-edit-roundtrip
    description: Edit a note offline, reconnect, and the edit appears on a second device
```

Then show the spec in a fenced block and ask with `AskUserQuestion`: "Spec ready. What next?" — "Preview the run (Recommended)" (hands over to the `build` skill), "Edit the spec", "Save for later".
