import { loadGame, saveGame } from './saveLoad.js';
import { Miner } from './professions/miner.js';
import { Lumberjack } from './professions/lumberjack.js';
import { MonsterManager } from './enemies/monster.js';
import { Inventory } from './inventory.js'; 
import { updateInventoryDisplay } from './inventoryDisplay.js';
import { ResourceManager } from './resourceManager.js';

let minerResources = [];
let lumberjackResources = [];
let worlds = [];
let zones = [];
let autoIncrementInterval;

export let miner;
export let lumberjack;
export const playerInventory = new Inventory(); 
export const resourceManager = new ResourceManager();
const monsterManager = new MonsterManager();

let playerExperience = 0;
const experienceToNextLevel = 100;
export let currentTranslations = {}; 

document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
    .then(response => response.json())
    .then(data => {
        data.minerResources.forEach(resource => resourceManager.addResource(resource));
        data.lumberjackResources.forEach(resource => resourceManager.addResource(resource));
        // Ajoutez ici d'autres types de ressources au fur et à mesure que vous ajoutez des métiers
        initializeGame();
    });
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

    updateExperienceBar();
    loadGame();
    loadTranslations('fr');
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
    document.getElementById('experience-text').textContent = `${playerExperience} / ${experienceToNextLevel} XP`;
}

function addLoot(loot) {
    for (const item of loot) {
        playerInventory.addItem(item, 1);
    }
    updateInventoryDisplay(currentTranslations);
}

function getResourceData(resourceId) {
    return resourceManager.getResource(resourceId);
}

export function updateInventoryDisplay(translations) {
    const inventoryElement = document.getElementById('profession-inventory');
    const allItems = playerInventory.getAllItems();
    const totalItems = Object.keys(allItems).length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    inventoryElement.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const itemsToDisplay = Object.entries(allItems).slice(startIndex, endIndex);

    for (const [resourceId, count] of itemsToDisplay) {
        const resource = getResourceData(resourceId);
        if (resource) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.innerHTML = `
                <img src="${resource.image}" alt="${translations.resources[resourceId]}">
                <div class="item-count">${count}</div>
                <div class="tooltip">${translations.resources[resourceId]}</div>
            `;
            inventoryElement.appendChild(slot);
        }
    }

    const paginationElement = document.getElementById('pagination');
    paginationElement.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.innerText = i;
        pageButton.addEventListener('click', () => {
            currentPage = i;
            updateInventoryDisplay(translations);
        });
        paginationElement.appendChild(pageButton);
    }
}

export function loadTranslations(language) {
    return fetch(`translations/${language}.json`)
        .then(response => response.json())
        .then(translations => {
            currentTranslations = translations;
            // Mettre à jour tous les éléments de l'interface utilisateur avec les nouvelles traductions
            document.getElementById('title').innerText = translations.title;
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
            document.getElementById('attack-monster').innerText = translations.attack;
            updateInventoryDisplay(translations);
        });
}

window.showTab = function (tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.style.display = 'none';
    });
    document.getElementById(tabId).style.display = 'block';
}