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
            maxHp: 5,     // +5 HP par niveau (au lieu de 10)
            attack: 0.1,  // +0.1 attaque par niveau (au lieu de 0.5)
            defense: 0.1  // +0.1 défense par niveau (au lieu de 0.2)
        };
        
        // Ajout de paliers de niveau pour des bonus spéciaux
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
            // etc...
        };
    }
    
    // Formule d'expérience requise pour le prochain niveau
    // Utilise une progression quadratique pour une courbe d'expérience croissante
    getExperienceToNextLevel() {
        return Math.floor(150 * Math.pow(1.6, this.level - 1));
    }
    
    // Calcul des stats totales en fonction du niveau
    getBaseStats() {
        return {
            maxHp: Math.floor(this.baseStats.maxHp + (this.level - 1) * this.statsPerLevel.maxHp),
            attack: Math.floor((this.baseStats.attack + (this.level - 1) * this.statsPerLevel.attack) * 10) / 10,
            defense: Math.floor((this.baseStats.defense + (this.level - 1) * this.statsPerLevel.defense) * 10) / 10
        };
    }
    
    addExperience(amount) {
        this.experience += amount;
        let leveled = false;
        
        while (this.experience >= this.getExperienceToNextLevel()) {
            this.levelUp();
            leveled = true;
        }
        
        if (leveled) {
            this.onLevelUp();
        }
        
        this.updateExperienceDisplay();
    }
    
    levelUp() {
        const oldStats = this.getBaseStats();
        this.experience -= this.getExperienceToNextLevel();
        this.level += 1;
        const newStats = this.getBaseStats();

        // Gains de stats modérés
        const statGains = {
            maxHp: newStats.maxHp - oldStats.maxHp,
            attack: newStats.attack - oldStats.attack,
            defense: newStats.defense - oldStats.defense
        };

        // Vérifier les paliers de niveau
        if (this.levelMilestones[this.level]) {
            const milestone = this.levelMilestones[this.level];
            milestone.effect();
            this.displayMilestoneMessage(milestone.description);
        }

        // Restaurer une partie des HP seulement
        this.currentHp = Math.min(this.currentHp + statGains.maxHp, newStats.maxHp);

        this.displayLevelUpMessage(statGains);
    }

    displayMilestoneMessage(description) {
        combatUI.addCombatLog(
            globalTranslationManager.translate('ui.levelMilestone')
                .replace('{level}', this.level)
                .replace('{description}', description)
        );
    }
    
    displayLevelUpMessage(statGains) {
        const message = globalTranslationManager.translate('ui.levelUp')
        .replace('{level}', this.level);
        
        const statsMessage = Object.entries(statGains)
        .map(([stat, gain]) => `${globalTranslationManager.translate(`ui.${stat}`)}: +${gain}`)
        .join(', ');
        
        combatUI.addCombatLog(message);
        combatUI.addCombatLog(statsMessage);
    }
    
    updateExperienceDisplay() {
        const expElement = document.getElementById('player-experience');
        const expBarElement = document.getElementById('experience-bar');
        
        if (expElement) {
            expElement.textContent = `${this.experience}/${this.getExperienceToNextLevel()}`;
        }
        
        if (expBarElement) {
            const percentage = (this.experience / this.getExperienceToNextLevel()) * 100;
            expBarElement.style.width = `${percentage}%`;
        }
    }
    
    addItem(itemId, quantity) {
        const currentQuantity = this.inventory.get(itemId) || 0;
        this.inventory.set(itemId, currentQuantity + quantity);
    }
    
    removeItem(itemId, quantity) {
        const currentQuantity = this.inventory.get(itemId) || 0;
        const newQuantity = Math.max(0, currentQuantity - quantity);
        if (newQuantity === 0) {
            this.inventory.delete(itemId);
        } else {
            this.inventory.set(itemId, newQuantity);
        }
    }
    
    getItemQuantity(itemId) {
        return this.inventory.get(itemId) || 0;
    }
}

export const character = new Character('Hero');

export function getCharacterLevel() {
    return character.level;
}

export function setCharacterLevel(level) {
    character.level = level;
    updateCharacterLevelDisplay(); // Mettre à jour l'affichage du niveau
}

export function updateCharacterLevelDisplay() {
    const levelElement = document.getElementById('character-level-value');
    if (levelElement) {
        levelElement.textContent = character.level;
    }
}