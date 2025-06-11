#!/bin/bash

# Build and deploy Arabic Names MCP Server to Kubernetes

set -e

echo "🏗️  Building Docker image..."
docker build -t ghcr.io/sahebsoft/arabic-names/mcp-server:latest .

echo "📤 Pushing image to registry..."
docker push ghcr.io/sahebsoft/arabic-names/mcp-server:latest