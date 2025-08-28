import * as vscode from 'vscode';
import { translationService } from './translationService';

export class TranslationPanel {
    public static currentPanel: TranslationPanel | undefined;
    public static readonly viewType = 'linguolinkTranslation';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (TranslationPanel.currentPanel) {
            TranslationPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            TranslationPanel.viewType,
            'LinguoLink Translation',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media')
                ]
            }
        );

        TranslationPanel.currentPanel = new TranslationPanel(panel, extensionUri);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        TranslationPanel.currentPanel = new TranslationPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'translate':
                        await this._handleTranslate(message.text, message.sourceLang, message.targetLang, message.provider);
                        break;
                    case 'getProviders':
                        await this._handleGetProviders();
                        break;
                    case 'getLanguages':
                        await this._handleGetLanguages(message.provider);
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    private async _handleTranslate(text: string, sourceLang: string, targetLang: string, provider: string) {
        try {
            const result = await translationService.translate(text, sourceLang, targetLang, provider);
            this._panel.webview.postMessage({
                command: 'translationResult',
                result: result
            });
        } catch (error) {
            this._panel.webview.postMessage({
                command: 'translationError',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    private async _handleGetProviders() {
        const providers = translationService.getConfiguredProviders();
        this._panel.webview.postMessage({
            command: 'providersResult',
            providers: providers
        });
    }

    private async _handleGetLanguages(provider: string) {
        try {
            const languages = await translationService.getSupportedLanguages(provider);
            this._panel.webview.postMessage({
                command: 'languagesResult',
                languages: languages
            });
        } catch (error) {
            this._panel.webview.postMessage({
                command: 'languagesError',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    public dispose() {
        TranslationPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(_webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LinguoLink Translation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            margin: 0;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            margin-bottom: 20px;
            text-align: center;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        textarea, select, input {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
            font-family: inherit;
            box-sizing: border-box;
        }
        textarea {
            resize: vertical;
            min-height: 100px;
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin: 5px;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .button-group {
            text-align: center;
            margin: 20px 0;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background-color: var(--vscode-editor-background);
        }
        .error {
            color: var(--vscode-errorForeground);
            background-color: var(--vscode-inputValidation-errorBackground);
        }
        .language-row {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 10px;
            align-items: end;
            margin-bottom: 15px;
        }
        .swap-button {
            padding: 5px 10px;
            font-size: 12px;
            min-width: 60px;
        }
        .provider-selection {
            margin-bottom: 20px;
        }
        .loading {
            opacity: 0.6;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 LinguoLink Translation</h1>
            <p>Translate text between different languages</p>
        </div>

        <div class="provider-selection">
            <label for="provider">Translation Provider:</label>
            <select id="provider">
                <option value="">Loading providers...</option>
            </select>
        </div>

        <div class="language-row">
            <div class="form-group">
                <label for="sourceLang">From:</label>
                <select id="sourceLang">
                    <option value="auto">Auto-detect</option>
                </select>
            </div>
            <button type="button" class="swap-button" onclick="swapLanguages()">⇄ Swap</button>
            <div class="form-group">
                <label for="targetLang">To:</label>
                <select id="targetLang">
                    <option value="en">English</option>
                </select>
            </div>
        </div>

        <div class="form-group">
            <label for="inputText">Text to translate:</label>
            <textarea id="inputText" placeholder="Enter text to translate..."></textarea>
        </div>

        <div class="button-group">
            <button type="button" onclick="translateText()">🔄 Translate</button>
            <button type="button" onclick="clearAll()">🗑️ Clear</button>
        </div>

        <div id="result" class="result" style="display: none;">
            <label>Translation Result:</label>
            <div id="resultText"></div>
            <div id="resultMeta" style="margin-top: 10px; font-size: 12px; opacity: 0.7;"></div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentProviders = [];
        let currentLanguages = [];

        // Initialize the panel
        window.addEventListener('load', () => {
            vscode.postMessage({ command: 'getProviders' });
        });

        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'providersResult':
                    updateProviders(message.providers);
                    break;
                case 'languagesResult':
                    updateLanguages(message.languages);
                    break;
                case 'translationResult':
                    showTranslationResult(message.result);
                    break;
                case 'translationError':
                case 'languagesError':
                    showError(message.error);
                    break;
            }
        });

        function updateProviders(providers) {
            currentProviders = providers;
            const providerSelect = document.getElementById('provider');
            providerSelect.innerHTML = '';
            
            if (providers.length === 0) {
                providerSelect.innerHTML = '<option value="">No providers configured</option>';
                return;
            }

            providers.forEach(provider => {
                const option = document.createElement('option');
                option.value = provider;
                option.textContent = provider.charAt(0).toUpperCase() + provider.slice(1);
                providerSelect.appendChild(option);
            });

            if (providers.length > 0) {
                providerSelect.value = providers[0];
                loadLanguages();
            }

            providerSelect.addEventListener('change', loadLanguages);
        }

        function loadLanguages() {
            const provider = document.getElementById('provider').value;
            if (provider) {
                vscode.postMessage({ 
                    command: 'getLanguages', 
                    provider: provider 
                });
            }
        }

        function updateLanguages(languages) {
            currentLanguages = languages;
            const sourceLangSelect = document.getElementById('sourceLang');
            const targetLangSelect = document.getElementById('targetLang');
            
            // Clear existing options except auto-detect for source
            sourceLangSelect.innerHTML = '<option value="auto">Auto-detect</option>';
            targetLangSelect.innerHTML = '';

            // Common languages mapping
            const languageNames = {
                'en': 'English',
                'es': 'Spanish',
                'fr': 'French',
                'de': 'German',
                'it': 'Italian',
                'pt': 'Portuguese',
                'ru': 'Russian',
                'ja': 'Japanese',
                'ko': 'Korean',
                'zh': 'Chinese',
                'ar': 'Arabic',
                'hi': 'Hindi',
                'tr': 'Turkish',
                'nl': 'Dutch',
                'pl': 'Polish'
            };

            languages.forEach(lang => {
                const name = languageNames[lang] || lang.toUpperCase();
                
                // Add to source languages
                const sourceOption = document.createElement('option');
                sourceOption.value = lang;
                sourceOption.textContent = name;
                sourceLangSelect.appendChild(sourceOption);
                
                // Add to target languages
                const targetOption = document.createElement('option');
                targetOption.value = lang;
                targetOption.textContent = name;
                targetLangSelect.appendChild(targetOption);
            });

            // Set default target to English if available
            if (languages.includes('en')) {
                targetLangSelect.value = 'en';
            } else if (languages.length > 0) {
                targetLangSelect.value = languages[0];
            }
        }

        function swapLanguages() {
            const sourceLang = document.getElementById('sourceLang');
            const targetLang = document.getElementById('targetLang');
            
            if (sourceLang.value !== 'auto') {
                const temp = sourceLang.value;
                sourceLang.value = targetLang.value;
                targetLang.value = temp;
            }
        }

        function translateText() {
            const text = document.getElementById('inputText').value.trim();
            if (!text) {
                showError('Please enter text to translate');
                return;
            }

            const provider = document.getElementById('provider').value;
            const sourceLang = document.getElementById('sourceLang').value;
            const targetLang = document.getElementById('targetLang').value;

            if (!provider) {
                showError('No translation provider selected');
                return;
            }

            // Show loading state
            document.body.classList.add('loading');
            hideResult();

            vscode.postMessage({
                command: 'translate',
                text: text,
                sourceLang: sourceLang,
                targetLang: targetLang,
                provider: provider
            });
        }

        function showTranslationResult(result) {
            document.body.classList.remove('loading');
            
            const resultDiv = document.getElementById('result');
            const resultText = document.getElementById('resultText');
            const resultMeta = document.getElementById('resultMeta');
            
            resultText.textContent = result.translatedText;
            resultMeta.textContent = \`Translated by \${result.provider} from \${result.sourceLanguage} to \${result.targetLanguage}\`;
            
            resultDiv.style.display = 'block';
            resultDiv.classList.remove('error');
        }

        function showError(errorMessage) {
            document.body.classList.remove('loading');
            
            const resultDiv = document.getElementById('result');
            const resultText = document.getElementById('resultText');
            const resultMeta = document.getElementById('resultMeta');
            
            resultText.textContent = 'Error: ' + errorMessage;
            resultMeta.textContent = '';
            
            resultDiv.style.display = 'block';
            resultDiv.classList.add('error');
        }

        function hideResult() {
            document.getElementById('result').style.display = 'none';
        }

        function clearAll() {
            document.getElementById('inputText').value = '';
            hideResult();
        }

        // Handle Enter key in textarea
        document.getElementById('inputText').addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                translateText();
            }
        });
    </script>
</body>
</html>`;
    }
}
