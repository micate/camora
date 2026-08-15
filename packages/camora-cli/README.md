# camora-cli

CLI tool and native host for [Camora](https://github.com/micate/camora) Chrome extension rule management.

## Overview

camora-cli provides command-line access to Camora's rule management system, enabling AI agents and developers to programmatically query, create, update, and manage proxy rules without opening the extension's popup interface.

### Key Features

- **Command-line interface** for rule management
- **Native host** for Chrome extension communication
- **Skill integration** for AI agents
- **Revision-based concurrency control** for safe multi-client access
- **Cross-platform support** (macOS, Linux)

## Installation

### Prerequisites

- Node.js >= 18.0.0
- Camora Chrome extension installed and loaded
- Chrome or Chromium-based browser

### Install via npm

```bash
npm install -g camora-cli
```

This installs one command:
- `camora` - CLI for setup and rule management

### Install Native Host

After installing camora-cli, you need to set up the native host to enable communication between the CLI and the Camora extension:

1. Get your Camora extension ID from `chrome://extensions`
2. Run the installer:

```bash
camora install-native-host <EXTENSION_ID>
```

For example:
```bash
camora install-native-host abcdefghijklmnopabcdefghijklmnop
```

3. Restart Chrome, or toggle Camora off and on in `chrome://extensions`

The installer will:
- Copy the native host to your local system
- Configure Chrome Native Messaging
- Install the Camora skill for AI agents

## Usage

### Basic Commands

```bash
# List all rule groups
camora group list

# List rules in a specific group
camora rule list --group <GROUP_ID>

# Get app status
camora app get

# Get specific rule details
camora rule get <RULE_ID>
```

### Creating Rules

```bash
# Create a redirect rule
camora rule create \
  --group <GROUP_ID> \
  --type redirect \
  --source 'https://example.com/app.js' \
  --target 'http://localhost:3000/app.js' \
  --revision <CURRENT_REVISION>

# Create a SourceMap rule
camora rule create \
  --group <GROUP_ID> \
  --type sourceMap \
  --source 'https://example.com/app.js' \
  --source-map-url 'http://localhost:3000/app.js.map' \
  --revision <CURRENT_REVISION>

# Create a CORS rule
camora rule create \
  --group <GROUP_ID> \
  --type cors \
  --source 'https://api.example.com/' \
  --revision <CURRENT_REVISION>
```

### Managing Rules

```bash
# Update a rule
camora rule update <RULE_ID> \
  --patch '{"target":"http://localhost:5173/app.js"}' \
  --revision <CURRENT_REVISION>

# Enable/disable a rule
camora rule enable <RULE_ID> --revision <CURRENT_REVISION>
camora rule disable <RULE_ID> --revision <CURRENT_REVISION>

# Delete a rule (requires confirmation)
camora rule delete <RULE_ID> --revision <CURRENT_REVISION> --confirm
```

### Managing Groups

```bash
# Create a new group
camora group create --name "Local Development" --revision <CURRENT_REVISION>

# Enable/disable a group
camora group enable <GROUP_ID> --revision <CURRENT_REVISION>
camora group disable <GROUP_ID> --revision <CURRENT_REVISION>

# Delete a group (requires confirmation)
camora group delete <GROUP_ID> --revision <CURRENT_REVISION> --confirm
```

### App-level Controls

```bash
# Enable Camora globally
camora app enable --revision <CURRENT_REVISION>

# Disable Camora globally
camora app disable --revision <CURRENT_REVISION>
```

## Revision System

All write operations require the current revision number to prevent concurrent modifications from overwriting each other. This is especially important when both the popup UI and CLI are being used simultaneously.

### Workflow

1. Read current state to get the revision
2. Perform your write operation with that revision
3. On `REVISION_CONFLICT`, re-read and retry with the new revision

```bash
# 1. Get current state
camora group list
# Output: { "revision": 5, "groups": [...] }

# 2. Perform write with current revision
camora rule create --group <GROUP_ID> --type redirect --source '...' --target '...' --revision 5

# 3. If conflict, re-read and retry
camora group list
# Output: { "revision": 6, "groups": [...] }
camora rule create --group <GROUP_ID> --type redirect --source '...' --target '...' --revision 6
```

## AI Agent Integration

camora-cli includes a skill for AI agents. The skill is automatically installed to `~/.agents/skills/camora-rules` during native host installation.

### Skill Capabilities

- List and query rules and groups
- Create, update, and delete rules
- Enable/disable rules and groups
- Revision-safe concurrent operations
- Rule validation before creation

### Example Agent Requests

- "List my Camora rules"
- "Create a redirect rule for example.com to localhost:3000"
- "Disable the rule that redirects app.js"
- "Show me all enabled SourceMap rules"

## Platform Support

### Supported Platforms

- **macOS** (Darwin)
- **Linux**

### Platform-specific Details

**macOS:**
- Native host installed to: `~/Library/Application Support/Camora/native-host`
- Chrome manifest: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.camora.rules.json`

**Linux:**
- Native host installed to: `~/.local/share/camora/native-host`
- Chrome manifest: `~/.config/google-chrome/NativeMessagingHosts/com.camora.rules.json`

## Troubleshooting

### "HOST_UNAVAILABLE" Error

If you see this error, the native host is not properly installed:

```bash
# Reinstall the native host
camora install-native-host <EXTENSION_ID>

# Restart Chrome, or toggle Camora off and on in chrome://extensions
```

### Permission Issues

Make sure the native host files have correct permissions:

```bash
# macOS/Linux
chmod 755 ~/Library/Application\ Support/Camora/native-host/camora-native-host
chmod 600 ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.camora.rules.json
```

### Extension ID Format

Extension IDs must be exactly 32 lowercase letters (a-p). You can find your extension ID in `chrome://extensions`.

### Socket Connection Issues

The CLI communicates with the native host via a Unix socket. If you experience connection issues:

```bash
# Check if socket exists
ls -la /tmp/camora-rules-*.sock

# Manually set socket path if needed
export CAMORA_RULES_SOCKET=/custom/path/to/socket.sock
camora group list
```

## Development

### Project Structure

```
camora-cli/
├── native-host/
│   ├── camora-native-host.mjs    # Native messaging host
│   └── install.mjs               # Installation script
├── skills/
│   └── camora-rules/
│       ├── SKILL.md              # Skill definition
│       ├── scripts/
│       │   └── camora.mjs        # CLI implementation
│       ├── references/
│       │   └── rule-schema.md    # Rule schema documentation
│       └── agents/
│           └── openai.yaml      # Agent configuration
└── package.json
```

### Building from Source

```bash
# Clone the repository
git clone https://github.com/micate/camora.git
cd camora/packages/camora-cli

# Test locally
npm link
camora group list
```

## Security Considerations

- The native host uses a Unix socket with restricted permissions (0600)
- Chrome Native Messaging only allows communication from the specific extension
- Revision system prevents unauthorized modifications
- Rule URLs should be treated as potentially sensitive

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on the main Camora repository.

## Related Projects

- [Camora](https://github.com/micate/camora) - Chrome extension for web resource replacement
- [Chrome Native Messaging](https://developer.chrome.com/docs/apps/nativeMessaging/) - Communication protocol
