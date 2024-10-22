import { BaseProfession } from './baseprofession.js';
import { globalInventory } from '../inventory.js';
import { updateInventoryDisplay } from '../inventoryDisplay.js';
import { globalTranslationManager } from '../translations/translationManager.js';
import { globalResourceManager } from '../resourceManager.js';

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
            {
                level: 3,
                expRequired: 300,
                resources: ['iron_ore', 'copper_ore', 'gold_ore'],
                upgrades: [
                    { id: 'betterPickaxe3', name: 'Better Pickaxe III', cost: { gold_ore: 5 }, effect: () => { this.miningPower += 3; } },
                    { id: 'autoMiner2', name: 'Auto Miner II', cost: { gold_ore: 15 }, effect: () => { this.autoMinerCount += 2; } },
                ]
            }
        ];
        this.unlockedUpgrades = new Set();
    }

    mine() {
        const currentProgression = this.getCurrentProgression();
        if (!currentProgression) return 0;

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
        if (!availableResources || availableResources.length === 0) {
            return null;
        }
        const randomIndex = Math.floor(Math.random() * availableResources.length);
        const resourceId = availableResources[randomIndex];
        return resourceId;
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
        try {
            const currentProgression = this.getCurrentProgression();
            const resourcesElement = document.getElementById('miner-resources');
            if (resourcesElement && currentProgression) {
                const resourceNames = currentProgression.resources
                    .map(id => globalTranslationManager.translate(`resources.professions.miner.${id}`))
                    .filter(name => name)
                    .join(", ");
                resourcesElement.textContent = resourceNames || 'None';
            }
        } catch (error) {
            console.error('Error updating resources display:', error);
        }
    }

    updateUpgradesDisplay() {
        const upgradesContainer = document.getElementById('miner-upgrades');
        if (upgradesContainer) {
            upgradesContainer.innerHTML = '';
            const availableUpgrades = this.getAvailableUpgrades();
            availableUpgrades.forEach(upgrade => {
                const upgradeButton = document.createElement('button');
                const upgradeInfo = globalTranslationManager.translate(`professions.miner.upgrades.${upgrade.id}`);
                const costText = Object.entries(upgrade.cost)
                    .map(([resourceId, cost]) => {
                        const resourceName = globalTranslationManager.translate(`resources.professions.miner.${resourceId}`);
                        return `${resourceName}: ${cost}`;
                    })
                    .join(', ');
                
                const upgradeName = typeof upgradeInfo === 'object' ? upgradeInfo.name : upgradeInfo;
                upgradeButton.textContent = `${upgradeName} (${costText})`;
                
                if (upgradeInfo.description) {
                    upgradeButton.title = upgradeInfo.description;
                }
                
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