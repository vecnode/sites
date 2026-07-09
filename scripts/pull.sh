#!/usr/bin/env bash
# Fetch a site's static assets into sites/<name>/.
# Usage: scripts/pull.sh <name> <url>
set -euo pipefail

name="${1:?usage: pull.sh <name> <url>}"
url="${2:?usage: pull.sh <name> <url>}"

dest="sites/$name"
mkdir -p "$dest"
wget --mirror --convert-links --adjust-extension --page-requisites --no-parent \
  -P "$dest" "$url"

echo "Pulled $url into $dest"
