import { loadGame, saveGame } from './saveLoad.js';
import { autoGeneratePoints, updatePointsDisplay } from './character.js';
import { autoIncrement, updateMinerExpDisplay, updateLumberjackExpDisplay, updateMinerLevelDisplay, updateLumberjackLevelDisplay, updateMinerInventoryDisplay, updateLumberjackInventoryDisplay } from './professions.js';

let minerResources = [];
let lumberjackResources = [];
let worlds = [];
let zones = [];
let autoIncrementInterval;

fetch('data.json')
    .then(response => response.json())
    .then(data => {
        minerResources = data.minerResources;
        lumberjackResources = data.lumberjackResources;
        worlds = data.worlds;
        zones = data.zones;
        initializeGame();
    });

function initializeGame() {
    document.getElementById('auto-increment-select').addEventListener('change', (event) => {
        clearInterval(autoIncrementInterval);
        if (event.target.value !== 'none') {
            autoIncrementInterval = setInterval(() => autoIncrement(event.target.value), 1000);
        }
    });

    // Reste du code d'initialisation...

    // Generate points every second
    setInterval(autoGeneratePoints, 1000);

    // Initialiser les affichages
    updateMinerExpDisplay();
    updateLumberjackExpDisplay();
    updateMinerLevelDisplay();
    updateLumberjackLevelDisplay();
    updateMinerInventoryDisplay();
    updateLumberjackInventoryDisplay();
}

// Appeler la fonction de chargement au démarrage du jeu
loadGame();

// Sauvegarder automatiquement toutes les 30 secondes
setInterval(saveGame, 30000);