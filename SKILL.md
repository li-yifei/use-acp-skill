---
name: use-acp-skill
version: "0.1.0"
tags: ["acp", "claude-code", "agent", "delegation"]
category: "integration"
description: >
  Delegate complex code tasks to a locally installed Claude Code instance via ACP.
  Use when: (1) spawning a Claude agent subprocess to handle code tasks,
  (2) streaming tool calls and results in real-time,
  (3) controlling what tools the agent can use (permission modes).
  NOT for: simple file reads, single-command tasks, or non-code queries.
metadata:
  openclaw:
    emoji: "\U0001F50C"
---

# use-acp-skill

Delegate complex code tasks to a local Claude Code instance. Send a prompt, get back results — Claude Code handles file reading, writing, and command execution.

## Prerequisites

- `claude-code-acp` installed: `npm install -g @zed-industries/claude-code-acp`
- Claude CLI authenticated: `claude login`
- Node.js >= 20

## Simple Usage

```typescript
import { createClient } from './src/index.js';

const client = await createClient({ cwd: '/path/to/project' });
const result = await client.prompt('Fix the TypeScript errors in src/app.ts');
console.log(result.text);
await client.close();
```

## Stream Progress

```typescript
import { createClient } from './src/index.js';

const client = await createClient({
  cwd: '/path/to/project',
  // If you installed the ACP server globally, it should be on PATH:
  // serverCommand: 'claude-code-acp',
  timeout: 60_000,
});

const result = await client.promptStream('Refactor the auth module', (event) => {
  switch (event.type) {
    case 'text': process.stdout.write(event.text); break;
    case 'tool_call': console.log(`[tool] ${event.title} (${event.status})`); break;
    case 'tool_result': console.log(`[result] ${event.status}`); break;
    case 'done': console.log(`[done] ${event.stopReason}`); break;
  }
});
await client.close();
```

## Verified Prompts (Anti-Hallucination)

Use `verifiedPrompt()` when the task produces files — it checks they actually exist on disk:

```typescript
import { createClient, verifiedPrompt } from './src/index.js';

// ⚠️ SECURITY: bypassPermissions skips confirmations. Only use in trusted/sandboxed envs.
const client = await createClient({ cwd: '/path/to/project', permissionMode: 'bypassPermissions' });
const result = await verifiedPrompt(client, 'Translate input.srt to Chinese and save as output.srt', {
  expectedFiles: ['/path/to/project/output.srt'],
  maxRetries: 2,
});
if (result.verified) {
  console.log('All files confirmed:', result.verifiedFiles);
}
await client.close();
```

## SECURITY

**`permissionMode` controls what the spawned Claude Code agent can do without asking.**

- **`bypassPermissions`** skips all confirmation prompts. The agent can read, write, and execute arbitrary commands in the project directory. Only use in sandboxed or fully trusted environments.
- **`acceptEdits`** auto-allows file writes but still prompts for shell commands. Safer than bypass, but the agent can still overwrite any file in `cwd`.
- **`dontAsk`** denies all permission requests silently — the agent cannot perform any tool actions that require approval.
- **`allowOutsideCwd: true`** lets `readTextFile`/`writeTextFile` access paths outside the working directory. This disables the path traversal guard entirely. Never enable this when `cwd` contains untrusted input.
- Always scope `cwd` to the narrowest directory needed. The agent has full access to everything under `cwd`.
- Treat the spawned agent as an untrusted subprocess: validate its outputs before using them in security-sensitive contexts.

## References

- `references/api.md` — Full API table (methods, options, events, permission modes)
- `references/advanced-usage.md` — Multi-turn, fork, resume, cancel, per-prompt cwd, security notes
