import { BaseProfession } from './baseprofession.js';
import { globalInventory } from '../inventory.js';
import { updateInventoryDisplay } from '../inventoryDisplay.js';
import { globalTranslationManager } from '../translations/translationManager.js';

export class Miner extends BaseProfession {
    constructor(resourceIds) {
        super('miner', resourceIds);
        this.miningPower = 1;
        this.autoMinerCount = 0;
        this.progression = [
            {
                level: 1,
                expRequired: 0,
                resources: ['iron_ore'],
                upgrades: [
                    { id: 'betterPickaxe1', name: 'Better Pickaxe I', cost: { iron_ore: 10 }, effect: () => { this.miningPower += 1; } },
                ]
            },
            {
                level: 2,
                expRequired: 100,
                resources: ['iron_ore', 'copper_ore'],
                upgrades: [
                    { id: 'betterPickaxe2', name: 'Better Pickaxe II', cost: { iron_ore: 20, copper_ore: 5 }, effect: () => { this.miningPower += 2; } },
                    { id: 'autoMiner1', name: 'Auto Miner I', cost: { iron_ore: 50, copper_ore: 20 }, effect: () => { this.autoMinerCount += 1; } },
                ]
            },
            // Ajoutez d'autres niveaux ici...
        ];
        this.unlockedUpgrades = new Set();
    }

    mine() {
        const currentProgression = this.getCurrentProgression();
        const resource = this.getRandomResource(currentProgression.resources);
        if (resource) {
            const amount = Math.floor(this.miningPower);
            globalInventory.addItem(resource, amount);
            this.exp += amount;
            this.checkLevelUp();
            this.updateResourcesDisplay();
            updateInventoryDisplay();
            return amount;
        }
        return 0;
    }

    autoMine() {
        let totalMined = 0;
        for (let i = 0; i < this.autoMinerCount; i++) {
            totalMined += this.mine();
        }
        return totalMined;
    }

    getRandomResource(availableResources) {
        if (availableResources.length === 0) {
            return null;
        }
        return availableResources[Math.floor(Math.random() * availableResources.length)];
    }

    getCurrentProgression() {
        return this.progression.filter(p => p.level <= this.level).pop();
    }

    getNextLevelProgression() {
        return this.progression.find(p => p.level === this.level + 1);
    }

    getAvailableUpgrades() {
        const currentProgression = this.getCurrentProgression();
        return currentProgression.upgrades.filter(u => !this.unlockedUpgrades.has(u.id));
    }

    buyUpgrade(upgradeId) {
        const upgrade = this.getAvailableUpgrades().find(u => u.id === upgradeId);
        if (upgrade) {
            for (const [resourceId, cost] of Object.entries(upgrade.cost)) {
                if (globalInventory.getItemQuantity(resourceId) < cost) {
                    return false; // Not enough resources
                }
            }
            // Deduct the cost
            for (const [resourceId, cost] of Object.entries(upgrade.cost)) {
                globalInventory.removeItem(resourceId, cost);
            }
            // Apply the upgrade
            upgrade.effect();
            this.unlockedUpgrades.add(upgradeId);
            return true;
        }
        return false;
    }


    updateDisplay() {
        super.updateExpDisplay();
        super.updateLevelDisplay();
        
        const miningPowerElement = document.getElementById('miner-mining-power');
        if (miningPowerElement) {
            miningPowerElement.textContent = `${this.miningPower.toFixed(1)}`;
        }
    
        const autoMinerElement = document.getElementById('miner-auto-miners');
        if (autoMinerElement) {
            autoMinerElement.textContent = `${this.autoMinerCount}`;
        }
    
        const expElement = document.getElementById('miner-exp');
        const expRequiredElement = document.getElementById('miner-exp-required');
        const nextLevel = this.getNextLevelProgression();
        if (expElement && expRequiredElement && nextLevel) {
            expElement.textContent = this.exp;
            expRequiredElement.textContent = nextLevel.expRequired;
        }
    
        this.updateResourcesDisplay();
        this.updateUpgradesDisplay();
    }

    updateResourcesDisplay() {
        const currentProgression = this.getCurrentProgression();
        const resourcesElement = document.getElementById('miner-resources');
        if (resourcesElement) {
            const resourceNames = currentProgression.resources
                .map(id => globalTranslationManager.translate(`resources.${id}`))
                .join(", ");
            resourcesElement.textContent = resourceNames || globalTranslationManager.translate('ui.none');
        }
    }

    updateUpgradesDisplay() {
        const upgradesContainer = document.getElementById('miner-upgrades');
        if (upgradesContainer) {
            upgradesContainer.innerHTML = '';
            const availableUpgrades = this.getAvailableUpgrades();
            availableUpgrades.forEach(upgrade => {
                const upgradeButton = document.createElement('button');
                const costText = Object.entries(upgrade.cost)
                    .map(([resourceId, cost]) => `${globalTranslationManager.translate(`resources.${resourceId}`)}: ${cost}`)
                    .join(', ');
                upgradeButton.textContent = `${globalTranslationManager.translate(`professions.miner.upgrades.${upgrade.id}`)} (${costText})`;
                upgradeButton.onclick = () => {
                    if (this.buyUpgrade(upgrade.id)) {
                        this.updateDisplay();
                        updateInventoryDisplay();
                    } else {
                        console.log(globalTranslationManager.translate('ui.notEnoughResources'));
                    }
                };
                upgradesContainer.appendChild(upgradeButton);
            });
        }
    }

    checkLevelUp() {
        const nextLevel = this.getNextLevelProgression();
        if (nextLevel && this.exp >= nextLevel.expRequired) {
            this.level += 1;
            this.updateLevelDisplay();
            this.updateDisplay()
            // Vous pouvez ajouter ici une notification ou un effet visuel pour le passage de niveau
        }
    }
}