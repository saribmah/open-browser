#!/bin/bash

# Build script for Open Browser Sandbox Docker image
# Supports multiple build modes and platforms

set -e

# Configuration
IMAGE_NAME="open-browser-sandbox"
IMAGE_TAG="${1:-latest}"
DOCKERFILE="Dockerfile"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Build functions
build_image() {
    local build_args=""
    local platforms=""

    case "$1" in
        "dev")
            log "Building development image..."
            build_args="--build-arg NODE_ENV=development"
            ;;
        "prod")
            log "Building production image..."
            build_args="--build-arg NODE_ENV=production"
            ;;
        "amd64")
            log "Building amd64 production image..."
            platforms="--platform linux/amd64"
            build_args="--build-arg NODE_ENV=production"
            ;;
        "multi-platform")
            log "Building multi-platform image..."
            platforms="--platform linux/amd64,linux/arm64"
            build_args="--build-arg NODE_ENV=production"
            ;;
        *)
            log "Building standard image..."
            ;;
    esac

    # Build command
    local build_cmd="docker build -f $DOCKERFILE -t $IMAGE_NAME:$IMAGE_TAG $build_args $platforms ."

    log "Executing: $build_cmd"

    if eval $build_cmd; then
        log_success "Image built successfully: $IMAGE_NAME:$IMAGE_TAG"
        return 0
    else
        log_error "Image build failed"
        return 1
    fi
}

# Build Daytona image
build_daytona() {
    local version="${1:-latest}"

    log "Building Daytona sandbox image..."

    # Check if DAYTONA_API_KEY is set
    if [ -z "$DAYTONA_API_KEY" ]; then
        log_error "DAYTONA_API_KEY environment variable is not set"
        return 1
    fi

    # Check if daytona CLI is available
    if ! command -v daytona >/dev/null 2>&1; then
        log_error "Daytona CLI is not installed or not in PATH"
        return 1
    fi

    # First build the Docker image
    log "Building Docker image for Daytona..."
    IMAGE_TAG="$version" build_image "amd64"
    if [ $? -ne 0 ]; then
        log_error "Docker image build failed"
        return 1
    fi

    # Push to Daytona as snapshot
    log "Pushing image to Daytona as snapshot: $IMAGE_NAME:$version"

    if DAYTONA_API="$DAYTONA_API_KEY" daytona snapshot push "$IMAGE_NAME:$version" --name "$IMAGE_NAME:$version" --cpu 2 --memory 4 --disk 6 -e "sleep infinity"; then
        log_success "Daytona snapshot pushed successfully: $IMAGE_NAME:$version"
        return 0
    else
        log_error "Daytona snapshot push failed"
        return 1
    fi
}

# Test functions
test_image() {
    log "Testing built image..."

    # Start container in background
    local container_name="test-$IMAGE_NAME-$$"

    log "Starting test container: $container_name"
    docker run -d \
        --name "$container_name" \
        -p 13097:3097 \
        -p 14096:4096 \
        "$IMAGE_NAME:$IMAGE_TAG"

    # Wait for services to start
    sleep 15

    # Test server
    if curl -f http://localhost:13097/health >/dev/null 2>&1; then
        log_success "Server health check passed"
    else
        log_error "Server health check failed"
        docker logs "$container_name"
        docker stop "$container_name" && docker rm "$container_name"
        return 1
    fi

    # Cleanup
    docker stop "$container_name" && docker rm "$container_name"
    log_success "All tests passed"
}

# Clean up old images
cleanup() {
    log "Cleaning up old images..."

    # Remove dangling images
    docker image prune -f

    # Remove old versions (keep latest 3)
    local old_images=$(docker images "$IMAGE_NAME" --format "table {{.Repository}}:{{.Tag}}" | grep -v "TAG" | tail -n +4)
    if [ -n "$old_images" ]; then
        echo "$old_images" | xargs docker rmi 2>/dev/null || true
        log_success "Cleaned up old images"
    else
        log "No old images to clean up"
    fi
}

# Show image info
show_info() {
    echo
    echo "=== Image Information ==="
    docker images "$IMAGE_NAME" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedSince}}"
    echo

    if docker inspect "$IMAGE_NAME:$IMAGE_TAG" >/dev/null 2>&1; then
        echo "=== Image Details ==="
        echo "Image: $IMAGE_NAME:$IMAGE_TAG"
        echo "Size: $(docker inspect "$IMAGE_NAME:$IMAGE_TAG" --format='{{.Size}}' | numfmt --to=iec)"
        echo "Created: $(docker inspect "$IMAGE_NAME:$IMAGE_TAG" --format='{{.Created}}')"
        echo "Ports: 3097 (Server), 4096 (OpenCode)"
        echo

        echo "=== Quick Start ==="
        echo "docker run -d --name sandbox -p 3097:3097 -p 4096:4096 $IMAGE_NAME:$IMAGE_TAG"
        echo
    fi
}

# Usage information
usage() {
    echo "Usage: $0 [COMMAND] [TAG]"
    echo
    echo "Commands:"
    echo "  build [dev|prod|amd64|multi-platform] [tag]  - Build Docker image"
    echo "  daytona [tag]                                 - Build and push to Daytona"
    echo "  test                                          - Test built image"
    echo "  cleanup                                       - Clean up old images"
    echo "  info                                          - Show image information"
    echo "  all [tag]                                     - Build, test, and show info"
    echo
    echo "Environment Variables:"
    echo "  DAYTONA_API_KEY                              - Daytona API key (required for daytona command)"
    echo
    echo "Examples:"
    echo "  $0 build                                     - Build standard image with 'latest' tag"
    echo "  $0 build dev v1.0.0                          - Build development image with v1.0.0 tag"
    echo "  $0 build prod v1.0.0                         - Build production image with v1.0.0 tag"
    echo "  $0 build amd64 v1.0.0                        - Build amd64 image with v1.0.0 tag"
    echo "  $0 daytona v1.0.0                            - Build and push to Daytona with v1.0.0 tag"
    echo "  $0 all v1.0.0                                - Build, test, and show info"
}

# Main script
main() {
    case "${1:-build}" in
        "build")
            IMAGE_TAG="${3:-$IMAGE_TAG}"
            build_image "${2:-}"
            ;;
        "daytona")
            build_daytona "${2:-latest}"
            ;;
        "test")
            test_image
            ;;
        "cleanup")
            cleanup
            ;;
        "info")
            show_info
            ;;
        "all")
            IMAGE_TAG="${3:-$IMAGE_TAG}"
            build_image "${2:-prod}" && test_image && show_info
            ;;
        "help"|"-h"|"--help")
            usage
            ;;
        *)
            log_error "Unknown command: $1"
            usage
            exit 1
            ;;
    esac
}

# Check if Docker is available
if ! command -v docker >/dev/null 2>&1; then
    log_error "Docker is not installed or not in PATH"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "$DOCKERFILE" ]; then
    log_error "Dockerfile not found: $DOCKERFILE"
    log "Please run this script from the sandbox directory"
    exit 1
fi

# Run main function
main "$@"
