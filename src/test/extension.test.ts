import * as assert from 'assert';
import * as vscode from 'vscode';
import { CodeSanitizer } from '../sanitizer';

suite('SafePaste Extension Tests', () => {
	vscode.window.showInformationMessage('Starting SafePaste tests...');

	suite('CodeSanitizer Tests', () => {
		let sanitizer: CodeSanitizer;

		setup(() => {
			sanitizer = new CodeSanitizer();
		});

		test('Should sanitize API keys', () => {
			const code = 'const apiKey = "sk_test_1234567890abcdef1234567890";';
			const result = sanitizer.sanitize(code);

			assert.strictEqual(result.hasChanges, true);
			assert.ok(result.appliedRules.includes('api-keys'));
			assert.ok(result.sanitized.includes('YOUR_API_KEY_HERE'));
		});

		test('Should sanitize passwords', () => {
			const code = 'password = "mySecretPassword123"';
			const result = sanitizer.sanitize(code);

			assert.strictEqual(result.hasChanges, true);
			assert.ok(result.appliedRules.includes('passwords'));
			assert.ok(result.sanitized.includes('YOUR_PASSWORD_HERE'));
		});

		test('Should sanitize connection strings', () => {
			const code = 'const dbUrl = "mongodb://user:pass@localhost:27017/mydb";';
			const result = sanitizer.sanitize(code);

			assert.strictEqual(result.hasChanges, true);
			assert.ok(result.appliedRules.includes('connection-strings'));
			assert.ok(result.sanitized !== result.original, 'Content should be different after sanitization');
		});

		test('Should sanitize email addresses', () => {
			const code = 'const email = "john.doe@company.com";';
			const result = sanitizer.sanitize(code);

			assert.strictEqual(result.hasChanges, true);
			assert.ok(result.appliedRules.includes('email-addresses'));
			assert.ok(result.sanitized.includes('user@example.com'));
		});

		test('Should sanitize IP addresses', () => {
			const code = 'const serverIp = "192.168.1.50";';
			const result = sanitizer.sanitize(code);

			assert.strictEqual(result.hasChanges, true);
			assert.ok(result.appliedRules.includes('ip-addresses'));
			assert.ok(result.sanitized.includes('192.168.1.100'));
		});

		test('Should handle code without sensitive data', () => {
			const code = 'function hello() { return "Hello World"; }';
			const result = sanitizer.sanitize(code);

			assert.strictEqual(result.hasChanges, false);
			assert.strictEqual(result.appliedRules.length, 0);
			assert.strictEqual(result.sanitized, result.original);
		});

		test('Should apply language-specific rules for JavaScript', () => {
			const code = 'const secret = process.env.SECRET_KEY;';
			const result = sanitizer.sanitize(code, 'javascript');

			assert.strictEqual(result.hasChanges, true);
			assert.ok(result.appliedRules.includes('js-env-vars'));
		});

		test('Should apply language-specific rules for Python', () => {
			const code = 'secret = os.environ.get("SECRET_KEY")';
			const result = sanitizer.sanitize(code, 'python');

			assert.strictEqual(result.hasChanges, true);
			assert.ok(result.appliedRules.includes('python-env-vars'));
		});

		test('Should preserve code structure', () => {
			const code = `
function authenticate() {
    const apiKey = "sk_live_1234567890abcdef";
    return fetch("/api", {
        headers: { "Authorization": "Bearer " + apiKey }
    });
}`;
			const result = sanitizer.sanitize(code, 'javascript');

			assert.strictEqual(result.hasChanges, true);
			// Should still be valid JavaScript structure
			assert.ok(result.sanitized.includes('function authenticate()'));
			assert.ok(result.sanitized.includes('return fetch'));
			assert.ok(result.sanitized.includes('YOUR_API_KEY_HERE'));
		});
	});
});
