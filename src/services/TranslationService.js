export class TranslationService {
  constructor() {
    this.translations = new Map();
    this.currentLanguage = 'fr';
  }

  async initialize() {
    try {
      const response = await fetch(`/translations/${this.currentLanguage}.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const translations = await response.json();
      this.translations.set(this.currentLanguage, translations);
    } catch (error) {
      console.error(`Failed to load translations for ${this.currentLanguage}:`, error);
      // En cas d'erreur, initialiser avec des traductions par défaut
      this.translations.set(this.currentLanguage, {
        ui: {
          title: "Idle RPG",
          attack: "Attack",
          autoCombat: "Auto Combat: {state}",
          autoCombatOn: "On",
          autoCombatOff: "Off"
        }
      });
    }
  }

  translate(key, replacements = {}) {
    try {
      const translations = this.translations.get(this.currentLanguage);
      if (!translations) return key;

      const keys = key.split('.');
      let result = translations;

      for (const k of keys) {
        if (!result || !result[k]) return key;
        result = result[k];
      }

      // Remplacer les variables dans le texte
      let translatedText = result;
      Object.entries(replacements).forEach(([key, value]) => {
        translatedText = translatedText.replace(`{${key}}`, value);
      });

      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return key;
    }
  }

  async setLanguage(language) {
    if (this.translations.has(language)) {
      this.currentLanguage = language;
    } else {
      try {
        const response = await fetch(`/translations/${language}.json`);
        const translations = await response.json();
        this.translations.set(language, translations);
        this.currentLanguage = language;
      } catch (error) {
        console.error(`Failed to load translations for ${language}:`, error);
      }
    }
  }
}

export const translationService = new TranslationService();