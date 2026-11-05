#!/usr/bin/env bash
# Claude Code adapter: rebuild agents/*.md from the portable role files in the skills.
# The role files are the source of truth; run this after editing one of them.
set -euo pipefail
cd "$(dirname "$0")/.."
sync() { # $1 agent name, $2 role file
  local agent="agents/$1.md"
  { awk 'BEGIN{n=0} {print} /^---$/ {n++; if (n==2) exit}' "$agent"; cat "$2"; } > "$agent.tmp"
  mv "$agent.tmp" "$agent"
}
sync builder  skills/sf-build/roles/builder.md
sync reviewer skills/sf-build/roles/reviewer.md
sync verifier skills/sf-build/roles/verifier.md
sync scout    skills/sf-scan/roles/scout.md
echo "agents synced"
