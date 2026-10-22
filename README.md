# Pfarre Emmaus Web Platform

![Social Media Preview](https://www.emmaus.wien/opengraph-image)

## Description

A comprehensive web platform for the Catholic parish "Emmaus am Wienerberg" in Vienna, Austria. This Next.js application provides various services for the parish community and its administration.

### Key Features

- **Event Management**: Integration with Google Calendar to display and manage parish events
- **Weekly Newsletter**: System for creating, editing, and automatically distributing the parish's weekly communications
- **Liturgy Organization**: Digital management system for organizing liturgical duties and roles
- **Content Management**: Tools for parish staff to update and maintain website content
- **Article Publishing**: Editor for creating and publishing articles and announcements
- **Instagram Content Creation**: Tools for generating Instagram-ready content for parish social media
- **Resource Management**: System for organizing and sharing parish resources
- **User Management**: Secure login system with role-based permissions

## Tech Stack

- Next.js (React framework)
- TypeScript
- Tailwind CSS
- Bun (JavaScript runtime)
- Google Calendar API
- Authentication with JSON Web Tokens
- Vercel (Hosting and environment management)

## Getting started

Currently, development happens against production data. Environment variables are managed through Vercel. Contact Manuel (@wolkoman) for access permissions to the project environment.

Follow these steps to set up your development environment:

1. `bun install` - Install dependencies
2. `vercel env pull .env.local` - Pull environment variables from Vercel
3. `bun dev` - Start the development server

The application will be available at http://localhost:3000.

## Project Structure

- `/app` - Main application code with route-based organization
- `/components` - Reusable UI components
- `/lib` - Utility functions and helpers
- `/public` - Static assets
- `/styles` - Global CSS styles
- `/pb` - Local Pocketbase dev setup (docker-compose, seed script)
- `/deploy/helm` - Helm chart including Pocketbase migrations at `pb_migrations/`

## Pocketbase (liturgy data)

The liturgy features use a Pocketbase instance (`emmaus-pb`) running in the
cluster. Prod admin UI: https://db.emmaus.wien/_/.

### Local development

Feature development happens against a **local** Pocketbase container — never
against prod. Same image and same migration files as prod, so the schema
matches.

```bash
# First time
bun pb:local        # start local Pocketbase on :8090
bun pb:seed         # populate fake liturgy data

# Day-to-day
bun pb:local        # ensure it's running
bun dev             # Next.js on :3000

# Open the admin UI (login: admin@emmaus.local / devpassword)
bun pb:local:ui

# Wipe the local DB and start fresh (migrations re-apply)
bun pb:local:reset
```

Environment variables (pre-filled in `.env`):

```
POCKETBASE_URL=http://localhost:8090
PB_ADMIN_EMAIL=admin@emmaus.local
PB_ADMIN_PASSWORD=devpassword
```

### Inspecting prod data

PocketBase is publicly reachable over HTTPS:

```bash
bun pb:prod:ui        # opens https://db.emmaus.wien/_/
```

The Kubernetes tunnel is only needed to bypass the public ingress or to run
migration scripts whose safety guard requires a localhost target:

```bash
bun pb:prod:tunnel    # kubectl port-forward -> localhost:8091
```

⚠️ **Do not** use prod as the normal development backend. One wrong mutation
can corrupt production data; use the local instance on `:8090` instead.

### Migrations

Migration files live at `deploy/helm/pb_migrations/*.js`. They are:

- Mounted as a read-only volume in the local container (see `pb/docker-compose.yml`)
- Bundled into the Helm chart as a `ConfigMap` and mounted at `/pb_migrations` in the prod pod
- Applied automatically on each PB startup (new migrations only)

To add a new migration: create `deploy/helm/pb_migrations/<unix-ts>_<name>.js`
and restart PB locally to apply it.

### Backups

A nightly CronJob (`emmaus-pb-backup`) creates a backup zip and uploads it
as a GitHub release asset tagged `pb-backup-<timestamp>` on this repo.
The newest 14 are kept; older ones are pruned.

**To restore** a backup:

```bash
# 1. Download the .zip asset from the desired release on GitHub.
# 2. Copy it into the PB pod and restore:
PB_POD=$(kubectl get pod -n emmaus -l app=emmaus-pb -o jsonpath='{.items[0].metadata.name}')
kubectl cp backup.zip emmaus/$PB_POD:/pb_data/backups/backup.zip
kubectl exec -n emmaus $PB_POD -- /usr/local/bin/pocketbase --dir /pb_data restore backup.zip
# 3. Restart the pod so PB reloads from the restored data.
kubectl rollout restart deployment/emmaus-pb -n emmaus
```
