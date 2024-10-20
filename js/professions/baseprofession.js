export class BaseProfession {
    constructor(name, resources) {
        this.name = name;
        this.exp = 0;
        this.level = 1;
        this.resources = resources;
        this.inventory = {};
    }

    setExp(value) {
        this.exp = value;
        this.updateExpDisplay();
    }

    setLevel(value) {
        this.level = value;
        this.updateLevelDisplay();
    }

    updateExpDisplay() {
        document.getElementById(`${this.name}-exp`).innerText = this.exp;
    }

    updateLevelDisplay() {
        document.getElementById(`${this.name}-level`).innerText = this.level;
    }

    updateResourcesDisplay(translations) {
        if (!translations) return;
        const resources = this.resources.slice(0, this.level).map(res => translations.resources[res.id]).join(", ") || "None";
        document.getElementById(`${this.name}-resources`).innerText = resources;
    }

    updateInventoryDisplay(translations) {
        const inventoryElement = document.getElementById('profession-inventory');
        inventoryElement.innerHTML = '';
        for (const [resourceId, count] of Object.entries(this.inventory)) {
            const resourceData = this.resources.find(res => res.id === resourceId);
            if (resourceData) {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot';
                slot.innerHTML = `
                    <img src="${resourceData.image}" alt="${translations.resources[resourceId]}">
                    <div class="item-count">${count}</div>
                    <div class="tooltip">${translations.resources[resourceId]}</div>
                `;
                inventoryElement.appendChild(slot);
            }
        }
    }

    checkLevelUp() {
        if (this.exp >= this.level * 100) {
            this.level += 1;
            this.updateLevelDisplay();
            this.updateResourcesDisplay();
        }
    }

    collectResource() {
        const resource = this.getRandomResource();
        if (resource) {
            this.inventory[resource.id] = (this.inventory[resource.id] || 0) + 1;
            this.updateInventoryDisplay();
        }
    }

    getRandomResource() {
        if (this.resources.length === 0) {
            return null;
        }
        const weightedResources = [];
        for (let i = 0; i < this.level; i++) {
            for (let j = 0; j < this.level - i; j++) {
                weightedResources.push(this.resources[i]);
            }
        }
        return weightedResources[Math.floor(Math.random() * weightedResources.length)];
    }

    autoIncrement() {
        this.exp += 1;
        this.updateExpDisplay();
        this.checkLevelUp();
        this.collectResource();
    }
}