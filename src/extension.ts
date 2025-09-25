import * as vscode from 'vscode';
import { CodeSanitizer } from './sanitizer';
import { ClipboardManager } from './clipboardManager';
import { StatusBarManager } from './statusBar';

let sanitizer: CodeSanitizer;
let clipboardManager: ClipboardManager;
let statusBar: StatusBarManager;

export function activate(context: vscode.ExtensionContext) {
	console.log('SafePaste extension is now active!');

	// Initialize components
	sanitizer = new CodeSanitizer();
	clipboardManager = new ClipboardManager(sanitizer);
	statusBar = new StatusBarManager();

	// Set context for keybindings
	vscode.commands.executeCommand('setContext', 'safepaste.hasSanitizedContent', false);
	vscode.commands.executeCommand('setContext', 'safepaste.hasOriginalContent', false);

	// Register commands
	const commands = [
		vscode.commands.registerCommand('safepaste.sanitizeClipboard', async () => {
			try {
				statusBar.updateStatusBar('processing');
				const result = await clipboardManager.sanitizeClipboard();

				statusBar.updateStatusBar('sanitized', result);

				// Update context for keybindings
				vscode.commands.executeCommand('setContext', 'safepaste.hasSanitizedContent', true);
				vscode.commands.executeCommand('setContext', 'safepaste.hasOriginalContent', true);

				if (result.hasChanges) {
					vscode.window.showInformationMessage(
						`SafePaste: Applied ${result.appliedRules.length} sanitization rules. Content is ready to paste.`,
						'Show Changes', 'Paste Now'
					).then(selection => {
						if (selection === 'Show Changes') {
							vscode.commands.executeCommand('safepaste.showStatus');
						} else if (selection === 'Paste Now') {
							vscode.commands.executeCommand('safepaste.pasteSanitized');
						}
					});
				} else {
					vscode.window.showInformationMessage('SafePaste: No sensitive content detected.');
				}
			} catch (error) {
				statusBar.updateStatusBar('error');
				vscode.window.showErrorMessage(`SafePaste Error: ${error}`);
			}
		}),

		vscode.commands.registerCommand('safepaste.pasteSanitized', async () => {
			try {
				await clipboardManager.pasteSanitized();
				vscode.window.showInformationMessage('SafePaste: Sanitized content pasted.');
			} catch (error) {
				vscode.window.showErrorMessage(`SafePaste Error: ${error}`);
			}
		}),

		vscode.commands.registerCommand('safepaste.pasteOriginal', async () => {
			try {
				await clipboardManager.pasteOriginal();
				vscode.window.showWarningMessage('SafePaste: Original (unsanitized) content pasted.');
			} catch (error) {
				vscode.window.showErrorMessage(`SafePaste Error: ${error}`);
			}
		}),

		vscode.commands.registerCommand('safepaste.showStatus', () => {
			const result = clipboardManager.getLastSanitizationResult();
			statusBar.showStatusDialog(result || undefined);
		}),

		vscode.commands.registerCommand('safepaste.configureRules', () => {
			vscode.commands.executeCommand('workbench.action.openSettings', 'safepaste');
		}),

		vscode.commands.registerCommand('safepaste.clearContent', () => {
			clipboardManager.clear();
			statusBar.updateStatusBar('ready');

			// Update context for keybindings
			vscode.commands.executeCommand('setContext', 'safepaste.hasSanitizedContent', false);
			vscode.commands.executeCommand('setContext', 'safepaste.hasOriginalContent', false);

			vscode.window.showInformationMessage('SafePaste: Stored content cleared.');
		})
	];

	// Register all commands
	commands.forEach(command => context.subscriptions.push(command));

	// Register status bar
	context.subscriptions.push(statusBar);

	// Listen for configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(event => {
			if (event.affectsConfiguration('safepaste')) {
				// Reload sanitizer with new configuration
				sanitizer = new CodeSanitizer();
				clipboardManager = new ClipboardManager(sanitizer);
			}
		})
	);
}

export function deactivate() {
	if (statusBar) {
		statusBar.dispose();
	}
}
