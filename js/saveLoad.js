import { getPoints, setPoints, getCharacterLevel, setCharacterLevel, updatePointsDisplay, updateCharacterLevelDisplay } from './character.js';
import { getMinerExp, setMinerExp, getLumberjackExp, setLumberjackExp, getMinerLevel, setMinerLevel, getLumberjackLevel, setLumberjackLevel, minerInventory, lumberjackInventory, updateMinerExpDisplay, updateLumberjackExpDisplay, updateMinerLevelDisplay, updateLumberjackLevelDisplay, updateMinerInventoryDisplay, updateLumberjackInventoryDisplay } from './professions.js';

// Sauvegarder la progression
export function saveGame() {
    const gameState = {
        points: getPoints(),
        characterLevel: getCharacterLevel(),
        minerExp: getMinerExp(),
        lumberjackExp: getLumberjackExp(),
        minerLevel: getMinerLevel(),
        lumberjackLevel: getLumberjackLevel(),
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
        setPoints(gameState.points);
        setCharacterLevel(gameState.characterLevel);
        setMinerExp(gameState.minerExp);
        setLumberjackExp(gameState.lumberjackExp);
        setMinerLevel(gameState.minerLevel);
        setLumberjackLevel(gameState.lumberjackLevel);
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