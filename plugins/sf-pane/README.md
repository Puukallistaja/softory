# sf-pane (experimental)

A live "Factory" pane beside the chat for Sofactory runs. It shows the current run's phase and round, every subagent with its tokens and time, a tokens-by-role bar chart, and buttons: Approve run (while a run waits for approval), Walk me through review (once the PR is up), Dashboard, and Clear. It reads `.sofactory/status.json`, which the sofactory plugin writes. It uses Claude Code's early-access function-hooks API (built and tested on Claude Code 2.1.318), so it may need updating on other versions. Open it with `/sf-pane`.
