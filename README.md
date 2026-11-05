# Sofactory for Claude Code

A software factory that runs inside Claude Code on your Claude Pro or Max subscription. It scans a repo, interviews you for a spec, builds the change with a builder, reviewer and verifier, opens a GitHub PR, and walks you through reviewing it. Every choice is a click in the chat.

It works in the Claude desktop app's **Code** tab, the `claude` CLI, and the VS Code and JetBrains extensions. It does not run in the regular chat tab, because that tab has no subagents and no access to your repo.

## Commands

| Command | What it does |
| --- | --- |
| `/sf:go [ask]` | Runs the whole factory, stage by stage. Start here. |
| `/sf:scan` | Maps the repo, writes a short brief, and suggests ranked improvements for you to tick. |
| `/sf:spec [ask]` | Grill-me interview: one clickable question at a time, each with a suggested answer. |
| `/sf:build [spec]` | Shows a preview for you to approve, then builds, reviews (up to 3 rounds), verifies edge-risk work (up to 2 rounds, in parallel) and opens the PR. |
| `/sf:review [PR]` | A guided review: you predict, it shows the code, then you decide. |
| `/sf:stats` | A dashboard with charts of tokens per role, rounds, findings and runs. |
| `/sf-pane` | Opens the live Factory pane beside the chat (optional plugin). |

## Install

You need Claude Code signed in with your Claude account (Pro or Max), and git. For PRs you also need the GitHub CLI.

1. **Add the marketplace and install.** Type these into Claude Code, either the Code tab or `claude` in a terminal:
   ```
   /plugin marketplace add Puukallistaja/sofactory-plugins
   /plugin install sf@sofactory
   /plugin install sf-pane@sofactory
   ```
   The last line is the optional live pane. You can also run `/plugin` on its own and pick from the menu. Claude Code clones the repo into `~/.claude/plugins/` itself, so there's nothing to download.
2. **Restart the session** so the skills, agents and hooks load. In the CLI, quit and run `claude` again. In the desktop app, start a new Code session.
3. **Check it loaded.** Type `/sf:` and the six commands should appear. `/agents` should list `sf:builder`, `sf:reviewer`, `sf:verifier` and `sf:scout`.
4. **Connect GitHub once:**
   ```bash
   brew install gh          # or see https://cli.github.com
   gh auth login
   ```
   The factory pushes and opens PRs as you, through `gh`, so there are no tokens to paste.
5. **Optional: fewer permission prompts.** Subagents ask before running commands. To pre-approve the usual ones for a repo, add this to its `.claude/settings.json`, with your own test command in place of `npm test`:
   ```json
   {
     "permissions": {
       "allow": ["Bash(git:*)", "Bash(gh pr:*)", "Bash(npm test:*)", "Write(.sofactory/**)"]
     }
   }
   ```

To try it without installing, clone this repo and start Claude Code with `claude --plugin-dir sofactory-plugins/plugins/sf`.

**Turn it on for a repo.** To have Claude Code offer the plugin to anyone who opens a repo, add this to the repo's `.claude/settings.json`:
```json
{
  "extraKnownMarketplaces": {
    "sofactory": { "source": { "source": "github", "repo": "Puukallistaja/sofactory-plugins" } }
  },
  "enabledPlugins": { "sf@sofactory": true }
}
```

## First run

1. Open the repo in the Code tab, or `cd` into it and run `claude`.
2. Type `/sf:go`. It scans the repo and shows ranked improvements. Tick one, or type your own ask instead.
3. Answer the spec questions. The first option is its suggestion, so clicking it is usually right.
4. Check the preview and click **Approve and run**. Nothing is changed before this.
5. Watch the status cards, or the pane if you installed it. When the PR is up, click **Walk me through the review**.

## What it writes

Everything goes into `.sofactory/` in the repo. It is added to `.git/info/exclude`, so it is never committed.

- `brief.md`: the repo brief every agent reads.
- `specs/*.yaml`: your specs. The format is the same as the TypeScript harness uses.
- `runs/<run>/`: `events.jsonl` (each phase, and each agent's tokens and time), `findings.json`, `report.md` (which is also the PR description) and `human-review.md`.
- `trace.jsonl`: a raw log of every subagent call, written by the plugin's hooks.
- `status.json`: the current phase. The pane reads it.
- `dashboard/index.html`: the stats page.

For session-wide metrics, start Claude Code with `CLAUDE_CODE_ENABLE_TELEMETRY=1`, `OTEL_METRICS_EXPORTER=otlp` and `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317`. That sends Claude Code's own OpenTelemetry metrics, with tokens and estimated cost, to any OTLP collector.

## Models

The builder and reviewer use the same model as your session. The scout and verifier use Sonnet. To change one, edit the `model:` line in `plugins/sf/agents/*.md` to `opus`, `sonnet`, `haiku` or `inherit`, then reinstall or restart. Opus uses up your plan's limits fastest.

## Usage limits

Each run counts against your plan's 5-hour and weekly limits, and every subagent counts. A small edge-risk task in testing used about 70k subagent tokens. A real feature with three review rounds can use several hundred thousand. Pro runs out after a run or two, so Max is the realistic plan for daily use. Check where you stand with `/usage`.

## Update or remove

- **Update:** run `/plugin marketplace update sofactory`, then restart the session.
- **Remove:** run `/plugin uninstall sf@sofactory`, `/plugin uninstall sf-pane@sofactory`, then `/plugin marketplace remove sofactory`.

## Troubleshooting

- **`/sf:` shows nothing.** Restart the session. If it's still missing, run `/plugin` and check that `sf` is enabled.
- **A subagent says a command was denied.** Approve it when Claude asks, or add it to `permissions.allow` (install step 5).
- **The PR step fails.** Run `gh auth status`. The repo also needs a GitHub remote. Without one, the run stops after the local commit.
- **No pane.** The pane uses an early-access Claude Code API, tested on version 2.1.318, so it may not load on other versions. Everything else works without it.
