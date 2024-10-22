class TranslationManager {
    constructor() {
        this.translations = new Map();
        this.currentLanguage = 'fr';
        this.resourceNameProvider = null;
    }

    setResourceNameProvider(provider) {
        this.resourceNameProvider = provider;
    }

    async loadTranslations(language) {
        try {
            const response = await fetch(`/js/translations/${language}.json`);
            const translations = await response.json();
            this.translations.set(language, translations);
            this.currentLanguage = language;
        } catch (error) {
            console.error(`Failed to load translations for ${language}:`, error);
        }
    }

    translate(key) {
        // Check for resource translation first
        if (key.startsWith('resources.') && this.resourceNameProvider) {
            const resourceId = key.split('.')[1];
            return this.resourceNameProvider.getResourceName(resourceId);
        }

        const languageTranslations = this.translations.get(this.currentLanguage);
        if (!languageTranslations) return key;

        const keys = key.split('.');
        let result = languageTranslations;

        for (const k of keys) {
            if (result[k] === undefined) {
                return key;
            }
            result = result[k];
        }

        return result;
    }

    setLanguage(language) {
        if (this.translations.has(language)) {
            this.currentLanguage = language;
        } else {
            this.loadTranslations(language);
        }
    }
}

export const globalTranslationManager = new TranslationManager();