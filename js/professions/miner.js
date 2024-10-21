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
            // Ajoutez d'autres niveaux ici...
        ];
        this.unlockedUpgrades = new Set();
    }

    mine(translations) {
        const currentProgression = this.getCurrentProgression();
        const resource = this.getRandomResource(currentProgression.resources);
        if (resource) {
            const amount = Math.floor(this.miningPower);
            globalInventory.addItem(resource, amount);
            this.exp += amount;
            this.checkLevelUp();
            this.updateResourcesDisplay(translations);
            updateInventoryDisplay(translations);
            return amount;
        }
        return 0;
    }

    autoMine(translations) {
        let totalMined = 0;
        for (let i = 0; i < this.autoMinerCount; i++) {
            totalMined += this.mine(translations);
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

    updateDisplay(translations) {
        if (!translations || !translations.miner) {
            console.log("Traductions non disponibles, mise à jour de l'affichage reportée.");
            return;
        }

        const minerTranslations = translations.miner;

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

    updateResourcesDisplay(translations) {
        if (!translations || !translations.miner) return;
        const minerTranslations = translations.miner;
        const currentProgression = this.getCurrentProgression();
        const resourcesElement = document.getElementById('miner-resources');
        if (resourcesElement) {
            const resourceNames = currentProgression.resources
                .map(id => minerTranslations.resources[id])
                .join(", ");
            resourcesElement.textContent = resourceNames || "None";
        }
    }

    updateUpgradesDisplay(translations) {
        const minerTranslations = translations.miner;
        const upgradesContainer = document.getElementById('miner-upgrades');
        if (upgradesContainer) {
            upgradesContainer.innerHTML = '';
            const availableUpgrades = this.getAvailableUpgrades();
            availableUpgrades.forEach(upgrade => {
                const upgradeButton = document.createElement('button');
                const costText = Object.entries(upgrade.cost)
                    .map(([resourceId, cost]) => `${minerTranslations.resources[resourceId]}: ${cost}`)
                    .join(', ');
                upgradeButton.textContent = `${minerTranslations.upgrades[upgrade.id]} (${costText})`;
                upgradeButton.onclick = () => {
                    if (this.buyUpgrade(upgrade.id)) {
                        this.updateDisplay(translations);
                        updateInventoryDisplay(translations);
                    } else {
                        console.log("Not enough resources");
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
            // Vous pouvez ajouter ici une notification ou un effet visuel pour le passage de niveau
        }
    }
}