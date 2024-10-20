import { loadGame, saveGame } from './saveLoad.js';
import { autoGeneratePoints, updatePointsDisplay } from './character.js';
import { Miner } from './professions/miner.js';
import { Lumberjack } from './professions/lumberjack.js';

let minerResources = [];
let lumberjackResources = [];
let worlds = [];
let zones = [];
let autoIncrementInterval;

export let miner;
export let lumberjack;

fetch('data.json')
    .then(response => response.json())
    .then(data => {
        minerResources = data.minerResources;
        lumberjackResources = data.lumberjackResources;
        worlds = data.worlds;
        zones = data.zones;
        miner = new Miner(minerResources);
        lumberjack = new Lumberjack(lumberjackResources);
        initializeGame();
    });

function initializeGame() {
    document.getElementById('auto-increment-select').addEventListener('change', (event) => {
        clearInterval(autoIncrementInterval);
        if (event.target.value === 'miner') {
            autoIncrementInterval = setInterval(() => miner.autoIncrement(), 1000);
        } else if (event.target.value === 'lumberjack') {
            autoIncrementInterval = setInterval(() => lumberjack.autoIncrement(), 1000);
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

    document.getElementById('language-select').addEventListener('change', (event) => {
        loadTranslations(event.target.value);
    });

    // Appeler la fonction de chargement au démarrage du jeu
    loadGame();

    // Charger les traductions françaises par défaut
    loadTranslations('fr');

    // Sauvegarder automatiquement toutes les 30 secondes
    setInterval(saveGame, 30000);

    // Generate points every second
    setInterval(autoGeneratePoints, 1000);
}

function loadTranslations(language) {
    fetch(`translations/${language}.json`)
        .then(response => response.json())
        .then(translations => {
            document.getElementById('title').innerText = translations.title;
            document.getElementById('generate').innerText = translations.generate;
            document.getElementById('character-title').innerText = translations.characterTitle;
            document.getElementById('character-name-label').innerText = translations.characterNameLabel;
            document.getElementById('change-name').innerText = translations.changeName;
            document.getElementById('save-name').innerText = translations.saveName;
            document.getElementById('character-level-label').innerText = translations.characterLevelLabel;
            document.getElementById('professions-title').innerText = translations.professionsTitle;
            document.getElementById('miner-title').innerText = translations.minerTitle;
            document.getElementById('miner-exp-label').innerText = translations.minerExpLabel;
            document.getElementById('miner-level-label').innerText = translations.minerLevelLabel;
            document.getElementById('miner-resources-label').innerText = translations.minerResourcesLabel;
            document.getElementById('lumberjack-title').innerText = translations.lumberjackTitle;
            document.getElementById('lumberjack-exp-label').innerText = translations.lumberjackExpLabel;
            document.getElementById('lumberjack-level-label').innerText = translations.lumberjackLevelLabel;
            document.getElementById('lumberjack-resources-label').innerText = translations.lumberjackResourcesLabel;
            document.getElementById('auto-increment-title').innerText = translations.autoIncrementTitle;
            document.getElementById('inventory-title').innerText = translations.inventoryTitle;
            document.querySelector('.tab-button:nth-child(1)').innerText = translations.professionResources;
            document.querySelector('.tab-button:nth-child(2)').innerText = translations.combatResources;

            // Update inventory and resources display with translations
            miner.updateInventoryDisplay(translations);
            miner.updateResourcesDisplay(translations);
            lumberjack.updateInventoryDisplay(translations);
            lumberjack.updateResourcesDisplay(translations);
        });
}

window.showTab = function(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.style.display = 'none';
    });
    document.getElementById(tabId).style.display = 'block';
}