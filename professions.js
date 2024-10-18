let minerExp = 0;
let lumberjackExp = 0;
let minerLevel = 1;
let lumberjackLevel = 1;

export const minerInventory = {};
export const lumberjackInventory = {};

let minerResources = [];
let lumberjackResources = [];

export function setResources(minerRes, lumberjackRes) {
    minerResources = minerRes;
    lumberjackResources = lumberjackRes;
}

export function getMinerExp() {
    return minerExp;
}

export function setMinerExp(value) {
    minerExp = value;
}

export function getLumberjackExp() {
    return lumberjackExp;
}

export function setLumberjackExp(value) {
    lumberjackExp = value;
}

export function getMinerLevel() {
    return minerLevel;
}

export function setMinerLevel(value) {
    minerLevel = value;
}

export function getLumberjackLevel() {
    return lumberjackLevel;
}

export function setLumberjackLevel(value) {
    lumberjackLevel = value;
}

export function updateMinerExpDisplay() {
    document.getElementById('miner-exp').innerText = minerExp;
}

export function updateLumberjackExpDisplay() {
    document.getElementById('lumberjack-exp').innerText = lumberjackExp;
}

export function updateMinerLevelDisplay() {
    document.getElementById('miner-level').innerText = minerLevel;
}

export function updateLumberjackLevelDisplay() {
    document.getElementById('lumberjack-level').innerText = lumberjackLevel;
}

export function updateMinerResourcesDisplay() {
    const resources = minerResources.slice(0, minerLevel).join(", ") || "None";
    document.getElementById('miner-resources').innerText = resources;
}

export function updateLumberjackResourcesDisplay() {
    const resources = lumberjackResources.slice(0, lumberjackLevel).join(", ") || "None";
    document.getElementById('lumberjack-resources').innerText = resources;
}

export function updateMinerInventoryDisplay() {
    const minerItems = document.getElementById('miner-items');
    minerItems.innerHTML = '';
    for (const [resource, count] of Object.entries(minerInventory)) {
        const li = document.createElement('li');
        li.innerText = `${resource}: ${count}`;
        minerItems.appendChild(li);
    }
}

export function updateLumberjackInventoryDisplay() {
    const lumberjackItems = document.getElementById('lumberjack-items');
    lumberjackItems.innerHTML = '';
    for (const [resource, count] of Object.entries(lumberjackInventory)) {
        const li = document.createElement('li');
        li.innerText = `${resource}: ${count}`;
        lumberjackItems.appendChild(li);
    }
}

export function autoIncrement(profession) {
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