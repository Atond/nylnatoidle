import { getCharacterLevel, setCharacterLevel, updateCharacterLevelDisplay } from './character.js';
import { miner, lumberjack, loadTranslations } from './main.js';
import { updateInventoryDisplay } from './inventoryDisplay.js';
import { globalInventory } from './inventory.js';

export function saveGame() {
    const gameState = {
        characterLevel: getCharacterLevel(),
        minerExp: miner.exp,
        minerLevel: miner.level,
        lumberjackExp: lumberjack.exp,
        lumberjackLevel: lumberjack.level,
        inventory: Array.from(globalInventory.items.entries()),
        characterName: document.getElementById('character-name').innerText
    };
    localStorage.setItem('idleRPGSave', JSON.stringify(gameState));
}

// Charger la progression
export function loadGame() {
    const savedGame = localStorage.getItem('idleRPGSave');
    if (savedGame) {
        const gameState = JSON.parse(savedGame);
        setCharacterLevel(gameState.characterLevel);
        miner.setExp(gameState.minerExp);
        miner.setLevel(gameState.minerLevel);
        lumberjack.setExp(gameState.lumberjackExp);
        lumberjack.setLevel(gameState.lumberjackLevel);
        
        // Charger l'inventaire
        globalInventory.items.clear();
        for (const [itemId, quantity] of gameState.inventory) {
            globalInventory.addItem(itemId, quantity);
        }
        
        document.getElementById('character-name').innerText = gameState.characterName || 'Unknown';
        updateCharacterLevelDisplay();
        
        // Charger les traductions avant de mettre à jour l'affichage
        loadTranslations('fr').then(translations => {
            miner.updateDisplay(translations);
            lumberjack.updateDisplay(translations);
            updateInventoryDisplay(translations);
        });
    }
}