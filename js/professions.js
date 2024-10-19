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
    const resources = minerResources.slice(0, minerLevel).map(res => res.name).join(", ") || "None";
    document.getElementById('miner-resources').innerText = resources;
}

export function updateLumberjackResourcesDisplay() {
    const resources = lumberjackResources.slice(0, lumberjackLevel).map(res => res.name).join(", ") || "None";
    document.getElementById('lumberjack-resources').innerText = resources;
}

export function updateMinerInventoryDisplay() {
    const minerItems = document.getElementById('profession-inventory');
    minerItems.innerHTML = '';
    for (const [resource, count] of Object.entries(minerInventory)) {
        const resourceData = minerResources.find(res => res.name === resource);
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        slot.innerHTML = `
            <img src="${resourceData.image}" alt="${resource}">
            <div class="item-count">${count}</div>
            <div class="tooltip">${resource}</div>
        `;
        minerItems.appendChild(slot);
    }
}

export function updateLumberjackInventoryDisplay() {
    const lumberjackItems = document.getElementById('profession-inventory');
    lumberjackItems.innerHTML = '';
    for (const [resource, count] of Object.entries(lumberjackInventory)) {
        const resourceData = lumberjackResources.find(res => res.name === resource);
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        slot.innerHTML = `
            <img src="${resourceData.image}" alt="${resource}">
            <div class="item-count">${count}</div>
            <div class="tooltip">${resource}</div>
        `;
        lumberjackItems.appendChild(slot);
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
        minerInventory[resource.name] = (minerInventory[resource.name] || 0) + 1;
        updateMinerInventoryDisplay();
    } else if (profession === 'lumberjack') {
        const resource = getRandomResource(lumberjackResources, lumberjackLevel);
        lumberjackInventory[resource.name] = (lumberjackInventory[resource.name] || 0) + 1;
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