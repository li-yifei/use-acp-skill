# use-acp-skill

ACP client for delegating code tasks to a locally installed **Claude Code** instance (via the Agent Client Protocol).

This repo is published **GitHub-first**: clone it into your agent/automation environment and import it directly. No npm publish required.

## What this is

- A small Node.js ESM module (`type: module`) that speaks ACP using `@agentclientprotocol/sdk`
- A convenience client (`createClient`) + helpers like `verifiedPrompt()`
- Examples for one-shot prompting and streaming events

## Optional dependency note (important)

This library expects an ACP server binary to be available.

- **Optional peer dependency:** `@zed-industries/claude-code-acp`
- **Why optional:** some environments may provide the server binary by other means
- **Typical install:**

```bash
npm i -g @zed-industries/claude-code-acp
# and authenticate
claude login
```

If you installed globally, you may need to point `serverCommand` to the binary path in your environment.

## Install (GitHub)

```bash
git clone https://github.com/<YOUR_GH_USERNAME>/use-acp-skill.git
cd use-acp-skill
npm i
```

Node.js requirement: **>= 20** (see `package.json#engines`).

## Usage

### Simple

```js
import { createClient } from './src/index.js';

const client = await createClient({ cwd: process.cwd() });
const result = await client.prompt('Explain what files are in this repo');
console.log(result.text);
await client.close();
```

### Streaming

```js
import { createClient } from './src/index.js';

const client = await createClient({
  cwd: process.cwd(),
  // serverCommand: '/path/to/claude-code-acp',
  timeout: 60_000,
});

await client.promptStream('Refactor the auth module', (event) => {
  switch (event.type) {
    case 'text':
      process.stdout.write(event.text);
      break;
    case 'tool_call':
      console.log(`[tool] ${event.title} (${event.status})`);
      break;
    case 'tool_result':
      console.log(`[result] ${event.status}`);
      break;
    case 'done':
      console.log(`[done] ${event.stopReason}`);
      break;
  }
});

await client.close();
```

### Verified prompts (anti-hallucination)

When a prompt is supposed to write files, `verifiedPrompt()` will verify the expected paths exist on disk.

```js
import { createClient, verifiedPrompt } from './src/index.js';

const client = await createClient({
  cwd: process.cwd(),
  permissionMode: 'bypassPermissions',
});

const r = await verifiedPrompt(
  client,
  'Translate input.srt to Chinese and save as output.srt',
  { expectedFiles: [new URL('./output.srt', import.meta.url).pathname], maxRetries: 2 }
);

console.log(r.verified, r.verifiedFiles);
await client.close();
```

## OpenClaw skill usage

This repo also contains an OpenClaw `SKILL.md`. If you use OpenClaw, you can place this folder under your skills directory and reference it from your setup.

## Docs

- `references/api.md` — full API
- `references/advanced-usage.md` — multi-turn, resume/cancel, security notes

## License

MIT (see `LICENSE`).
