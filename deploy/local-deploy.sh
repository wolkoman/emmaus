#!/usr/bin/env bash
# Local mirror of .github/workflows/deploy.yml.
#
# The main app now runs on Vercel; this chart only manages the self-hosted
# PocketBase deployment. Runs `helm upgrade --install` against the active
# kube context.
set -euo pipefail

cd "$(dirname "$0")/.."

NAMESPACE="${NAMESPACE:-emmaus}"
RELEASE="${RELEASE:-emmaus}"

echo "▶ Context  : $(kubectl config current-context)"
echo "▶ Namespace: ${NAMESPACE}"
echo

echo "▶ helm upgrade --install ${RELEASE} -n ${NAMESPACE}"
helm upgrade --install "$RELEASE" ./deploy/helm \
  -n "$NAMESPACE" \
  --wait \
  --timeout 5m

echo
echo "✅ Deployed"
kubectl -n "$NAMESPACE" get deploy -o wide
