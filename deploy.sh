#!/bin/bash

# Build and deploy Arabic Names MCP Server to Kubernetes

set -e

echo "🏗️  Building Docker image..."
docker build -t ghcr.io/sahebsoft/arabic-names/mcp-server:latest .

echo "📤 Pushing image to registry..."
# Replace with your registry
# docker tag arabic-names-mcp-server:latest your-registry/arabic-names-mcp-server:latest
# docker push your-registry/arabic-names-mcp-server:latest

echo "🚀 Deploying to Kubernetes..."
kubectl apply -f ./manifest/k8s-configmap.yaml
kubectl apply -f ./manifest/k8s-deployment.yaml
kubectl apply -f ./manifest/k8s-service.yaml
kubectl apply -f ./manifest/k8s-ingress.yaml

echo "⏳ Waiting for deployment to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/arabic-names-mcp-server

echo "✅ Deployment complete!"
echo "🌐 Your MCP server will be available at: https://mcp-server.facequizz.com"
echo ""
echo "📊 Check status with:"
echo "kubectl get pods -l app=arabic-names-mcp-server"
echo "kubectl logs -l app=arabic-names-mcp-server"
echo ""
echo "🔍 Check ingress status:"
echo "kubectl get ingress arabic-names-mcp-server-ingress"