# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

- `npm start` - Start the MCP server
- `npm run dev` - Start with nodemon for development
- `npm test` - Run tests using Node.js built-in test runner
- `npm run prepublishOnly` - Run tests before publishing

## Architecture Overview

This is a Model Context Protocol (MCP) server for Arabic names with Elasticsearch backend. The server operates in a single-file architecture (`server.js`) and provides three main tools:

### Core Components

- **MCP Server**: Built on `@modelcontextprotocol/sdk` with stdio transport
- **Elasticsearch Integration**: Primary storage with automatic fallback to in-memory storage
- **Dual Storage Strategy**: Elasticsearch for production, Map-based fallback for development/testing

### Tool Interface

1. **read-name**: Retrieves basic name information by UUID
2. **submit-name-details**: Stores comprehensive Arabic name data with extensive schema
3. **get-oldest-new-names**: Queries names with "NEW" status ordered by submission date

### Data Schema

The `submitNameDetailsScheme` defines a comprehensive structure for Arabic names including:
- Basic info (arabic, transliteration, meaning, origin, gender)
- Cultural data (significance, famous persons, variations)
- Linguistic analysis (etymology, linguistic root, pronunciation)
- Numerology and personality traits
- Compatibility and historical context

### Environment Configuration

- `ELASTIC_URL`: Elasticsearch endpoint (default: http://localhost:9200)
- `ELASTIC_USERNAME`: Optional authentication
- `ELASTIC_PASSWORD`: Optional authentication

The server gracefully handles Elasticsearch unavailability by falling back to in-memory storage with console warnings.

## Development Notes

- Server runs as a CLI tool with shebang (`#!/usr/bin/env node`)
- Uses ES modules (`"type": "module"`)
- Requires Node.js 18+
- Index name: `arabic_names`
- All name records include UUID, status, and timestamp fields
- Error handling includes automatic ES client disabling on repeated failures