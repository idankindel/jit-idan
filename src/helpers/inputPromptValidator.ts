import { TDockerConfig } from './types';

// Size limits
export const MAX_SCRIPT_SIZE = 1024 * 1024; // 1MB
export const MAX_README_SIZE = 100 * 1024;  // 100KB

// Allowed values
export const ALLOWED_SCRIPT_TYPES = ['python', 'bash', 'javascript', 'typescript', 'java', 'ruby', 'go'];
export const ALLOWED_ANALYSIS_RESULTS = ['SUCCESS', 'FAILED'];

// Regex patterns for prompt injection detection
export const SUSPICIOUS_PATTERNS = [
    /{{.*}}/,                    // Template injection
    /<script.*>/i,               // Script tags
    /\[.*system.*\]/i,          // System commands in brackets
    /prompt.*return/i,          // Prompt manipulation attempts
    /role.*=.*system/i,         // Role manipulation
    /assistant.*=.*system/i,    // Assistant manipulation
];

export namespace inputPromptValidator {

    export function detectPromptInjection(input: string): void {
        // Check for suspicious patterns
        for (const pattern of SUSPICIOUS_PATTERNS) {
            if (pattern.test(input)) {
                throw new Error(`Potential prompt injection detected: ${pattern}`);
            }
        }

        // Check for attempts to escape code blocks
        const backticksCount = (input.match(/```/g) || []).length;
        if (backticksCount % 2 !== 0) {
            throw new Error('Invalid code block formatting detected');
        }

        // Check for attempts to change roles or system prompts
        const lowercaseInput = input.toLowerCase();
        if (
            lowercaseInput.includes('system prompt') ||
            lowercaseInput.includes('ignore previous') ||
            lowercaseInput.includes('forget above')
        ) {
            throw new Error('Potential prompt injection attempt detected');
        }
    }

    export function validateScriptInput(scriptContent: string, scriptName: string): void {
        // Check file size
        if (Buffer.from(scriptContent).length > MAX_SCRIPT_SIZE) {
            throw new Error('Script size exceeds maximum allowed size');
        }

        // Validate script name
        if (!/^[\w\-\.]+$/.test(scriptName)) {
            throw new Error('Invalid script name format');
        }

        // Check for file path traversal
        if (scriptName.includes('..') || scriptName.includes('/')) {
            throw new Error('Path traversal attempt detected');
        }
    }

    export function validateReadmeContent(readmeContent: string): void {
        if (Buffer.from(readmeContent).length > MAX_README_SIZE) {
            throw new Error('README size exceeds maximum allowed size');
        }
    }

    export function validateDockerConfig(config: TDockerConfig): void {
        const { baseImage, execPrefix, entrypoint } = config;

        // Validate base image format
        if (!/^[\w\-\/\:\.]+$/.test(baseImage)) {
            throw new Error('Invalid base image format');
        }

        // Validate execution prefix
        if (!/^\/[\w\-\/]+$/.test(execPrefix)) {
            throw new Error('Invalid execution prefix format');
        }

        // Validate entrypoint
        if (!Array.isArray(entrypoint) || !entrypoint.every(item => typeof item === 'string')) {
            throw new Error('Invalid entrypoint format');
        }
    }
}