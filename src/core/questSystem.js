import { gameStore } from '../store/state/GameStore';

class QuestSystem {
    constructor() {
        this.activeQuests = new Map();
        this.completedQuests = new Set();
        this.questProgress = new Map();
        this.progression = null;
        
        // Initialiser immédiatement les données des quêtes
        this.loadQuestData().then(() => {
            console.log('Quest data loaded successfully');
            
            // Initialize quest data in the game store
            this.initializeQuestStateInStore();
        });
    }

    async loadQuestData() {
        try {
            const response = await fetch('/data/gameProgression.json');
            this.progression = await response.json();
            console.log('Quest data loaded successfully, available quests:', Object.keys(this.progression.quests).join(", "));
            return this.progression;
        } catch (error) {
            console.error('Failed to load quest data:', error);
            return null;
        }
    }

    initializeQuestStateInStore() {
        gameStore.dispatch({
            type: 'quests/initialize',
            paths: ['quests'],
            reducer: (state) => {
                const newState = structuredClone(state);
                if (!newState.quests) {
                    newState.quests = {
                        activeQuests: new Map(),
                        completedQuests: new Set(),
                        questProgress: new Map()
                    };
                }
                
                newState.quests.activeQuests = this.activeQuests;
                newState.quests.completedQuests = this.completedQuests;
                newState.quests.questProgress = this.questProgress;
                
                return newState;
            }
        });
        
        // Start checking for auto-start quests
        setTimeout(() => {
            this.checkAutoStartQuests();
        }, 500);
    }

