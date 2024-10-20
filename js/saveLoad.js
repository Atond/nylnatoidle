import { getCharacterLevel, setCharacterLevel, updateCharacterLevelDisplay } from './character.js';
import { miner, lumberjack, loadTranslations, playerInventory, updateInventoryDisplay } from './main.js'; // Import the necessary functions and variables

export function saveGame() {
    const gameState = {
        characterLevel: getCharacterLevel(),
        minerExp: miner.exp,
        minerLevel: miner.level,
        lumberjackExp: lumberjack.exp,
        lumberjackLevel: lumberjack.level,
        inventory: playerInventory.getAllItems(),
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
        const inventory = gameState.inventory || {}; // Ensure inventory is an object
        for (const [itemId, quantity] of Object.entries(inventory)) {
            playerInventory.addItem(itemId, quantity);
        }
        
        document.getElementById('character-name').innerText = gameState.characterName || 'Unknown';
        updateCharacterLevelDisplay();
        loadTranslations('fr').then(translations => {
            miner.updateExpDisplay();
            miner.updateLevelDisplay();
            miner.updateResourcesDisplay(translations);
            lumberjack.updateExpDisplay();
            lumberjack.updateLevelDisplay();
            lumberjack.updateResourcesDisplay(translations);
            updateInventoryDisplay(translations);
        });
    }
}

// Sauvegarder automatiquement toutes les 30 secondes
setInterval(saveGame, 30000);