# SafePaste - VS Code Extension

SafePaste is a VS Code extension that automatically sanitizes sensitive data from code before pasting to AI tools. It protects API keys, passwords, tokens, and other secrets while maintaining code structure and functionality.

## Features

### 🔐 Intelligent Sanitization
- **API Keys & Tokens**: Automatically detects and replaces API keys, tokens, and bearer tokens
- **Passwords**: Identifies password patterns in various formats
- **Connection Strings**: Sanitizes database connection strings (MongoDB, MySQL, PostgreSQL, Redis)
- **Credentials in URLs**: Removes authentication credentials from URLs
- **Email Addresses & IP Addresses**: Replaces with placeholder values
- **Private Keys**: Sanitizes SSL/SSH private keys
- **Sensitive Comments**: Removes comments containing sensitive information

### 🎯 Language-Specific Rules
- **JavaScript/TypeScript**: Handles `process.env` patterns
- **Python**: Sanitizes `os.environ` usage
- **Java**: Processes `System.getProperty` calls
- **More languages**: Extensible architecture for additional language support

### ⚡ Smart Keyboard Shortcuts
- **Ctrl+Alt+C** (Cmd+Alt+C on Mac): Sanitize clipboard content
- **Ctrl+V** (Cmd+V on Mac): Paste sanitized version (when sanitized content available)
- **Ctrl+Alt+V** (Cmd+Alt+V on Mac): Paste original version

### 📊 Visual Feedback
- **Status Bar Indicator**: Shows sanitization status and applied rules
- **Diff Viewer**: Compare original vs sanitized content
- **Rule Notifications**: See which sanitization rules were applied

### ⚙️ Configurable Rules
- Enable/disable default sanitization rules
- Add custom sanitization patterns
- Configure replacement strings
- Language-specific rule settings

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "SafePaste"
4. Click Install

## Usage

### Basic Workflow
1. Copy code containing sensitive data to your clipboard
2. Press **Ctrl+Alt+C** to sanitize the clipboard content
3. Press **Ctrl+V** to paste the sanitized version
4. Use **Ctrl+Alt+V** if you need the original version

### Command Palette
Access SafePaste commands via Command Palette (Ctrl+Shift+P):
- `SafePaste: Sanitize Clipboard Content`
- `SafePaste: Paste Sanitized Content`
- `SafePaste: Paste Original Content`
- `SafePaste: Show Status`
- `SafePaste: Configure Sanitization Rules`
- `SafePaste: Clear Stored Content`

### Status Bar
The SafePaste status bar indicator shows:
- 🛡️ **Ready**: Extension is active and ready
- 🛡️ **X rules applied**: Content has been sanitized
- ⚡ **Processing**: Currently sanitizing content
- ❌ **Error**: Something went wrong

Click the status bar item for detailed information and options.

## Extension Settings

This extension contributes the following settings:

* `safepaste.enabled`: Enable/disable SafePaste extension
* `safepaste.showStatusBar`: Show SafePaste status in status bar
* `safepaste.autoSanitizeOnCopy`: Automatically sanitize content when copying to clipboard
* `safepaste.defaultRules`: Enable/disable specific default sanitization rules
* `safepaste.customRules`: Add custom sanitization patterns

Example configuration:

```json
{
  "safepaste.enabled": true,
  "safepaste.showStatusBar": true,
  "safepaste.autoSanitizeOnCopy": false,
  "safepaste.defaultRules": {
    "api-keys": true,
    "tokens": true,
    "passwords": true,
    "connection-strings": true,
    "urls-with-credentials": true,
    "email-addresses": true,
    "ip-addresses": true,
    "private-keys": true,
    "sensitive-comments": true
  },
  "safepaste.customRules": [
    {
      "name": "custom-secret",
      "pattern": "SECRET_[A-Z_]+",
      "replacement": "SECRET_PLACEHOLDER",
      "description": "Replace custom secret patterns",
      "enabled": true
    }
  ]
}
```

## Examples

### Before Sanitization
```javascript
const config = {
  apiKey: "sk_live_abcd1234567890",
  dbUrl: "mongodb://admin:password123@localhost:27017/myapp",
  email: "john.doe@company.com",
  serverIp: "192.168.1.50",
  token: process.env.JWT_SECRET
};
```

### After Sanitization
```javascript
const config = {
  apiKey: "YOUR_API_KEY_HERE",
  dbUrl: "database://user:password@host:port/database",
  email: "user@example.com",
  serverIp: "192.168.1.100",
  token: process.env.YOUR_ENV_VAR
};
```

## Security & Privacy

- **No Data Transmission**: All processing happens locally in VS Code
- **No Storage**: Sensitive data is not persisted to disk
- **Temporary Memory**: Original content is only kept in memory during the session
- **User Control**: You decide when and what to sanitize

## Requirements

- VS Code 1.104.0 or higher
- No additional dependencies required

## Known Issues

- Complex regex patterns in custom rules may impact performance
- Some edge cases in language-specific sanitization may require manual review
- Keybinding conflicts may occur with other extensions

## Release Notes

### 0.0.1 - Initial Release

- Core sanitization functionality for API keys, passwords, tokens, and connection strings
- Smart keyboard shortcuts for clipboard management
- Status bar integration with visual feedback
- Command palette support for all operations
- Configurable sanitization rules with custom pattern support
- Language-specific sanitization for JavaScript, Python, and Java
- Comprehensive test suite ensuring reliability
- Diff viewer for comparing original vs sanitized content

---

## Security Notice

**⚠️ Important**: Always review sanitized content before sharing with AI tools to ensure no sensitive information remains. SafePaste provides intelligent sanitization but cannot guarantee complete removal of all sensitive data in every context.
