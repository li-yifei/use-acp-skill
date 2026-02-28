# ACP Client API Reference

## `createClient(options?)`

Creates and connects a client. Returns `AcpCodeClient`.

## `AcpCodeClient`

| Method | Description |
|--------|-------------|
| `prompt(message, options?)` | Send task, return final result (`{text, sessionId, stopReason}`) |
| `promptStream(message, onEvent, options?)` | Send task with real-time event callback |
| `resumeSession(options)` | Resume a previous session (returns session ID) |
| `forkSession(options)` | Branch from an existing session (returns new session ID) |
| `listSessions(cwd?)` | List available sessions, optionally filtered by directory |
| `close()` | Disconnect and stop the agent |
| `connected` | Whether the client is connected |

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cwd` | `string` | `process.cwd()` | Project directory Claude works in |
| `permissionMode` | `string` | `'default'` | Tool approval mode (see below) |
| `permissionHandler` | `function` | auto-allow | Custom approval callback |
| `serverCommand` | `string` | `'claude-code-acp'` | Path to server binary |
| `timeout` | `number` | `30000` | Connection timeout (ms) |
| `mcpServers` | `array` | `[]` | Additional MCP servers |

## Prompt Options

| Option | Type | Description |
|--------|------|-------------|
| `sessionId` | `string` | Existing session ID to continue a conversation |
| `cwd` | `string` | Override client-level working directory for this prompt |
| `signal` | `AbortSignal` | Cancel the prompt |

## Resume/Fork Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `sessionId` | `string` | Yes | Session to resume or fork from |
| `cwd` | `string` | No | Override working directory |
| `mcpServers` | `array` | No | MCP servers for the session |

## Permission Modes

| Mode | Behavior |
|------|----------|
| `default` | Ask the client for approval on each tool use |
| `acceptEdits` | Auto-allow file edits, ask for others |
| `bypassPermissions` | Auto-allow everything (use with caution) |
| `plan` | Read-only mode, no edits allowed |
| `dontAsk` | Deny all permission requests without prompting. The agent cannot execute any tools that require approval. Use for dry-run or audit scenarios where no side effects are desired. *(Behavior inferred from name — verify against claude-code-acp release notes.)* |

## Streaming Events

| Event | Key Fields | When |
|-------|------------|------|
| `text` | `text` | Claude writes a response chunk |
| `thinking` | `text` | Extended thinking output |
| `tool_call` | `title`, `status` | Claude invokes a tool (Read, Write, Bash, etc.) |
| `tool_result` | `status`, `content?` | Tool execution completed |
| `permission_request` | `title`, `selectedOptionId` | A tool required approval |
| `plan` | `entries[]` | Claude updated its plan |
| `done` | `stopReason` | Task completed |
