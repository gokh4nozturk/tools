import * as vscode from 'vscode';
import { TranslationProvider, TranslationResult, GoogleTranslateProvider, DeepLProvider, AzureTranslatorProvider } from './translationProviders';

export class TranslationService {
    private providers: Map<string, TranslationProvider> = new Map();

    constructor() {
        this.initializeProviders();
    }

    private initializeProviders() {
        const config = vscode.workspace.getConfiguration('linguolink');
        
        // Google Translate
        const googleApiKey = config.get<string>('googleTranslateApiKey');
        if (googleApiKey) {
            this.providers.set('google', new GoogleTranslateProvider(googleApiKey));
        }

        // DeepL
        const deeplApiKey = config.get<string>('deeplApiKey');
        if (deeplApiKey) {
            this.providers.set('deepl', new DeepLProvider(deeplApiKey));
        }

        // Azure Translator
        const azureApiKey = config.get<string>('azureTranslatorKey');
        const azureRegion = config.get<string>('azureTranslatorRegion');
        if (azureApiKey && azureRegion) {
            this.providers.set('azure', new AzureTranslatorProvider(azureApiKey, azureRegion));
        }
    }

    public refreshProviders() {
        this.providers.clear();
        this.initializeProviders();
    }

    public getAvailableProviders(): string[] {
        return Array.from(this.providers.keys());
    }

    public async translate(text: string, sourceLang?: string, targetLang?: string, provider?: string): Promise<TranslationResult> {
        const config = vscode.workspace.getConfiguration('linguolink');
        
        const selectedProvider = provider || config.get<string>('translationProvider', 'google');
        const sourceLanguage = sourceLang || config.get<string>('defaultSourceLanguage', 'auto');
        const targetLanguage = targetLang || config.get<string>('defaultTargetLanguage', 'en');

        const translationProvider = this.providers.get(selectedProvider);
        if (!translationProvider) {
            throw new Error(`Translation provider '${selectedProvider}' is not configured or available. Please check your API keys in settings.`);
        }

        try {
            return await translationProvider.translate(text, sourceLanguage, targetLanguage);
        } catch (error) {
            throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async getSupportedLanguages(provider?: string): Promise<string[]> {
        const config = vscode.workspace.getConfiguration('linguolink');
        const selectedProvider = provider || config.get<string>('translationProvider', 'google');
        
        const translationProvider = this.providers.get(selectedProvider);
        if (!translationProvider) {
            throw new Error(`Translation provider '${selectedProvider}' is not configured`);
        }

        return await translationProvider.getSupportedLanguages();
    }

    public isProviderConfigured(provider: string): boolean {
        return this.providers.has(provider);
    }

    public getConfiguredProviders(): string[] {
        return Array.from(this.providers.keys());
    }
}

export const translationService = new TranslationService();
