import { loadGame, saveGame } from './saveLoad.js';
import { autoGeneratePoints, updatePointsDisplay } from './character.js';
import { autoIncrement, setResources } from './professions.js';

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
        setResources(minerResources, lumberjackResources); // Pass resources to professions.js
        initializeGame();
    });

function initializeGame() {
    document.getElementById('auto-increment-select').addEventListener('change', (event) => {
        clearInterval(autoIncrementInterval);
        if (event.target.value !== 'none') {
            autoIncrementInterval = setInterval(() => autoIncrement(event.target.value), 1000);
        }
    });

    document.getElementById('change-name').addEventListener('click', () => {
        document.getElementById('character-name-input').style.display = 'inline';
        document.getElementById('save-name').style.display = 'inline';
        document.getElementById('change-name').style.display = 'none';
    });

    document.getElementById('save-name').addEventListener('click', () => {
        const name = document.getElementById('character-name-input').value;
        if (name) {
            document.getElementById('character-name').innerText = name;
            document.getElementById('character-name-input').style.display = 'none';
            document.getElementById('save-name').style.display = 'none';
            document.getElementById('change-name').style.display = 'inline';
        }
    });

    // Appeler la fonction de chargement au démarrage du jeu
    loadGame();

    // Sauvegarder automatiquement toutes les 30 secondes
    setInterval(saveGame, 30000);

    // Generate points every second
    setInterval(autoGeneratePoints, 1000);

    // Auto-increment experience for the selected profession every second
    autoIncrementInterval = setInterval(() => {
        const selectedProfession = document.getElementById('auto-increment-select').value;
        if (selectedProfession !== 'none') {
            autoIncrement(selectedProfession);
        }
    }, 1000);
}