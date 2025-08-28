import axios from 'axios';

export interface TranslationResult {
    translatedText: string;
    sourceLanguage?: string;
    targetLanguage: string;
    provider: string;
}

export interface TranslationProvider {
    name: string;
    translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult>;
    getSupportedLanguages(): Promise<string[]>;
}

export class GoogleTranslateProvider implements TranslationProvider {
    name = 'Google Translate';
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult> {
        try {
            const url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;
            const response = await axios.post(url, {
                q: text,
                source: sourceLang === 'auto' ? undefined : sourceLang,
                target: targetLang,
                format: 'text'
            });

            const translatedText = response.data.data.translations[0].translatedText;
            const detectedSourceLanguage = response.data.data.translations[0].detectedSourceLanguage || sourceLang;

            return {
                translatedText,
                sourceLanguage: detectedSourceLanguage,
                targetLanguage: targetLang,
                provider: this.name
            };
        } catch (error) {
            throw new Error(`Google Translate API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getSupportedLanguages(): Promise<string[]> {
        try {
            const url = `https://translation.googleapis.com/language/translate/v2/languages?key=${this.apiKey}`;
            const response = await axios.get(url);
            return response.data.data.languages.map((lang: any) => lang.language);
        } catch (error) {
            throw new Error(`Failed to get supported languages: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export class DeepLProvider implements TranslationProvider {
    name = 'DeepL';
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult> {
        try {
            const url = 'https://api-free.deepl.com/v2/translate';
            const params = new URLSearchParams();
            params.append('auth_key', this.apiKey);
            params.append('text', text);
            params.append('target_lang', targetLang.toUpperCase());
            
            if (sourceLang !== 'auto') {
                params.append('source_lang', sourceLang.toUpperCase());
            }

            const response = await axios.post(url, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const translation = response.data.translations[0];
            return {
                translatedText: translation.text,
                sourceLanguage: translation.detected_source_language?.toLowerCase() || sourceLang,
                targetLanguage: targetLang,
                provider: this.name
            };
        } catch (error) {
            throw new Error(`DeepL API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getSupportedLanguages(): Promise<string[]> {
        // DeepL supported languages (simplified list)
        return ['en', 'de', 'fr', 'es', 'it', 'nl', 'pl', 'pt', 'ru', 'ja', 'zh', 'tr'];
    }
}

export class AzureTranslatorProvider implements TranslationProvider {
    name = 'Azure Translator';
    private apiKey: string;
    private region: string;

    constructor(apiKey: string, region: string) {
        this.apiKey = apiKey;
        this.region = region;
    }

    async translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult> {
        try {
            const url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLang}${sourceLang !== 'auto' ? `&from=${sourceLang}` : ''}`;
            
            const response = await axios.post(url, [{ Text: text }], {
                headers: {
                    'Ocp-Apim-Subscription-Key': this.apiKey,
                    'Ocp-Apim-Subscription-Region': this.region,
                    'Content-Type': 'application/json'
                }
            });

            const translation = response.data[0];
            return {
                translatedText: translation.translations[0].text,
                sourceLanguage: translation.detectedLanguage?.language || sourceLang,
                targetLanguage: targetLang,
                provider: this.name
            };
        } catch (error) {
            throw new Error(`Azure Translator API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getSupportedLanguages(): Promise<string[]> {
        try {
            const url = 'https://api.cognitive.microsofttranslator.com/languages?api-version=3.0';
            const response = await axios.get(url);
            return Object.keys(response.data.translation);
        } catch (error) {
            throw new Error(`Failed to get supported languages: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
