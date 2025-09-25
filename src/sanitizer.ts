import * as vscode from 'vscode';

export interface SanitizationRule {
    name: string;
    pattern: RegExp;
    replacement: string | ((match: string, ...groups: string[]) => string);
    description: string;
    enabled: boolean;
}

export interface SanitizationResult {
    sanitized: string;
    original: string;
    appliedRules: string[];
    hasChanges: boolean;
}

export class CodeSanitizer {
    private defaultRules: SanitizationRule[] = [
        {
            name: 'api-keys',
            pattern: /(?:api_key|apikey|api-key|key)\s*[=:]\s*["']?([a-zA-Z0-9_\-]{20,})["']?/gi,
            replacement: (match: string, key: string) => match.replace(key, 'YOUR_API_KEY_HERE'),
            description: 'Replace API keys with placeholder',
            enabled: true
        },
        {
            name: 'tokens',
            pattern: /(?:token|auth_token|access_token|bearer)\s*[=:]\s*["']?([a-zA-Z0-9_\-\.]{30,})["']?/gi,
            replacement: (match: string, token: string) => match.replace(token, 'YOUR_TOKEN_HERE'),
            description: 'Replace tokens with placeholder',
            enabled: true
        },
        {
            name: 'passwords',
            pattern: /(?:password|passwd|pwd)\s*[=:]\s*["']([^"'\s]{6,})["']?/gi,
            replacement: (match: string, pwd: string) => match.replace(pwd, 'YOUR_PASSWORD_HERE'),
            description: 'Replace passwords with placeholder',
            enabled: true
        },
        {
            name: 'connection-strings',
            pattern: /(mongodb|mysql|postgres|redis):\/\/[^\s"'`]+/gi,
            replacement: 'database://user:password@host:port/database',
            description: 'Replace database connection strings',
            enabled: true
        },
        {
            name: 'urls-with-credentials',
            pattern: /https?:\/\/[^:\/\s]+:[^@\/\s]+@[^\s"'`]+/gi,
            replacement: 'https://username:password@your-server.com',
            description: 'Replace URLs containing credentials',
            enabled: true
        },
        {
            name: 'email-addresses',
            pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            replacement: 'user@example.com',
            description: 'Replace email addresses',
            enabled: true
        },
        {
            name: 'ip-addresses',
            pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
            replacement: '192.168.1.100',
            description: 'Replace IP addresses',
            enabled: true
        },
        {
            name: 'private-keys',
            pattern: /-----BEGIN[^-]+PRIVATE KEY-----[\s\S]*?-----END[^-]+PRIVATE KEY-----/gi,
            replacement: '-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----',
            description: 'Replace private keys',
            enabled: true
        },
        {
            name: 'sensitive-comments',
            pattern: /\/\*[\s\S]*?(?:password|secret|key|token|credential)[\s\S]*?\*\/|\/\/.*(?:password|secret|key|token|credential).*/gi,
            replacement: '// Sensitive comment removed',
            description: 'Remove sensitive information from comments',
            enabled: true
        }
    ];

    private customRules: SanitizationRule[] = [];

    constructor() {
        this.loadCustomRules();
    }

    public sanitize(code: string, language?: string): SanitizationResult {
        let sanitized = code;
        const appliedRules: string[] = [];
        const original = code;

        const allRules = [...this.defaultRules, ...this.customRules].filter(rule => rule.enabled);

        for (const rule of allRules) {
            const beforeSanitization = sanitized;

            if (typeof rule.replacement === 'function') {
                sanitized = sanitized.replace(rule.pattern, rule.replacement);
            } else {
                sanitized = sanitized.replace(rule.pattern, rule.replacement);
            }

            if (beforeSanitization !== sanitized) {
                appliedRules.push(rule.name);
            }
        }

        // Language-specific sanitization
        if (language) {
            sanitized = this.applylanguageSpecificRules(sanitized, language, appliedRules);
        }

        return {
            sanitized,
            original,
            appliedRules,
            hasChanges: sanitized !== original
        };
    }

    private applylanguageSpecificRules(code: string, language: string, appliedRules: string[]): string {
        let sanitized = code;

        switch (language.toLowerCase()) {
            case 'javascript':
            case 'typescript':
                // Handle process.env patterns
                sanitized = sanitized.replace(
                    /process\.env\.([A-Z_]+)/g,
                    'process.env.YOUR_ENV_VAR'
                );
                if (sanitized !== code) {
                    appliedRules.push('js-env-vars');
                }
                break;

            case 'python':
                // Handle os.environ patterns
                sanitized = sanitized.replace(
                    /os\.environ(?:\.get)?\(['"]([^'"]+)['"]\)/g,
                    "os.environ.get('YOUR_ENV_VAR')"
                );
                if (sanitized !== code) {
                    appliedRules.push('python-env-vars');
                }
                break;

            case 'java':
                // Handle System.getProperty patterns
                sanitized = sanitized.replace(
                    /System\.getProperty\(['"]([^'"]+)['"]\)/g,
                    "System.getProperty('your.property')"
                );
                if (sanitized !== code) {
                    appliedRules.push('java-properties');
                }
                break;
        }

        return sanitized;
    }

    private loadCustomRules(): void {
        const config = vscode.workspace.getConfiguration('safepaste');
        const customRules = config.get<SanitizationRule[]>('customRules', []);
        this.customRules = customRules;
    }

    public getEnabledRules(): SanitizationRule[] {
        return [...this.defaultRules, ...this.customRules].filter(rule => rule.enabled);
    }

    public updateCustomRules(rules: SanitizationRule[]): void {
        this.customRules = rules;
        const config = vscode.workspace.getConfiguration('safepaste');
        config.update('customRules', rules, vscode.ConfigurationTarget.Global);
    }
}