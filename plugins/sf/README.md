# sofactory

The Sofactory software factory as Claude Code skills and subagents. It onboards a repo, grills you for a spec one clickable question at a time, shows a preview to approve, runs a builder→reviewer loop (≤3 rounds, findings go back to the same builder), runs one verifier per acceptance flow in parallel on edge-risk tasks (≤2 rounds), opens a GitHub PR, and walks you through reviewing it. Start with `/sf:go`. See the repository README for install steps.
