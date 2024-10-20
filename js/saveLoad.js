import { getCharacterLevel, setCharacterLevel } from './character.js'; // 
import { miner, lumberjack, loadTranslations } from './main.js'; // Import the loadTranslations function

// Sauvegarder la progression
export function saveGame() {
    const gameState = {
        characterLevel: getCharacterLevel(),
        minerExp: miner.exp,
        minerLevel: miner.level,
        minerInventory: miner.inventory,
        lumberjackExp: lumberjack.exp,
        lumberjackLevel: lumberjack.level,
        lumberjackInventory: lumberjack.inventory,
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
        Object.assign(miner.inventory, gameState.minerInventory);
        lumberjack.setExp(gameState.lumberjackExp);
        lumberjack.setLevel(gameState.lumberjackLevel);
        Object.assign(lumberjack.inventory, gameState.lumberjackInventory);
        document.getElementById('character-name').innerText = gameState.characterName || 'Unknown';
        updateCharacterLevelDisplay();
        loadTranslations('fr').then(translations => {
            miner.updateExpDisplay();
            miner.updateLevelDisplay();
            miner.updateResourcesDisplay(translations);
            miner.updateInventoryDisplay(translations);
            lumberjack.updateExpDisplay();
            lumberjack.updateLevelDisplay();
            lumberjack.updateResourcesDisplay(translations);
            lumberjack.updateInventoryDisplay(translations);
        });
    }
}

// Sauvegarder automatiquement toutes les 30 secondes
setInterval(saveGame, 30000);