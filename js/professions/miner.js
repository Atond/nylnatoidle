import { BaseProfession } from './baseprofession.js';
import { globalInventory } from '../inventory.js';
import { updateInventoryDisplay } from '../inventoryDisplay.js';

export class Miner extends BaseProfession {
    constructor(resourceIds) {
        super('miner', resourceIds);
        this.miningPower = 1;
        this.autoMinerCount = 0;
        this.upgrades = [
            { id: 'betterPickaxe', name: 'Better Pickaxe', cost: 10, effect: () => { this.miningPower += 1; } },
            { id: 'efficientTechnique', name: 'Efficient Technique', cost: 50, effect: () => { this.miningPower *= 1.5; } },
            { id: 'autoMiner', name: 'Auto Miner', cost: 100, effect: () => { this.autoMinerCount += 1; } },
        ];
        this.unlockedUpgrades = new Set();
    }

    mine(translations) {
        const resource = this.getRandomResource();
        if (resource) {
            const amount = Math.floor(this.miningPower);
            globalInventory.addItem(resource.id, amount);
            this.exp += amount;
            this.checkLevelUp();
            this.updateResourcesDisplay(translations);
            updateInventoryDisplay(translations);
            return amount;
        }
        return 0;
    }

    autoMine(translations) {
        if (this.autoMinerCount > 0) {
            const totalMined = this.autoMinerCount * this.mine(translations);
            return totalMined;
        }
        return 0;
    }

    buyUpgrade(upgradeId) {
        const upgrade = this.upgrades.find(u => u.id === upgradeId);
        if (upgrade && !this.unlockedUpgrades.has(upgradeId)) {
            const oreCost = upgrade.cost;
            let totalOre = 0;
            for (const resourceId of this.resourceIds) {
                totalOre += globalInventory.getItemQuantity(resourceId);
            }
            if (totalOre >= oreCost) {
                // Deduct the cost
                let remainingCost = oreCost;
                for (const resourceId of this.resourceIds) {
                    const quantity = globalInventory.getItemQuantity(resourceId);
                    if (quantity > 0) {
                        const deduct = Math.min(quantity, remainingCost);
                        globalInventory.removeItem(resourceId, deduct);
                        remainingCost -= deduct;
                        if (remainingCost <= 0) break;
                    }
                }
                // Apply the upgrade
                upgrade.effect();
                this.unlockedUpgrades.add(upgradeId);
                return true;
            }
        }
        return false;
    }

    getAvailableUpgrades() {
        return this.upgrades.filter(u => !this.unlockedUpgrades.has(u.id) && this.level >= 2);
    }

    updateDisplay(translations) {
        const minerTranslations = translations.miner;
        
        document.getElementById('miner-title').textContent = minerTranslations.title;
        document.getElementById('miner-exp-label').textContent = minerTranslations.expLabel;
        document.getElementById('miner-level-label').textContent = minerTranslations.levelLabel;
        document.getElementById('miner-resources-label').textContent = minerTranslations.resourcesLabel;
        
        super.updateExpDisplay();
        super.updateLevelDisplay();
        
        // Update mining power display
        const miningPowerElement = document.getElementById('miner-mining-power');
        if (miningPowerElement) {
            miningPowerElement.textContent = `${minerTranslations.miningPower}: ${this.miningPower.toFixed(1)}`;
        }

        // Update auto miner count display
        const autoMinerElement = document.getElementById('miner-auto-miners');
        if (autoMinerElement) {
            autoMinerElement.textContent = `${minerTranslations.autoMiners}: ${this.autoMinerCount}`;
        }

        // Update resources display
        const resourcesElement = document.getElementById('miner-resources');
        if (resourcesElement) {
            const resourceNames = this.resourceIds.slice(0, this.level)
                .map(id => minerTranslations.resources[id])
                .join(", ");
            resourcesElement.textContent = resourceNames || "None";
        }

        // Update available upgrades
        this.updateUpgradesDisplay(minerTranslations);
    }

    updateUpgradesDisplay(minerTranslations) {
        const upgradesContainer = document.getElementById('miner-upgrades');
        if (upgradesContainer) {
            upgradesContainer.innerHTML = '';
            const availableUpgrades = this.getAvailableUpgrades();
            availableUpgrades.forEach(upgrade => {
                const upgradeButton = document.createElement('button');
                upgradeButton.textContent = `${minerTranslations.upgrades[upgrade.id]} (${upgrade.cost} ore)`;
                upgradeButton.onclick = () => {
                    if (this.buyUpgrade(upgrade.id)) {
                        this.updateDisplay(minerTranslations);
                        updateInventoryDisplay(minerTranslations);
                    }
                };
                upgradesContainer.appendChild(upgradeButton);
            });
        }
    }
}