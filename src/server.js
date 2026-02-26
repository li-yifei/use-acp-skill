import { spawn } from 'node:child_process';
import { Writable, Readable } from 'node:stream';
import { ndJsonStream } from '@agentclientprotocol/sdk';
import { ServerNotFoundError } from './errors.js';
export class AcpServer {
    process = null;
    _stream = null;
    command;
    env;
    permissionMode;
    constructor(options = {}) {
        this.command = options.command ?? 'claude-code-acp';
        this.env = options.env ?? {};
        this.permissionMode = options.permissionMode;
    }
    /**
     * Spawn the claude-code-acp process and create the ACP stream.
     * Returns the ndJsonStream for use with ClientSideConnection.
     */
    async start() {
        // Build args array with permission mode if provided
        const args = [];
        if (this.permissionMode) {
            args.push('--permission-mode', this.permissionMode);
        }
        // Spawn the process with stdio pipes
        this.process = spawn(this.command, args, {
            stdio: ['pipe', 'pipe', 'inherit'],
            env: { ...process.env, ...this.env },
        });
        // Handle spawn errors (e.g., command not found)
        // Use a Promise that rejects on 'error' event or resolves on first 'spawn' event
        await new Promise((resolve, reject) => {
            this.process.once('error', (err) => {
                if (err.code === 'ENOENT') {
                    reject(new ServerNotFoundError(this.command));
                }
                else {
                    reject(err);
                }
            });
            this.process.once('spawn', () => resolve());
        });
        // Convert node streams to web streams for ACP SDK
        const input = Writable.toWeb(this.process.stdin);
        const output = Readable.toWeb(this.process.stdout);
        this._stream = ndJsonStream(input, output);
        return this._stream;
    }
    /**
     * Get the current stream (throws if not started).
     */
    get stream() {
        if (!this._stream) {
            throw new Error('Server not started. Call start() first.');
        }
        return this._stream;
    }
    /**
     * Whether the server process is running.
     */
    get running() {
        return this.process !== null && this.process.exitCode === null && !this.process.killed;
    }
    /**
     * Gracefully stop the server process.
     */
    async stop() {
        if (!this.process)
            return;
        const proc = this.process;
        this.process = null;
        this._stream = null;
        if (proc.exitCode !== null || proc.killed)
            return;
        // Send SIGTERM and wait up to 5 seconds
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                proc.kill('SIGKILL');
                resolve();
            }, 5000);
            proc.once('exit', () => {
                clearTimeout(timeout);
                resolve();
            });
            proc.kill('SIGTERM');
        });
    }
}
