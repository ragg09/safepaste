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
exports.ClipboardManager = void 0;
const vscode = __importStar(require("vscode"));
class ClipboardManager {
    sanitizer;
    originalContent = '';
    sanitizedContent = '';
    lastSanitizationResult = null;
    constructor(sanitizer) {
        this.sanitizer = sanitizer;
    }
    async sanitizeClipboard() {
        try {
            const clipboardContent = await vscode.env.clipboard.readText();
            if (!clipboardContent || clipboardContent.trim() === '') {
                throw new Error('Clipboard is empty');
            }
            // Get the active editor's language for context-aware sanitization
            const activeEditor = vscode.window.activeTextEditor;
            const language = activeEditor?.document.languageId;
            const result = this.sanitizer.sanitize(clipboardContent, language);
            this.originalContent = result.original;
            this.sanitizedContent = result.sanitized;
            this.lastSanitizationResult = result;
            // Write the sanitized content back to clipboard
            await vscode.env.clipboard.writeText(result.sanitized);
            return result;
        }
        catch (error) {
            throw new Error(`Failed to sanitize clipboard: ${error}`);
        }
    }
    async pasteSanitized() {
        if (!this.sanitizedContent) {
            throw new Error('No sanitized content available. Run "Sanitize Clipboard" first.');
        }
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            throw new Error('No active editor found');
        }
        const selection = activeEditor.selection;
        await activeEditor.edit(editBuilder => {
            editBuilder.replace(selection, this.sanitizedContent);
        });
    }
    async pasteOriginal() {
        if (!this.originalContent) {
            throw new Error('No original content available. Run "Sanitize Clipboard" first.');
        }
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            throw new Error('No active editor found');
        }
        const selection = activeEditor.selection;
        await activeEditor.edit(editBuilder => {
            editBuilder.replace(selection, this.originalContent);
        });
    }
    async restoreOriginalToClipboard() {
        if (!this.originalContent) {
            throw new Error('No original content available');
        }
        await vscode.env.clipboard.writeText(this.originalContent);
    }
    hasContent() {
        return this.sanitizedContent !== '' || this.originalContent !== '';
    }
    getLastSanitizationResult() {
        return this.lastSanitizationResult;
    }
    getSanitizedContent() {
        return this.sanitizedContent;
    }
    getOriginalContent() {
        return this.originalContent;
    }
    clear() {
        this.originalContent = '';
        this.sanitizedContent = '';
        this.lastSanitizationResult = null;
    }
}
exports.ClipboardManager = ClipboardManager;
//# sourceMappingURL=clipboardManager.js.map