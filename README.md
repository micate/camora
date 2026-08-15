# Camora

A Chrome extension for replacing web resources based on user-defined rules.

## Features

- Replace JavaScript and CSS resources with custom URLs
- Group rules for better organization
- Enable/disable individual rules or entire rule groups
- Modern UI built with Ant Design
- Built with TypeScript and Vite

## Agent skill integration

Camora includes a local agent skill and CLI for querying, creating, updating,
deleting, and enabling rules without MCP. The CLI talks to the extension through
Chrome Native Messaging and a current-user-only Unix socket.

### Installation (Recommended)

For users who want to use the agent features without building from source:

1. Install Camora from Chrome Web Store.
2. Copy the extension ID shown in `chrome://extensions`.
3. Install the camora-cli package:

   ```bash
   npm install -g camora-cli
   camora install-native-host <EXTENSION_ID>
   ```

4. Restart Chrome, or toggle Camora off and on in `chrome://extensions`, then start an agent session that loads skills from `~/.agents/skills`.

### Development Installation

For developers working with the source code:

1. Build and load Camora from `.output/chrome-mv3` in `chrome://extensions`.
2. Copy the extension ID shown by Chrome.
3. Install the Native Messaging host and the `camora-rules` skill into the user-level agent skills directory (`~/.agents/skills`):

   ```bash
   node packages/camora-cli/native-host/install.mjs <EXTENSION_ID>
   ```

4. Reload the unpacked extension, or restart Chrome / toggle Camora off and on in `chrome://extensions`, then start an agent session that loads skills from `~/.agents/skills`.

Example requests include “list my Camora rules”, “redirect this resource to
localhost”, and “disable rule X”. Writes use revisions to prevent concurrent
Popup and Agent changes from silently overwriting each other.

## Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Load the extension in Chrome:
- Open Chrome and navigate to `chrome://extensions`
- Enable "Developer mode"
- Click "Load unpacked" and select the `.output/chrome-mv3` directory

## License

MIT
