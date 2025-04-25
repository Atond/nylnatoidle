import { gameStore } from '../store/state/GameStore';

class QuestSystem {
    constructor() {
        this.activeQuests = new Map();
        this.completedQuests = new Set();
        this.questProgress = new Map();
        this.progression = null;
        
        // Load quest data when the system is created
        this.loadQuestData();
    }

    async loadQuestData() {
        try {
            const response = await fetch('/data/gameProgression.json');
            this.progression = await response.json();
            console.log('Quest data loaded successfully');
            
            // Initialize quest state and start beginnerQuest
            this.initializeQuestSystem();
        } catch (error) {
            console.error('Failed to load quest data:', error);
        }
    }
    
    initializeQuestSystem() {
        // Initialize beginnerQuest directly - this guarantees it's active
        if (this.progression && this.progression.quests && this.progression.quests.beginnerQuest) {
            const beginnerQuest = this.progression.quests.beginnerQuest;
            
            // Only start if not already active or completed
            if (!this.activeQuests.has('beginnerQuest') && !this.completedQuests.has('beginnerQuest')) {
                console.log('Starting beginnerQuest directly');
                
                // Set the quest as active
                this.activeQuests.set('beginnerQuest', beginnerQuest);
                
                // Initialize progress tracking
                this.questProgress.set('beginnerQuest', {
                    monstersKilled: {
                        goblin: 0  // Initialize explicitly with goblin: 0
                    },
                    items: {}
                });
                
                // Add to game log
                this.addToGameLog(`Nouvelle quête: ${beginnerQuest.title}`);
            }
        }
        
        // Update the store with our quest state
        this.syncQuestsToStore();
    }
    
    addToGameLog(message) {
        // Add message to combat log
        gameStore.dispatch({
            type: 'COMBAT_LOG_ADD',
            paths: ['combat'],
            reducer: (state) => {
                const newState = structuredClone(state);
                if (!newState.combat) newState.combat = {};
                if (!newState.combat.logs) newState.combat.logs = [];
                newState.combat.logs.push(message);
                return newState;
            }
        });
    }
    
    // Sync quest data to the game store
    syncQuestsToStore() {
        gameStore.dispatch({
            type: 'quests/update',
            paths: ['quests'],
            reducer: (state) => {
                const newState = structuredClone(state);
                if (!newState.quests) newState.quests = {};
                
                // Store active quests, completedQuests and questProgress in the store
                newState.quests.activeQuests = this.activeQuests;
                newState.quests.completedQuests = this.completedQuests;
                newState.quests.questProgress = this.questProgress;
                
                return newState;
            }
        });
        
        console.log('Quest state updated in store:', 
            Array.from(this.activeQuests.keys()),
            'Progress:', 
            this.questProgress.get('beginnerQuest')?.monstersKilled?.goblin || 0);
    }
    
    // Called when a monster is killed
    handleMonsterKill(monsterId, zoneId) {
        console.log(`Quest system handling monster kill: ${monsterId} in zone ${zoneId}`);
        
        // Process all active quests
        this.activeQuests.forEach((quest, questId) => {
            // Check if this quest tracks monster kills
            if (quest.requirements && quest.requirements.monstersKilled) {
                const requiredMonsters = quest.requirements.monstersKilled;
                const requiredZone = requiredMonsters.zone;
                
                // Skip if zone doesn't match
                if (requiredZone && requiredZone !== zoneId) {
                    console.log(`Zone mismatch for quest ${questId}: Required ${requiredZone}, got ${zoneId}`);
                    return;
                }
                
                // Check if this monster type counts for the quest
                Object.keys(requiredMonsters).forEach(requiredMonsterId => {
                    if (requiredMonsterId !== 'zone' && requiredMonsterId === monsterId) {
                        // This monster counts! Update progress
                        const progress = this.questProgress.get(questId);
                        
                        if (!progress.monstersKilled) {
                            progress.monstersKilled = {};
                        }
                        
                        // Increment monster kill count
                        progress.monstersKilled[monsterId] = (progress.monstersKilled[monsterId] || 0) + 1;
                        
                        const currentKills = progress.monstersKilled[monsterId];
                        const requiredKills = requiredMonsters[monsterId];
                        
                        console.log(`Updated quest ${questId}: ${currentKills}/${requiredKills} ${monsterId}s killed`);
                        
                        // Add progress message to game log
                        this.addToGameLog(`${quest.title}: ${currentKills}/${requiredKills} ${monsterId}s`);
                        
                        // Check if quest is complete
                        if (currentKills >= requiredKills) {
                            console.log(`Quest ${questId} requirements met!`);
                            this.completeQuest(questId);
                        } else {
                            // Just update the store with new progress
                            this.syncQuestsToStore();
                        }
                    }
                });
            }
        });
    }
    
