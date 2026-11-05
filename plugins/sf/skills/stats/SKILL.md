---
name: stats
description: Softory stats dashboard with charts. Use when the user asks how factory runs went, what they cost, tokens per role, rounds or findings, or wants graphs or a dashboard of Softory activity.
---

# Build the Softory stats dashboard

Goal: an HTML page with charts of the factory's runs, opened for the user, plus a short summary in chat.

1. Read every `.softory/runs/*/events.jsonl`, `findings.json` and `spec.yaml`. If `.softory/trace.jsonl` exists (some clients write it through hooks), use its subagent usage numbers to fill gaps.
2. Build this object and write it to `.softory/dashboard/data.js` as `window.SOFTORY = { ... };`:
```json
{"generated":"<ISO>","repo":"<name>",
 "runs":[{"id":"","title":"","risk":"routine","outcome":"done","pr_url":"","started":"<ISO>","minutes":0,
          "reviewRounds":0,"verifyRounds":0,
          "agents":[{"label":"builder-1","role":"builder","phase":"build","round":1,"tokens":0,"tool_uses":0,"ms":0}],
          "findings":[{"id":"f-1","source":"reviewer","severity":"blocking","round":1,"status":"fixed","claim":""}],
          "flows":[{"id":"","pass":true,"round":1}]}]}
```
   Use `"pass": null` for a flow that couldn't be verified.
3. Copy `template.html` from this skill's folder to `.softory/dashboard/index.html` if it's missing or older than the template. The page reads `data.js` and needs no network.
4. Open it with `open` (macOS), `xdg-open` (Linux) or `start ""` (Windows). If your client can show HTML pages in the conversation, also show it there, with the data inlined in place of the `<script src="data.js"></script>` line.
5. In chat, give a 5-line summary: runs, success rate, median rounds, tokens by role as text bars (`builder ████████ 61%`), and the most common kind of finding. Then ask "Want the factory to act on this?" with up to 3 concrete suggestions drawn from the data, such as "The reviewer finds the same null-check bug every run: add it to the brief's conventions" or "The verifier is 40% of tokens: give it a smaller model". Add "No, thanks" as the last option.
