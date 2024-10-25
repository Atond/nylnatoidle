// Dans character.js
import { globalTranslationManager } from './translations/translationManager.js';
import { experienceManager } from './combat/experience.js';
import { combatUI } from './combat/combatUI.js';

class Character {
    constructor(name) {
        this.name = name;
        this.level = 1;
        this.experience = 0;
        this.baseStats = {
            maxHp: 100,
            attack: 1,
            defense: 0
        };
        
        this.statsPerLevel = {
            maxHp: 5,
            attack: 0.1,
            defense: 0.1
        };
        
        this.levelMilestones = {
            5: {
                description: "Débloque un emplacement d'équipement supplémentaire (Anneau)",
                effect: () => this.unlockEquipmentSlot('ring')
            },
            10: {
                description: "Débloque les quêtes quotidiennes",
                effect: () => questSystem.unlockDailyQuests()
            },
            15: {
                description: "Débloque un emplacement d'équipement supplémentaire (Amulette)",
                effect: () => this.unlockEquipmentSlot('amulet')
            },
            20: {
                description: "Débloque les quêtes de guilde",
                effect: () => questSystem.unlockGuildQuests()
            }
        };

        setTimeout(() => {
            experienceManager.updateExperience(
                this.experience,
                this.getExperienceToNextLevel(),
                this.level
            );
        }, 100);
    }
    
    getExperienceToNextLevel() {
        return Math.floor(150 * Math.pow(1.6, this.level - 1));
    }
    
    getBaseStats() {
        return {
            maxHp: Math.floor(this.baseStats.maxHp + (this.level - 1) * this.statsPerLevel.maxHp),
            attack: Math.floor((this.baseStats.attack + (this.level - 1) * this.statsPerLevel.attack) * 10) / 10,
            defense: Math.floor((this.baseStats.defense + (this.level - 1) * this.statsPerLevel.defense) * 10) / 10
        };
    }
    
    addExperience(amount) {
        this.experience += amount;
        
        experienceManager.updateExperience(
            this.experience,
            this.getExperienceToNextLevel(),
            this.level
        );

        while (this.experience >= this.getExperienceToNextLevel()) {
            const remainingExp = this.experience - this.getExperienceToNextLevel();
            this.levelUp();
            this.experience = remainingExp;
        }
    }

    levelUp() {
        const oldStats = this.getBaseStats();
        this.level += 1;
        const newStats = this.getBaseStats();
        
        const statGains = {
            maxHp: newStats.maxHp - oldStats.maxHp,
            attack: newStats.attack - oldStats.attack,
            defense: newStats.defense - oldStats.defense
        };

        this.displayLevelUpMessage(statGains);
        
        if (this.levelMilestones[this.level]) {
            const milestone = this.levelMilestones[this.level];
            this.displayMilestoneMessage(milestone.description);
            milestone.effect();
        }
        
        experienceManager.updateExperience(
            this.experience,
            this.getExperienceToNextLevel(),
            this.level
        );
        updateCharacterLevelDisplay();
        
        // Émettre un événement pour notifier le combat system
        this.emitLevelUpEvent(newStats.maxHp);
    }
    
    // Nouvelle méthode pour émettre un événement
    emitLevelUpEvent(newMaxHp) {
        const event = new CustomEvent('characterLevelUp', {
            detail: { maxHp: newMaxHp }
        });
        window.dispatchEvent(event);
    }
    
    displayLevelUpMessage(statGains) {
        const message = globalTranslationManager.translate('ui.levelUp')
            .replace('{level}', this.level);
        
        const statsMessage = Object.entries(statGains)
            .map(([stat, gain]) => `${globalTranslationManager.translate(`ui.${stat}`)}: +${gain}`)
            .join(', ');
        
            combatUI.addLevelUpLog(this.level, statGains);
    }
    
    displayMilestoneMessage(description) {
        combatUI.addCombatLog(description);
    }
}

export const character = new Character('Hero');

export function getCharacterLevel() {
    return character.level;
}

export function setCharacterLevel(level) {
    character.level = level;
    updateCharacterLevelDisplay();
    experienceManager.updateExperience(
        character.experience,
        character.getExperienceToNextLevel(),
        character.level
    );
}

export function updateCharacterLevelDisplay() {
    const levelElement = document.getElementById('character-level-value');
    if (levelElement) {
        levelElement.textContent = character.level;
    }
}