class TranslationManager {
    constructor() {
        this.translations = new Map();
        this.currentLanguage = 'fr'; // Langue par défaut
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
        const languageTranslations = this.translations.get(this.currentLanguage);
        if (!languageTranslations) return key;

        const keys = key.split('.');
        let result = languageTranslations;

        for (const k of keys) {
            if (result[k] === undefined) {
                return key; // Retourne la clé originale si la traduction n'est pas trouvée
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