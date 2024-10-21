// baseprofession.js
import { globalResourceManager } from '../resourceManager.js';
import { globalInventory } from '../inventory.js';
import { updateInventoryDisplay } from '../inventoryDisplay.js';
import { globalTranslationManager } from '../translations/translationManager.js';

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
            this.updateResourcesDisplay();
            updateInventoryDisplay();
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
        const expElement = document.getElementById(`${this.name}-exp`);
        if (expElement) {
            expElement.innerText = this.exp;
        }
    }

    updateLevelDisplay() {
        const levelElement = document.getElementById(`${this.name}-level`);
        if (levelElement) {
            levelElement.innerText = this.level;
        }
    }

    updateResourcesDisplay() {
        const resourcesElement = document.getElementById(`${this.name}-resources`);
        if (resourcesElement) {
            const resources = this.resourceIds.slice(0, this.level)
                .map(id => globalTranslationManager.translate(`resources.${id}`))
                .join(", ") || globalTranslationManager.translate('ui.none');
            resourcesElement.innerText = resources;
        }
    }

    checkLevelUp() {
        if (this.exp >= this.level * 100) {
            this.level += 1;
            this.updateLevelDisplay();
            this.updateResourcesDisplay();
        }
    }

    autoIncrement() {
        this.exp += 1;
        this.updateExpDisplay();
        this.checkLevelUp();
        this.collectResource();
    }
}