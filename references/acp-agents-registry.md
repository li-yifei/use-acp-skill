# ACP Agent Registry — 启动方式速查

> 来源: [agentclientprotocol/registry](https://github.com/agentclientprotocol/registry) + [官方 Agents 页](https://agentclientprotocol.com/overview/agents)
> 最后更新: 2026-02-28

所有 ACP agent 共同点：通过 **stdio NDJSON** 与客户端通信，启动后即可用 `@agentclientprotocol/sdk` 的 `ClientSideConnection` 对接。

---

## 1. Claude Agent (claude-acp)

| 项目 | 值 |
|---|---|
| ID | `claude-acp` |
| 厂商 | Anthropic / Zed |
| 许可 | proprietary |
| 安装 | `npx @zed-industries/claude-agent-acp@0.19.2` 或下载二进制 |
| 启动命令 | `claude-agent-acp` |
| ACP 参数 | 无需额外 flag（默认就是 ACP 模式） |
| 特殊参数 | `--permission-mode <bypassPermissions|acceptEdits|dontAsk>` |
| 仓库 | https://github.com/zed-industries/claude-agent-acp |

> ⚠️ 注意：这是 **新版** `claude-agent-acp`，替代了旧的 `claude-code-acp`（`@zed-industries/claude-code-acp`）。

---

## 2. Codex CLI (codex-acp)

| 项目 | 值 |
|---|---|
| ID | `codex-acp` |
| 厂商 | OpenAI / Zed |
| 许可 | Apache-2.0 |
| 安装 | `npx @zed-industries/codex-acp@0.9.5` 或下载二进制 |
| 启动命令 | `codex-acp` |
| ACP 参数 | 无需额外 flag |
| 仓库 | https://github.com/zed-industries/codex-acp |

---

## 3. Gemini CLI

| 项目 | 值 |
|---|---|
| ID | `gemini` |
| 厂商 | Google |
| 许可 | Apache-2.0 |
| 安装 | `npm install -g @google/gemini-cli` |
| 启动命令 | `gemini --experimental-acp` |
| ACP 参数 | `--experimental-acp` |
| npx | `npx @google/gemini-cli@0.31.0 --experimental-acp` |
| 仓库 | https://github.com/google-gemini/gemini-cli |

---

## 4. GitHub Copilot

| 项目 | 值 |
|---|---|
| ID | `github-copilot` |
| 厂商 | Microsoft |
| 许可 | proprietary |
| 安装 | `npm install -g @github/copilot-language-server` |
| 启动命令 | `copilot-language-server --acp` |
| ACP 参数 | `--acp` |
| npx | `npx @github/copilot-language-server@1.435.0 --acp` |
| 仓库 | https://github.com/github/copilot-language-server-release |

---

## 5. Goose (by Block)

| 项目 | 值 |
|---|---|
| ID | `goose` |
| 厂商 | Block |
| 许可 | Apache-2.0 |
| 安装 | 下载二进制 |
| 启动命令 | `goose acp` |
| ACP 参数 | 子命令 `acp`（不是 flag） |
| 仓库 | https://github.com/block/goose |

---

## 6. Cline

| 项目 | 值 |
|---|---|
| ID | `cline` |
| 厂商 | Cline Bot Inc. |
| 许可 | Apache-2.0 |
| 安装 | `npm install -g cline` |
| 启动命令 | `cline --acp` |
| ACP 参数 | `--acp` |
| npx | `npx cline@2.5.1 --acp` |
| 仓库 | https://github.com/cline/cline |

---

## 7. OpenCode (by Anomaly/SST)

| 项目 | 值 |
|---|---|
| ID | `opencode` |
| 厂商 | Anomaly |
| 许可 | MIT |
| 安装 | 下载二进制 |
| 启动命令 | `opencode acp` |
| ACP 参数 | 子命令 `acp` |
| 仓库 | https://github.com/anomalyco/opencode |

---

## 8. Qwen Code

| 项目 | 值 |
|---|---|
| ID | `qwen-code` |
| 厂商 | Alibaba Qwen Team |
| 许可 | Apache-2.0 |
| 安装 | `npm install -g @qwen-code/qwen-code` |
| 启动命令 | `qwen-code --acp --experimental-skills` |
| ACP 参数 | `--acp --experimental-skills` |
| npx | `npx @qwen-code/qwen-code@0.10.6 --acp --experimental-skills` |
| 仓库 | https://github.com/QwenLM/qwen-code |

---

## 9. Kimi CLI (Moonshot AI)

| 项目 | 值 |
|---|---|
| ID | `kimi` |
| 厂商 | Moonshot AI |
| 许可 | MIT |
| 安装 | 下载二进制 |
| 启动命令 | `kimi acp` |
| ACP 参数 | 子命令 `acp` |
| 仓库 | https://github.com/MoonshotAI/kimi-cli |

---

## 10. Mistral Vibe

| 项目 | 值 |
|---|---|
| ID | `mistral-vibe` |
| 厂商 | Mistral AI |
| 许可 | Apache-2.0 |
| 安装 | 下载二进制 |
| 启动命令 | `vibe-acp` |
| ACP 参数 | 无需额外 flag |
| 仓库 | https://github.com/mistralai/mistral-vibe |

---

## 11. Junie (JetBrains)

| 项目 | 值 |
|---|---|
| ID | `junie` |
| 厂商 | JetBrains |
| 许可 | proprietary |
| 安装 | `npm install -g @jetbrains/junie-cli` |
| 启动命令 | `junie-cli --acp=true` |
| ACP 参数 | `--acp=true` |
| npx | `npx @jetbrains/junie-cli@849.19.0 --acp=true` |
| 仓库 | https://github.com/jetbrains-junie/junie |

---

## 其他已知支持 ACP 的 agent

| Agent | 启动方式 | 备注 |
|---|---|---|
| AgentPool | Python 库 | [docs](https://phil65.github.io/agentpool/advanced/acp-integration/) |
| Augment Code | CLI | [docs](https://docs.augmentcode.com/cli/acp) |
| AutoDev | — | [repo](https://github.com/phodal/auto-dev) |
| Blackbox AI | CLI | [docs](https://docs.blackbox.ai/features/blackbox-cli/introduction) |
| Docker cagent | CLI | [repo](https://github.com/docker/cagent) |
| fast-agent | Python | [docs](https://fast-agent.ai/acp) |
| Factory Droid | SaaS | [factory.ai](https://factory.ai/) |
| Kiro CLI | CLI | [docs](https://kiro.dev/docs/cli/acp/) |
| OpenHands | CLI | [docs](https://docs.openhands.dev/openhands/usage/run-openhands/acp) |
| Pi | via pi-acp adapter | [repo](https://github.com/svkozak/pi-acp) |
| Qoder CLI | CLI | [docs](https://docs.qoder.com/cli/acp) |
| Stakpak | CLI | [repo](https://github.com/stakpak/agent) |

---

## 启动方式模式总结

ACP agent 的启动方式归纳为 **3 种模式**：

1. **无参数直接 ACP**: `claude-agent-acp`, `codex-acp`, `vibe-acp` — 二进制本身就是 ACP server
2. **Flag 模式**: `--acp`, `--acp=true`, `--experimental-acp` — 主 CLI 加 flag 进入 ACP 模式
3. **子命令模式**: `goose acp`, `opencode acp`, `kimi acp` — 用子命令启动 ACP server

→ 通用 skill 只需支持 `{ cmd, args }` 即可覆盖所有模式。
