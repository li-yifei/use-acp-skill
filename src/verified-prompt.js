/**
 * Anti-hallucination instructions prepended to every verified prompt.
 * Forces the agent to use tool calls for file writes and forbids
 * dumping large content into chat output.
 */
const WRITE_GUARD = `
CRITICAL FILE-WRITE RULES (you MUST follow these):
1. You MUST use the Write tool to save any file output. NEVER just display file contents in chat.
2. Do NOT output the full file content in your response text. Only output brief status updates.
3. After writing each file, immediately run: ls -l <filepath> to confirm it exists and has non-zero size.
4. If a file is too large to write in one call, write it in chunks — do NOT skip the write.
5. You have NOT completed the task until all target files are confirmed on disk via ls.
`.trim();
/**
 * Verification prompt sent after the main task to check file existence.
 */
function buildVerificationPrompt(files) {
    const checks = files.map(f => `ls -l "${f}"`).join(' && ');
    return `VERIFICATION STEP — Do not skip this.
Run the following command and report the output exactly:
${checks}

For each file, report:
- EXISTS: <filepath> (<size> bytes)
- MISSING: <filepath>

If ANY file is MISSING or has 0 bytes, you MUST retry writing it now. Do NOT report success if files are missing.`;
}
/**
 * Strip markdown formatting (backticks, bold, italic) from text for reliable parsing.
 */
function stripMarkdown(text) {
    return text
        .replace(/```[^`]*```/gs, '') // code blocks
        .replace(/`([^`]+)`/g, '$1') // inline code
        .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
        .replace(/\*([^*]+)\*/g, '$1'); // italic
}
/**
 * Parse verification response to extract which files exist.
 */
function parseVerification(text, expectedFiles) {
    const verified = [];
    const missing = [];
    const clean = stripMarkdown(text);
    for (const file of expectedFiles) {
        const basename = file.split('/').pop() ?? file;
        const escaped = escapeRegex(file);
        const escapedBase = escapeRegex(basename);
        // Check for negative indicators first
        const hasMissing = /MISSING/i.test(clean) && (clean.includes(file) || clean.includes(basename));
        const hasNoSuch = /No such file/i.test(clean) && clean.includes(basename);
        const hasNotFound = /not found/i.test(clean) && clean.includes(basename);
        // Check for positive indicators
        const hasExist = new RegExp(`EXISTS[:\\s]+${escaped}`, 'i').test(clean)
            || new RegExp(`EXISTS[:\\s]+${escapedBase}`, 'i').test(clean);
        const hasLsOutput = new RegExp(`[-rwx]{10}.*${escapedBase}`).test(clean)
            || new RegExp(`\\d+\\s+\\S+.*${escapedBase}`).test(clean);
        const hasBytesRef = new RegExp(`${escapedBase}.*\\d+\\s*bytes`, 'i').test(clean)
            || new RegExp(`\\d+\\s*bytes.*${escapedBase}`, 'i').test(clean);
        const hasConfirmed = new RegExp(`(confirmed|verified|exists|created|written).*${escapedBase}`, 'i').test(clean);
        if (hasMissing || hasNoSuch || hasNotFound) {
            missing.push(file);
        }
        else if (hasExist || hasLsOutput || hasBytesRef || hasConfirmed) {
            verified.push(file);
        }
        else {
            // If we can't determine status, assume missing
            missing.push(file);
        }
    }
    return { verified, missing };
}
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * Send a prompt with anti-hallucination safeguards and post-execution file verification.
 *
 * This wraps the standard `prompt()` with:
 * 1. Injected instructions forcing the agent to use Write tool (not chat output)
 * 2. A follow-up verification prompt that checks expected files exist on disk
 * 3. Automatic retry if files are missing
 */
export async function verifiedPrompt(client, message, options) {
    const maxRetries = options.maxRetries ?? 1;
    const { expectedFiles, ...promptOptions } = options;
    // Inject anti-hallucination guard into the prompt
    const guardedMessage = `${WRITE_GUARD}\n\n---\n\nTASK:\n${message}\n\nEXPECTED OUTPUT FILES:\n${expectedFiles.map(f => `- ${f}`).join('\n')}`;
    let lastResult = await client.prompt(guardedMessage, promptOptions);
    const sessionId = lastResult.sessionId;
    let attempts = 1;
    // Verification + retry loop
    for (let retry = 0; retry <= maxRetries; retry++) {
        // Send verification prompt on the same session
        const verifyResult = await client.prompt(buildVerificationPrompt(expectedFiles), { sessionId });
        const { verified, missing } = parseVerification(verifyResult.text, expectedFiles);
        if (missing.length === 0) {
            return {
                text: lastResult.text,
                sessionId,
                stopReason: lastResult.stopReason,
                verified: true,
                verifiedFiles: verified,
                missingFiles: [],
                attempts,
            };
        }
        // If this was the last retry, return with failures
        if (retry === maxRetries) {
            return {
                text: lastResult.text,
                sessionId,
                stopReason: lastResult.stopReason,
                verified: false,
                verifiedFiles: verified,
                missingFiles: missing,
                attempts,
            };
        }
        // Retry: ask the agent to fix the missing files
        const retryMessage = `RETRY: The following files are MISSING or EMPTY after your previous attempt:\n${missing.map(f => `- ${f}`).join('\n')}\n\nYou MUST write these files now using the Write tool. Do NOT display their contents in chat. After writing, run ls -l to confirm.`;
        lastResult = await client.prompt(retryMessage, { sessionId });
        attempts++;
    }
    // Should not reach here, but just in case
    return {
        text: lastResult.text,
        sessionId,
        stopReason: lastResult.stopReason,
        verified: false,
        verifiedFiles: [],
        missingFiles: expectedFiles,
        attempts,
    };
}
