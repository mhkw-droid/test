#!/usr/bin/env bash
set -euo pipefail

TARGET_REMOTE="${1:-origin}"
TARGET_BRANCH="${2:-master}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: Not a git repository"
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: Working tree is not clean. Commit/stash/discard first."
  exit 1
fi

if ! git remote get-url "$TARGET_REMOTE" >/dev/null 2>&1; then
  echo "ERROR: Remote '$TARGET_REMOTE' is not configured"
  exit 1
fi

echo "Fetching $TARGET_REMOTE/$TARGET_BRANCH ..."
git fetch "$TARGET_REMOTE" "$TARGET_BRANCH"

echo "Hard resetting current branch to $TARGET_REMOTE/$TARGET_BRANCH ..."
git reset --hard "$TARGET_REMOTE/$TARGET_BRANCH"

echo "Cleaning untracked files ..."
git clean -fd

echo "Done. Repository now matches $TARGET_REMOTE/$TARGET_BRANCH exactly."
