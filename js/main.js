import { loadGame, saveGame } from './saveLoad.js';
import { Miner } from './professions/miner.js';
import { Lumberjack } from './professions/lumberjack.js';
//import { MonsterManager } from './enemies/monster.js';
import { globalInventory } from './inventory.js'; 
import { updateInventoryDisplay } from './inventoryDisplay.js';
import { globalResourceManager } from './resourceManager.js';
import { globalTranslationManager } from './translations/translationManager.js';

let worlds = [];
let zones = [];
let autoIncrementInterval;

export let professions = {};

let playerExperience = 0;
const experienceToNextLevel = 100;

// Fonction pour charger un fichier JSON
async function loadJsonData(path) {
    try {
        const response = await fetch(`data/${path}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error loading ${path}:`, error);
        return null;
    }
}

// Fonction pour initialiser toutes les ressources du jeu
async function initializeGameData() {
    try {
        // Chargement de tous les fichiers de données
        const [
            professionResources,
            monsterResources,
            monstersData,
            worldMapData
        ] = await Promise.all([
            loadJsonData('professionResources.json'),
            loadJsonData('monsterResources.json'),
            loadJsonData('monsters.json'),
            loadJsonData('worldMap.json')
        ]);

        if (!professionResources || !monsterResources || !monstersData || !worldMapData) {
            throw new Error('Failed to load one or more required data files');
        }

        // Initialisation des ressources des professions
        if (professionResources.miner) {
            professionResources.miner.forEach(resource => 
                globalResourceManager.addResource(resource, 'profession'));
        }
        if (professionResources.lumberjack) {
            professionResources.lumberjack.forEach(resource => 
                globalResourceManager.addResource(resource, 'profession'));
        }

        // Initialisation des ressources des monstres
        monsterResources.resources.forEach(resource => 
            globalResourceManager.addResource(resource, 'monster'));

        // Stockage des données des monstres et du monde
        worlds = worldMapData.worlds;
        zones = worlds.flatMap(world => world.zones);

        // Création des instances de profession
        professions = {
            miner: new Miner(professionResources.miner.map(r => r.id)),
            lumberjack: new Lumberjack(professionResources.lumberjack.map(r => r.id))
        };

        // Initialisation des traductions
        await globalTranslationManager.loadTranslations('fr');

        return true;
    } catch (error) {
        console.error('Error initializing game data:', error);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const dataInitialized = await initializeGameData();
        if (!dataInitialized) {
            throw new Error('Failed to initialize game data');
        }
        
        initializeGame();
    } catch (error) {
        console.error("Error starting game:", error);
        // Afficher un message d'erreur à l'utilisateur
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = 'Failed to load game data. Please refresh the page.';
        document.body.prepend(errorElement);
    }
});

