/**
 * Base error class for ACP skill errors.
 */
export class AcpSkillError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AcpSkillError';
    }
}
/**
 * Thrown when the ACP server binary cannot be found.
 */
export class ServerNotFoundError extends AcpSkillError {
    constructor(command) {
        super(
          `Could not find '${command}' on PATH. ` +
          `Install the agent/CLI you chose (see references/acp-agents-registry.md), ` +
          `or set serverCommand/serverArgs to a valid ACP server.`
        );
        this.name = 'ServerNotFoundError';
    }
}
/**
 * Thrown when the connection to the ACP server times out.
 */
export class ConnectionTimeoutError extends AcpSkillError {
    constructor(timeoutMs) {
        super(`Connection to ACP server timed out after ${timeoutMs}ms`);
        this.name = 'ConnectionTimeoutError';
    }
}
/**
 * Thrown when the ACP server process crashes unexpectedly.
 */
export class ServerCrashedError extends AcpSkillError {
    exitCode;
    signal;
    constructor(exitCode, signal) {
        super(`ACP server crashed` +
            (exitCode !== null ? ` with exit code ${exitCode}` : '') +
            (signal ? ` (signal: ${signal})` : ''));
        this.name = 'ServerCrashedError';
        this.exitCode = exitCode;
        this.signal = signal;
    }
}
/**
 * Thrown when a tool permission is denied.
 */
export class PermissionDeniedError extends AcpSkillError {
    toolName;
    constructor(toolName) {
        super(`Permission denied for tool: ${toolName}`);
        this.name = 'PermissionDeniedError';
        this.toolName = toolName;
    }
}
/**
 * Thrown when a session is not found.
 */
export class SessionNotFoundError extends AcpSkillError {
    sessionId;
    constructor(sessionId) {
        super(`Session not found: ${sessionId}`);
        this.name = 'SessionNotFoundError';
        this.sessionId = sessionId;
    }
}
