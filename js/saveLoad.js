import { getCharacterLevel, setCharacterLevel, updateCharacterLevelDisplay } from './character.js';
import { professions, updateDisplays } from './main.js';
import { updateInventoryDisplay } from './inventoryDisplay.js';
import { globalInventory } from './inventory.js';
import { globalTranslationManager } from './translations/translationManager.js';
import { combatSystem } from './combat/combatSystem.js';
import { questSystem } from './quests/questSystem.js';
import { combatUI } from './combat/combatUI.js';

export function saveGame() {
    const gameState = {
        // Informations du personnage
        character: {
            level: getCharacterLevel(),
            experience: character.experience,
            name: document.getElementById('character-name').innerText,
            stats: {
                maxHp: combatSystem.player.maxHp,
                currentHp: combatSystem.player.currentHp,
                baseAttack: combatSystem.player.baseAttack,
                baseDefense: combatSystem.player.baseDefense
            },
            equipment: combatSystem.player.equipment
        },
        
        // Inventaire
        inventory: Array.from(globalInventory.items.entries()),
        
        // Progression des métiers
        professions: Object.entries(professions).reduce((acc, [name, profession]) => {
            acc[name] = {
                exp: profession.exp,
                level: profession.level,
                unlockedUpgrades: Array.from(profession.unlockedUpgrades || []),
                // Sauvegarder d'autres propriétés spécifiques aux métiers
                miningPower: profession.miningPower,
                autoMinerCount: profession.autoMinerCount
            };
            return acc;
        }, {}),
        
        // Progression du combat
        combat: {
            currentWorld: combatSystem.currentWorld?.id,
            currentZone: combatSystem.currentZone?.id,
            monstersDefeated: combatSystem.monstersDefeated,
            inCombat: combatSystem.inCombat,
            autoCombatEnabled: combatSystem.autoCombatEnabled,
            unlockedWorlds: combatSystem.unlockedWorlds,
            unlockedZones: combatSystem.unlockedZones,
            completedZones: combatSystem.completedZones,
            savedProgress: Array.from(combatSystem.savedProgress.entries())
        },
        
        // Progression des quêtes
        quests: {
            active: Array.from(questSystem.activeQuests.entries()).map(([questId, quest]) => ({
                id: questId,
                progress: questSystem.questProgress.get(questId)
            })),
            completed: Array.from(questSystem.completedQuests),
            progress: Array.from(questSystem.questProgress.entries()).map(([questId, progress]) => ({
                questId,
                progress: {
                    monstersKilled: progress.monstersKilled || {},
                    items: progress.items || {}
                }
            }))
        }
    };
    
    localStorage.setItem('idleRPGSave', JSON.stringify(gameState));
    console.log('Game saved:', gameState);
}

export function loadGame() {
    const savedGame = localStorage.getItem('idleRPGSave');
    if (!savedGame) return;
    
    try {
        const gameState = JSON.parse(savedGame);
        
        // Charger les informations du personnage
        if (gameState.character) {
            if (gameState.character.experience !== undefined) {
                character.experience = gameState.character.experience;
            }

            setCharacterLevel(gameState.character.level);
            document.getElementById('character-name').innerText = 
            gameState.character.name || globalTranslationManager.translate('ui.unknownCharacter');
            
            // Charger les stats
            if (gameState.character.stats) {
                Object.assign(combatSystem.player, gameState.character.stats);
            }
            
            // Charger l'équipement
            if (gameState.character.equipment) {
                combatSystem.player.equipment = gameState.character.equipment;
            }
        }
        
        // Charger l'inventaire
        if (gameState.inventory) {
            globalInventory.items.clear();
            for (const [itemId, quantity] of gameState.inventory) {
                globalInventory.addItem(itemId, quantity);
            }
        }
        
        // Charger la progression des métiers
        if (gameState.professions) {
            Object.entries(gameState.professions).forEach(([name, data]) => {
                if (professions[name]) {
                    professions[name].exp = data.exp;
                    professions[name].level = data.level;
                    professions[name].unlockedUpgrades = new Set(data.unlockedUpgrades);
                    if (data.miningPower) professions[name].miningPower = data.miningPower;
                    if (data.autoMinerCount) professions[name].autoMinerCount = data.autoMinerCount;
                }
            });
        }
        
        // Charger la progression du combat
        if (gameState.combat) {
            combatSystem.monstersDefeated = gameState.combat.monstersDefeated || 0;

            if (gameState.combat.savedProgress) {
                combatSystem.savedProgress = new Map(gameState.combat.savedProgress);
            }
            
            // Restaurer les zones et mondes débloqués
            if (gameState.combat.unlockedWorlds) {
                combatSystem.unlockedWorlds = gameState.combat.unlockedWorlds;
            }
            if (gameState.combat.unlockedZones) {
                combatSystem.unlockedZones = gameState.combat.unlockedZones;
            }
            if (gameState.combat.completedZones) {
                combatSystem.completedZones = gameState.combat.completedZones;
            }

            // Initialiser la zone après avoir restauré toutes les données
            if (gameState.combat.currentWorld && gameState.combat.currentZone) {
                // Utilisons setTimeout pour s'assurer que tout est bien initialisé
                setTimeout(() => {
                    combatSystem.initZone(gameState.combat.currentZone, gameState.combat.currentWorld);
                    combatSystem.inCombat = gameState.combat.inCombat || false;
                    combatSystem.autoCombatEnabled = gameState.combat.autoCombatEnabled || false;
                    if (combatSystem.autoCombatEnabled) {
                        combatSystem.toggleAutoCombat();
                    }
                    combatUI.updateUI();
                }, 100);
            }
        }
        
        // Charger les quêtes
        if (gameState.quests) {
            // Restaurer les quêtes complétées
            questSystem.completedQuests = new Set(gameState.quests.completed);
            
            // Restaurer les quêtes actives et leur progression
            questSystem.activeQuests.clear();
            questSystem.questProgress.clear();
            
            gameState.quests.active.forEach(questData => {
                const quest = questSystem.progression.quests[questData.id];
                if (quest) {
                    questSystem.activeQuests.set(questData.id, quest);
                }
            });
            
            // Restaurer la progression des quêtes
            gameState.quests.progress.forEach(({questId, progress}) => {
                questSystem.questProgress.set(questId, {
                    monstersKilled: progress.monstersKilled || {},
                    items: progress.items || {}
                });
            });
            
            // Démarrer automatiquement les quêtes qui devraient l'être
            questSystem.checkAutoStartQuests();
        }
        
        // Mettre à jour tous les affichages
        updateCharacterLevelDisplay();
        updateInventoryDisplay();
        updateDisplays();
        questSystem.updateQuestDisplay();
        
        // Mettre à jour l'expérience
        character.updateExperienceDisplay();
        
        console.log('Game loaded successfully');
    } catch (error) {
        console.error('Error loading game:', error);
    }
}