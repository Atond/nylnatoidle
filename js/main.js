import { loadGame, saveGame } from './saveLoad.js';
import { Miner } from './professions/miner.js';
import { Lumberjack } from './professions/lumberjack.js';
import { MonsterManager } from './enemies/monster.js';
import { globalInventory } from './inventory.js'; 
import { updateInventoryDisplay } from './inventoryDisplay.js';
import { globalResourceManager } from './resourceManager.js';
import { globalTranslationManager } from './translations/translationManager.js';

let worlds = [];
let zones = [];
let autoIncrementInterval;

export let miner;
export let lumberjack;
const monsterManager = new MonsterManager();

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
        miner = new Miner(minerResourceIds);
        lumberjack = new Lumberjack(lumberjackResourceIds);
        
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
        globalTranslationManager.setLanguage(event.target.value);
        updateUITranslations();
    });

    monsterManager.setWorld("Forest");
    monsterManager.setZone("Dark Woods");
    monsterManager.spawnMonster();

    document.getElementById('attack-monster').addEventListener('click', () => {
        const { expGained, loot } = monsterManager.attackMonster(1);
        if (expGained > 0) {
            addExperience(expGained);
            addLoot(loot);
        }
    });

    document.getElementById('mine-button').addEventListener('click', () => {
        const minedAmount = miner.mine();
        console.log(`Mined ${minedAmount} ore`);
        miner.updateDisplay();
    });

    // Démarrer l'auto-minage
    setInterval(() => {
        if (miner.autoMinerCount > 0) {
            const autoMinedAmount = miner.autoMine();
            if (autoMinedAmount > 0) {
                console.log(`Auto-mined ${autoMinedAmount} ore`);
                miner.updateDisplay();
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

function updateUITranslations() {
    document.getElementById('title').innerText = globalTranslationManager.translate('ui.title');
    document.getElementById('character-title').innerText = globalTranslationManager.translate('ui.characterTitle');
    document.getElementById('character-name-label').innerText = globalTranslationManager.translate('ui.characterNameLabel');
    document.getElementById('change-name').innerText = globalTranslationManager.translate('ui.changeName');
    document.getElementById('save-name').innerText = globalTranslationManager.translate('ui.saveName');
    document.getElementById('character-level-label').innerText = globalTranslationManager.translate('ui.characterLevelLabel');
    document.getElementById('professions-title').innerText = globalTranslationManager.translate('ui.professionsTitle');
    document.getElementById('miner-title').innerText = globalTranslationManager.translate('professions.miner.title');
    document.getElementById('miner-exp-label').innerText = globalTranslationManager.translate('professions.miner.expLabel');
    document.getElementById('miner-level-label').innerText = globalTranslationManager.translate('professions.miner.levelLabel');
    document.getElementById('miner-resources-label').innerText = globalTranslationManager.translate('professions.miner.resourcesLabel');
    document.getElementById('lumberjack-title').innerText = globalTranslationManager.translate('professions.lumberjack.title');
    document.getElementById('lumberjack-exp-label').innerText = globalTranslationManager.translate('professions.lumberjack.expLabel');
    document.getElementById('lumberjack-level-label').innerText = globalTranslationManager.translate('professions.lumberjack.levelLabel');
    document.getElementById('lumberjack-resources-label').innerText = globalTranslationManager.translate('professions.lumberjack.resourcesLabel');
    document.getElementById('auto-increment-title').innerText = globalTranslationManager.translate('ui.autoIncrementTitle');
    document.getElementById('inventory-title').innerText = globalTranslationManager.translate('ui.inventoryTitle');
    document.getElementById('attack-monster').innerText = globalTranslationManager.translate('ui.attack');
    
    updateInventoryDisplay();
    miner.updateDisplay();
    lumberjack.updateDisplay();
}

window.showTab = function (tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.style.display = 'none';
    });
    document.getElementById(tabId).style.display = 'block';
}