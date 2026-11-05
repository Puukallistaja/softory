---
name: stats
description: Sofactory dashboard with charts. Use when the user asks how factory runs went, what they cost, tokens per role, rounds, findings, or wants graphs/a dashboard of Sofactory activity.
---

# Build the Sofactory dashboard

Goal: an HTML page with charts of the factory's runs, opened for the user, plus a short in-chat summary.

1. Read every `.sofactory/runs/*/events.jsonl`, `findings.json`, `spec.yaml`, and `.sofactory/trace.jsonl` (PostToolUse events on the Agent tool carry `tool_response.totalTokens`, `totalDurationMs`, `totalToolUseCount` and `agentType` — use them to fill gaps in events.jsonl).
2. Build this object and write it to `.sofactory/dashboard/data.js` as `window.SOFACTORY = { ... };`:
```json
{"generated":"<ISO>","repo":"<name>",
 "runs":[{"id":"","title":"","risk":"routine","outcome":"done","pr_url":"","started":"<ISO>","minutes":0,
          "reviewRounds":0,"verifyRounds":0,
          "agents":[{"label":"builder-1","role":"builder","phase":"build","round":1,"tokens":0,"tool_uses":0,"ms":0}],
          "findings":[{"id":"f-1","source":"reviewer","severity":"blocking","round":1,"status":"fixed","claim":""}],
          "flows":[{"id":"","pass":true,"round":1}]}]}
```
3. Copy `template.html` from this skill's own base directory (shown when the skill loads) to `.sofactory/dashboard/index.html` (only if missing or older than the template). The page reads `data.js`; it needs no network.
4. Open it: `open` (macOS), `xdg-open` (Linux) or `start ""` (Windows) on `.sofactory/dashboard/index.html`. If you have an `Artifact` tool, also publish a copy with the data inlined (replace the `<script src="data.js"></script>` line with an inline script holding the data), so it renders in the app.
5. In chat, show a 5-line summary: runs, success rate, median rounds, tokens by role as text bars (`builder ████████ 61%`), and the most common finding type. Then `AskUserQuestion`: "Want the factory to act on this?" with up to 3 concrete suggestions you derive from the data (e.g. "Reviewer finds the same null-check bug every run → add it to the brief's conventions", "Verifier is 40% of tokens → use haiku for it"), plus "No, thanks".
