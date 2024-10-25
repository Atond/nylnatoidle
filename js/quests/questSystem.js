import { combatUI } from '../combat/combatUI.js';
import { character } from '../character.js';
import { professions } from '../main.js';
import { globalInventory } from '../inventory.js';
import { globalTranslationManager } from '../translations/translationManager.js';

class QuestSystem {
    constructor() {
        this.activeQuests = new Map();
        this.completedQuests = new Set();
        this.questProgress = new Map();
        this.progression = null;
        this.loadQuestData();
    }

    async loadQuestData() {
        try {
            const response = await fetch('/data/gameProgression.json');
            this.progression = await response.json();
        } catch (error) {
            console.error('Failed to load quest data:', error);
        }
    }

    createQuestElement(quest, progress) {
        const element = document.createElement('div');
        element.className = 'quest';
        element.innerHTML = `
            <h3>${quest.title}</h3>
            <p>${quest.description}</p>
            <p>Progress: ${progress.monstersKilled}/${quest.monstersToKill}</p>
        `;
        return element;
    }

    startQuest(questId) {
        if (!this.progression || !this.progression.quests) {
            console.error('Quest progression data not loaded.');
            return false;
        }

        const quest = this.progression.quests[questId];
        if (!quest || this.activeQuests.has(questId) || this.completedQuests.has(questId)) {
            return false;
        }

        this.activeQuests.set(questId, quest);
        this.questProgress.set(questId, {
            monstersKilled: 0,
            items: {}
        });

        combatUI.addQuestLog(`Nouvelle quête : ${quest.title}`);
        return true;
    }


    updateQuestDisplay() {
        const questsContainer = document.getElementById('active-quests');
        if (!questsContainer) return;
    
        questsContainer.innerHTML = '';
    
        this.activeQuests.forEach((quest, questId) => {
            const progress = this.questProgress.get(questId);
            const questElement = document.createElement('div');
            questElement.className = 'quest-item p-4 bg-gray-50 rounded-lg mb-2';
            
            let progressText = '';
            if (quest.requirements.monstersKilled) {
                Object.entries(quest.requirements.monstersKilled).forEach(([monsterId, required]) => {
                    if (monsterId !== 'zone') {
                        const current = (progress?.monstersKilled?.[monsterId] || 0);
                        progressText += `${current}/${required} ${globalTranslationManager.translate(`monsters.${monsterId}`)} tués`;
                    }
                });
            }
            
            questElement.innerHTML = `
                <h3 class="font-medium text-lg mb-2">${quest.title}</h3>
                <p class="text-gray-600 mb-2">${quest.description}</p>
                <div class="progress-bar bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div class="bg-blue-500 h-full" style="width: ${this.calculateQuestProgress(questId)}%"></div>
                </div>
                <p class="text-sm text-gray-500 mt-1">${progressText}</p>
            `;
            
            questsContainer.appendChild(questElement);
        });
    }

    calculateQuestProgress(questId) {
        const quest = this.activeQuests.get(questId);
        const progress = this.questProgress.get(questId);
        if (!quest || !progress) return 0;

        let totalRequired = 0;
        let totalCompleted = 0;

        if (quest.requirements.monstersKilled) {
            Object.entries(quest.requirements.monstersKilled).forEach(([monsterId, required]) => {
                if (monsterId !== 'zone') {
                    totalRequired += required;
                    totalCompleted += (progress.monstersKilled?.[monsterId] || 0);
                }
            });
        }

        return totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 0;
    }

    updateQuestProgress(questId, type, data) {
        if (!this.activeQuests.has(questId)) return;

        const quest = this.activeQuests.get(questId);
        const progress = this.questProgress.get(questId);

        switch (type) {
            case 'monsterKill':
                const { monsterId, zoneId } = data;
                if (quest.requirements.monstersKilled?.[monsterId]) {
                    const requiredZone = quest.requirements.monstersKilled.zone;
                    if (!requiredZone || requiredZone === zoneId) {
                        progress.monstersKilled[monsterId] = 
                            (progress.monstersKilled[monsterId] || 0) + 1;
                    }
                }
                break;

            case 'itemCollect':
                const { itemId, quantity } = data;
                if (quest.requirements.items?.[itemId]) {
                    progress.items[itemId] = (progress.items[itemId] || 0) + quantity;
                }
                break;
        }

        this.checkQuestCompletion(questId);
    }

    checkQuestCompletion(questId) {
        const quest = this.activeQuests.get(questId);
        const progress = this.questProgress.get(questId);

        let completed = true;

        // Vérifier les monstres tués
        if (quest.requirements.monstersKilled) {
            for (const [monsterId, required] of Object.entries(quest.requirements.monstersKilled)) {
                if (monsterId !== 'zone' && (progress.monstersKilled[monsterId] || 0) < required) {
                    completed = false;
                }
            }
        }

        // Vérifier les objets collectés
        if (quest.requirements.items) {
            for (const [itemId, required] of Object.entries(quest.requirements.items)) {
                if ((progress.items[itemId] || 0) < required) {
                    completed = false;
                }
            }
        }

        if (completed) {
            this.completeQuest(questId);
        }
    }

    completeQuest(questId) {
        const quest = this.activeQuests.get(questId);
        
        // Distribuer les récompenses
        if (quest.rewards) {
            if (quest.rewards.experience) {
                setCharacterLevel(getCharacterLevel() + quest.rewards.experience);
            }

            if (quest.rewards.items) {
                quest.rewards.items.forEach(item => {
                    globalInventory.addItem(item.id, item.quantity);
                });
            }

            if (quest.rewards.professionExp) {
                Object.entries(quest.rewards.professionExp).forEach(([profession, exp]) => {
                    professions[profession].addExperience(exp);
                });
            }

            if (quest.rewards.unlocks) {
                Object.entries(quest.rewards.unlocks).forEach(([type, value]) => {
                    this.handleUnlock(type, value);
                });
            }
        }

        this.activeQuests.delete(questId);
        this.completedQuests.add(questId);
        this.questProgress.delete(questId);

        combatUI.addQuestLog(`Quête terminée : ${quest.title}`);
    }

    isQuestCompleted(questId) {
        return this.completedQuests.has(questId);
    }

    checkAutoStartQuests() {
        if (!this.progression || !this.progression.quests) return;
        
        Object.entries(this.progression.quests)
            .filter(([id, quest]) => quest.autoStart && !this.completedQuests.has(id))
            .forEach(([id]) => this.startQuest(id));
    }

    handleUnlock(type, value) {
        switch (type) {
            case 'minerUpgrade':
                professions.miner.unlockUpgrade(value);
                break;
            case 'title':
                player.addTitle(value);
                break;
            // Ajouter d'autres types de déblocages selon les besoins
        }
    }
}

export const questSystem = new QuestSystem();