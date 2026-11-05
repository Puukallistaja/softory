---
name: build
description: Sofactory run. Use when the user wants a spec built by agents: preview and approve, builder→reviewer loop, verifier on edge-risk tasks, then a GitHub PR. Takes a spec path or the latest spec in .sofactory/specs/.
argument-hint: "[path to spec.yaml]"
---

# Run the factory on one spec

You are the orchestrator. You do not write the code yourself: the `builder` subagent does. You keep the loop, the limits, the run log and the user informed. Orchestration lives here; never ask a subagent to orchestrate other agents (subagents cannot spawn subagents).

## How to call subagents

- Always call the Agent tool with `run_in_background: false`. Foreground subagents can show the user permission prompts (a background one is silently denied, so the builder can't run tests and the verifier can't verify), and their result carries the token, tool-use and duration numbers you log.
- To run agents in parallel (verifiers), put all the Agent calls in one message; foreground calls in one message still run at the same time.
- Before the build, check that the builder and verifier can run the project's test command (from the brief). If a subagent reports that a command was denied, stop and ask the user to approve it or add it to `permissions.allow`, then retry; never quietly do the subagent's job yourself. A flow the verifier could not run is `unverified`, not `pass`.

## Limits (defaults; the user may change them at preview)

- Review: at most **3 rounds**. Blocking findings go back to the **same builder**.
- Verify: only when `risk: edge`. At most **2 rounds**. One verifier **per acceptance flow, in parallel**.
- Budget: stop and escalate if the run passes 2,000,000 total subagent tokens or 90 minutes.

## Run folder and status file

Pick `RUN = <yyyymmdd-hhmm>-<slug>`. Create `.sofactory/runs/$RUN/` and write `$RUN` to `.sofactory/current-run` (the trace hook tags events with it). Copy the spec there as `spec.yaml`.

Keep these files current; they are the observability layer:
- `events.jsonl` — one JSON line per event. Add lines with the Write tool (rewrite the file with the new line at the end); Bash redirects with variables often need a permission prompt. Format: `{"ts":"<ISO>","type":"phase|agent|finding|verdict|outcome","...":...}`. For every subagent that returns, log `{"type":"agent","role":"builder","label":"builder-1","phase":"build","round":1,"tokens":N,"tool_uses":N,"ms":N}` using the usage numbers in the Agent tool's result (write `null` if your build doesn't show them; `.sofactory/trace.jsonl` has them too).
- `findings.json` — every finding with an id (`f-1`, `f-2`...), source, round, severity, claim, status (`open|fixed|wontfix`).
- `.sofactory/status.json` (overwrite at every phase change; the live pane reads it):
```json
{"run":"<RUN>","title":"<spec title>","phase":"building","round":1,"maxRounds":3,
 "agents":[{"label":"builder-1","role":"builder","status":"running","tokens":0,"ms":0}],
 "findings":{"open":0,"fixed":0},"pr_url":null,"updated":"<ISO>"}
```
`phase` is one of `awaiting_approval, building, reviewing, fixing, verifying, publishing, human_review, done, escalated, failed`.

## 1. Preview and approve

Read the spec and `.sofactory/brief.md`. Show a preview card:
- Title, goal (one line), risk tag, acceptance flows as a checklist.
- Plan table: phase, agent, model, limit. E.g. `build | builder | inherit | —`, `review | reviewer | inherit | ≤3 rounds`, `verify | verifier ×<flows> | sonnet | ≤2 rounds (edge only)`.
- Branch name `sofactory/<slug>` and base branch.
- A rough usage estimate: routine ≈ 150k–400k tokens, edge ≈ 400k–1.2M, and the reminder that this counts against the user's plan limits.

Set phase `awaiting_approval`, then `AskUserQuestion`: "Start this run?" — "Approve and run (Recommended)", "Change limits or models", "Edit the spec", "Cancel". Do nothing irreversible before Approve.

## 2. Build

- Check the worktree is clean (`git status --porcelain`). If not, ask whether to stash, commit, or stop.
- Record `BASE=$(git rev-parse HEAD)` in the run folder, then `git checkout -b sofactory/<slug>`.
- Spawn `builder` (label `builder-1`) with the full spec as YAML plus: "The workspace root is your current directory. You are on branch sofactory/<slug>. Start." Keep its agent id: you will continue this same builder later.

## 3. Review loop (≤3 rounds)

For round r = 1..3:
1. Phase `reviewing`. Spawn a **new** `reviewer` each round (fresh eyes) with: the spec, `Review round: r`, and the instruction to read the diff with `git diff $BASE` (give the BASE sha). In round 2+, also pass the list of findings already fixed so it checks them rather than re-reporting.
2. Parse the trailing JSON. Record findings. Show a card: round, blocking/minor counts, the blocking claims as a list.
3. No blocking findings → leave the loop. Note any `needs_verification` findings for step 4.
4. Otherwise phase `fixing`: send the blocking findings back to the **same builder** — continue it by its agent id (`SendMessage` to that id, or the Agent tool's resume option, whichever your build has). Message: "Findings to address (from the reviewer): - [f-3] (blocking) src/x.ts:42: claim. Evidence: ... Fix every blocking finding. Then re-check your work and reply with what you changed." If your build cannot continue a subagent, spawn a new `builder` with the spec + `git diff $BASE` + the findings, and log `findings_to: fresh` in events.jsonl.
5. After round 3 with blocking findings left → outcome `escalated` (go to step 5 with a draft PR).

## 4. Verify (edge-risk only, ≤2 rounds)

Skip when `risk: routine` and no finding has `needs_verification`.
For round v = 1..2:
1. Phase `verifying`. Spawn one `verifier` per acceptance flow **in a single message so they run in parallel**. Each gets: `Verify round: v`, `Flow id: <id>`, the flow description, and the full spec.
2. Show a card: one row per flow with ✅/❌ and the one-line evidence.
3. All pass → done. Otherwise send the failing flows' findings to the same builder (as in 3.4), then — if v = 1 — run one quick review round on the new diff before re-verifying only the failed flows.
4. Still failing after round 2 → outcome `escalated`.

## 5. Publish the PR

Phase `publishing`. Write `report.md` in the run folder: outcome, spec, what the builder did (its last summary), findings table with status, verification table, agent usage table (from events.jsonl), and remaining risks.

1. Commit on the branch: `git add -A && git commit -m "<spec title>" -m "<goal>"` (exclude `.sofactory/`).
2. Push: `git push -u origin sofactory/<slug>`.
3. Open the PR with `gh pr create --title "<title>" --body-file <report.md>` (add `--draft` when escalated). If `gh` is missing or not signed in, try the GitHub MCP tools; if neither works, give the user the compare URL and the report to paste.
4. Save the PR URL into status.json and events.jsonl.

Pushing and opening a PR are outward-facing: they were approved at step 1, but if the remote is not GitHub or the user said "local only", stop after the commit.

## 6. Hand over

Phase `human_review`. Show a final card: outcome, PR link, rounds used, findings fixed/open, total tokens and time by role (a small table with text bars). Then `AskUserQuestion`: "PR is up. What next?" — "Walk me through the review (Recommended)" (→ `review` skill), "Show the dashboard" (→ `stats` skill), "Done for now".

## Escalation

On budget hit, impossible goal, or rounds exhausted: stop the loop, keep the work committed on the branch, open the PR as a draft, and tell the user exactly what is unresolved and what you would try next.