    canStartQuest(questId) {
        const quest = this.progression?.quests[questId];
        if (!quest) {
            console.log(`Quest ${questId} not found in progression data`);
            return false;
        }

        // Vérifier si la quête n'est pas déjà active ou complétée
        if (this.activeQuests.has(questId) || this.completedQuests.has(questId)) {
            console.log(`Quest ${questId} is already active or completed`);
            return false;
        }

        // Pas de conditions de déblocage spécifiées, la quête peut démarrer
        if (!quest.unlockConditions) {
            return true;
        }

        // Vérifier les quêtes requises
        if (quest.unlockConditions.requiredQuests && quest.unlockConditions.requiredQuests.length > 0) {
            for (const requiredQuest of quest.unlockConditions.requiredQuests) {
                if (!this.isQuestCompleted(requiredQuest)) {
                    console.log(`Required quest ${requiredQuest} not completed for ${questId}`);
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
        if (!quest) {
            console.error(`Quest ${questId} not found in progression data`);
            return false;
        }
        
        if (this.activeQuests.has(questId) || this.completedQuests.has(questId)) {
            console.log(`Quest ${questId} is already active or completed`);
            return false;
        }

        // Initialize proper structure for quest progress
        this.activeQuests.set(questId, quest);
        this.questProgress.set(questId, {
            monstersKilled: {}, // Object to track different monster types
            items: {}          // Object to track different item types
        });
        
        console.log(`Started quest: ${questId} - ${quest.title}, active quests: ${this.activeQuests.size}`);
        
        // Update store with new quest data
        this.syncQuestDataToStore();
        
        // Add to combat log
        this.addToCombatLog(`Nouvelle quête : ${quest.title}`);
        
        return true;
    }

    syncQuestDataToStore() {
        gameStore.dispatch({
            type: 'quests/update',
            paths: ['quests'],
            reducer: (state) => {
                const newState = structuredClone(state);
                if (!newState.quests) {
                    newState.quests = {};
                }
                
                // Properly assign Map objects directly
                newState.quests.activeQuests = this.activeQuests; 
                newState.quests.completedQuests = this.completedQuests;
                newState.quests.questProgress = this.questProgress;
                
                return newState;
            }
        });
        
        // Force sync active quests
        const activeQuestArray = Array.from(this.activeQuests.keys());
        console.log('Synced quests to store, active quests:', activeQuestArray.join(', '));
    }

    addToCombatLog(message) {
        // Send message to combat log through store
        gameStore.dispatch({
            type: 'COMBAT_LOG_ADD',
            paths: ['combat'],
            reducer: (state) => {
                const newState = structuredClone(state);
                if (!newState.combat) {
                    newState.combat = {};
                }
                if (!newState.combat.logs) {
                    newState.combat.logs = [];
                }
                newState.combat.logs.push(message);
                return newState;
            }
        });
    }

    updateQuestProgress(questId, type, data) {
        // Special case for updating all active quests
        if (questId === 'all') {
            console.log('Updating all quests, active quests count:', this.activeQuests.size);
            this.activeQuests.forEach((quest, id) => {
                this.updateQuestProgress(id, type, data);
            });
            return;
        }
    
        if (!this.activeQuests.has(questId)) {
            console.log(`Quest ${questId} not active, cannot update progress`);
            return;
        }
    
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
    
        let updated = false;
        
        switch (type) {
            case 'monsterKill':
                const { monsterId, zoneId } = data;
                if (quest.requirements && quest.requirements.monstersKilled) {
                    const requiredZone = quest.requirements.monstersKilled.zone;
                    const requiredMonsterId = Object.keys(quest.requirements.monstersKilled)
                        .find(key => key !== 'zone' && key === monsterId);
                    
                    if (requiredMonsterId && (!requiredZone || requiredZone === zoneId)) {
                        progress.monstersKilled[monsterId] = (progress.monstersKilled[monsterId] || 0) + 1;
                        console.log(`Quest progress for ${questId}: ${monsterId} killed in ${zoneId}, count: ${progress.monstersKilled[monsterId]}`);
                        updated = true;
                        
                        // Immediately add to combat log
                        this.addToCombatLog(`Quête "${quest.title}": ${progress.monstersKilled[monsterId]}/${quest.requirements.monstersKilled[monsterId]} ${monsterId}s`);
                    } else {
                        console.log(`Monster ${monsterId} in zone ${zoneId} not required for quest ${questId}`);
                    }
                }
                break;
    
            case 'itemCollect':
                const { itemId, quantity } = data;
                if (quest.requirements && quest.requirements.items) {
                    const requiredItem = Object.keys(quest.requirements.items)
                        .find(key => key === itemId);
                        
                    if (requiredItem) {
                        progress.items[itemId] = (progress.items[itemId] || 0) + quantity;
                        console.log(`Quest progress for ${questId}: collected ${quantity} ${itemId}, total: ${progress.items[itemId]}`);
                        updated = true;
                        
                        // Immediately add to combat log
                        this.addToCombatLog(`Quête "${quest.title}": ${progress.items[itemId]}/${quest.requirements.items[itemId]} ${itemId}s`);
                    }
                }
                break;
        }
        
        if (updated) {
            // Sync with game store
            this.syncQuestDataToStore();
            
            // Check if the quest is complete
            this.checkQuestCompletion(questId);
        }
    }

    checkQuestCompletion(questId) {
        const quest = this.activeQuests.get(questId);
        const progress = this.questProgress.get(questId);
    
        if (!quest || !progress) return;
    
        let completed = true;
    
        // Vérifier les monstres tués
        if (quest.requirements && quest.requirements.monstersKilled) {
            Object.entries(quest.requirements.monstersKilled).forEach(([monsterId, required]) => {
                if (monsterId !== 'zone') {
                    const currentKills = progress.monstersKilled[monsterId] || 0;
                    console.log(`Checking completion for ${questId}: ${monsterId} - ${currentKills}/${required}`);
                    if (currentKills < required) {
                        completed = false;
                    }
                }
            });
        }
    
        // Vérifier les objets collectés
        if (quest.requirements && quest.requirements.items) {
            Object.entries(quest.requirements.items).forEach(([itemId, required]) => {
                const currentAmount = progress.items[itemId] || 0;
                if (currentAmount < required) {
                    completed = false;
                }
            });
        }
    
        if (completed) {
            console.log(`Quest ${questId} is completed!`);
            this.completeQuest(questId);
        }
    }

    completeQuest(questId) {
        try {
            const quest = this.activeQuests.get(questId);
            if (!quest) {
                console.error('Quest not found:', questId);
                return;
            }
    
            // Logs pour le débogage
            console.log('Completing quest:', quest);
            console.log('Quest unlocks:', quest.unlocks);
    
            // Gérer les déblocages avant les récompenses
            if (quest.unlocks) {
                if (quest.unlocks.profession) {
                    console.log('Unlocking profession:', quest.unlocks.profession);
                    // Using dispatch to unlock profession
                    gameStore.dispatch({
                        type: 'professions/unlock',
                        paths: ['professions'],
                        reducer: (state) => {
                            const newState = structuredClone(state);
                            if (newState.professions && newState.professions.slots) {
                                if (!newState.professions.slots.unlocked.includes(quest.unlocks.profession)) {
                                    newState.professions.slots.unlocked.push(quest.unlocks.profession);
                                }
                            }
                            return newState;
                        }
                    });
                    
                    // Show professions tab
                    const professionsTab = document.querySelector('[data-tab="professions"]');
                    if (professionsTab) {
                        professionsTab.style.display = 'block';
                        professionsTab.classList.add('tab-appear');
                    }
                    
                    // Also enable professions tab
                    const profBtn = document.querySelector('[data-tab-target="professions"]');
                    if (profBtn) {
                        profBtn.classList.remove('disabled');
                        profBtn.removeAttribute('disabled');
                    }
                }
                
                if (quest.unlocks.unlockedZones) {
                    quest.unlocks.unlockedZones.forEach(zoneId => {
                        console.log('Unlocking zone:', zoneId);
                        // Unlock zones through game store
                        gameStore.dispatch({
                            type: 'zones/unlock',
                            paths: ['combat.zones'],
                            reducer: (state) => {
                                const newState = structuredClone(state);
                                if (newState.combat && newState.combat.zones) {
                                    newState.combat.zones.unlockedZones[zoneId] = true;
                                }
                                return newState;
                            }
                        });
                    });
                }
            }
    
            // Mettre à jour l'état des quêtes
            this.activeQuests.delete(questId);
            this.completedQuests.add(questId);
            this.questProgress.delete(questId);
            
            // Add quest completion message
            const completionMessage = `Quête terminée : ${quest.title}`;
            this.addToCombatLog(completionMessage);
            
            // Special messages for specific quests
            if (questId === 'beginnerQuest') {
                this.addToCombatLog('Vous avez débloqué les métiers !');
            }
            
            // Sync with game store
            this.syncQuestDataToStore();
    
            // Vérifier et démarrer les nouvelles quêtes disponibles
            setTimeout(() => {
                this.checkAutoStartQuests();
            }, 500);
    
        } catch (error) {
            console.error('Error completing quest:', questId, error);
        }
    }

    isQuestCompleted(questId) {
        return this.completedQuests.has(questId);
    }

    checkAutoStartQuests() {
        if (!this.progression?.quests) {
            console.log('No quest data available');
            return;
        }
        
        console.log('Checking auto-start quests');
        const autoStartable = Object.entries(this.progression.quests)
            .filter(([id, quest]) => {
                // Should auto-start if:
                // 1. It has autoStart: true
                // 2. It's not already active
                // 3. It's not already completed
                // 4. It meets all unlock conditions (canStartQuest checks this)
                const shouldStart = quest.autoStart && 
                                   !this.activeQuests.has(id) && 
                                   !this.completedQuests.has(id) &&
                                   this.canStartQuest(id);
                                   
                console.log(`Quest ${id} should auto-start:`, shouldStart);
                return shouldStart;
            });
            
        console.log(`Found ${autoStartable.length} quests to auto-start`);
        autoStartable.forEach(([id, quest]) => {
            console.log(`Starting quest: ${id} - ${quest.title}`);
            this.startQuest(id);
        });
    }
    
    // Method to manually trigger quest check (useful for debugging)
    triggerQuestCheck() {
        console.log("Manually triggering quest system check");
        console.log("Active quests:", Array.from(this.activeQuests.keys()));
        console.log("Completed quests:", Array.from(this.completedQuests));
        
        if (this.activeQuests.size === 0) {
            console.log("No active quests! Trying to start beginnerQuest...");
            this.startQuest("beginnerQuest");
        } else {
            this.checkAutoStartQuests();
        }
        
        // Force sync to store
        this.syncQuestDataToStore();
    }
}

export const questSystem = new QuestSystem();