function initializeGame() {
    document.getElementById('auto-increment-select').addEventListener('change', (event) => {
        clearInterval(autoIncrementInterval);
        if (event.target.value === 'miner') {
            autoIncrementInterval = setInterval(() => professions.miner.autoIncrement(), 1000);
        } else if (event.target.value === 'lumberjack') {
            autoIncrementInterval = setInterval(() => professions.lumberjack.autoIncrement(), 1000);
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
        globalTranslationManager.setLanguage(event.target.value);
        updateUITranslations();
    });

    document.getElementById('mine-button').addEventListener('click', () => {
        const minedAmount = professions.miner.mine();
        console.log(`Mined ${minedAmount} ore`);
        professions.miner.updateDisplay();
    });

    displayProfessionsList();

    // Démarrer l'auto-minage
    setInterval(() => {
        if (professions.miner.autoMinerCount > 0) {
            const autoMinedAmount = professions.miner.autoMine();
            if (autoMinedAmount > 0) {
                console.log(`Auto-mined ${autoMinedAmount} ore`);
                professions.miner.updateDisplay();
            }
        }
    }, 1000);  // Vérifier toutes les secondes

    updateInventoryDisplay();
    updateExperienceBar();
    loadGame();
    updateUITranslations();
    setInterval(saveGame, 30000);
}

function addExperience(amount) {
    playerExperience += amount;
    if (playerExperience >= experienceToNextLevel) {
        playerExperience -= experienceToNextLevel;
        // Gérer le passage au niveau supérieur ici
    }
    updateExperienceBar();
}

function updateExperienceBar() {
    const expBar = document.getElementById('experience-bar');
    const expPercentage = (playerExperience / experienceToNextLevel) * 100;
    expBar.style.width = `${expPercentage}%`;
    document.getElementById('experience-text').textContent = 
        `${playerExperience} / ${experienceToNextLevel} ${globalTranslationManager.translate('ui.xp')}`;
}

function addLoot(loot) {
    for (const item of loot) {
        globalInventory.addItem(item, 1);
    }
    updateInventoryDisplay();
}

function updateCommonElements() {
    // Mettez à jour les éléments communs ici, comme le niveau du personnage, l'expérience globale, etc.
    updateExperienceBar();
}

function displayProfessionsList() {
    // Mise à jour de la liste des professions
    const professionsList = document.getElementById('professions-list');
    if (professionsList) {
        professionsList.innerHTML = '';
        
        for (const [professionName, profession] of Object.entries(professions)) {
            const professionButton = document.createElement('button');
            professionButton.textContent = globalTranslationManager.translate(`professions.${professionName}.title`);
            professionButton.className = 'profession-button';
            professionButton.addEventListener('click', () => selectProfession(professionName));
            professionsList.appendChild(professionButton);
        }
    }

    // Configuration des boutons d'action pour chaque profession
    for (const [professionName, profession] of Object.entries(professions)) {
        const actionButton = document.getElementById(`${professionName}-action`);
        if (actionButton) {
            // Supprimer les anciens event listeners
            const newButton = actionButton.cloneNode(true);
            actionButton.parentNode.replaceChild(newButton, actionButton);
            
            // Ajouter le nouveau event listener
            newButton.addEventListener('click', () => {
                if (typeof profession.mine === 'function') {
                    const amount = profession.mine();
                    console.log(`${professionName} gathered ${amount} resources`);
                    profession.updateDisplay();
                }
            });
        }
    }
}

function selectProfession(professionName) {
    // Mettre à jour la visibilité des détails de profession
    document.querySelectorAll('.profession-details').forEach(el => {
        if (el.id === `${professionName}-details`) {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    });
    
    // Mettre à jour l'affichage de la profession sélectionnée
    if (professions[professionName]) {
        professions[professionName].updateDisplay();
    }
}


function updateUITranslations() {
    const elements = {
        'title': 'ui.title',
        'character-title': 'ui.characterTitle',
        'character-name-label': 'ui.characterNameLabel',
        'change-name': 'ui.changeName',
        'save-name': 'ui.saveName',
        'character-level-label': 'ui.characterLevelLabel',
        'professions-title': 'ui.professionsTitle',
        'miner-title': 'professions.miner.title',
        'miner-exp-label': 'professions.miner.expLabel',
        'miner-level-label': 'professions.miner.levelLabel',
        'miner-resources-label': 'professions.miner.resourcesLabel',
        'lumberjack-title': 'professions.lumberjack.title',
        'lumberjack-exp-label': 'professions.lumberjack.expLabel',
        'lumberjack-level-label': 'professions.lumberjack.levelLabel',
        'lumberjack-resources-label': 'professions.lumberjack.resourcesLabel',
        'auto-increment-title': 'ui.autoIncrementTitle',
        'inventory-title': 'ui.inventoryTitle',
        'attack-monster': 'ui.attack'
    };

    for (const [id, translationKey] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.innerText = globalTranslationManager.translate(translationKey);
        }
    }

    updateInventoryDisplay();
    for (const profession of Object.values(professions)) {
        if (typeof profession.updateDisplay === 'function') {
            profession.updateDisplay();
        }
    }
}

window.showTab = function (tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.style.display = 'none';
    });
    document.getElementById(tabId).style.display = 'block';
}

// Exportez les données qui pourraient être nécessaires ailleurs
export function getWorlds() {
    return worlds;
}

export function getZones() {
    return zones;
}

export function getZoneById(zoneId) {
    return zones.find(zone => zone.id === zoneId);
}

export function getWorldById(worldId) {
    return worlds.find(world => world.id === worldId);
}

export function updateDisplays(selectedProfession = null) {
    updateInventoryDisplay();
    updateCommonElements();
    
    if (selectedProfession && professions[selectedProfession]) {
        const profession = professions[selectedProfession];
        if (typeof profession.updateDisplay === 'function') {
            profession.updateDisplay();
        } else {
            console.warn(`Update display function not available for ${selectedProfession}`);
        }
    }
}