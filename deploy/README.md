# Emmaus Deployment Guide

The main Next.js app is hosted on Vercel. This directory only manages the
self-hosted PocketBase (`pb`) deployment on the `eco` Kubernetes cluster.

## Prerequisites

- Kubernetes cluster access with `kubectl` configured
- `helm` installed locally

## Initial Setup (one-time)

### 1. Create namespace and CI service account

```bash
kubectl apply -f deploy/ci-serviceaccount.yaml
```

### 1b. PDF render jobs (optional feature)

The app spawns one-shot Kubernetes Jobs for server-side PDF rendering
(Monatsblatt flyer). Setup, env vars, and the cluster-migration checklist are
documented in [docs/pdf-render-jobs.md](../docs/pdf-render-jobs.md):

```bash
kubectl apply -f deploy/render-trigger-serviceaccount.yaml
```

### 2. Create the secrets

PocketBase and render jobs read `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` from
`emmaus-secrets`, the backup CronJob reads `GITHUB_TOKEN` from
`emmaus-pb-backup`. Both come from Doppler (`emmaus` / `prd_cluster`). The sync
script replaces them, so on a fresh cluster create them empty first:

```bash
kubectl --context=eco create secret generic emmaus-secrets -n emmaus
kubectl --context=eco create secret generic emmaus-pb-backup -n emmaus
./deploy/sync-secrets.sh
```

## Deploying

```bash
./deploy/local-deploy.sh
```

or directly:

```bash
helm upgrade --install emmaus ./deploy/helm -n emmaus
```

To see what would be applied without deploying:

```bash
helm template emmaus ./deploy/helm -n emmaus
```

## Updating Secrets

Change the value in Doppler, then:

```bash
./deploy/sync-secrets.sh
```

## Verifying Deployment

```bash
kubectl get pods -l app=emmaus-pb -n emmaus
kubectl logs -l app=emmaus-pb -n emmaus -f
kubectl get ingress emmaus-pb -n emmaus
helm history emmaus -n emmaus
```

## Rolling Back

```bash
helm rollback emmaus -n emmaus        # roll back one revision
helm rollback emmaus 2 -n emmaus      # roll back to specific revision
```

## Security Notes

- Never commit `.env` file to version control
- Doppler is the source of truth; Kubernetes Secrets are a copy written by `sync-secrets.sh`
- TLS certificates are managed by cert-manager
