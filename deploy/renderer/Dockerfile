# PDF renderer job image (see docs/pdf-render-jobs.md).
#
# One-shot container: renders a URL to PDF with headless Chromium and uploads
# the result into a Pocketbase `renders` record. Spawned as a Kubernetes Job
# by the Next.js app; exits when done.
#
# Base image: official Playwright image — ships a pinned Chromium plus all
# system fonts/deps, so PDFs render identically everywhere (dev, CI, any
# cluster). Keep the Playwright version here in sync with the `playwright`
# version in package.json below.
FROM mcr.microsoft.com/playwright:v1.49.1-noble

WORKDIR /app

COPY package.json ./
# The base image already contains the browsers; skip the download.
RUN PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --omit=dev

COPY render.mjs ./

# Run as the unprivileged user provided by the Playwright image.
USER pwuser

ENTRYPOINT ["node", "render.mjs"]
