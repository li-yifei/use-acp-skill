# use-acp-skill

ACP client for delegating code tasks to **any ACP-compatible coding agent** (Claude Agent, Codex CLI, Gemini CLI, OpenCode, etc.) via the [Agent Client Protocol](https://agentclientprotocol.com/).

## What this is

- A small Node.js ESM module (`type: module`) that speaks ACP using `@agentclientprotocol/sdk`
- A convenience client (`createClient`) + helpers like `verifiedPrompt()`
- Supports any ACP server via `serverCommand` + `serverArgs`

## Install

```bash
git clone https://github.com/li-yifei/use-acp-skill.git
cd use-acp-skill
npm i
```

Node.js requirement: **>= 20**.

Then install the ACP agent of your choice:

```bash
# Claude Agent (default)
npm i -g @zed-industries/claude-agent-acp

# Codex CLI
npm i -g @zed-industries/codex-acp

# Gemini CLI
npm i -g @google/gemini-cli

# OpenCode — download binary from https://github.com/anomalyco/opencode/releases
```

## Usage

```js
import { createClient } from './src/index.js';

// Claude Agent (default — no serverArgs needed)
const client = await createClient({ cwd: process.cwd() });

// Codex CLI
const client = await createClient({ cwd: process.cwd(), serverCommand: 'codex-acp' });

// Gemini CLI (needs flag)
const client = await createClient({ cwd: process.cwd(), serverCommand: 'gemini', serverArgs: ['--experimental-acp'] });

// OpenCode (needs subcommand)
const client = await createClient({ cwd: process.cwd(), serverCommand: 'opencode', serverArgs: ['acp'] });

const result = await client.prompt('Explain what files are in this repo');
console.log(result.text);
await client.close();
```

See `references/acp-agents-registry.md` for a full list of supported agents and their launch commands.

## Docs

- `references/api.md` — full API
- `references/advanced-usage.md` — multi-turn, resume/cancel, security notes
- `references/acp-agents-registry.md` — ACP agent registry & launch commands

## License

MIT (see `LICENSE`).
