---
name: use-acp-skill
description: >
  Delegate code tasks to any ACP-compatible coding agent/CLI (Claude Agent, Codex CLI, Gemini CLI, etc.) by spawning an ACP server subprocess (stdio NDJSON) and communicating via Agent Client Protocol (ACP).
  Use when you need to: (1) ask the human which ACP agent to use, (2) optionally remember a default agent choice, (3) stream tool events/results, or (4) run multi-step coding work through an external agent.
  NOT for simple one-liner shell commands or quick file reads.
---

# use-acp-skill

Delegate complex code tasks to an **ACP-compatible** agent by spawning its ACP server and speaking ACP over stdio.

## Agent selection (ask the human)

1. Read `references/acp-agents-registry.md`.
2. Ask the human which agent/CLI to use (give 5–10 options).
3. Ask whether to remember a default choice.
   - If yes: store it in the project's memory (so future runs can default without asking).
   - If no: require explicit choice each time.

## Prerequisites

- Node.js >= 20
- Install at least one ACP-compatible agent/CLI (see `references/acp-agents-registry.md`).

## Simple Usage

```typescript
import { createClient } from './src/index.js';

const client = await createClient({
  cwd: '/path/to/project',
  // Pick an ACP server command for the agent you chose.
  // Example: 'claude-agent-acp' or 'codex-acp'
  serverCommand: 'claude-agent-acp',
});
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
  // serverCommand: 'claude-agent-acp',
  //
  // NOTE: Some agents need extra args (flags/subcommands) to enter ACP mode.
  // Use `serverArgs` for that, e.g.
  // - Gemini CLI: serverCommand: 'gemini', serverArgs: ['--experimental-acp']
  // - OpenCode:   serverCommand: 'opencode', serverArgs: ['acp']
  // - Goose:      serverCommand: 'goose', serverArgs: ['acp']
  // - Cline:      serverCommand: 'cline', serverArgs: ['--acp']
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
// NOTE: permissionMode is implemented by passing `--permission-mode` to the server command;
// this flag is supported by Zed's Claude adapter, but may not exist for other agents.
const client = await createClient({ cwd: '/path/to/project', serverCommand: 'claude-agent-acp', permissionMode: 'bypassPermissions' });
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

**`permissionMode` controls what the spawned agent can do without asking (Zed Claude adapter only; other agents may ignore it).**

- **`bypassPermissions`** skips all confirmation prompts. The agent can read, write, and execute arbitrary commands in the project directory. Only use in sandboxed or fully trusted environments.
- **`acceptEdits`** auto-allows file writes but still prompts for shell commands. Safer than bypass, but the agent can still overwrite any file in `cwd`.
- **`dontAsk`** denies all permission requests silently — the agent cannot perform any tool actions that require approval.
- **`allowOutsideCwd: true`** lets `readTextFile`/`writeTextFile` access paths outside the working directory. This disables the path traversal guard entirely. Never enable this when `cwd` contains untrusted input.
- Always scope `cwd` to the narrowest directory needed. The agent has full access to everything under `cwd`.
- Treat the spawned agent as an untrusted subprocess: validate its outputs before using them in security-sensitive contexts.

## References

- `references/api.md` — Full API table (methods, options, events, permission modes)
- `references/advanced-usage.md` — Multi-turn, fork, resume, cancel, per-prompt cwd, security notes
