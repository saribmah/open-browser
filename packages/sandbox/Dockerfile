# Optimized Multi-stage Docker build for Sandbox Server
# Only includes server code, not app templates

# Stage 1: Build server binary
FROM oven/bun:alpine AS builder

WORKDIR /app
COPY package.json bun.lock* ./
# Only install production dependencies
RUN bun install --frozen-lockfile --production

COPY src ./src
COPY tsconfig.json ./
# Compile to native binary with optimization
RUN bun build ./src/index.ts --compile --outfile /out/server --minify


# ---------- Runtime: Bun Alpine for smaller size with bun included ----------
FROM oven/bun:alpine AS runtime

RUN apk add --no-cache \
    bash \
    git \
    ca-certificates \
    curl \
    ripgrep \
    lsof

RUN bun add -g opencode-ai

WORKDIR /home/user/sandbox

# Optional: global git defaults (safe to keep; your app also sets these)
COPY --from=builder /out/server /usr/local/bin/server

# Do NOT bake workspace or node_modules into the image; hydrate at runtime from S3
ENV NODE_ENV=development \
    WORKSPACE_DIR=/home/user/sandbox/workspace

EXPOSE 3097
EXPOSE 4096

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD echo "Container is running" || exit 1

# Default command - keep container running
CMD ["sleep", "infinity"]
