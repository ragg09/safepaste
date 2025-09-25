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

            // Write the sanitized content back to clipboard
            await vscode.env.clipboard.writeText(result.sanitized);

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

    public clear(): void {
        this.originalContent = '';
        this.sanitizedContent = '';
        this.lastSanitizationResult = null;
    }
}