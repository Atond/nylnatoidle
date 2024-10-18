import { updatePointsDisplay, updateCharacterLevelDisplay } from './character.js';
import { updateMinerExpDisplay, updateLumberjackExpDisplay, updateMinerLevelDisplay, updateLumberjackLevelDisplay, updateMinerInventoryDisplay, updateLumberjackInventoryDisplay } from './professions.js';

// Sauvegarder la progression
export function saveGame() {
    const gameState = {
        points,
        characterLevel,
        minerExp,
        lumberjackExp,
        minerLevel,
        lumberjackLevel,
        minerInventory,
        lumberjackInventory,
        characterName: document.getElementById('character-name').innerText
    };
    localStorage.setItem('idleRPGSave', JSON.stringify(gameState));
}

// Charger la progression
export function loadGame() {
    const savedGame = localStorage.getItem('idleRPGSave');
    if (savedGame) {
        const gameState = JSON.parse(savedGame);
        points = gameState.points;
        characterLevel = gameState.characterLevel;
        minerExp = gameState.minerExp;
        lumberjackExp = gameState.lumberjackExp;
        minerLevel = gameState.minerLevel;
        lumberjackLevel = gameState.lumberjackLevel;
        Object.assign(minerInventory, gameState.minerInventory);
        Object.assign(lumberjackInventory, gameState.lumberjackInventory);
        document.getElementById('character-name').innerText = gameState.characterName || 'Unknown';
        updatePointsDisplay();
        updateMinerExpDisplay();
        updateLumberjackExpDisplay();
        updateMinerLevelDisplay();
        updateLumberjackLevelDisplay();
        updateMinerInventoryDisplay();
        updateLumberjackInventoryDisplay();
    }
}

// Sauvegarder automatiquement toutes les 30 secondes
setInterval(saveGame, 30000);