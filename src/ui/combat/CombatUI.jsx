import React, { useState, useEffect } from 'react';
import { Camera, Play, Pause } from 'lucide-react';
import { gameStore } from '../../store/state/GameStore';
import { combatSelectors } from '../../store/actions/combat';
import { monsterService } from '../../services/MonsterService';
import CombatInventoryComponent from '../inventory/CombatInventoryComponent';
import './combat.css';

const CombatUI = () => {
  const [combatState, setCombatState] = useState({
    player: {
      currentHp: 100,
      maxHp: 100,
      attack: 1,
      defense: 0,
      level: 1,
      exp: 0,
      maxExp: 100
    },
    monster: null,
    inCombat: false,
    autoCombatEnabled: false,
    monstersDefeated: 0,
    currentZone: 'peaceful_meadow',
    combatLog: [],
    activeQuests: [] // Add activeQuests to track quests
  });

  useEffect(() => {
    const initCombat = async () => {
      try {
        // 1. Initialiser le monster service
        await monsterService.initialize();
        
        // 2. S'assurer que l'état initial est correct
        const initialState = gameStore.getState();
        
        // Check if party structure exists and initialize it if needed
        if (!initialState.party || !initialState.party.characters || !initialState.party.activeCharacterId) {
          console.log('Party structure missing, initializing with default data');
          await gameStore.dispatch({
            type: 'INIT_PARTY',
            paths: ['party'],
            reducer: (state) => {
              const newState = structuredClone(state);
              if (!newState.party) {
                newState.party = {
                  characters: {},
                  activeCharacterId: 'hero-1'
                };
              }
              
              if (!newState.party.characters) {
                newState.party.characters = {};
              }
              
              if (!newState.party.activeCharacterId) {
                newState.party.activeCharacterId = 'hero-1';
              }
              
              // Ensure hero-1 character exists
              if (!newState.party.characters['hero-1']) {
                newState.party.characters['hero-1'] = {
                  id: 'hero-1',
                  name: 'Hero',
                  level: 1,
                  experience: 0,
                  stats: {
                    maxHp: 100,
                    currentHp: 100,
                    attack: 10,
                    defense: 5
                  },
                  equipment: {
                    weapon: null,
                    armor: null,
                    accessory: null
                  }
                };
              }
              
              return newState;
            }
          });
        }
        
        // Get the updated state after possible initialization
        const updatedState = gameStore.getState();
        const activeChar = updatedState.party.characters[updatedState.party.activeCharacterId];
        
        if (!activeChar) {
          throw new Error('Character not initialized');
        }
  
        // 3. Mettre à jour l'état local avec les données du personnage
        setCombatState(prev => ({
          ...prev,
          player: {
            currentHp: activeChar.stats.currentHp,
            maxHp: activeChar.stats.maxHp,
            attack: activeChar.stats.attack,
            defense: activeChar.stats.defense,
            level: activeChar.level,
            exp: activeChar.experience || 0,
            maxExp: 100 * Math.pow(1.5, activeChar.level - 1)
          }
        }));
  
        // 4. Initialiser la zone de combat
        await gameStore.dispatch({
          type: 'combat/initZone',
          paths: ['combat.zones'],
          reducer: (state) => {
            const newState = structuredClone(state);
            
            // Initialize combat structure if needed
            if (!newState.combat) {
              newState.combat = {
                state: { inCombat: false },
                zones: { currentWorld: 'green_fields', currentZone: 'peaceful_meadow' }
              };
            }
            
            if (!newState.combat.zones) {
              newState.combat.zones = { currentWorld: 'green_fields', currentZone: 'peaceful_meadow' };
            }
            
            if (!newState.combat.state) {
              newState.combat.state = { inCombat: false };
            }
            
            newState.combat.zones.currentWorld = 'green_fields';
            newState.combat.zones.currentZone = 'peaceful_meadow';
            newState.combat.state.inCombat = false;
            return newState;
          }
        });
  
        // 5. Démarrer le premier combat seulement après l'initialisation complète
        setTimeout(() => handleAttack(), 100);
  
      } catch (error) {
        console.error('Combat initialization error:', error);
        setCombatState(prev => ({
          ...prev,
          combatLog: [...prev.combatLog, `Erreur d'initialisation: ${error.message}`]
        }));
      }
    };
  
    initCombat();

    // Scroll automatique du log de combat
    const logContainer = document.querySelector('.combat-log-container');
    if (logContainer) {
      const observer = new MutationObserver(() => {
        logContainer.scrollTop = logContainer.scrollHeight;
      });
      observer.observe(logContainer, { childList: true, subtree: true });
      return () => observer.disconnect();
    }
  }, []);

  // Add effect to fetch active quests
  useEffect(() => {
    // Create a function to fetch quest data from the store and update state
    const updateQuestsFromStore = () => {
      const state = gameStore.getState();
      
      if (state.quests && state.quests.activeQuests) {
        const activeQuestsData = [];
        
        // Convert Map to array for React rendering
        if (state.quests.activeQuests instanceof Map) {
          state.quests.activeQuests.forEach((quest, questId) => {
            const progress = state.quests.questProgress?.get(questId);
            if (quest && progress) {
              activeQuestsData.push({
                id: questId,
                title: quest.title,
                description: quest.description,
                progress: progress,
                requirements: quest.requirements
              });
            }
          });
        }
        
        setCombatState(prev => ({
          ...prev,
          activeQuests: activeQuestsData
        }));
        
        console.log('Active quests updated:', activeQuestsData.length);
      }
      
      // Also check for any combat logs to display
      if (state.combat && state.combat.logs && state.combat.logs.length > 0) {
        const newLogs = [...state.combat.logs];
        state.combat.logs = []; // Clear logs after reading
        
        setCombatState(prev => ({
          ...prev,
          combatLog: [...prev.combatLog, ...newLogs]
        }));
      }
    };
    
    // Initial update
    updateQuestsFromStore();
    
    // Subscribe to quest and combat changes
    const unsubscribe = gameStore.subscribe(['quests', 'combat'], updateQuestsFromStore);
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = gameStore.subscribe(['combat|party'], (state) => {
      if (!state) {
        console.error('State is undefined');
        return;
      }
      
      if (!state.party) {
        console.error('Party is undefined');
        return;
      }
      
      if (!state.party.characters || !state.party.activeCharacterId) {
        console.error('Invalid party structure:', state.party);
        return;
      }
  
      const activeChar = state.party.characters[state.party.activeCharacterId];
      
      if (!activeChar) {
        console.error('Character not found, using previous state');
        return;
      }
  
      setCombatState(prevState => ({
        ...prevState,
        player: {
          currentHp: activeChar.stats.currentHp,
          maxHp: activeChar.stats.maxHp,
          attack: activeChar.stats.attack,
          defense: activeChar.stats.defense,
          level: activeChar.level,
          exp: activeChar.experience || 0,
          maxExp: 100 * Math.pow(1.5, activeChar.level - 1)
        },
        monster: state.combat?.state?.currentMonster || prevState.monster,
        inCombat: state.combat?.state?.inCombat || false,
        autoCombatEnabled: state.combat?.state?.autoCombatEnabled || false,
        monstersDefeated: state.combat?.zones?.monstersDefeated || 0,
        currentZone: state.combat?.zones?.currentZone || 'peaceful_meadow'
      }));
    });
  
    return () => unsubscribe();
  }, []);

  const handleAttack = async () => {
    const state = gameStore.getState();
    
    if (!state.combat.state.inCombat) {
      const newMonster = monsterService.generateMonsterForZone(combatState.currentZone);
      
      if (!newMonster) {
        console.error('Failed to generate monster');
        return;
      }
      
      await gameStore.dispatch({
        type: 'COMBAT_START',
        paths: ['combat'],
        reducer: (state) => {
          const newState = structuredClone(state);
          newState.combat.state.currentMonster = newMonster;
          newState.combat.state.inCombat = true;
          return newState;
        }
      });
  
      // Mettre à jour l'état local une seule fois après le démarrage du combat
      setCombatState(prev => ({
        ...prev,
        monster: newMonster,
        inCombat: true,
        combatLog: [...prev.combatLog, `Un ${newMonster.defaultName} Nv.${newMonster.level} apparaît!`]
      }));
  
    } else {
      // Store the monster health before attack to check if it dies
      const monsterBeforeAttack = { ...state.combat.state.currentMonster };
      
      await gameStore.dispatch({
        type: 'COMBAT_ATTACK',
        paths: ['combat', 'party'],
        reducer: (state) => {
          const newState = structuredClone(state);
          // Accès direct à l'objet au lieu d'utiliser .get()
          const activeCharId = newState.party.activeCharacterId;
          const activeChar = newState.party.characters[activeCharId];
          const monster = newState.combat.state.currentMonster;
      
          // Vérification de l'existence des objets nécessaires
          if (!activeChar || !monster || !activeChar.stats || !monster.stats) {
            console.error('Missing required data:', { activeChar, monster });
            return state;
          }
  
          // Calcul des dégâts du joueur
          const playerDamage = Math.max(1, activeChar.stats.attack - (monster.stats.defense || 0) / 2);
          monster.currentHp = Math.max(0, monster.currentHp - playerDamage);
  
          // Only update combat log for damage here, not for monster death
          if (monster.currentHp > 0) {
            setCombatState(prev => ({
              ...prev,
              monster: { ...monster },
              combatLog: [...prev.combatLog, `Player deals ${playerDamage} damage to ${monster.defaultName}`]
            }));
          } else {
            // Just update the monster state but don't add victory messages yet
            setCombatState(prev => ({
              ...prev,
              monster: { ...monster }
            }));
          }
  
          // Contre-attaque si le monstre est vivant
          if (monster.currentHp > 0) {
            const monsterDamage = Math.max(1, monster.stats.attack - (activeChar.stats.defense || 0) / 2);
            activeChar.stats.currentHp = Math.max(0, activeChar.stats.currentHp - monsterDamage);
            
            setCombatState(prev => ({
              ...prev,
              player: {
                ...prev.player,
                currentHp: activeChar.stats.currentHp
              },
              combatLog: [...prev.combatLog, `${monster.defaultName} deals ${monsterDamage} damage to Player`]
            }));
          }
  
          return newState;
        }
      });
  
      // Vérifier la victoire
      const updatedState = gameStore.getState();
      const monster = updatedState.combat.state.currentMonster;
      if (monster && monster.currentHp <= 0) {
        await handleVictory(monster);
      }
    }
  };

  const handleVictory = async (monster) => {
    const experience = monsterService.calculateExperience(monster);
    const loot = monsterService.generateLoot(monster);
    
    await gameStore.dispatch({
      type: 'COMBAT_VICTORY',
      paths: ['combat', 'party', 'inventory'],
      reducer: (state) => {
        const newState = structuredClone(state);
        
        // Accès direct à l'objet au lieu d'utiliser .get()
        const activeCharId = newState.party.activeCharacterId;
        const activeChar = newState.party.characters[activeCharId];
        
        // Mettre à jour l'expérience du joueur
        if (activeChar) {
          activeChar.experience += experience;
        }
        
        // Ajouter le butin à l'inventaire
        loot.forEach(item => {
          const currentQuantity = newState.inventory.items.get(item.id) || 0;
          newState.inventory.items.set(item.id, currentQuantity + item.quantity);
        });
        
        // Terminer le combat
        newState.combat.state.inCombat = false;
        newState.combat.zones.monstersDefeated++;
        newState.combat.state.currentMonster = null; // Important: réinitialiser le monstre
        
        return newState;
      }
    });
  
    // Ajouter les messages de victoire aux logs
    setCombatState(prev => ({
      ...prev,
      inCombat: false,
      monster: null,
      combatLog: [
        ...prev.combatLog,
        `Victoire! Le ${monster.defaultName} est vaincu!`,
        `Vous gagnez ${experience} points d'expérience`,
        ...loot.map(item => `Vous obtenez ${item.quantity}x ${item.id}`)
      ]
    }));
  
    // Démarrer un nouveau combat après un délai
    setTimeout(handleAttack, 1000);
  };

  const toggleAutoCombat = () => {
    gameStore.dispatch({
      type: 'COMBAT_TOGGLE_AUTO',
      paths: ['combat'],
      reducer: (state) => {
        const newState = structuredClone(state);
        newState.combat.state.autoCombatEnabled = !newState.combat.state.autoCombatEnabled;
        return newState;
      }
    });

    if (!combatState.inCombat) {
      handleAttack();
    }
  };

  // Helper function to calculate quest progress percentage
  const calculateQuestProgress = (quest) => {
    if (!quest.requirements || !quest.progress) return 0;
    
    let totalRequired = 0;
    let totalCompleted = 0;
    
    if (quest.requirements.monstersKilled) {
      Object.entries(quest.requirements.monstersKilled).forEach(([monsterId, required]) => {
        if (monsterId !== 'zone') {
          totalRequired += required;
          totalCompleted += (quest.progress.monstersKilled?.[monsterId] || 0);
        }
      });
    }
    
    if (quest.requirements.items) {
      Object.entries(quest.requirements.items).forEach(([itemId, required]) => {
        totalRequired += required;
        totalCompleted += (quest.progress.items?.[itemId] || 0);
      });
    }
    
    return totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 0;
  };
  
  // Helper function to get quest progress text
  const getQuestProgressText = (quest) => {
    if (!quest.requirements || !quest.progress) return '';
    
    if (quest.requirements.monstersKilled) {
      const [monsterId, required] = Object.entries(quest.requirements.monstersKilled).find(([key]) => key !== 'zone') || [];
      if (monsterId) {
        const current = quest.progress.monstersKilled?.[monsterId] || 0;
        return `${current}/${required}`;
      }
    }
    
    if (quest.requirements.items) {
      const entries = Object.entries(quest.requirements.items);
      if (entries.length > 0) {
        const [itemId, required] = entries[0];
        const current = quest.progress.items?.[itemId] || 0;
        return `${current}/${required}`;
      }
    }
    
    return '';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Zone de combat */}
      <div className="card">
        <div className="flex justify-between items-start mb-6">
          {/* Stats du joueur */}
          <div className="space-y-2">
            <h3 className="font-medium">Player</h3>
            <div className="w-48">
              <div className="h-2 bg-gray-200 rounded-full mb-2">
                <div 
                  className="h-2 bg-green-500 rounded-full transition-all duration-300" 
                  style={{ width: `${(combatState.player.currentHp / combatState.player.maxHp) * 100}%` }}
                />
              </div>
              <div className="text-sm text-gray-600">
                HP: {Math.round(combatState.player.currentHp)}/{combatState.player.maxHp}
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <span>ATK: {combatState.player.attack}</span>
              <span>DEF: {combatState.player.defense}</span>
            </div>
          </div>

          {/* Stats du monstre */}
          {combatState.monster && (
            <div className="space-y-2">
              <h3 className="font-medium">{combatState.monster.defaultName} Lvl.{combatState.monster.level}</h3>
              <div className="w-48">
                <div className="h-2 bg-gray-200 rounded-full mb-2">
                  <div 
                    className="h-2 bg-red-500 rounded-full transition-all duration-300" 
                    style={{ width: `${(combatState.monster.currentHp / combatState.monster.maxHp) * 100}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  HP: {Math.round(combatState.monster.currentHp)}/{combatState.monster.maxHp}
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <span>ATK: {combatState.monster.stats.attack}</span>
                <span>DEF: {combatState.monster.stats.defense}</span>
              </div>
            </div>
          )}
        </div>

        {/* Contrôles de combat */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleAttack}
            className="btn btn-primary gap-2"
          >
            <Camera className="w-4 h-4" />
            Attack
          </button>
          <button
            onClick={toggleAutoCombat}
            className={`btn gap-2 ${combatState.autoCombatEnabled ? 'btn-secondary' : 'btn-primary'}`}
          >
            {combatState.autoCombatEnabled ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Auto Combat
          </button>
        </div>
      </div>

      {/* Progression et logs */}
      <div className="card space-y-4">
        {/* Progression de zone */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Zone: {combatState.currentZone || 'None'}</span>
            <span>{combatState.monstersDefeated}/10 Monsters</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 bg-blue-500 rounded-full transition-all duration-300" 
              style={{ width: `${(combatState.monstersDefeated / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Barre d'expérience */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Level {combatState.player.level}</span>
            <span>{combatState.player.exp}/{combatState.player.maxExp} XP</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 bg-purple-500 rounded-full transition-all duration-300" 
              style={{ width: `${(combatState.player.exp / combatState.player.maxExp) * 100}%` }}
            />
          </div>
        </div>

        {/* Log de combat */}
        <div className="mt-4">
          <h3 className="font-medium mb-2">Combat Log</h3>
          <div className="combat-log-container bg-gray-50 rounded-lg p-4 h-48 overflow-y-auto text-sm">
            {combatState.combatLog.map((log, index) => (
              <div 
                key={index} 
                className="combat-message text-gray-600"
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Quests section */}
      <div className="md:col-span-2 quests-section">
        <h2 className="font-bold mb-4">Quêtes Actives</h2>
        <div id="active-quests" className="space-y-3">
          {combatState.activeQuests.length > 0 ? (
            combatState.activeQuests.map(quest => (
              <div key={quest.id} className="quest-item">
                <h3>{quest.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{quest.description}</p>
                <div className="progress-bar">
                  <div 
                    style={{ width: `${calculateQuestProgress(quest)}%` }} 
                    className="bg-indigo-500 transition-all duration-300">
                  </div>
                </div>
                <div className="progress-text">
                  <span>Progression</span>
                  <span>{getQuestProgressText(quest)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Aucune quête active en ce moment.</p>
          )}
        </div>
      </div>
      
      {/* Inventory section below combat area */}
      <div className="md:col-span-2">
        <CombatInventoryComponent />
      </div>
    </div>
  );
};

export default CombatUI;