let points = 0;
let characterLevel = 1;
let minerExp = 0;
let lumberjackExp = 0;
let minerLevel = 1;
let lumberjackLevel = 1;
let autoIncrementInterval;

const minerResources = ["Minerai 1", "Minerai 2", "Minerai 3", "Minerai 4", "Minerai 5", "Minerai 6", "Minerai 7", "Minerai 8", "Minerai 9", "Minerai 10"];
const lumberjackResources = ["Bois 1", "Bois 2", "Bois 3", "Bois 4", "Bois 5", "Bois 6", "Bois 7", "Bois 8", "Bois 9", "Bois 10"];

const minerInventory = {};
const lumberjackInventory = {};

document.getElementById('generate').addEventListener('click', () => {
    points += 1;
    updatePointsDisplay();
});

document.getElementById('auto-increment-select').addEventListener('change', (event) => {
    clearInterval(autoIncrementInterval);
    if (event.target.value !== 'none') {
        autoIncrementInterval = setInterval(() => autoIncrement(event.target.value), 1000);
    }
});

function updatePointsDisplay() {
    document.getElementById('points').innerText = `Points: ${points}`;
}

function updateMinerExpDisplay() {
    document.getElementById('miner-exp').innerText = minerExp;
}

function updateLumberjackExpDisplay() {
    document.getElementById('lumberjack-exp').innerText = lumberjackExp;
}

function updateMinerLevelDisplay() {
    document.getElementById('miner-level').innerText = minerLevel;
}

function updateLumberjackLevelDisplay() {
    document.getElementById('lumberjack-level').innerText = lumberjackLevel;
}

function updateMinerResourcesDisplay() {
    const resources = minerResources.slice(0, minerLevel).join(", ") || "None";
    document.getElementById('miner-resources').innerText = resources;
}

function updateLumberjackResourcesDisplay() {
    const resources = lumberjackResources.slice(0, lumberjackLevel).join(", ") || "None";
    document.getElementById('lumberjack-resources').innerText = resources;
}

function updateMinerInventoryDisplay() {
    const minerItems = document.getElementById('miner-items');
    minerItems.innerHTML = '';
    for (const [resource, count] of Object.entries(minerInventory)) {
        const li = document.createElement('li');
        li.innerText = `${resource}: ${count}`;
        minerItems.appendChild(li);
    }
}

function updateLumberjackInventoryDisplay() {
    const lumberjackItems = document.getElementById('lumberjack-items');
    lumberjackItems.innerHTML = '';
    for (const [resource, count] of Object.entries(lumberjackInventory)) {
        const li = document.createElement('li');
        li.innerText = `${resource}: ${count}`;
        lumberjackItems.appendChild(li);
    }
}

function autoIncrement(profession) {
    if (profession === 'miner') {
        minerExp += 1;
        updateMinerExpDisplay();
        checkLevelUp('miner');
        collectResource('miner');
    } else if (profession === 'lumberjack') {
        lumberjackExp += 1;
        updateLumberjackExpDisplay();
        checkLevelUp('lumberjack');
        collectResource('lumberjack');
    }
}

function checkLevelUp(profession) {
    if (profession === 'miner' && minerExp >= minerLevel * 100) {
        minerLevel += 1;
        updateMinerLevelDisplay();
        updateMinerResourcesDisplay();
    } else if (profession === 'lumberjack' && lumberjackExp >= lumberjackLevel * 100) {
        lumberjackLevel += 1;
        updateLumberjackLevelDisplay();
        updateLumberjackResourcesDisplay();
    }
}

function collectResource(profession) {
    if (profession === 'miner') {
        const resource = getRandomResource(minerResources, minerLevel);
        minerInventory[resource] = (minerInventory[resource] || 0) + 1;
        updateMinerInventoryDisplay();
    } else if (profession === 'lumberjack') {
        const resource = getRandomResource(lumberjackResources, lumberjackLevel);
        lumberjackInventory[resource] = (lumberjackInventory[resource] || 0) + 1;
        updateLumberjackInventoryDisplay();
    }
}

function getRandomResource(resources, level) {
    const weightedResources = [];
    for (let i = 0; i < level; i++) {
        for (let j = 0; j < level - i; j++) {
            weightedResources.push(resources[i]);
        }
    }
    return weightedResources[Math.floor(Math.random() * weightedResources.length)];
}

// Sauvegarder la progression
function saveGame() {
    const gameState = {
        points,
        characterLevel,
        minerExp,
        lumberjackExp,
        minerLevel,
        lumberjackLevel,
        minerInventory,
        lumberjackInventory
    };
    localStorage.setItem('idleRPGSave', JSON.stringify(gameState));
}

// Charger la progression
function loadGame() {
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

// Appeler la fonction de chargement au démarrage du jeu
window.onload = loadGame;

// Function to auto-generate points
function autoGeneratePoints() {
    points += 1;
    updatePointsDisplay();
}

// Generate points every second
setInterval(autoGeneratePoints, 1000);