# Open Browser API

## Setup

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run deploy
```

## Type Generation

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```bash
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

## Docker Configuration (Local Development)

The Docker sandbox provider is used for local development. Uses `node-docker-api` (pure JavaScript, no native dependencies). Configure via environment variables:

```bash
# Docker image to use for sandboxes
DOCKER_IMAGE=open-browser-sandbox:latest

# Docker socket path (defaults to /var/run/docker.sock)
DOCKER_SOCKET=/var/run/docker.sock
```

The Docker provider creates containers with:
- **Memory**: 1GB
- **CPU**: 1 CPU share
- **Ports**: Dynamic port mapping for server (3000) and frontend (5173)
- **Auto-remove**: Containers are automatically removed when stopped

## Sandbox Providers

Available providers:
- **docker** - For local development (uses dockerode)
- **daytona** - Cloud-based development environments
- **cloudflare** - Cloudflare sandbox (not yet implemented)
- **vercel** - Vercel sandbox (not yet implemented)
