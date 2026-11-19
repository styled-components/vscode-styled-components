#!/bin/sh
# Usage: check-commit-message.sh [--local] <file with the message> | check-commit-message.sh [--local] -m "<message>"
# Checks the first line against Conventional Commits: type(scope)!: subject.
# --local (the commit-msg hook) also accepts the subjects git writes itself: fixup!, squash!, amend!, and Revert "...".
# CI omits it, so those commits must be squashed or reworded before merge.
local=0
if [ "$1" = "--local" ]; then
  local=1
  shift
fi

if [ "$1" = "-m" ]; then
  subject=$(printf '%s\n' "$2" | head -n 1)
else
  subject=$(head -n 1 "$1")
fi

pattern='^(feat|fix|perf|refactor|style|test|docs|build|ci|chore|revert)(\([a-z0-9-]+\))?!?: [^ ].*$'
if printf '%s\n' "$subject" | grep -Eq "$pattern"; then
  exit 0
fi

if [ "$local" = 1 ] && printf '%s\n' "$subject" | grep -Eq '^((fixup|squash|amend)! .|Revert ".)'; then
  exit 0
fi

echo "Commit message \"$subject\" is not a Conventional Commit." >&2
echo "Write it as \"type(scope): subject\", e.g. \"fix(grammar): stop highlighting after an empty template\"." >&2
echo "Types: feat, fix, perf, refactor, style, test, docs, build, ci, chore, revert. See CONTRIBUTING.md, \"Commit messages\"." >&2
exit 1
