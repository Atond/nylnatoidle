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

    canStartQuest(questId) {
        const quest = this.progression?.quests[questId];
        if (!quest) return false;

        // Vérifier si la quête n'est pas déjà active ou complétée
        if (this.activeQuests.has(questId) || this.completedQuests.has(questId)) {
            return false;
        }

        const conditions = quest.unlockConditions || { minLevel: 1, requiredQuests: [] };

        // Vérifier le niveau minimum
        if (character.level < conditions.minLevel) {
            return false;
        }

        // Vérifier les quêtes requises
        if (conditions.requiredQuests) {
            for (const requiredQuest of conditions.requiredQuests) {
                if (!this.isQuestCompleted(requiredQuest)) {
                    return false;
                }
            }
        }

        return true;
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
            questElement.className = 'quest-item';
    
            let progressText = '';
            let progressPercentage = 0;
    
            if (quest.requirements.monstersKilled) {
                Object.entries(quest.requirements.monstersKilled).forEach(([monsterId, required]) => {
                    if (monsterId !== 'zone') {
                        const current = progress?.monstersKilled?.[monsterId] || 0;
                        progressText = `${current}/${required}`;
                        progressPercentage = (current / required) * 100;
                    }
                });
            }
    
            questElement.innerHTML = `
                <h3>${quest.title}</h3>
                <p>${quest.description}</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
                <p class="progress-text">${progressText}</p>
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
        let progress = this.questProgress.get(questId);
    
        // Initialiser la progression si elle n'existe pas
        if (!progress) {
            progress = {
                monstersKilled: {},
                items: {}
            };
            this.questProgress.set(questId, progress);
        }
    
        // S'assurer que monstersKilled existe
        if (!progress.monstersKilled) {
            progress.monstersKilled = {};
        }
    
        switch (type) {
            case 'monsterKill':
                const { monsterId, zoneId } = data;
                if (quest.requirements.monstersKilled) {
                    const requiredZone = quest.requirements.monstersKilled.zone;
                    if (!requiredZone || requiredZone === zoneId) {
                        progress.monstersKilled[monsterId] = (progress.monstersKilled[monsterId] || 0) + 1;
                        console.log(`Quest progress for ${questId}: ${monsterId} killed in ${zoneId}, count: ${progress.monstersKilled[monsterId]}`);
                        this.updateQuestDisplay();
                        this.checkQuestCompletion(questId);
                    }
                }
                break;
    
            case 'itemCollect':
                const { itemId, quantity } = data;
                if (quest.requirements.items) {
                    progress.items[itemId] = (progress.items[itemId] || 0) + quantity;
                    this.updateQuestDisplay();
                    this.checkQuestCompletion(questId);
                }
                break;
        }
    }

    checkQuestCompletion(questId) {
        const quest = this.activeQuests.get(questId);
        const progress = this.questProgress.get(questId);
    
        if (!quest || !progress) return;
    
        let completed = true;
    
        // Vérifier les monstres tués
        if (quest.requirements.monstersKilled) {
            Object.entries(quest.requirements.monstersKilled).forEach(([monsterId, required]) => {
                if (monsterId !== 'zone') {
                    const currentKills = progress.monstersKilled[monsterId] || 0;
                    if (currentKills < required) {
                        completed = false;
                    }
                }
            });
        }
    
        // Vérifier les objets collectés
        if (quest.requirements.items) {
            Object.entries(quest.requirements.items).forEach(([itemId, required]) => {
                const currentAmount = progress.items[itemId] || 0;
                if (currentAmount < required) {
                    completed = false;
                }
            });
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
                character.addExperience(quest.rewards.experience);
            }
    
            if (quest.rewards.items) {
                quest.rewards.items.forEach(item => {
                    globalInventory.addItem(item.id, item.quantity);
                });
            }
        }
    
        // Gérer les déblocages
        if (quest.unlocks?.profession) {
            this.unlockProfession(quest.unlocks.profession);
        }
    
        this.activeQuests.delete(questId);
        this.completedQuests.add(questId);
        this.questProgress.delete(questId);
    
        // Émettre un événement de complétion avec plus de détails
        const questCompletedEvent = new CustomEvent('questCompleted', {
            detail: {
                questId: questId,
                quest: quest
            }
        });
        window.dispatchEvent(questCompletedEvent);
    
        // Afficher le message de complétion
        combatUI.addQuestLog(`Quête terminée : ${quest.title}`);
        
        // Pour les quêtes spécifiques qui débloquent des fonctionnalités
        if (questId === 'beginnerQuest') {
            combatUI.addQuestLog('Vous avez débloqué les métiers !');
        }
    }

    isQuestCompleted(questId) {
        return this.completedQuests.has(questId);
    }

    checkAutoStartQuests() {
        if (!this.progression || !this.progression.quests) return;
        
        Object.entries(this.progression.quests)
            .filter(([id, quest]) => quest.autoStart && this.canStartQuest(id))
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