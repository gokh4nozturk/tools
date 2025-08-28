import * as vscode from 'vscode';
import { TranslationPanel } from './translationPanel';
import { translationService } from './translationService';

export function activate(context: vscode.ExtensionContext) {
	console.log('LinguoLink extension is now active!');

	// Register commands
	const commands = [
		vscode.commands.registerCommand('linguolink.translateText', () => translateSelectedText()),
		vscode.commands.registerCommand('linguolink.translateComment', () => translateSelectedComment()),
		vscode.commands.registerCommand('linguolink.openTranslationPanel', () => TranslationPanel.createOrShow(context.extensionUri)),
		vscode.commands.registerCommand('linguolink.configureApiKeys', () => openApiKeyConfiguration())
	];

	// Register webview panel serializer
	if (vscode.window.registerWebviewPanelSerializer) {
		vscode.window.registerWebviewPanelSerializer(TranslationPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, _state: any) {
				TranslationPanel.revive(webviewPanel, context.extensionUri);
			}
		});
	}

	// Listen for configuration changes to refresh translation providers
	const configListener = vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('linguolink')) {
			translationService.refreshProviders();
		}
	});

	context.subscriptions.push(...commands, configListener);
}

async function translateSelectedText() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active editor found');
		return;
	}

	const selection = editor.selection;
	const selectedText = editor.document.getText(selection);
	
	if (!selectedText.trim()) {
		vscode.window.showErrorMessage('Please select text to translate');
		return;
	}

	try {
		// Check if any providers are configured
		const configuredProviders = translationService.getConfiguredProviders();
		if (configuredProviders.length === 0) {
			const choice = await vscode.window.showErrorMessage(
				'No translation providers configured. Would you like to configure API keys?',
				'Configure API Keys'
			);
			if (choice) {
				await openApiKeyConfiguration();
			}
			return;
		}

		// Show progress
		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: 'Translating text...',
			cancellable: false
		}, async (_progress) => {
			try {
				const result = await translationService.translate(selectedText);
				
				const config = vscode.workspace.getConfiguration('linguolink');
				const showInQuickPick = config.get<boolean>('showTranslationInQuickPick', true);
				const autoReplace = config.get<boolean>('autoReplaceTranslation', false);

				if (autoReplace) {
					// Replace selected text with translation
					await editor.edit(editBuilder => {
						editBuilder.replace(selection, result.translatedText);
					});
					vscode.window.showInformationMessage(`Text translated using ${result.provider}`);
				} else if (showInQuickPick) {
					// Show translation in quick pick
					const action = await vscode.window.showQuickPick([
						{
							label: '$(replace) Replace with translation',
							description: result.translatedText,
							action: 'replace'
						},
						{
							label: '$(copy) Copy to clipboard',
							description: result.translatedText,
							action: 'copy'
						},
						{
							label: '$(comment) Add as comment',
							description: `Add translation as comment above selection`,
							action: 'comment'
						}
					], {
						placeHolder: `Translation result (${result.sourceLanguage} → ${result.targetLanguage})`,
						title: `Translated by ${result.provider}`
					});

					if (action) {
						await handleTranslationAction(action.action, result, editor, selection);
					}
				} else {
					// Just show notification
					vscode.window.showInformationMessage(
						`Translation: ${result.translatedText}`,
						'Copy to Clipboard'
					).then(choice => {
						if (choice) {
							vscode.env.clipboard.writeText(result.translatedText);
						}
					});
				}
			} catch (error) {
				vscode.window.showErrorMessage(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		});
	} catch (error) {
		vscode.window.showErrorMessage(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

async function translateSelectedComment() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active editor found');
		return;
	}

	const selection = editor.selection;
	const selectedText = editor.document.getText(selection);
	
	if (!selectedText.trim()) {
		vscode.window.showErrorMessage('Please select text to translate');
		return;
	}

	// Extract comment content (remove comment syntax)
	const commentPattern = /^\s*(\/\/|\/\*|\*|#|<!--)\s*(.*)(\*\/|-->)?\s*$/gm;
	let textToTranslate = selectedText;
	let matches = selectedText.match(commentPattern);
	
	if (matches) {
		// Extract actual comment text
		textToTranslate = selectedText.replace(commentPattern, '$2').trim();
	}

	if (!textToTranslate) {
		vscode.window.showErrorMessage('No translatable text found in selection');
		return;
	}

	try {
		const configuredProviders = translationService.getConfiguredProviders();
		if (configuredProviders.length === 0) {
			const choice = await vscode.window.showErrorMessage(
				'No translation providers configured. Would you like to configure API keys?',
				'Configure API Keys'
			);
			if (choice) {
				await openApiKeyConfiguration();
			}
			return;
		}

		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: 'Translating comment...',
			cancellable: false
		}, async (_progress) => {
			try {
				const result = await translationService.translate(textToTranslate);
				
				// Insert translated comment above the selection
				const lineStart = selection.start.line;
				const currentLineText = editor.document.lineAt(lineStart).text;
				const indentation = currentLineText.match(/^\s*/)?.[0] || '';
				
				// Detect comment style based on file type
				const languageId = editor.document.languageId;
				let commentPrefix = '//';
				
				switch (languageId) {
					case 'python':
					case 'ruby':
					case 'yaml':
					case 'dockerfile':
						commentPrefix = '#';
						break;
					case 'html':
					case 'xml':
						commentPrefix = '<!--';
						break;
					case 'css':
					case 'scss':
					case 'less':
						commentPrefix = '/*';
						break;
				}
				
				const translatedComment = languageId === 'html' || languageId === 'xml' 
					? `${indentation}<!-- ${result.translatedText} -->\n`
					: languageId === 'css' || languageId === 'scss' || languageId === 'less'
					? `${indentation}/* ${result.translatedText} */\n`
					: `${indentation}${commentPrefix} ${result.translatedText}\n`;

				await editor.edit(editBuilder => {
					editBuilder.insert(new vscode.Position(lineStart, 0), translatedComment);
				});

				vscode.window.showInformationMessage(`Comment translated and added using ${result.provider}`);
			} catch (error) {
				vscode.window.showErrorMessage(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		});
	} catch (error) {
		vscode.window.showErrorMessage(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

async function handleTranslationAction(action: string, result: any, editor: vscode.TextEditor, selection: vscode.Selection) {
	switch (action) {
		case 'replace':
			await editor.edit(editBuilder => {
				editBuilder.replace(selection, result.translatedText);
			});
			vscode.window.showInformationMessage('Text replaced with translation');
			break;
		case 'copy':
			await vscode.env.clipboard.writeText(result.translatedText);
			vscode.window.showInformationMessage('Translation copied to clipboard');
			break;
		case 'comment':
			const lineStart = selection.start.line;
			const currentLineText = editor.document.lineAt(lineStart).text;
			const indentation = currentLineText.match(/^\s*/)?.[0] || '';
			const languageId = editor.document.languageId;
			
			let commentPrefix = '//';
			if (languageId === 'python' || languageId === 'ruby' || languageId === 'yaml') {
				commentPrefix = '#';
			}
			
			const comment = `${indentation}${commentPrefix} ${result.translatedText}\n`;
			await editor.edit(editBuilder => {
				editBuilder.insert(new vscode.Position(lineStart, 0), comment);
			});
			vscode.window.showInformationMessage('Translation added as comment');
			break;
	}
}

async function openApiKeyConfiguration() {
	const choice = await vscode.window.showQuickPick([
		{
			label: '$(gear) Open Settings',
			description: 'Configure LinguoLink in VS Code settings',
			action: 'settings'
		},
		{
			label: '$(question) View Documentation',
			description: 'Learn how to get API keys',
			action: 'docs'
		}
	], {
		placeHolder: 'How would you like to configure API keys?'
	});

	if (choice?.action === 'settings') {
		await vscode.commands.executeCommand('workbench.action.openSettings', 'linguolink');
	} else if (choice?.action === 'docs') {
		await vscode.env.openExternal(vscode.Uri.parse('https://github.com/gokh4nozturk/app.lingulink/blob/master/README.md'));
	}
}

export function deactivate() {
	// Clean up resources
}
