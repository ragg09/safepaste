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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const sanitizer_1 = require("./sanitizer");
const clipboardManager_1 = require("./clipboardManager");
const statusBar_1 = require("./statusBar");
let sanitizer;
let clipboardManager;
let statusBar;
function activate(context) {
    console.log('SafePaste extension is now active!');
    // Initialize components
    sanitizer = new sanitizer_1.CodeSanitizer();
    clipboardManager = new clipboardManager_1.ClipboardManager(sanitizer);
    statusBar = new statusBar_1.StatusBarManager();
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
                    vscode.window.showInformationMessage(`SafePaste: Applied ${result.appliedRules.length} sanitization rules. Content is ready to paste.`, 'Show Changes', 'Paste Now').then(selection => {
                        if (selection === 'Show Changes') {
                            vscode.commands.executeCommand('safepaste.showStatus');
                        }
                        else if (selection === 'Paste Now') {
                            vscode.commands.executeCommand('safepaste.pasteSanitized');
                        }
                    });
                }
                else {
                    vscode.window.showInformationMessage('SafePaste: No sensitive content detected.');
                }
            }
            catch (error) {
                statusBar.updateStatusBar('error');
                vscode.window.showErrorMessage(`SafePaste Error: ${error}`);
            }
        }),
        vscode.commands.registerCommand('safepaste.pasteSanitized', async () => {
            try {
                await clipboardManager.pasteSanitized();
                vscode.window.showInformationMessage('SafePaste: Sanitized content pasted.');
            }
            catch (error) {
                vscode.window.showErrorMessage(`SafePaste Error: ${error}`);
            }
        }),
        vscode.commands.registerCommand('safepaste.pasteOriginal', async () => {
            try {
                await clipboardManager.pasteOriginal();
                vscode.window.showWarningMessage('SafePaste: Original (unsanitized) content pasted.');
            }
            catch (error) {
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
        }),
        vscode.commands.registerCommand('safepaste.pasteWithAutoSanitize', async () => {
            try {
                await clipboardManager.pasteWithAutoSanitize();
                // Update context for keybindings
                vscode.commands.executeCommand('setContext', 'safepaste.hasSanitizedContent', true);
                vscode.commands.executeCommand('setContext', 'safepaste.hasOriginalContent', true);
            }
            catch (error) {
                vscode.window.showErrorMessage(`SafePaste Error: ${error}`);
            }
        })
    ];
    // Register all commands
    commands.forEach(command => context.subscriptions.push(command));
    // Register status bar
    context.subscriptions.push(statusBar);
    // Listen for configuration changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('safepaste')) {
            // Reload sanitizer with new configuration
            sanitizer = new sanitizer_1.CodeSanitizer();
            clipboardManager = new clipboardManager_1.ClipboardManager(sanitizer);
        }
    }));
}
function deactivate() {
    if (statusBar) {
        statusBar.dispose();
    }
}
//# sourceMappingURL=extension.js.map