#!/usr/bin/env bash
# Softory trace hook. Appends each hook event (as Claude Code sends it on stdin)
# to .softory/trace.jsonl in the project, wrapped with a timestamp.
# No dependencies beyond bash, tr and date. Only logs inside repos that opted in
# (a .softory/ folder exists, which the sf-scan skill creates).
dir="${CLAUDE_PROJECT_DIR:-$PWD}/.softory"
[ -d "$dir" ] || { cat >/dev/null; exit 0; }
ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
run=""
[ -f "$dir/current-run" ] && run="$(tr -d '\n\r"' < "$dir/current-run")"
{
  printf '{"ts":"%s","run":"%s","event":' "$ts" "$run"
  tr -d '\n\r'
  printf '}\n'
} >> "$dir/trace.jsonl"
exit 0
