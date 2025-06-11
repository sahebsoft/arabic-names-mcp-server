# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server for Arabic names that provides two main tools:
- `read-name`: Reads basic Arabic name information by UUID
- `submit-name-details`: Submits comprehensive Arabic name details with extensive metadata

The server uses Elasticsearch as the backend database and runs as a containerized service in Kubernetes.

## Architecture

- **MCP Server**: Built using `@modelcontextprotocol/sdk` with stdio transport
- **Database**: Elasticsearch cluster with TLS authentication
- **Deployment**: Dockerized application deployed to Kubernetes
- **Index**: Single index `arabic_names` stores all name records
- **Security**: Non-root container execution with minimal privileges

## Environment Requirements

The application requires these Elasticsearch environment variables:
- `ELASTIC_HOST`
- `ELASTIC_PORT` 
- `ELASTIC_USERNAME`
- `ELASTIC_PASSWORD`
- `ELASTIC_CA_CERT`

Missing variables will cause startup failure with error logging.

## Development Commands

```bash
# Run in development mode with auto-restart
npm run dev

# Run in production mode
npm start

# Build Docker image
./build.sh

# Deploy to Kubernetes
./deploy.sh
```

## Container Architecture

- Base image: `node:18-alpine`
- Non-root user: `nextjs` (UID 1001)
- Working directory: `/app`
- Security: Read-only root filesystem, no privilege escalation
- Health checks: Simple Node.js process validation

## Kubernetes Deployment

The application deploys to the `arabic-names` namespace with:
- 2 replicas for high availability
- Resource limits: 512Mi memory, 500m CPU
- ConfigMap and Secret injection for Elasticsearch configuration
- Ingress available at `https://mcp-server.facequizz.com`

## Data Schema

Names are stored with comprehensive metadata including:
- Basic info: Arabic text, transliteration, meaning, origin, gender
- Cultural data: Historical context, religious significance, cultural importance
- Linguistic data: Etymology, linguistic root, pronunciation (IPA)
- Personality traits and compatibility information
- Famous persons, variations, and related names
- Modern usage patterns and popularity trends