import * as vscode from 'vscode';
import { CodeSanitizer, SanitizationResult } from './sanitizer';

export class ClipboardManager {
    private sanitizer: CodeSanitizer;
    private originalContent: string = '';
    private sanitizedContent: string = '';
    private lastSanitizationResult: SanitizationResult | null = null;

    constructor(sanitizer: CodeSanitizer) {
        this.sanitizer = sanitizer;
    }

    public async sanitizeClipboard(): Promise<SanitizationResult> {
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
        } catch (error) {
            throw new Error(`Failed to sanitize clipboard: ${error}`);
        }
    }

    public async pasteSanitized(): Promise<void> {
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
            const choice = await vscode.window.showWarningMessage(
                'Clipboard content has changed since sanitization. Use current clipboard content instead?',
                'Re-sanitize Current', 'Use Stored Sanitized', 'Cancel'
            );

            if (choice === 'Cancel') {
                return;
            }

            if (choice === 'Re-sanitize Current') {
                // Re-sanitize current clipboard content
                const result = await this.sanitizeClipboard();
                if (result.hasChanges) {
                    vscode.window.showInformationMessage(
                        `Re-sanitized: Applied ${result.appliedRules.length} sanitization rules.`
                    );
                }
            }
            // If "Use Stored Sanitized" is chosen, continue with stored content
        }

        const selection = activeEditor.selection;
        await activeEditor.edit(editBuilder => {
            editBuilder.replace(selection, this.sanitizedContent);
        });
    }

    public async pasteOriginal(): Promise<void> {
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

    public async restoreOriginalToClipboard(): Promise<void> {
        if (!this.originalContent) {
            throw new Error('No original content available');
        }

        await vscode.env.clipboard.writeText(this.originalContent);
    }

    public hasContent(): boolean {
        return this.sanitizedContent !== '' || this.originalContent !== '';
    }

    public getLastSanitizationResult(): SanitizationResult | null {
        return this.lastSanitizationResult;
    }

    public getSanitizedContent(): string {
        return this.sanitizedContent;
    }

    public getOriginalContent(): string {
        return this.originalContent;
    }

    public async pasteWithAutoSanitize(): Promise<void> {
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
            vscode.window.showInformationMessage(
                `SafePaste: Auto-sanitized and pasted. Applied ${result.appliedRules.length} rules.`,
                'Show Changes'
            ).then(selection => {
                if (selection === 'Show Changes') {
                    vscode.commands.executeCommand('safepaste.showStatus');
                }
            });
        }
    }

    public clear(): void {
        this.originalContent = '';
        this.sanitizedContent = '';
        this.lastSanitizationResult = null;
    }
}