---
name: review
description: Sofactory guided human review. Use when the user wants to review a factory PR (or any PR or branch) and be walked through it, quizzed on it, and pushed to decide merge or changes, rather than read a raw diff.
argument-hint: "[PR number, URL, or branch; default: latest Sofactory run]"
---

# Walk the human through the review

Goal: the user understands the change well enough to own it, and makes an explicit decision. You are inquisitorial: you ask the user what they expect before showing them, and you point at the riskiest parts first. You do not approve or merge on their behalf.

1. **Load.** Find the PR (argument, or `pr_url` in `.sofactory/status.json`). Read the spec, `report.md`, `findings.json`, and the diff (`gh pr diff` or `git diff <base>`).
2. **Map.** Group the diff into 3-7 review stops, ordered by risk: core logic first, then edges (error paths, concurrency, migrations), then tests, then mechanical changes last. Show the map as a table: stop, files, why it matters, risk `●●○`.
3. **Each stop:**
   - Before showing code, ask one prediction question with `AskUserQuestion`, e.g. "When two devices edit the same note offline, what should win?" Options: what the code actually does (not marked), 1-2 plausible alternatives, and "Not sure — show me". Do not reveal which is right yet.
   - Show the relevant hunk (keep it under ~40 lines; summarise the rest), then say what it does in two sentences and whether the user's prediction matched.
   - Call out: the reviewer/verifier findings that touched this stop and how they were fixed, any test that covers it (or that nothing does), and one thing you would still worry about.
   - Ask with `AskUserQuestion`: "This stop:" — "Looks right, next (Recommended)", "I have a concern" (then capture it), "Explain more".
4. **Tests.** Ask the user which acceptance flow they trust least, then show the evidence for it (verifier output or test). Offer to have a `verifier` re-run that flow now.
5. **Decision.** Show a summary card: stops reviewed, concerns raised, open findings. Then `AskUserQuestion`: "Your call on this PR" — "Approve — I'll merge it myself", "Request changes" (send concerns to a builder as findings via the `build` skill's fix step, on the same branch), "Leave a review comment", "Decide later".
6. Record the decision and the concerns in the run folder as `human-review.md` and append an `{"type":"human_review",...}` line to `events.jsonl`. Only post to GitHub (`gh pr review` / comment) if the user picked an option that says so.
