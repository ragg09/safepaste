import * as vscode from 'vscode';
import { SanitizationResult } from './sanitizer';

export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.command = 'safepaste.showStatus';
        this.updateStatusBar('ready');
        this.statusBarItem.show();
    }

    public updateStatusBar(state: 'ready' | 'sanitized' | 'processing' | 'error', result?: SanitizationResult): void {
        switch (state) {
            case 'ready':
                this.statusBarItem.text = '$(shield) SafePaste: Ready';
                this.statusBarItem.tooltip = 'SafePaste is ready. Use Ctrl+Alt+C to sanitize clipboard content.';
                this.statusBarItem.backgroundColor = undefined;
                break;

            case 'processing':
                this.statusBarItem.text = '$(sync~spin) SafePaste: Processing...';
                this.statusBarItem.tooltip = 'SafePaste is processing clipboard content...';
                this.statusBarItem.backgroundColor = undefined;
                break;

            case 'sanitized':
                if (result) {
                    const rulesCount = result.appliedRules.length;
                    this.statusBarItem.text = `$(shield-check) SafePaste: ${rulesCount} rules applied`;
                    this.statusBarItem.tooltip = this.createSanitizedTooltip(result);
                    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                } else {
                    this.statusBarItem.text = '$(shield-check) SafePaste: Content sanitized';
                    this.statusBarItem.tooltip = 'Content has been sanitized. Click for details.';
                    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                }
                break;

            case 'error':
                this.statusBarItem.text = '$(error) SafePaste: Error';
                this.statusBarItem.tooltip = 'SafePaste encountered an error. Click for details.';
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
                break;
        }
    }

    private createSanitizedTooltip(result: SanitizationResult): string {
        const lines = [
            'SafePaste - Content Sanitized',
            '═'.repeat(30),
            '',
            `Applied Rules: ${result.appliedRules.length}`,
            result.appliedRules.map(rule => `  • ${rule}`).join('\n'),
            '',
            'Commands:',
            '  • Ctrl+V: Paste sanitized version',
            '  • Ctrl+Alt+V: Paste original version',
            '  • Click here for more options'
        ];
        return lines.join('\n');
    }

    public showStatusDialog(result?: SanitizationResult): void {
        if (!result) {
            vscode.window.showInformationMessage('SafePaste is ready. Use Ctrl+Alt+C to sanitize clipboard content.');
            return;
        }

        const message = `SafePaste applied ${result.appliedRules.length} sanitization rules.`;

        const items = [
            'Show Changes',
            'Paste Sanitized',
            'Paste Original',
            'Configure Rules'
        ];

        vscode.window.showInformationMessage(message, ...items).then(selection => {
            switch (selection) {
                case 'Show Changes':
                    this.showChanges(result);
                    break;
                case 'Paste Sanitized':
                    vscode.commands.executeCommand('safepaste.pasteSanitized');
                    break;
                case 'Paste Original':
                    vscode.commands.executeCommand('safepaste.pasteOriginal');
                    break;
                case 'Configure Rules':
                    vscode.commands.executeCommand('workbench.action.openSettings', 'safepaste');
                    break;
            }
        });
    }

    private showChanges(result: SanitizationResult): void {
        const panel = vscode.window.createWebviewPanel(
            'safepasteDiff',
            'SafePaste - Changes Made',
            vscode.ViewColumn.Two,
            {
                enableScripts: true
            }
        );

        panel.webview.html = this.generateDiffHtml(result);
    }

    private generateDiffHtml(result: SanitizationResult): string {
        const originalLines = result.original.split('\n');
        const sanitizedLines = result.sanitized.split('\n');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 20px; }
                    .header { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
                    .rules { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 4px; }
                    .diff-container { display: flex; gap: 20px; }
                    .diff-panel { flex: 1; }
                    .diff-title { font-weight: bold; margin-bottom: 10px; padding: 8px; border-radius: 4px; }
                    .original-title { background: #ffebee; color: #c62828; }
                    .sanitized-title { background: #e8f5e8; color: #2e7d32; }
                    .code-block {
                        background: #f8f8f8;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        padding: 12px;
                        white-space: pre-wrap;
                        font-size: 12px;
                        max-height: 400px;
                        overflow-y: auto;
                    }
                </style>
            </head>
            <body>
                <div class="header">SafePaste - Sanitization Results</div>
                <div class="rules">
                    <strong>Applied Rules:</strong> ${result.appliedRules.join(', ')}
                </div>
                <div class="diff-container">
                    <div class="diff-panel">
                        <div class="diff-title original-title">Original Content</div>
                        <div class="code-block">${this.escapeHtml(result.original)}</div>
                    </div>
                    <div class="diff-panel">
                        <div class="diff-title sanitized-title">Sanitized Content</div>
                        <div class="code-block">${this.escapeHtml(result.sanitized)}</div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    public dispose(): void {
        this.statusBarItem.dispose();
    }
}