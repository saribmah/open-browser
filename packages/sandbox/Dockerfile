# Optimized Multi-stage Docker build for Sandbox Server
# Only includes server code, not app templates

# Stage 1: Build server binary
FROM oven/bun:debian AS builder

WORKDIR /app
COPY package.json bun.lock* ./
# Only install production dependencies
RUN bun install --frozen-lockfile --production

COPY src ./src
COPY tsconfig.json ./
# Compile to native binary with optimization
RUN bun build ./src/index.ts --compile --outfile /out/server --minify


# ---------- Runtime: Bun Debian for glibc compatibility with opencode ----------
# Use Cloudflare sandbox as base
FROM docker.io/cloudflare/sandbox:0.5.1 as runtime
#FROM oven/bun:debian AS runtime

RUN apt-get update && apt-get install -y \
    bash \
    git \
    ca-certificates \
    curl \
    ripgrep \
    lsof \
    unzip \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://opencode.ai/install | bash

# Add opencode to PATH
ENV PATH="/root/.opencode/bin:${PATH}"

WORKDIR /home/user/sandbox

# Optional: global git defaults (safe to keep; your app also sets these)
COPY --from=builder /out/server /usr/local/bin/server

# Do NOT bake workspace or node_modules into the image; hydrate at runtime from S3
ENV NODE_ENV=development \
    WORKSPACE_DIR=/home/user/sandbox/workspace

EXPOSE 3097
EXPOSE 4096
EXPOSE 3000

# Health check configuration
#HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
#    CMD echo "Container is running" || exit 1

# Default command - keep container running
#CMD ["sleep", "infinity"]
