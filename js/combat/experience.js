import { globalTranslationManager } from '../translations/translationManager.js';

class ExperienceManager {
    constructor() {
        this.initializeElements();
        this.updateInterval = null;
    }

    initializeElements() {
        this.experienceBar = document.getElementById('experience-bar');
        this.experienceText = document.getElementById('experience-text');
        
        // Démarrer la mise à jour périodique
        this.startPeriodicUpdate();
    }

    startPeriodicUpdate() {
        // Mettre à jour l'affichage toutes les 100ms pour une animation fluide
        this.updateInterval = setInterval(() => {
            if (this.experienceBar && this.experienceBar.dataset.targetWidth) {
                const current = parseFloat(this.experienceBar.style.width || '0');
                const target = parseFloat(this.experienceBar.dataset.targetWidth);
                if (current !== target) {
                    const newWidth = current + (target - current) * 0.1;
                    this.experienceBar.style.width = `${newWidth}%`;
                }
            }
        }, 100);
    }

    updateExperience(currentExp, maxExp, level) {
        if (this.experienceBar) {
            const percentage = (currentExp / maxExp) * 100;
            // Stocker la largeur cible pour l'animation
            this.experienceBar.dataset.targetWidth = percentage;
        }

        if (this.experienceText) {
            this.experienceText.textContent = 
                `${globalTranslationManager.translate('ui.levelLabel')} ${level} - ` +
                `${currentExp.toLocaleString()}/${maxExp.toLocaleString()} ` +
                `${globalTranslationManager.translate('ui.xp')}`;
        }
    }

    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

export const experienceManager = new ExperienceManager();