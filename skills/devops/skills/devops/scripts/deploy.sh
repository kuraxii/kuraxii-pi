#!/usr/bin/env bash
# Deploy script template
set -euo pipefail

ENV="${1:-production}"
echo "Deploying to ${ENV}..."
# Add your deploy logic here