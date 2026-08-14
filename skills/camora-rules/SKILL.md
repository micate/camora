---
name: camora-rules
description: Query and manage Camora Chrome extension proxy rules and groups through the bundled local CLI. Use when users mention Camora rules, redirects, SourceMap rules, CORS rules, rule groups, enabling or disabling Camora, or ask to list, create, change, delete, enable, or disable those rules without MCP.
---

# Camora Rules

Use `scripts/camora.mjs` for every Camora operation. Resolve the script relative to this `SKILL.md`; do not assume the task working directory is the skill directory. Do not edit Chrome profile data or Camora storage files directly.

## Workflow

1. Run a read command first and retain its `revision`.
2. Validate unfamiliar rule payloads before creating them.
3. Show the proposed change before a write when user intent is ambiguous.
4. Pass the latest revision to every write with `--revision`.
5. Re-read state after a write. On `REVISION_CONFLICT`, re-read and reconsider the change; never retry blindly.
6. Ask for explicit confirmation immediately before deleting a rule or group, then pass `--confirm`.
7. For a retried write, reuse the original `--request-id`; use a new request ID for a new intent.
8. If a successful write returns `dnrApplied: false`, report that storage changed but Chrome rejected the active DNR update.

Run the CLI with Node:

```bash
node scripts/camora.mjs group list
node scripts/camora.mjs rule list --group GROUP_ID
node scripts/camora.mjs rule get RULE_ID
```

## Write operations

```bash
node scripts/camora.mjs group create --name "Local dev" --revision 4 --request-id create-local-dev-1
node scripts/camora.mjs group enable GROUP_ID --revision 5
node scripts/camora.mjs app enable --revision 6

node scripts/camora.mjs rule validate --rule '{"type":"redirect","source":"https://example.com/app.js","target":"http://localhost:3000/app.js"}'
node scripts/camora.mjs rule create --group GROUP_ID --type redirect --source 'https://example.com/app.js' --target 'http://localhost:3000/app.js' --revision 7
node scripts/camora.mjs rule create --group GROUP_ID --rule '{"type":"sourceMap","source":"https://example.com/app.js","sourceMapUrl":"http://localhost:3000/app.js.map"}' --revision 8
node scripts/camora.mjs rule update RULE_ID --patch '{"target":"http://localhost:5173/app.js"}' --revision 9
node scripts/camora.mjs rule disable RULE_ID --revision 10
```

Deletion is destructive:

```bash
node scripts/camora.mjs rule delete RULE_ID --revision 10 --confirm
node scripts/camora.mjs group delete GROUP_ID --revision 11 --confirm
```

Read [references/rule-schema.md](references/rule-schema.md) when constructing SourceMap or CORS rules, using regex substitutions, or interpreting CLI errors.

## Safety

- Treat rule URLs as potentially sensitive and avoid echoing unrelated rules.
- Prefer a narrow rule update over replacing a whole group.
- Do not invent IDs or revisions.
- Do not use the raw `call` command unless the regular command surface cannot express the requested operation.
- If the CLI returns `HOST_UNAVAILABLE`, tell the user to install the Camora native host and reload the extension. Do not attempt to read Chrome's LevelDB storage.
