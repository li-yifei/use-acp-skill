# Advanced ACP Usage

## Multi-turn conversation

```typescript
const result1 = await client.prompt('Analyze the codebase');
const result2 = await client.prompt('Now fix the issues you found', {
  sessionId: result1.sessionId,
});
```

## Per-prompt working directory

```typescript
const client = await createClient({ cwd: '/path/to/main-project' });
const r1 = await client.prompt('Fix tests');                                    // uses /path/to/main-project
const r2 = await client.prompt('Fix tests', { cwd: '/path/to/other-project' }); // uses /path/to/other-project
```

## Resume a previous session

```typescript
const sessions = await client.listSessions('/path/to/project');
if (sessions.length > 0) {
  const sessionId = await client.resumeSession({ sessionId: sessions[0].sessionId });
  const result = await client.prompt('Continue where you left off', { sessionId });
}
```

## Fork a session

```typescript
const result = await client.prompt('Analyze the codebase');
const forkedId = await client.forkSession({ sessionId: result.sessionId });
const summary = await client.prompt('Summarize what you found', { sessionId: forkedId });
```

## List sessions

```typescript
const all = await client.listSessions();
const filtered = await client.listSessions('/path/to/project');
for (const s of filtered) {
  console.log(`${s.sessionId} - ${s.title ?? 'untitled'} (${s.updatedAt})`);
}
```

## Cancel a long-running task

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 30_000);
const result = await client.prompt('Large refactoring task', { signal: controller.signal });
```

## Control what Claude is allowed to do

```typescript
const client = await createClient({
  cwd: '/path/to/project',
  permissionMode: 'default',
  permissionHandler: async ({ title, options }) => {
    if (title.includes('Bash')) {
      return options.find(o => o.kind === 'reject_once')?.optionId ?? null;
    }
    return options.find(o => o.kind === 'allow_once')?.optionId ?? null;
  },
});
```

## Verified Prompts (Anti-Hallucination)

LLM agents can "hallucinate" file writes — claiming a file was saved when no Write tool was actually called. `verifiedPrompt()` solves this by:
1. Injecting anti-hallucination instructions (forces Write tool usage)
2. Sending a follow-up verification prompt that checks files exist via `ls -l`
3. Automatically retrying if files are missing

```typescript
import { createClient, verifiedPrompt } from './src/index.js';

const client = await createClient({ cwd: '/path/to/project', permissionMode: 'bypassPermissions' });

const result = await verifiedPrompt(client, 'Translate input.srt to Chinese and save as output.srt', {
  expectedFiles: ['/path/to/project/output.srt'],
  maxRetries: 2,
});

if (result.verified) {
  console.log('All files confirmed on disk:', result.verifiedFiles);
} else {
  console.error('Missing files after retries:', result.missingFiles);
}
console.log(`Completed in ${result.attempts} attempt(s)`);
await client.close();
```

## Long-Running Operations

ACP prompts can take minutes to tens of minutes. To avoid blocking:

- **Always run ACP operations in a subagent** using `Task` with `run_in_background: true`
- Use `promptStream` in subagents to monitor progress
- Set appropriate timeouts — the default 30s is for setup only

```typescript
const result = await client.prompt('Refactor the auth module', {
  signal: AbortSignal.timeout(300_000), // 5-minute safety limit
});
```

## Security

- `bypassPermissions` disables all safety checks — only use in trusted environments
- Use `permissionHandler` to enforce what tools Claude can run
- Each session is isolated to its own working directory
