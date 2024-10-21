// baseprofession.js
import { globalResourceManager } from '../resourceManager.js';
import { globalInventory } from '../inventory.js';

export class BaseProfession {
    constructor(name, resourceIds) {
        this.name = name;
        this.resourceIds = resourceIds;
        this.exp = 0;
        this.level = 1;
    }

    getRandomResource() {
        if (this.resourceIds.length === 0) {
            return null;
        }
        const weightedResources = [];
        for (let i = 0; i < this.level; i++) {
            for (let j = 0; j < this.level - i; j++) {
                weightedResources.push(this.resourceIds[i]);
            }
        }
        const randomResourceId = weightedResources[Math.floor(Math.random() * weightedResources.length)];
        return globalResourceManager.getResource(randomResourceId);
    }

    collectResource() {
        const resource = this.getRandomResource();
        if (resource) {
            globalInventory.addItem(resource.id, 1);
            this.exp += 1;
            this.checkLevelUp();
            this.updateResourcesDisplay(currentTranslations);
            updateInventoryDisplay(currentTranslations);
        }
    }
    
    setExp(value) {
        this.exp = value;
        this.updateExpDisplay();
    }

    setLevel(value) {
        this.level = value;
        this.updateLevelDisplay();
    }

    setResources(resources) {
        this.resources = resources;
    }

    updateExpDisplay() {
        document.getElementById(`${this.name}-exp`).innerText = this.exp;
    }

    updateLevelDisplay() {
        document.getElementById(`${this.name}-level`).innerText = this.level;
    }

    updateResourcesDisplay(translations) {
        if (!translations) return;
        const resources = this.resourceIds.slice(0, this.level)
            .map(id => translations.resources[id])
            .join(", ") || "None";
        document.getElementById(`${this.name}-resources`).innerText = resources;
    }

    checkLevelUp() {
        if (this.exp >= this.level * 100) {
            this.level += 1;
            this.updateLevelDisplay();
            this.updateResourcesDisplay(currentTranslations);
        }
    }

    autoIncrement() {
        this.exp += 1;
        this.updateExpDisplay();
        this.checkLevelUp();
        this.collectResource();
    }
}