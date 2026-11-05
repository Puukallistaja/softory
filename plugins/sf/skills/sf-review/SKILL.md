---
name: sf-review
description: Sofactory guided human review. Use when the user wants to review a factory PR (or any PR or branch) by being walked through it, quizzed on it, and pushed to a decision, instead of reading a raw diff.
---

# Walk the human through the review

Goal: the user understands the change well enough to own it, and makes an explicit decision. You are inquisitorial: you ask what the user expects before you show them, and you lead with the riskiest parts. You never approve or merge for them. Follow the question conventions in the `sf-go` skill.

1. **Load.** Find the PR: the one the user named, or `pr_url` in `.sofactory/status.json`. Read the spec, `report.md`, `findings.json` and the diff (`gh pr diff`, or `git diff <base>`).
2. **Map.** Group the diff into 3 to 7 review stops, ordered by risk: core logic first, then edges (error paths, concurrency, migrations), then tests, with mechanical changes last. Show the map as a table: stop, files, why it matters, and risk as `●●○`.
3. **Each stop:**
   - Before showing code, ask one prediction question, for example "When two devices edit the same note offline, what should win?" Offer what the code actually does (unmarked), one or two plausible alternatives, and "Not sure, show me". Don't reveal which is right yet.
   - Show the relevant hunk, under about 40 lines with the rest summarised. Say what it does in two sentences and whether the user's prediction matched.
   - Point out the review and verification findings that touched this stop and how they were fixed, the test that covers it (or that nothing does), and one thing you'd still worry about.
   - Ask "This stop:" with "Looks right, next (Recommended)", "I have a concern" (then capture it), and "Explain more".
4. **Tests.** Ask which acceptance flow the user trusts least, then show the evidence for it: the verifier output or the test. Offer to have a verifier re-run that flow now.
5. **Decision.** Show a summary card: stops reviewed, concerns raised, open findings. Then ask "Your call on this PR" with "Approve. I'll merge it myself", "Request changes" (the concerns go to a builder as findings, on the same branch, through the `sf-build` fix step), "Leave a review comment" and "Decide later".
6. Record the decision and the concerns in the run folder as `human-review.md`, and append `{"type":"human_review",...}` to `events.jsonl`. Post to GitHub (`gh pr review` or a comment) only if the user picked an option that says so.
