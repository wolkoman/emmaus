#!/usr/bin/env bash
# Writes the cluster Secrets from Doppler (project emmaus, config prd_cluster)
# and restarts PocketBase so it picks up the new values.
set -euo pipefail

NAMESPACE="${NAMESPACE:-emmaus}"
KUBECTL=(kubectl --context=eco -n "$NAMESPACE")

secret() { doppler secrets get "$1" --plain --project emmaus --config prd_cluster; }

# replace (not apply) so keys removed in Doppler also disappear from the Secret.
"${KUBECTL[@]}" create secret generic emmaus-secrets \
  --from-literal=PB_ADMIN_EMAIL="$(secret PB_ADMIN_EMAIL)" \
  --from-literal=PB_ADMIN_PASSWORD="$(secret PB_ADMIN_PASSWORD)" \
  --dry-run=client -o yaml | "${KUBECTL[@]}" replace -f -

"${KUBECTL[@]}" create secret generic emmaus-pb-backup \
  --from-literal=GITHUB_TOKEN="$(secret GITHUB_TOKEN)" \
  --dry-run=client -o yaml | "${KUBECTL[@]}" replace -f -

"${KUBECTL[@]}" rollout restart deployment/emmaus-pb
echo "✅ Secrets synced from Doppler"
