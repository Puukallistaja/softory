---
name: go
description: Softory software factory, end to end. Use when the user wants the factory to work on a repo, says "factory", "softory" or "sf", asks agents to build something for them, or asks what to work on next in this repo.
---

# Softory: the whole factory

You orchestrate a small software factory in this session. Roles do the work (scout, builder, reviewer, verifier); you route work between them, keep the run log, and talk to the user. The user's ask, if they gave one, is the text after the command.

## The stages

1. **Scan.** If `.softory/brief.md` is missing or more than 50 commits old, use the `scan` skill first. It writes the brief and offers ranked improvements.
2. **Spec.** Use the `spec` skill to interview the user for a spec, for their ask or the improvement they picked.
3. **Preview and approve.** The first step of the `build` skill.
4. **Build, review, verify, PR.** The `build` skill.
5. **Human review.** The `review` skill: a guided walkthrough of the PR.
6. **Stats.** The `stats` skill, whenever the user asks how runs went or what they cost.

Go stage by stage. Between stages, say in one line what finished and what comes next, and ask whether to continue: "Continue to <next stage> (Recommended)" or "Stop here".

## Conventions for every Softory skill

- **Questions are choices.** Ask each question as multiple choice: at most 4 options, short labels, your recommendation first with "(Recommended)" after its label, and one line on what each option does. Use your client's multiple-choice question tool if it has one, so the user can click; otherwise write a numbered list and wait for a number or a typed answer.
- **Roles run as subagents when your client has them.** Each role's instructions are a Markdown file in the skill that uses it (`build/roles/`, `scan/roles/`). Start the role as a subagent with a fresh context and give it that file as its instructions, plus the task. Some clients ship ready-made agents for these roles (the Claude Code plugin has `sf:builder`, `sf:reviewer`, `sf:verifier` and `sf:scout`); use those when present. Wait for each subagent to finish, so permission prompts reach the user and its usage numbers come back. If your client has no subagents, play the role yourself, following its file, and say in the run report that review and verification were not independent.
- **Status cards.** At each phase change show a compact Markdown card: a one-line heading, a table of roles (role, status, tokens, time, as far as your client reports them), and a text progress bar such as `review ███░░ round 2/3`.
- **Status file.** Write `.softory/status.json` at every phase change (schema in `build`). Optional panes and dashboards read it.
- **Files over memory.** Everything a later session needs goes under `.softory/`. Keep `.softory/` out of git by adding it to `.git/info/exclude`.
