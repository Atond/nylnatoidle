import { globalTranslationManager } from '../translations/translationManager.js';

class ExperienceManager {
    constructor() {
        this.initializeElements();
        this.updateInterval = null;
    }

    initializeElements() {
        this.levelElement = document.getElementById('character-level');
        this.expFill = document.querySelector('.exp-fill');
        
        // Démarrer la mise à jour périodique
        this.startPeriodicUpdate();
    }

    startPeriodicUpdate() {
        // Mettre à jour l'affichage toutes les 100ms pour une animation fluide
        this.updateInterval = setInterval(() => {
            if (this.expFill && this.expFill.dataset.targetWidth) {
                const current = parseFloat(this.expFill.style.width || '0');
                const target = parseFloat(this.expFill.dataset.targetWidth);
                if (current !== target) {
                    const newWidth = current + (target - current) * 0.1;
                    this.expFill.style.width = `${newWidth}%`;
                }
            }
        }, 100);
    }

    updateExperience(currentExp, maxExp, level) {
        // Mettre à jour le niveau
        if (this.levelElement) {
            this.levelElement.textContent = `Niveau ${level}`;
        }

        // Mettre à jour la barre d'expérience
        if (this.expFill) {
            const percentage = (currentExp / maxExp) * 100;
            // Stocker la largeur cible pour l'animation
            this.expFill.dataset.targetWidth = percentage;
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