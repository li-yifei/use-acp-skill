import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Resolve a requested path and verify it falls under the given cwd.
 * Returns the resolved path if valid, or an error string if outside cwd.
 */
export function validatePath(requestedPath, cwd, allowOutsideCwd) {
    if (allowOutsideCwd) {
        return { valid: true, resolved: path.resolve(requestedPath) };
    }
    const resolved = path.resolve(requestedPath);
    const normalizedCwd = path.resolve(cwd);
    if (!resolved.startsWith(normalizedCwd + path.sep) && resolved !== normalizedCwd) {
        return { valid: false, error: `Path "${requestedPath}" is outside the allowed working directory` };
    }
    return { valid: true, resolved };
}

/**
 * Default permission handler - auto-allows everything.
 */
const autoAllowPermission = async (_title, options) => {
    const allow = options.find(o => o.kind === 'allow_once' || o.kind === 'allow_always');
    return allow?.optionId ?? options[0]?.optionId ?? null;
};
/**
 * ACP Client implementation that collects session events.
 */
export class AcpSessionClient {
    events = [];
    eventListeners = [];
    permissionHandler;
    cwd;
    allowOutsideCwd;
    constructor(permissionHandler, cwd, allowOutsideCwd) {
        this.permissionHandler = permissionHandler ?? autoAllowPermission;
        this.cwd = cwd ?? process.cwd();
        this.allowOutsideCwd = allowOutsideCwd ?? false;
    }
    /**
     * Subscribe to streaming events.
     */
    onEvent(listener) {
        this.eventListeners.push(listener);
        return () => {
            const idx = this.eventListeners.indexOf(listener);
            if (idx >= 0)
                this.eventListeners.splice(idx, 1);
        };
    }
    emit(event) {
        this.events.push(event);
        for (const listener of this.eventListeners) {
            listener(event);
        }
    }
    /**
     * Get all collected events.
     */
    getEvents() {
        return [...this.events];
    }
    /**
     * Clear collected events.
     */
    clearEvents() {
        this.events = [];
    }
    async requestPermission(params) {
        const options = params.options.map(o => ({
            name: o.name,
            kind: o.kind,
            optionId: o.optionId,
        }));
        const selectedId = await this.permissionHandler(params.toolCall.title ?? '', options);
        const finalId = selectedId ?? params.options[0]?.optionId ?? '';
        // Emit permission event so streaming callers can see it
        this.emit({
            type: 'permission_request',
            toolCallId: params.toolCall.toolCallId ?? '',
            title: params.toolCall.title ?? '',
            options,
            selectedOptionId: finalId,
        });
        return { outcome: { outcome: 'selected', optionId: finalId } };
    }
    async sessionUpdate(params) {
        const update = params.update;
        switch (update.sessionUpdate) {
            case 'agent_message_chunk':
                if (update.content.type === 'text') {
                    this.emit({ type: 'text', text: update.content.text });
                }
                break;
            case 'agent_thought_chunk':
                if ('text' in update.content && typeof update.content.text === 'string') {
                    this.emit({ type: 'thinking', text: update.content.text });
                }
                break;
            case 'tool_call':
                this.emit({
                    type: 'tool_call',
                    toolCallId: update.toolCallId ?? '',
                    title: update.title ?? '',
                    status: update.status ?? '',
                });
                break;
            case 'tool_call_update':
                this.emit({
                    type: 'tool_result',
                    toolCallId: update.toolCallId ?? '',
                    status: update.status ?? '',
                    content: update.content?.[0]?.type === 'content' && update.content[0].content.type === 'text'
                        ? update.content[0].content.text
                        : undefined,
                });
                break;
            case 'plan':
                this.emit({
                    type: 'plan',
                    entries: update.entries?.map((e) => ({ title: e.title, status: e.status })) ?? [],
                });
                break;
            default:
                break;
        }
    }
    async readTextFile(params) {
        const check = validatePath(params.path, this.cwd, this.allowOutsideCwd);
        if (!check.valid) {
            return { content: check.error };
        }
        try {
            const content = await fs.readFile(check.resolved, 'utf-8');
            return { content };
        }
        catch {
            return { content: '' };
        }
    }
    async writeTextFile(params) {
        const check = validatePath(params.path, this.cwd, this.allowOutsideCwd);
        if (!check.valid) {
            return { error: check.error };
        }
        await fs.writeFile(check.resolved, params.content, 'utf-8');
        return {};
    }
}
