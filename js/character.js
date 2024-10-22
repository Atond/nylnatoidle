class Character {
    constructor(name) {
        this.name = name;
        this.level = 1;
        this.experience = 0;
        this.inventory = new Map();
    }

    addExperience(amount) {
        this.experience += amount;
        if (this.experience >= this.getExperienceToNextLevel()) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level += 1;
        this.experience = 0;
        console.log(`${this.name} has leveled up to level ${this.level}!`);
        updateCharacterLevelDisplay(); // Mettre à jour l'affichage du niveau
    }

    getExperienceToNextLevel() {
        return this.level * 100; // Example formula
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