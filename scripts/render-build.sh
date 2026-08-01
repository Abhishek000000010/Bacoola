#!/usr/bin/env bash
#
# Render build for the Bacoola backend.
#
# Why this exists instead of a one-line build command:
# Medusa installs its dependencies TWICE — once at the repo root, and again
# inside the generated `.medusa/server` folder that `medusa build` produces.
# The root install uses the committed package-lock.json, so it resolves from
# pinned versions and barely touches the registry. The `.medusa/server`
# install has NO lockfile, so npm must fetch metadata for ~1,900 packages in
# one burst. On some build networks (notably Render's Singapore region) npm's
# registry rate-limits that burst with HTTP 429 and the build dies.
#
# Fix: make the second install knock GENTLY (few concurrent connections) and
# RETRY HARD (with backoff), so it never trips the limit. Same correct build,
# just polite to the registry.

set -euo pipefail

echo "==> [render-build] root install"
npm install

echo "==> [render-build] medusa build (backend + admin)"
npm run build -w @dtc/backend

echo "==> [render-build] .medusa/server install (throttled to avoid npm 429)"
(
  cd apps/backend/.medusa/server
  npm install --legacy-peer-deps \
    --maxsockets=3 \
    --fetch-retries=10 \
    --fetch-retry-mintimeout=20000 \
    --fetch-retry-maxtimeout=120000 \
    --prefer-offline \
    --no-audit \
    --no-fund
)

echo "==> [render-build] apply shiprocket patches to every node_modules"
node scripts/patch-shiprocket-skip-awb.cjs

echo "==> [render-build] done"
