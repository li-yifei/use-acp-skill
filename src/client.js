import { ClientSideConnection, PROTOCOL_VERSION, } from '@agentclientprotocol/sdk';
import { AcpServer } from './server.js';
import { AcpSessionClient } from './session.js';
import { ConnectionTimeoutError } from './errors.js';
/**
 * High-level client for delegating code tasks to Claude Code via ACP.
 */
export class AcpCodeClient {
    server;
    connection = null;
    sessionClient;
    options;
    constructor(options = {}) {
        this.options = {
            cwd: options.cwd ?? process.cwd(),
            timeout: options.timeout ?? 30_000,
            ...options,
        };
        this.server = new AcpServer({
            command: options.serverCommand,
            env: options.env,
            permissionMode: options.permissionMode,
        });
        // Build permission handler
        let sessionPermHandler;
        if (options.permissionHandler) {
            const userHandler = options.permissionHandler;
            sessionPermHandler = async (title, options) => {
                return userHandler({ title, options });
            };
        }
        this.sessionClient = new AcpSessionClient(sessionPermHandler);
    }
    /**
     * Start the ACP server and initialize the connection.
     */
    async connect() {
        const stream = await this.server.start();
        this.connection = new ClientSideConnection((_agent) => this.sessionClient, stream);
        // Initialize with timeout
        const initPromise = this.connection.initialize({
            protocolVersion: PROTOCOL_VERSION,
            clientCapabilities: {
                fs: {
                    readTextFile: true,
                    writeTextFile: true,
                },
            },
        });
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new ConnectionTimeoutError(this.options.timeout)), this.options.timeout);
        });
        await Promise.race([initPromise, timeoutPromise]);
    }
    /**
     * Send a prompt and get the complete result.
     * Creates a new session, sends the prompt, and returns the result.
     */
    async prompt(message, options) {
        if (!this.connection) {
            throw new Error('Not connected. Call connect() first.');
        }
        // Use existing session or create a new one
        let sessionId = options?.sessionId;
        if (!sessionId) {
            const session = await this.connection.newSession({
                cwd: options?.cwd ?? this.options.cwd,
                mcpServers: this.options.mcpServers ?? [],
            });
            sessionId = session.sessionId;
        }
        // Set up cancellation
        if (options?.signal) {
            const sid = sessionId;
            options.signal.addEventListener('abort', () => {
                if (sid) {
                    this.connection?.cancel({ sessionId: sid });
                }
            }, { once: true });
        }
        // Clear previous events
        this.sessionClient.clearEvents();
        // Send the prompt
        const result = await this.connection.prompt({
            sessionId,
            prompt: [{ type: 'text', text: message }],
        });
        // Collect text from events
        const events = this.sessionClient.getEvents();
        const text = events
            .filter((e) => e.type === 'text')
            .map(e => e.text)
            .join('');
        return {
            text,
            sessionId: sessionId,
            stopReason: result.stopReason,
        };
    }
    /**
     * Send a prompt with streaming events via callback.
     * Returns the final PromptResult when complete.
     */
    async promptStream(message, onEvent, options) {
        if (!this.connection) {
            throw new Error('Not connected. Call connect() first.');
        }
        let sessionId = options?.sessionId;
        if (!sessionId) {
            const session = await this.connection.newSession({
                cwd: options?.cwd ?? this.options.cwd,
                mcpServers: this.options.mcpServers ?? [],
            });
            sessionId = session.sessionId;
        }
        if (options?.signal) {
            const sid = sessionId;
            options.signal.addEventListener('abort', () => {
                if (sid) {
                    this.connection?.cancel({ sessionId: sid });
                }
            }, { once: true });
        }
        this.sessionClient.clearEvents();
        const unsubscribe = this.sessionClient.onEvent(onEvent);
        try {
            const result = await this.connection.prompt({
                sessionId,
                prompt: [{ type: 'text', text: message }],
            });
            // Emit done event
            onEvent({ type: 'done', stopReason: result.stopReason });
            const events = this.sessionClient.getEvents();
            const text = events
                .filter((e) => e.type === 'text')
                .map(e => e.text)
                .join('');
            return {
                text,
                sessionId: sessionId,
                stopReason: result.stopReason,
            };
        }
        finally {
            unsubscribe();
        }
    }
    /**
     * Resume a previous session without replaying message history.
     * Returns the session ID for use in subsequent prompts.
     */
    async resumeSession(options) {
        if (!this.connection) {
            throw new Error('Not connected. Call connect() first.');
        }
        const resumePromise = this.connection.unstable_resumeSession({
            sessionId: options.sessionId,
            cwd: options.cwd ?? this.options.cwd,
            mcpServers: options.mcpServers ?? this.options.mcpServers ?? [],
        });
        await this.withTimeout(resumePromise);
        return options.sessionId;
    }
    /**
     * Fork an existing session to create an independent branch.
     * Returns the new session ID.
     */
    async forkSession(options) {
        if (!this.connection) {
            throw new Error('Not connected. Call connect() first.');
        }
        const forkPromise = this.connection.unstable_forkSession({
            sessionId: options.sessionId,
            cwd: options.cwd ?? this.options.cwd,
            mcpServers: options.mcpServers ?? this.options.mcpServers ?? [],
        });
        const result = await this.withTimeout(forkPromise);
        return result.sessionId;
    }
    /**
     * List available sessions, optionally filtered by working directory.
     */
    async listSessions(cwd) {
        if (!this.connection) {
            throw new Error('Not connected. Call connect() first.');
        }
        const listPromise = this.connection.unstable_listSessions({
            cwd: cwd ?? null,
        });
        const result = await this.withTimeout(listPromise);
        return result.sessions.map((s) => ({
            sessionId: s.sessionId,
            cwd: s.cwd,
            title: s.title ?? undefined,
            updatedAt: s.updatedAt ?? undefined,
        }));
    }
    withTimeout(promise) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new ConnectionTimeoutError(this.options.timeout)), this.options.timeout);
        });
        return Promise.race([promise, timeoutPromise]);
    }
    /**
     * Get the underlying ACP connection (for advanced usage).
     */
    getConnection() {
        return this.connection;
    }
    /**
     * Whether the client is connected to the server.
     */
    get connected() {
        return this.connection !== null && this.server.running;
    }
    /**
     * Close the connection and stop the server.
     */
    async close() {
        this.connection = null;
        await this.server.stop();
    }
}
/**
 * Create and connect an ACP client. Convenience factory function.
 */
export async function createClient(options) {
    const client = new AcpCodeClient(options);
    await client.connect();
    return client;
}