    // Complete a quest
    completeQuest(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return;
        
        console.log(`Completing quest: ${questId}`);
        
        // Handle quest rewards/unlocks
        if (quest.unlocks) {
            // Handle profession unlock
            if (quest.unlocks.profession) {
                const profession = quest.unlocks.profession;
                console.log(`Unlocking profession: ${profession}`);
                
                // Update professions in store
                gameStore.dispatch({
                    type: 'professions/unlock',
                    paths: ['professions'],
                    reducer: (state) => {
                        const newState = structuredClone(state);
                        if (!newState.professions) newState.professions = {};
                        if (!newState.professions.slots) newState.professions.slots = {};
                        if (!newState.professions.slots.unlocked) newState.professions.slots.unlocked = [];
                        
                        if (!newState.professions.slots.unlocked.includes(profession)) {
                            newState.professions.slots.unlocked.push(profession);
                        }
                        
                        return newState;
                    }
                });
                
                // Show professions tab if it exists
                const profTab = document.querySelector('[data-tab="professions"]');
                if (profTab) profTab.style.display = 'block';
            }
            
            // Handle zone unlocks
            if (quest.unlocks.unlockedZones) {
                quest.unlocks.unlockedZones.forEach(zoneId => {
                    console.log(`Unlocking zone: ${zoneId}`);
                    
                    gameStore.dispatch({
                        type: 'zones/unlock',
                        paths: ['combat.zones'],
                        reducer: (state) => {
                            const newState = structuredClone(state);
                            if (!newState.combat) newState.combat = {};
                            if (!newState.combat.zones) newState.combat.zones = {};
                            if (!newState.combat.zones.unlockedZones) newState.combat.zones.unlockedZones = {};
                            
                            newState.combat.zones.unlockedZones[zoneId] = true;
                            return newState;
                        }
                    });
                });
            }
        }
        
        // Mark quest as completed and remove from active
        this.completedQuests.add(questId);
        this.activeQuests.delete(questId);
        this.questProgress.delete(questId);
        
        // Add completion message
        this.addToGameLog(`Quête terminée: ${quest.title}`);
        
        if (questId === 'beginnerQuest') {
            this.addToGameLog('Vous avez débloqué le métier de mineur !');
        }
        
        // Update store with quest state
        this.syncQuestsToStore();
        
        // Start any new quests that should auto-start
        this.checkForAutoStartQuests();
    }
    
    // Check for quests that should auto-start
    checkForAutoStartQuests() {
        if (!this.progression || !this.progression.quests) return;
        
        Object.entries(this.progression.quests).forEach(([questId, quest]) => {
            // Skip if already active or completed
            if (this.activeQuests.has(questId) || this.completedQuests.has(questId)) {
                return;
            }
            
            // Check if quest should auto-start
            if (quest.autoStart) {
                // Check unlock conditions
                let canStart = true;
                
                if (quest.unlockConditions && quest.unlockConditions.requiredQuests) {
                    // Check if all required quests are completed
                    for (const reqQuest of quest.unlockConditions.requiredQuests) {
                        if (!this.completedQuests.has(reqQuest)) {
                            canStart = false;
                            break;
                        }
                    }
                }
                
                // Start quest if conditions are met
                if (canStart) {
                    console.log(`Auto-starting quest: ${questId}`);
                    
                    // Add quest to active quests
                    this.activeQuests.set(questId, quest);
                    
                    // Initialize progress
                    this.questProgress.set(questId, {
                        monstersKilled: {},
                        items: {}
                    });
                    
                    // Add message to log
                    this.addToGameLog(`Nouvelle quête: ${quest.title}`);
                }
            }
        });
        
        // Update store with new quests
        this.syncQuestsToStore();
    }
    
    // Debug method to check quest state
    debugQuestState() {
        console.log('--- Quest System Debug ---');
        console.log('Active quests:', Array.from(this.activeQuests.keys()));
        console.log('Completed quests:', Array.from(this.completedQuests));
        
        if (this.activeQuests.has('beginnerQuest')) {
            const progress = this.questProgress.get('beginnerQuest');
            console.log('beginnerQuest progress:', progress);
        }
    }
}

// Create and export the quest system
export const questSystem = new QuestSystem();