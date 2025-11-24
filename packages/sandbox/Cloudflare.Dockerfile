FROM docker.io/cloudflare/sandbox:0.5.1

# On a Mac with Apple Silicon, you might need to specify the platform:
# FROM --platform=linux/arm64 docker.io/cloudflare/sandbox:0.5.1

WORKDIR /workspace

# Required during local development to access exposed ports
# OpenCode server port
EXPOSE 4096
