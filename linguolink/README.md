# 🌐 LinguoLink

A powerful VS Code extension that brings seamless translation capabilities directly to your development environment. Perfect for international developers, documentation translation, and multilingual codebases.

## ✨ Features

- **Text Translation**: Translate selected text with multiple provider options
- **Comment Translation**: Smart comment translation with automatic formatting
- **Translation Panel**: Interactive webview for advanced translation workflows
- **Multiple Providers**: Support for Google Translate, DeepL, and Azure Translator
- **Language Auto-Detection**: Automatic source language detection
- **Context Menu Integration**: Right-click to translate directly from the editor
- **Configurable Settings**: Customize default languages and provider preferences

### 🚀 Quick Actions

- **Translate Selected Text**: Select any text and use the command palette or context menu
- **Translate Comments**: Extract and translate comment content with proper formatting
- **Translation Panel**: Open a dedicated panel for complex translation tasks
- **Auto-Replace**: Option to automatically replace selected text with translation
- **Copy to Clipboard**: Quickly copy translations without replacing original text

## 📋 Requirements

To use LinguoLink, you need API keys from one or more translation providers:

- **Google Translate API**: [Get API Key](https://cloud.google.com/translate/docs/setup)
- **DeepL API**: [Get API Key](https://www.deepl.com/pro-api)
- **Azure Translator**: [Get API Key](https://azure.microsoft.com/en-us/services/cognitive-services/translator/)

## ⚙️ Extension Settings

This extension contributes the following settings:

### Translation Providers
- `linguolink.translationProvider`: Choose your default translation provider (`google`, `deepl`, `azure`)
- `linguolink.googleTranslateApiKey`: Your Google Translate API key
- `linguolink.deeplApiKey`: Your DeepL API key
- `linguolink.azureTranslatorKey`: Your Azure Translator API key
- `linguolink.azureTranslatorRegion`: Your Azure Translator region

### Language Settings
- `linguolink.defaultSourceLanguage`: Default source language (`auto` for auto-detection)
- `linguolink.defaultTargetLanguage`: Default target language (e.g., `en` for English)

### Behavior Settings
- `linguolink.showTranslationInQuickPick`: Show translation results in quick pick menu (default: `true`)
- `linguolink.autoReplaceTranslation`: Automatically replace selected text with translation (default: `false`)

## 🛠️ Usage

### 1. Configure API Keys

1. Open VS Code Settings (`Cmd/Ctrl + ,`)
2. Search for "linguolink"
3. Enter your API keys for your preferred translation provider(s)

### 2. Translate Text

1. Select any text in your editor
2. Use one of these methods:
   - Right-click and select "Translate Selected Text"
   - Open Command Palette (`Cmd/Ctrl + Shift + P`) and run "LinguoLink: Translate Selected Text"
   - Use the keyboard shortcut (if configured)

### 3. Translation Panel

1. Open Command Palette (`Cmd/Ctrl + Shift + P`)
2. Run "LinguoLink: Open Translation Panel"
3. Use the interactive interface for advanced translation tasks

### 4. Comment Translation

1. Select a comment (including comment syntax)
2. Right-click and select "Translate Comment"
3. The translated comment will be added above the original

## 🎯 Commands

- `LinguoLink: Translate Selected Text` - Translate any selected text
- `LinguoLink: Translate Comment` - Translate and format comments
- `LinguoLink: Open Translation Panel` - Open the translation webview
- `LinguoLink: Configure API Keys` - Quick access to settings and documentation

## 🔧 Supported Languages

The extension supports all languages available through your chosen translation provider:

- **Google Translate**: 100+ languages
- **DeepL**: 31+ languages with high accuracy
- **Azure Translator**: 90+ languages

## 🐛 Known Issues

- Some translation providers may have rate limits
- Very long texts might be truncated by API providers
- Network connectivity required for all translation operations

## 📝 Release Notes

### 0.0.1

Initial release of LinguoLink featuring:
- Multi-provider translation support
- Interactive translation panel
- Context menu integration
- Configurable settings
- Comment translation with formatting

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues and enhancement requests.

## 📄 License

This extension is released under the MIT License.

## 🔗 Links

- [GitHub Repository](https://github.com/gokh4nozturk/app.lingulink)
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=gokhanozturk.linguolink)
- [Issue Tracker](https://github.com/gokh4nozturk/app.lingulink/issues)

---

**Enjoy seamless translation with LinguoLink!** 🌐✨
