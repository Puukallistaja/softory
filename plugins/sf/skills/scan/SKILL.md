---
name: scan
description: Sofactory onboarding scan of the current repo. Use when the user wants the repo scanned, a project brief written, or a ranked list of improvements to pick from, or before the first Sofactory run in a repo.
---

# Onboard this repo

Goal: a short brief that every later agent reads, and a ranked list of improvements the user can pick from with a click.

1. Create `.sofactory/` if missing, and add `.sofactory/` to `.git/info/exclude` (not `.gitignore`, so nothing is committed) unless the user wants it committed.
2. Write `.sofactory/status.json` with `"phase":"onboarding"` (schema in the `build` skill).
3. Spawn the `scout` subagent: "Map the repository in the current directory." For a large monorepo, spawn one scout per top-level package in parallel (all Agent calls in one message) and merge.
4. Save the scout's `## Brief` to `.sofactory/brief.md`, with today's date and the current commit (`git rev-parse --short HEAD`) at the top. Save the candidates to `.sofactory/candidates.json`.
5. Rank candidates by `impact * 2 - effort_cost` where S=1, M=2, L=3, ties broken by lower risk. Drop anything the brief shows is already done.
6. Show the user:
   - The brief's first 10 lines and a link to the file.
   - A table of the top candidates: rank, title, why (one line), effort, risk, impact as `★★★★☆`.
7. Ask with `AskUserQuestion`, `multiSelect: true`: "Which improvements should the factory take on?" with the top 4 as options (label = title, description = why + effort/risk). The user may also type their own ask.
8. For each picked item, hand it to the `spec` skill one at a time, starting with the highest ranked. Write the queue to `.sofactory/queue.json` so a later session can pick it up.
