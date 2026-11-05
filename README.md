# Sofactory

A software factory made of agent skills. It scans a repo, interviews you for a spec, builds the change with a builder, reviewer and verifier, opens a GitHub PR, and walks you through reviewing it.

The skills use the open Agent Skills format (a folder with a `SKILL.md`), so they work in OpenAI Codex, Claude Code, and other agents that read skills. Claude Code also gets an optional plugin with ready-made subagents, a trace hook, and a live pane.

## The skills

| Skill | What it does |
| --- | --- |
| `sf-go` | Runs the whole factory, stage by stage. Start here. |
| `sf-scan` | Maps the repo, writes a short brief, and suggests ranked improvements for you to pick. |
| `sf-spec` | Grill-me interview: one question at a time, each with a suggested answer. |
| `sf-build` | Shows a preview for you to approve, then builds, reviews (up to 3 rounds), verifies edge-risk work (up to 2 rounds, one verifier per flow) and opens the PR. |
| `sf-review` | A guided review: you predict, it shows the code, then you decide. |
| `sf-stats` | A dashboard with charts of tokens per role, rounds, findings and runs. |

How you call a skill depends on the agent: `$sf-go` in Codex, `/sf:sf-go` in Claude Code. Asking in plain words also works, such as "run the factory on this repo".

## Install in Codex

1. Clone the repo somewhere you'll keep it:
   ```bash
   git clone https://github.com/Puukallistaja/sofactory-plugins ~/sofactory-plugins
   ```
2. Link the skills into Codex's user skills folder:
   ```bash
   mkdir -p ~/.agents/skills
   for s in ~/sofactory-plugins/plugins/sf/skills/*; do ln -s "$s" ~/.agents/skills/; done
   ```
   Linking instead of copying means `git pull` in `~/sofactory-plugins` updates the skills. To use them in one repo only, link them into that repo's `.agents/skills/` instead.
3. Restart Codex, then run `/skills` or type `$sf` to check that the six skills appear.
4. Sign in to GitHub once with `gh auth login`, so the factory can open PRs as you.

In Codex the roles run as subagents when Codex starts them, and the questions come as numbered lists you answer by number.

## Install in Claude Code

1. Type these into Claude Code, either the desktop app's Code tab or `claude` in a terminal:
   ```
   /plugin marketplace add Puukallistaja/sofactory-plugins
   /plugin install sf@sofactory
   /plugin install sf-pane@sofactory
   ```
   The last line is the optional live pane. Claude Code clones the repo itself, so there's nothing to download.
2. Start a new session. Type `/sf:` and the six skills should appear. `/agents` should list `sf:builder`, `sf:reviewer`, `sf:verifier` and `sf:scout`.
3. Sign in to GitHub once with `gh auth login`.

The plugin adds the ready-made subagents, a hook that logs every subagent call with its token usage to `.sofactory/trace.jsonl`, and clickable questions. `/sf-pane` opens the live pane. The pane uses an early-access Claude Code API, tested on version 2.1.318, so it may not load on other versions.

To have Claude Code offer the plugin to anyone who opens a repo, add this to the repo's `.claude/settings.json`:
```json
{
  "extraKnownMarketplaces": {
    "sofactory": { "source": { "source": "github", "repo": "Puukallistaja/sofactory-plugins" } }
  },
  "enabledPlugins": { "sf@sofactory": true }
}
```

## Install in other agents

Link or copy the folders in `plugins/sf/skills/` into the agent's skills folder, the same way as for Codex:

| Agent | Repo folder | User folder |
| --- | --- | --- |
| Cursor | `.cursor/skills/` | `~/.cursor/skills/` |
| Gemini CLI | `.gemini/skills/` | `~/.gemini/skills/` |
| GitHub Copilot | `.github/skills/` | `~/.copilot/skills/` |
| OpenCode | `.opencode/skills/` | `~/.config/opencode/skills/` |

The skills only need file access, a shell and git. Where an agent has no subagents, it plays each role itself and says in the run report that review and verification weren't independent.

## First run

1. Open the repo in your agent.
2. Run `sf-go`. It scans the repo and shows ranked improvements. Pick one, or type your own ask instead.
3. Answer the spec questions. The first option is its suggestion, so picking it is usually right.
4. Check the preview and approve it. Nothing changes in the repo before that.
5. Follow the status cards. When the PR is up, choose the guided review.

Subagents ask before running commands. To pre-approve the usual ones, allow `git`, `gh pr`, your test command, and writes to `.sofactory/` in your agent's permission settings.

## What it writes

Everything goes into `.sofactory/` in the repo. It is added to `.git/info/exclude`, so it is never committed.

- `brief.md`: the repo brief every role reads.
- `specs/*.yaml`: your specs, in the same format as the TypeScript harness.
- `runs/<run>/`: `events.jsonl` (each phase, and each role's tokens and time), `findings.json`, `report.md` (which is also the PR description) and `human-review.md`.
- `status.json`: the current phase. The pane reads it.
- `trace.jsonl`: a raw log of every subagent call (Claude Code plugin only).
- `dashboard/index.html`: the stats page.

## Changing the roles

Each role's instructions are a plain Markdown file: `plugins/sf/skills/sf-build/roles/` holds the builder, reviewer and verifier, and `plugins/sf/skills/sf-scan/roles/` holds the scout. Edit those. If you use the Claude Code plugin, run `plugins/sf/scripts/sync-agents.sh` afterwards to copy the changes into its subagents. Models are set in the agent files (`model:` in `plugins/sf/agents/*.md`) or in your agent's own settings.

## Usage and cost

Each run uses several times the tokens of a normal chat, because every role reads the code. A small edge-risk task in testing used about 70k role tokens, and a real feature with three review rounds can use several hundred thousand. On a subscription plan this counts against your usage limits; on an API key it's billed per token.

## Update or remove

- **Codex and other agents:** run `git pull` in `~/sofactory-plugins`. To remove, delete the `sf-*` links from the skills folder.
- **Claude Code:** run `/plugin marketplace update sofactory` and start a new session. To remove, run `/plugin uninstall sf@sofactory`, `/plugin uninstall sf-pane@sofactory`, then `/plugin marketplace remove sofactory`.

## Troubleshooting

- **The skills don't show up.** Restart the agent. Check that each skill is its own folder with a `SKILL.md` directly inside the skills folder (for example `~/.agents/skills/sf-go/SKILL.md`), not nested one level deeper.
- **A role says a command was denied.** Approve it when asked, or allow it in your agent's permission settings.
- **The PR step fails.** Run `gh auth status`. The repo also needs a GitHub remote. Without one, the run stops after the local commit.
