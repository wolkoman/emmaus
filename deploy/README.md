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

### 2. Create the shared secret

PocketBase reads `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` from the
`emmaus-secrets` Secret:

```bash
kubectl create secret generic emmaus-secrets --from-env-file=.env -n emmaus
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

```bash
kubectl delete secret emmaus-secrets -n emmaus
kubectl create secret generic emmaus-secrets --from-env-file=.env -n emmaus
kubectl rollout restart deployment/emmaus-pb -n emmaus
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
- Secrets are stored in Kubernetes and injected at runtime
- TLS certificates are managed by cert-manager
