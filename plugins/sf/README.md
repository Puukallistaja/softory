# sf

The Sofactory software factory as portable agent skills. It scans a repo, grills you for a spec one question at a time, shows a preview to approve, runs a builder and reviewer loop (up to 3 rounds, findings go back to the same builder), runs one verifier per acceptance flow on edge-risk tasks (up to 2 rounds), opens a GitHub PR, and walks you through reviewing it.

`skills/` follows the open Agent Skills format, so any agent that reads SKILL.md files can use it (Codex, Claude Code, Cursor, Gemini CLI and others). `agents/`, `hooks/` and `scripts/trace.sh` are the Claude Code adapter: ready-made subagents and a trace hook. Start with the `sf-go` skill. See the repository README for install steps.
