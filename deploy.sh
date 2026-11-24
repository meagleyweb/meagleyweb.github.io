#!/usr/bin/env bash
# Publishes the committed site to https://meagley.tech. Only committed site files are copied into dist/.
set -e
cd "$(dirname "$0")"
rm -rf ./dist && mkdir dist
git archive HEAD index.html robots.txt sitemap.xml img thanks work questionnaire setup | tar -x -C dist
node ../mane-house-booking/app/node_modules/wrangler/bin/wrangler.js deploy "$@"
