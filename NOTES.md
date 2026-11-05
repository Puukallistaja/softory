# Skills version vs the TypeScript harness

## What carries over

| Harness feature | In the plugin |
| --- | --- |
| Repo onboarding scan, brief, ranked improvements | `scout` agent + `sf-scan`; pick improvements with a click |
| Grill-me spec interview, one question with a suggested answer | `sf-spec`, clickable options with the suggestion marked Recommended; same spec YAML |
| Preview / approve before running | First step of `sf-build`; nothing irreversible before Approve |
| Builder → reviewer loop, ≤3 rounds, findings to the same builder | Orchestrated by the `build` skill in the main session; the builder is continued by its agent id |
| Verifier on edge-risk only, ≤2 rounds, parallel per flow | Same, one foreground Agent call per flow in a single message |
| PR on GitHub | `gh pr create` (draft when escalated); falls back to the GitHub MCP tools or a compare URL |
| Guided, inquisitorial human review | `sf-review`: predict-then-reveal per risky stop, then an explicit decision |
| Event log and UI | `.sofactory/runs/<run>/events.jsonl`, `trace.jsonl`, status cards in chat, live pane, HTML dashboard |

## What is lost or weaker

- **Deterministic orchestration.** In the harness the loop is code. Here it is a skill the main Claude follows. It is usually faithful (the smoke test followed it), but limits like "≤3 rounds" are instructions, not guarantees.
- **Model-agnostic.** Claude models only. You can still pick opus / sonnet / haiku per agent.
- **Advisor and delegate roles.** Subagents cannot spawn subagents, so the builder can't call an advisor mid-task. The orchestrator could do it between rounds, but this version drops both.
- **Exact per-role cost in dollars.** On a subscription there is no per-call bill. You get tokens, tool uses and duration per subagent (from the Agent result and the trace hook), plus Claude Code's own OTel metrics, which include an *estimated* cost. Weekly plan usage is the real budget, and you see it with `/usage` (or `/status`, depending on build).
- **OTel GenAI spans per agent turn.** The harness emitted a span per model call with GenAI attributes. Claude Code's built-in OTel exports session-level metrics and events, not that span tree. The JSONL logs keep the per-agent view.
- **Hard budgets.** The harness cut a run at a token/dollar cap. Here the skill checks the running total between steps; a single runaway subagent isn't interrupted mid-task. `maxTurns` in agent frontmatter is a backstop if your build supports it.
- **Unattended runs and a server UI.** This runs inside an interactive Claude Code session. The live pane replaces the web UI's live view; the dashboard replaces its history view.

## Subscription: terms and limits

- **Allowed.** Using Claude Code on a Pro or Max plan, including its own skills, subagents and plugins, is what the subscription covers. Anthropic's help article: [Using Claude Code with your Pro or Max plan](https://support.anthropic.com/en/articles/11145838).
- **Not allowed: running the TypeScript harness on the subscription.** In February 2026 Anthropic clarified that subscription OAuth tokens may not be used in third-party harnesses or tools built on the Agent SDK; those need an API key ([The Register](https://www.theregister.com/2026/02/20/anthropic_clarifies_ban_third_party_claude_access)). That is the real reason this plugin version is worth having.
- **Grey zone: unattended automation.** Running `claude -p` from cron or CI on a personal subscription to run factory jobs nobody is watching is the kind of use the consumer terms steer toward API keys. Interactive use, you at the keyboard approving runs, is clearly fine.
- **Limits.** Usage is shared between claude.ai, the desktop app and Claude Code, with a rolling 5-hour window plus weekly caps ([Max plan usage](https://support.claude.com/en/articles/11014257-about-claude-s-max-plan-usage)). Every subagent draws from the same pool. Multi-agent work uses several times the tokens of a single chat; Anthropic's own multi-agent research write-up puts it at roughly 4× for agents and 15× for multi-agent systems.
- **Measured here.** The smoke test (small edge-risk task, 1 review round, 2 parallel verifiers) used about 60–100k subagent tokens plus the orchestrator. Real repos with 3 rounds will be several hundred thousand to over a million. Expect Pro to run out after a run or two; Max 5× handles a few runs a day; Max 20× is the plan for heavy daily use. Opus burns limits fastest, so the verifier and scout default to Sonnet.
