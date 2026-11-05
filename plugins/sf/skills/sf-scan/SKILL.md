---
name: sf-scan
description: Sofactory repo scan. Use when the user wants a repo mapped, a project brief written, or a ranked list of improvements to pick from, or before the first Sofactory build in a repo.
---

# Scan this repo

Goal: a short brief that every later role reads, and a ranked list of improvements the user picks from.

Follow the conventions in the `sf-go` skill for questions, subagents and status. The scout's instructions are in `roles/scout.md` next to this file.

1. Create `.sofactory/` if missing and add `.sofactory/` to `.git/info/exclude`, unless the user wants it committed.
2. Write `.sofactory/status.json` with `"phase":"scanning"`.
3. Run the **scout** role (a subagent if your client has them) with the task "Map the repository in the current directory." For a large monorepo, run one scout per top-level package, in parallel if your client can, and merge the results.
4. Save the scout's `## Brief` section to `.sofactory/brief.md`, with today's date and the current commit (`git rev-parse --short HEAD`) at the top. Save the candidates JSON to `.sofactory/candidates.json`.
5. Rank the candidates by `impact * 2 - effort`, where effort is S=1, M=2, L=3. Break ties by lower risk. Drop anything the brief shows is already done.
6. Show the user the brief's first 10 lines with the file path, and a table of the top candidates: rank, title, why (one line), effort, risk, and impact as stars (`★★★★☆`).
7. Ask, allowing several picks: "Which improvements should the factory take on?" Offer the top 4 (label: the title; description: why, effort and risk). The user can also type their own ask.
8. Write the picks to `.sofactory/queue.json`, then take them one at a time, highest ranked first, into the `sf-spec` skill.
