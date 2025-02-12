import React, { useState, useEffect } from 'react';
import { Camera, Play, Pause } from 'lucide-react';
import { gameStore } from '../../store/state/GameStore';
import { combatSelectors } from '../../store/actions/combat';
import { monsterService } from '../../services/MonsterService';
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
    combatLog: []
  });

  useEffect(() => {
    const initCombat = async () => {
      try {
        await monsterService.initialize();
        
        // Configuration de la zone initiale
        await gameStore.dispatch({
          type: 'combat/initZone',
          paths: ['combat.zones'],
          reducer: (state) => {
            const newState = structuredClone(state);
            newState.combat.zones.currentWorld = 'green_fields';
            newState.combat.zones.currentZone = 'peaceful_meadow';
            newState.combat.state.inCombat = false;
            return newState;
          }
        });

        handleAttack(); // Démarrer le premier combat
      } catch (error) {
        console.error('Failed to initialize combat:', error);
        setCombatState(prev => ({
          ...prev,
          combatLog: [...prev.combatLog, 'Erreur lors de l\'initialisation du combat']
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

  useEffect(() => {
    const unsubscribe = gameStore.subscribe(['combat', 'party'], () => {
      const state = gameStore.getState();
      const activeChar = state.party.characters[state.party.activeCharacterId];
      const monster = state.combat.state.currentMonster;
      
      setCombatState(prevState => ({
        ...prevState,
        player: {
          currentHp: activeChar.stats.currentHp,
          maxHp: activeChar.stats.maxHp,
          attack: activeChar.stats.attack,
          defense: activeChar.stats.defense,
          level: activeChar.level,
          exp: activeChar.experience,
          maxExp: 100 * Math.pow(1.5, activeChar.level - 1)
        },
        monster,
        inCombat: state.combat.state.inCombat,
        autoCombatEnabled: state.combat.state.autoCombatEnabled,
        monstersDefeated: state.combat.zones.monstersDefeated,
        currentZone: state.combat.zones.currentZone
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

      setCombatState(prev => ({
        ...prev,
        monster: newMonster,
        inCombat: true,
        combatLog: [...prev.combatLog, `Un ${newMonster.defaultName} Nv.${newMonster.level} apparaît!`]
      }));
    } else {
      await gameStore.dispatch({
        type: 'COMBAT_ATTACK',
        paths: ['combat', 'party'],
        reducer: (state) => {
          const newState = structuredClone(state);
          const activeChar = newState.party.characters[newState.party.activeCharacterId];
          const monster = newState.combat.state.currentMonster;

          // Calcul des dégâts
          const playerDamage = Math.max(1, activeChar.stats.attack - monster.stats.defense/2);
          monster.currentHp -= playerDamage;

          setCombatState(prev => ({
            ...prev,
            combatLog: [...prev.combatLog, 
              `Player deals ${playerDamage} damage to ${monster.defaultName}`
            ]
          }));

          // Contre-attaque si le monstre est vivant
          if (monster.currentHp > 0) {
            const monsterDamage = Math.max(1, monster.stats.attack - activeChar.stats.defense/2);
            activeChar.stats.currentHp = Math.max(0, activeChar.stats.currentHp - monsterDamage);
            
            setCombatState(prev => ({
              ...prev,
              combatLog: [...prev.combatLog, 
                `${monster.defaultName} deals ${monsterDamage} damage to Player`
              ]
            }));
          }

          return newState;
        }
      });

      // Vérifier la victoire
      const updatedState = gameStore.getState();
      const monster = updatedState.combat.state.currentMonster;
      if (monster.currentHp <= 0) {
        handleVictory(monster);
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
        
        // Mettre à jour l'expérience du joueur
        const activeChar = newState.party.characters.get(newState.party.activeCharacterId);
        activeChar.experience += experience;
        
        // Ajouter le butin à l'inventaire
        loot.forEach(item => {
          const currentQuantity = newState.inventory.items.get(item.id) || 0;
          newState.inventory.items.set(item.id, currentQuantity + item.quantity);
        });
        
        // Terminer le combat
        newState.combat.state.inCombat = false;
        newState.combat.zones.monstersDefeated++;
        
        return newState;
      }
    });

    // Ajouter les messages de victoire aux logs
    setCombatState(prev => ({
      ...prev,
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
    </div>
  );
};

export default CombatUI;