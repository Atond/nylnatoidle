import { BaseProfession } from './baseprofession.js';
import { globalInventory } from '../inventory.js';
import { updateInventoryDisplay } from '../inventoryDisplay.js';

export class Miner extends BaseProfession {
    constructor(resourceIds) {
        super('miner', resourceIds);
        this.miningPower = 1;
        this.autoMinerCount = 0;
        this.progression = [
            {
                level: 1,
                expRequired: 0,
                resources: ['minerai111'],
                upgrades: [
                    { id: 'betterPickaxe1', name: 'Better Pickaxe I', cost: { minerai111: 10 }, effect: () => { this.miningPower += 1; } },
                ]
            },
            {
                level: 2,
                expRequired: 100,
                resources: ['minerai111', 'minerai112'],
                upgrades: [
                    { id: 'betterPickaxe2', name: 'Better Pickaxe II', cost: { minerai111: 20, minerai112: 5 }, effect: () => { this.miningPower += 2; } },
                    { id: 'autoMiner1', name: 'Auto Miner I', cost: { minerai111: 50, minerai112: 20 }, effect: () => { this.autoMinerCount += 1; } },
                ]
            },
            {
                level: 3,
                expRequired: 300,
                resources: ['minerai111', 'minerai112', 'minerai113'],
                upgrades: [
                    { id: 'efficientTechnique1', name: 'Efficient Technique I', cost: { minerai112: 30, minerai113: 10 }, effect: () => { this.miningPower *= 1.5; } },
                    { id: 'autoMiner2', name: 'Auto Miner II', cost: { minerai112: 80, minerai113: 40 }, effect: () => { this.autoMinerCount += 2; } },
                ]
            },
            {
                level: 4,
                expRequired: 600,
                resources: ['minerai111', 'minerai112', 'minerai113', 'minerai114'],
                upgrades: [
                    { id: 'betterPickaxe3', name: 'Better Pickaxe III', cost: { minerai113: 40, minerai114: 20 }, effect: () => { this.miningPower += 5; } },
                ]
            },
            // Ajoutez plus de niveaux ici...
        ];
        this.unlockedUpgrades = new Set();
    }

    mine(translations) {
        const currentProgression = this.getCurrentProgression();
        const resource = this.getRandomResource(currentProgression.resources);
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

    checkLevelUp() {
        const nextLevel = this.progression.find(p => p.level === this.level + 1);
        if (nextLevel && this.exp >= nextLevel.expRequired) {
            this.level += 1;
            this.updateLevelDisplay();
            // Vous pouvez ajouter ici une notification ou un effet visuel pour le passage de niveau
        }
    }

    getCurrentProgression() {
        return this.progression.filter(p => p.level <= this.level).pop();
    }

    getNextLevelProgression() {
        return this.progression.find(p => p.level === this.level + 1);
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
        super.updateExpDisplay();
        super.updateLevelDisplay();
        
        const minerTranslations = translations.miner;
        
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

        // Update experience and level display
        const expElement = document.getElementById('miner-exp');
        const nextLevel = this.getNextLevelProgression();
        if (expElement && nextLevel) {
            expElement.textContent = `${this.exp} / ${nextLevel.expRequired}`;
        }

        // Update resources display
        this.updateResourcesDisplay(translations);

        // Update available upgrades
        this.updateUpgradesDisplay(translations);
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