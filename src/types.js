/**
 * @typedef {'default'|'acceptEdits'|'bypassPermissions'|'plan'|'dontAsk'} PermissionMode
 */

/**
 * @typedef {{name: string, uri: string}} McpServerConfig
 */

/**
 * @typedef {Object} ClientOptions
 * @property {string=} cwd
 * @property {PermissionMode=} permissionMode
 * @property {string=} model
 * @property {string=} serverCommand
 * @property {Record<string,string>=} env
 * @property {number=} timeout
 * @property {number=} maxRetries
 * @property {string[]=} additionalDirectories
 * @property {McpServerConfig[]=} mcpServers
 * @property {(request:{title:string, options:Array<{name:string, kind:string, optionId:string}>})=>Promise<string|null>=} permissionHandler
 * @property {boolean=} allowOutsideCwd - When true, readTextFile/writeTextFile can access paths outside cwd. Default false.
 */

/**
 * @typedef {Object} PromptOptions
 * @property {string=} sessionId
 * @property {string=} cwd
 * @property {AbortSignal=} signal
 */

/**
 * @typedef {Object} ResumeOptions
 * @property {string} sessionId
 * @property {string=} cwd
 * @property {McpServerConfig[]=} mcpServers
 */

/**
 * @typedef {Object} SessionInfo
 * @property {string} sessionId
 * @property {string} cwd
 * @property {string=} title
 * @property {string=} updatedAt
 */

/**
 * @typedef {Object} PromptResult
 * @property {string} text
 * @property {string} sessionId
 * @property {string} stopReason
 */

/**
 * @typedef {Object} VerifiedPromptOptions
 * @property {string[]} expectedFiles
 * @property {number=} maxRetries
 * @property {string=} sessionId
 * @property {string=} cwd
 * @property {AbortSignal=} signal
 */

/**
 * @typedef {PromptResult & {
 *   verified: boolean,
 *   verifiedFiles: string[],
 *   missingFiles: string[],
 *   attempts: number
 * }} VerifiedPromptResult
 */

export {};
