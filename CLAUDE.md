# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Camora, a Chrome extension for replacing web resources based on user-defined rules. It allows users to redirect URLs, modify SourceMap headers, and add CORS headers to web resources using Chrome's declarativeNetRequest API.

## Architecture

The extension follows a standard Chrome extension structure:

1. **Background Script** (`entrypoints/background.ts`): 
   - Manages Chrome's declarativeNetRequest rules
   - Listens to storage changes to update dynamic rules
   - Handles extension lifecycle events (install, update, startup)

2. **Popup UI** (`entrypoints/popup/`):
   - Main user interface built with React and Ant Design
   - Organizes rules into groups for better management
   - Provides rule editing capabilities

3. **Core Components**:
   - `components/`: React components for the UI
   - `utils/`: Helper functions for rule management, storage, and synchronization
   - `types.ts`: TypeScript type definitions for rules and groups

4. **Rule System**:
   - Rules are organized into groups
   - Three rule types: Redirect, SourceMap, and CORS
   - Rules are converted to Chrome's declarativeNetRequest format

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run compile
```

## Key Implementation Details

1. **Rule Management**:
   - Rules are stored in Chrome's local storage
   - Dynamic rules are updated using `chrome.declarativeNetRequest.updateDynamicRules`
   - Rules support both URL filters and regex patterns

2. **Cloud Sync**:
   - Backup system using Chrome's sync storage
   - Data compression with lz-string to stay within storage limits
   - Automatic cleanup when storage approaches limits

3. **UI Components**:
   - Built with React and Ant Design
   - Rule editing with live validation
   - Drag-and-drop reordering using dnd-kit

## File Structure

- `entrypoints/`: Chrome extension entry points (background script, popup)
- `components/`: React UI components
- `utils/`: Helper functions
- `types.ts`: TypeScript type definitions
- `wxt.config.ts`: WXT build configuration