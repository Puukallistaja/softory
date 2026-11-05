---
name: build
description: Softory build. Use when the user wants a spec built by agents - preview and approve, builder and reviewer loop, verifiers on edge-risk tasks, then a GitHub PR. Takes a spec path, or uses the newest spec in .softory/specs/.
---

# Build one spec

You are the orchestrator. You don't write the code yourself: the builder does. You keep the loop, the limits, the run log, and the user informed. The orchestration lives here, so never ask a role to orchestrate other roles.

Follow the conventions in the `go` skill for questions, subagents, status cards and the status file. The role instructions are in `roles/builder.md`, `roles/reviewer.md` and `roles/verifier.md` next to this file.

## Running the roles

- Run each role as a subagent if your client has them, and wait for it to finish. A subagent left running in the background can't show the user permission prompts, so the builder can't run tests and the verifier can't verify.
- Run the verifiers in parallel if your client can start several subagents at once; otherwise run them one after another.
- Before the build, check that the builder and verifier will be able to run the project's test command (from the brief). If a role reports that a command was denied, stop and ask the user to allow it, then retry. Never quietly do a role's job yourself. A flow the verifier couldn't run is `unverified`, not `pass`.
- To send findings back to the **same** builder, continue that subagent if your client can message it again. If it can't, start a new builder with the spec, the output of `git diff $BASE` and the findings, and log `"findings_to":"fresh"` in the run log.

## Limits

These are defaults; the user can change them at the preview.

- Review: at most **3 rounds**. Blocking findings go back to the same builder.
- Verify: only for `risk: edge`, at most **2 rounds**, one verifier per acceptance flow.
- Budget: stop and escalate past 2,000,000 role tokens or 90 minutes in total, when your client reports them.

## Run folder and status file

Pick `RUN = <yyyymmdd-hhmm>-<slug>`. Create `.softory/runs/$RUN/`, write `$RUN` to `.softory/current-run`, and copy the spec there as `spec.yaml`.

Keep these files current, because they are the run's observability:

- `events.jsonl`: one JSON line per event, appended with whatever file-writing tool you have. The format is `{"ts":"<ISO>","type":"phase|agent|finding|verdict|outcome",...}`. For every role that returns, log `{"type":"agent","role":"builder","label":"builder-1","phase":"build","round":1,"tokens":N,"tool_uses":N,"ms":N}`, using `null` for anything your client doesn't report.
- `findings.json`: every finding, with an id (`f-1`, `f-2`...), its source, round, severity, claim and status (`open`, `fixed` or `wontfix`).
- `.softory/status.json`: overwrite it at every phase change:
```json
{"run":"<RUN>","title":"<spec title>","phase":"building","round":1,"maxRounds":3,
 "agents":[{"label":"builder-1","role":"builder","status":"running","tokens":0,"ms":0}],
 "findings":{"open":0,"fixed":0},"pr_url":null,"updated":"<ISO>"}
```
`phase` is one of `awaiting_approval`, `building`, `reviewing`, `fixing`, `verifying`, `publishing`, `human_review`, `done`, `escalated` or `failed`.

## 1. Preview and approve

Read the spec and `.softory/brief.md`, then show a preview card:
- The title, the goal in one line, the risk tag, and the acceptance flows as a checklist.
- A plan table with columns for phase, role, model and limit. For example: `build | builder | session model | —`, `review | reviewer | session model | ≤3 rounds`, `verify | verifier ×<flows> | smaller model | ≤2 rounds (edge only)`.
- The branch name `softory/<slug>` and its base branch.
- A rough usage estimate: routine work is about 150k to 400k tokens and edge work about 400k to 1.2M. Remind the user this counts against their plan or API bill.

Set the phase to `awaiting_approval` and ask "Start this run?" with "Approve and run (Recommended)", "Change limits or models", "Edit the spec" and "Cancel". Do nothing irreversible before Approve.

## 2. Build

- Check that the worktree is clean with `git status --porcelain`. If it isn't, ask whether to stash, commit or stop.
- Record `BASE=$(git rev-parse HEAD)` in the run folder, then run `git checkout -b softory/<slug>`.
- Run the **builder** (label `builder-1`) with the full spec as YAML plus: "The workspace root is your current directory. You are on branch softory/<slug>. Start." Keep a handle on it so you can continue it later.

## 3. Review loop (up to 3 rounds)

For round r = 1 to 3:
1. Set the phase to `reviewing`. Run a **new** reviewer each round, for fresh eyes. Give it the spec, `Review round: r`, and the BASE sha so it reads the diff with `git diff $BASE`. From round 2 on, also pass the findings already fixed, so it checks those instead of reporting them again.
2. Parse the JSON block at the end of its reply and record the findings. Show a card with the round, the blocking and minor counts, and the blocking claims as a list.
3. If there are no blocking findings, leave the loop. Note any `needs_verification` findings for step 4.
4. Otherwise set the phase to `fixing` and send the blocking findings to the same builder: "Findings to address (from the reviewer): - [f-3] (blocking) src/x.ts:42: <claim>. Evidence: <evidence>. Fix every blocking finding. Then re-check your work and reply with what you changed."
5. If blocking findings remain after round 3, the outcome is `escalated`. Go to step 5 and open a draft PR.

## 4. Verify (edge risk only, up to 2 rounds)

Skip this when the spec is `risk: routine` and no finding has `needs_verification`.

For round v = 1 to 2:
1. Set the phase to `verifying`. Run one **verifier** per acceptance flow. Give each `Verify round: v`, `Flow id: <id>`, the flow description and the full spec.
2. Show a card with one row per flow: ✅ or ❌ and a line of evidence.
3. If every flow passes, you're done. Otherwise send the failing flows' findings to the same builder as in step 3. If v = 1, run one quick review round on the new diff, then re-verify only the flows that failed.
4. If flows still fail after round 2, the outcome is `escalated`.

## 5. Publish the PR

Set the phase to `publishing`. Write `report.md` in the run folder with the outcome, the spec, what the builder did (its last summary), a findings table with statuses, a verification table, a role usage table from events.jsonl, and the remaining risks.

1. Commit on the branch, leaving out `.softory/`: `git add -A && git commit -m "<spec title>" -m "<goal>"`.
2. Push with `git push -u origin softory/<slug>`.
3. Open the PR with `gh pr create --title "<title>" --body-file <report.md>`, adding `--draft` when the outcome is escalated. If `gh` is missing or signed out, use any GitHub tool your client has. If nothing works, give the user the compare URL and the report to paste.
4. Save the PR URL in status.json and events.jsonl.

Pushing and opening a PR are outward-facing. The Approve click in step 1 covers them, but if the remote isn't GitHub, or the user said "local only", stop after the commit.

## 6. Hand over

Set the phase to `human_review`. Show a final card with the outcome, the PR link, rounds used, findings fixed and open, and total tokens and time by role (a small table with text bars). Then ask "PR is up. What next?" with "Walk me through the review (Recommended)", which moves to the `review` skill, "Show the stats", which moves to `stats`, and "Done for now".

## Escalation

If the budget runs out, the goal turns out to be impossible, or the rounds run out: stop the loop, keep the work committed on the branch, open the PR as a draft, and tell the user exactly what is unresolved and what you'd try next.
