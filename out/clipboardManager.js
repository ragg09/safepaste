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
            // Don't write back to clipboard - keep it in memory only
            // This allows external clipboard changes to work normally
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
        // Check if clipboard content has changed since sanitization
        const currentClipboard = await vscode.env.clipboard.readText();
        if (currentClipboard !== this.originalContent) {
            // Clipboard has changed - warn user and offer to re-sanitize
            const choice = await vscode.window.showWarningMessage('Clipboard content has changed since sanitization. Use current clipboard content instead?', 'Re-sanitize Current', 'Use Stored Sanitized', 'Cancel');
            if (choice === 'Cancel') {
                return;
            }
            if (choice === 'Re-sanitize Current') {
                // Re-sanitize current clipboard content
                const result = await this.sanitizeClipboard();
                if (result.hasChanges) {
                    vscode.window.showInformationMessage(`Re-sanitized: Applied ${result.appliedRules.length} sanitization rules.`);
                }
            }
            // If "Use Stored Sanitized" is chosen, continue with stored content
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
    async pasteWithAutoSanitize() {
        const currentClipboard = await vscode.env.clipboard.readText();
        if (!currentClipboard || currentClipboard.trim() === '') {
            throw new Error('Clipboard is empty');
        }
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            throw new Error('No active editor found');
        }
        // Get the active editor's language for context-aware sanitization
        const language = activeEditor.document.languageId;
        const result = this.sanitizer.sanitize(currentClipboard, language);
        // Update stored content
        this.originalContent = result.original;
        this.sanitizedContent = result.sanitized;
        this.lastSanitizationResult = result;
        // Paste the sanitized content
        const selection = activeEditor.selection;
        await activeEditor.edit(editBuilder => {
            editBuilder.replace(selection, result.sanitized);
        });
        // Show notification if changes were made
        if (result.hasChanges) {
            vscode.window.showInformationMessage(`SafePaste: Auto-sanitized and pasted. Applied ${result.appliedRules.length} rules.`, 'Show Changes').then(selection => {
                if (selection === 'Show Changes') {
                    vscode.commands.executeCommand('safepaste.showStatus');
                }
            });
        }
    }
    clear() {
        this.originalContent = '';
        this.sanitizedContent = '';
        this.lastSanitizationResult = null;
    }
}
exports.ClipboardManager = ClipboardManager;
//# sourceMappingURL=clipboardManager.js.map