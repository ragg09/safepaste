"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeSanitizer = void 0;
const vscode = __importStar(require("vscode"));
class CodeSanitizer {
    defaultRules = [
        {
            name: 'api-keys',
            pattern: /(?:api_key|apikey|api-key|key)\s*[=:]\s*["']?([a-zA-Z0-9_\-]{20,})["']?/gi,
            replacement: (match, key) => match.replace(key, 'YOUR_API_KEY_HERE'),
            description: 'Replace API keys with placeholder',
            enabled: true
        },
        {
            name: 'tokens',
            pattern: /(?:token|auth_token|access_token|bearer)\s*[=:]\s*["']?([a-zA-Z0-9_\-\.]{30,})["']?/gi,
            replacement: (match, token) => match.replace(token, 'YOUR_TOKEN_HERE'),
            description: 'Replace tokens with placeholder',
            enabled: true
        },
        {
            name: 'passwords',
            pattern: /(?:password|passwd|pwd)\s*[=:]\s*["']([^"'\s]{6,})["']?/gi,
            replacement: (match, pwd) => match.replace(pwd, 'YOUR_PASSWORD_HERE'),
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
    customRules = [];
    constructor() {
        this.loadCustomRules();
    }
    sanitize(code, language) {
        let sanitized = code;
        const appliedRules = [];
        const original = code;
        const allRules = [...this.defaultRules, ...this.customRules].filter(rule => rule.enabled);
        for (const rule of allRules) {
            const beforeSanitization = sanitized;
            if (typeof rule.replacement === 'function') {
                sanitized = sanitized.replace(rule.pattern, rule.replacement);
            }
            else {
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
    applylanguageSpecificRules(code, language, appliedRules) {
        let sanitized = code;
        switch (language.toLowerCase()) {
            case 'javascript':
            case 'typescript':
                // Handle process.env patterns
                sanitized = sanitized.replace(/process\.env\.([A-Z_]+)/g, 'process.env.YOUR_ENV_VAR');
                if (sanitized !== code) {
                    appliedRules.push('js-env-vars');
                }
                break;
            case 'python':
                // Handle os.environ patterns
                sanitized = sanitized.replace(/os\.environ(?:\.get)?\(['"]([^'"]+)['"]\)/g, "os.environ.get('YOUR_ENV_VAR')");
                if (sanitized !== code) {
                    appliedRules.push('python-env-vars');
                }
                break;
            case 'java':
                // Handle System.getProperty patterns
                sanitized = sanitized.replace(/System\.getProperty\(['"]([^'"]+)['"]\)/g, "System.getProperty('your.property')");
                if (sanitized !== code) {
                    appliedRules.push('java-properties');
                }
                break;
        }
        return sanitized;
    }
    loadCustomRules() {
        const config = vscode.workspace.getConfiguration('safepaste');
        const customRules = config.get('customRules', []);
        this.customRules = customRules;
    }
    getEnabledRules() {
        return [...this.defaultRules, ...this.customRules].filter(rule => rule.enabled);
    }
    updateCustomRules(rules) {
        this.customRules = rules;
        const config = vscode.workspace.getConfiguration('safepaste');
        config.update('customRules', rules, vscode.ConfigurationTarget.Global);
    }
}
exports.CodeSanitizer = CodeSanitizer;
//# sourceMappingURL=sanitizer.js.map