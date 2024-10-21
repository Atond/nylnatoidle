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

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        data.minerResources.forEach(resource => globalResourceManager.addResource(resource));
        data.lumberjackResources.forEach(resource => globalResourceManager.addResource(resource));
        worlds = data.worlds;
        zones = data.zones;
        const minerResourceIds = data.minerResources.map(resource => resource.id);
        const lumberjackResourceIds = data.lumberjackResources.map(resource => resource.id);

        professions = {
            miner: new Miner(minerResourceIds),
            lumberjack: new Lumberjack(lumberjackResourceIds),
        };
        
        // Charger les traductions avant d'initialiser le jeu
        await globalTranslationManager.loadTranslations('fr');
        initializeGame();
    } catch (error) {
        console.error("Error initializing game:", error);
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
    const professionsList = document.getElementById('professions-list');
    professionsList.innerHTML = '';
    
    for (const [professionName, profession] of Object.entries(professions)) {
        const professionElement = document.createElement('div');
        professionElement.textContent = globalTranslationManager.translate(`professions.${professionName}.title`);
        professionElement.addEventListener('click', () => selectProfession(professionName));
        professionsList.appendChild(professionElement);
    }
}

function selectProfession(professionName) {
    document.querySelectorAll('.profession-details').forEach(el => el.style.display = 'none');
    
    const selectedProfessionDetails = document.getElementById(`${professionName}-details`);
    if (selectedProfessionDetails) {
        selectedProfessionDetails.style.display = 'block';
    }
    
    updateDisplays(professionName);
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