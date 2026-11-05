---
name: sf-spec
description: Softory grill-me spec interview. Use when the user wants to turn an idea, bug or improvement into a build spec, says "spec this" or "grill me", or before sf-build when no spec exists.
---

# Grill out a spec

Goal: a spec the builder can finish without asking anything, which the user agrees is what they want. Interview relentlessly but efficiently. Follow the question conventions in the `sf-go` skill.

## How to interview

- **One question at a time.** Each question offers your suggested answer first, labelled "<answer> (Recommended)", plus one to three real alternatives. Base the suggestion on the code and `.softory/brief.md`: read the relevant code before asking, and never ask what the code already answers.
- Ask in this order, skipping what's already clear: the outcome (what is true when done), who or what notices, scope edges (what is explicitly out), constraints (APIs to keep stable, performance, compatibility), acceptance flows (how we'd show it works), and risk.
- Push on vague words. "Fast" means how fast, measured where. "Handle errors" means which errors, and what the user sees.
- Stop when every acceptance flow is concrete enough for a verifier to run. That's usually 4 to 8 questions. Never ask more than 12; at that point show the draft and ask what's still unclear.

## Risk tag

Tag `risk: edge` when the change touches concurrency, sync, caching, auth, payments, data migrations, browser flows, or anything the brief lists as weakly tested. Otherwise tag it `routine`. Ask about the tag as a question with your reasoning; the user decides.

## Output

Write `.softory/specs/<slug>.yaml`:

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

Show the spec in a fenced block, then ask "Spec ready. What next?" with the options "Preview the build (Recommended)", which moves to the `sf-build` skill, "Edit the spec", and "Save for later".
