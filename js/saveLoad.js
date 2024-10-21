import { getCharacterLevel, setCharacterLevel, updateCharacterLevelDisplay } from './character.js';
//import { miner, lumberjack } from './main.js';
import { professions, updateDisplays } from './main.js';
import { updateInventoryDisplay } from './inventoryDisplay.js';
import { globalInventory } from './inventory.js';
import { globalTranslationManager } from './translations/translationManager.js';

export function saveGame() {
    const gameState = {
        characterLevel: getCharacterLevel(),
        inventory: Array.from(globalInventory.items.entries()),
        characterName: document.getElementById('character-name').innerText
    };

    for (const [professionName, profession] of Object.entries(professions)) {
        gameState[`${professionName}Exp`] = profession.exp;
        gameState[`${professionName}Level`] = profession.level;
    }

    localStorage.setItem('idleRPGSave', JSON.stringify(gameState));
}

export function loadGame() {
    const savedGame = localStorage.getItem('idleRPGSave');
    if (savedGame) {
        try {
            const gameState = JSON.parse(savedGame);
            setCharacterLevel(gameState.characterLevel);
            
            for (const [professionName, profession] of Object.entries(professions)) {
                if (gameState[`${professionName}Exp`] !== undefined && typeof profession.setExp === 'function') {
                    profession.setExp(gameState[`${professionName}Exp`]);
                }
                if (gameState[`${professionName}Level`] !== undefined && typeof profession.setLevel === 'function') {
                    profession.setLevel(gameState[`${professionName}Level`]);
                }
            }
            
            // Charger l'inventaire
            globalInventory.items.clear();
            for (const [itemId, quantity] of gameState.inventory) {
                globalInventory.addItem(itemId, quantity);
            }
            
            document.getElementById('character-name').innerText = gameState.characterName || globalTranslationManager.translate('ui.unknownCharacter');
            updateCharacterLevelDisplay();
            
            // Mettre à jour l'affichage
            updateDisplays();
        } catch (error) {
            console.error('Error loading game:', error);
        }
    }
}