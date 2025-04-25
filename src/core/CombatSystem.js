import { gameStore } from '../store/state/GameStore';
import * as combatActions from '../store/actions/combat';
import * as characterActions from '../store/actions/character';
import { combatSelectors } from '../store/actions/combat';
import { questSystem } from './questSystem.js'; // Import the quest system

class CombatSystem {
  constructor() {
    try {
      this.initialize();
      this.setupAutoCombat();
    } catch (error) {
      console.error('Combat initialization error:', error);
    }
  }
  
  initialize() {
    try {
      // Écouter les changements d'état pertinents
      gameStore.subscribe('combat', (state) => {
        if (combatSelectors.isAutoCombatEnabled(state) && 
            !combatSelectors.isInCombat(state)) {
          this.startCombat();
        }
      });
    } catch (error) {
      console.error('Combat initialization error:', error);
    }
  }
  
  setupAutoCombat() {
    setInterval(() => {
      try {
        const state = gameStore.getState();
        if (combatSelectors.isAutoCombatEnabled(state) && 
            combatSelectors.isInCombat(state)) {
          this.attack();
        }
      } catch (error) {
        console.error('Auto combat error:', error);
      }
    }, 1000);
  }
  
  async startCombat() {
    try {
      const monster = await this.generateMonster();
      if (monster) {
        gameStore.dispatch(combatActions.startCombat(monster));
      }
    } catch (error) {
      console.error('Start combat error:', error);
    }
  }
  
  attack() {
    try {
      gameStore.dispatch(combatActions.attack());
      
      const state = gameStore.getState();
      const monster = combatSelectors.getCurrentMonster(state);
      
      if (!monster) return;
      
      if (monster.currentHp <= 0) {
        this.handleVictory();
      } else if (state.party && state.party.characters && 
                state.party.activeCharacterId && 
                state.party.characters[state.party.activeCharacterId] &&
                state.party.characters[state.party.activeCharacterId].stats &&
                state.party.characters[state.party.activeCharacterId].stats.currentHp <= 0) {
        this.handleDefeat();
      }
    } catch (error) {
      console.error('Attack error:', error);
    }
  }
  
  handleVictory() {
    const state = gameStore.getState();
    const monster = combatSelectors.getCurrentMonster(state);
    
    gameStore.dispatch(combatActions.endCombat(true));
    // Ajouter l'expérience et le butin
    this.grantRewards();
    
    // Update quest progress for the killed monster
    if (monster && monster.id) {
      const currentZone = state.combat.zones.currentZone;
      let zoneId = '';
      
      // Make sure we get the zone ID correctly
      if (typeof currentZone === 'string') {
        zoneId = currentZone;
      } else if (currentZone && currentZone.id) {
        zoneId = currentZone.id;
      } else {
        // Default to peaceful_meadow if no zone is specified
        zoneId = 'peaceful_meadow';
      }
      
      console.log(`Monster killed: ${monster.id} in zone: ${zoneId} - Updating quest progress`);
      
      // Force update through direct method call instead of using the proxy
      if (questSystem && typeof questSystem.updateQuestProgress === 'function') {
        questSystem.updateQuestProgress('all', 'monsterKill', { 
          monsterId: monster.id, 
          zoneId: zoneId
        });
      } else {
        console.error("Quest system or updateQuestProgress method not available");
      }
      
      // Log active quests for debugging
      if (questSystem && questSystem.activeQuests) {
        console.log("Active quests after monster kill:", 
          Array.from(questSystem.activeQuests.keys()).join(", "));
      }
    }
    
    // Démarrer un nouveau combat après un délai
    setTimeout(() => this.startCombat(), 1000);
  }
  
  handleDefeat() {
    gameStore.dispatch(combatActions.endCombat(false));
    setTimeout(() => this.startCombat(), 1000);
  }
  
  toggleAutoCombat() {
    gameStore.dispatch(combatActions.toggleAutoCombat());
  }

  async generateMonster() {
    const state = gameStore.getState();
    const currentZone = state.combat.zones.currentZone;
    if (!currentZone) return null;

    const monsterTemplate = await this.selectRandomMonster(currentZone.monsters);
    if (!monsterTemplate) return null;

    const level = this.calculateMonsterLevel(monsterTemplate);
    const stats = this.scaleMonsterStats(monsterTemplate.baseStats, level, currentZone.index);

    return {
      ...monsterTemplate,
      level,
      maxHp: stats.hp,
      currentHp: stats.hp,
      stats
    };
  }

  selectRandomMonster(monsters) {
    if (!monsters || monsters.length === 0) return null;

    const totalSpawnRate = monsters.reduce((sum, m) => sum + m.spawnRate, 0);
    let random = Math.random() * totalSpawnRate;

    for (const monster of monsters) {
      random -= monster.spawnRate;
      if (random <= 0) {
        return monster;
      }
    }
    return null;
  }

  calculateMonsterLevel(monster) {
    if (!monster.levelRange) return 1;
    const [min, max] = monster.levelRange;
    return Math.floor(min + Math.random() * (max - min + 1));
  }

  scaleMonsterStats(baseStats, level, zoneIndex) {
    const state = gameStore.getState();
    const scaling = state.combat.scaling;

    const zoneMultiplier = Math.pow(1 + scaling.zoneMultiplier * zoneIndex, scaling.scalingPower);
    const levelMultiplier = 1 + (level - 1) * scaling.levelScaling;

    return Object.entries(baseStats).reduce((acc, [stat, value]) => {
      const useFullScaling = scaling.stats[stat]?.useFullScaling ?? false;
      
      if (useFullScaling) {
        acc[stat] = Math.floor(value * zoneMultiplier * levelMultiplier);
      } else {
        acc[stat] = Math.floor(value * Math.sqrt(zoneMultiplier) * levelMultiplier);
      }
      return acc;
    }, {});
  }

  grantRewards() {
    const state = gameStore.getState();
    const monster = combatSelectors.getCurrentMonster(state);
    
    // Calculer l'expérience
    const experience = this.calculateExperience(monster);
    if (experience > 0) {
      gameStore.dispatch(characterActions.gainExperience(experience));
    }

    // Générer le butin
    const loot = this.generateLoot(monster);
    loot.forEach(item => {
      gameStore.dispatch({
        type: 'inventory/addItem',
        paths: ['inventory'],
        reducer: (state) => {
          const newState = structuredClone(state);
          const currentQuantity = newState.inventory.items.get(item.id) || 0;
          newState.inventory.items.set(item.id, currentQuantity + item.quantity);
          return newState;
        }
      });
    });
  }

  calculateExperience(monster) {
    if (!monster.baseExperience) return 0;

    const state = gameStore.getState();
    const zoneIndex = state.combat.zones.currentZone.index;
    
    let experience = monster.baseExperience;
    const levelBonus = 1 + (monster.level - 1) * 0.05;
    const zoneBonus = 1 + zoneIndex * 0.1;
    const rarityMultiplier = monster.isRare ? 1.5 : (monster.isBoss ? 3 : 1);

    return Math.floor(experience * levelBonus * zoneBonus * rarityMultiplier);
  }

  generateLoot(monster) {
    if (!monster.loot) return [];

    const lootItems = [];
    monster.loot.forEach(lootEntry => {
      const { resourceId, chance, minQuantity, maxQuantity } = lootEntry;
      
      if (Math.random() < chance) {
        const quantity = minQuantity === maxQuantity ? 
          minQuantity : 
          Math.floor(Math.random() * (maxQuantity - minQuantity + 1)) + minQuantity;
        
        lootItems.push({
          id: resourceId,
          quantity: quantity
        });
      }
    });

    return lootItems;
  }

  // Méthodes pour changer de zone/monde
  async changeZone(zoneId, worldId) {
    const canChange = await this.canAccessZone(zoneId, worldId);
    if (canChange) {
      gameStore.dispatch({
        type: 'combat/changeZone',
        paths: ['combat.zones'],
        reducer: (state) => {
          const newState = structuredClone(state);
          newState.combat.zones.currentWorld = worldId;
          newState.combat.zones.currentZone = zoneId;
          newState.combat.zones.monstersDefeated = 0;
          return newState;
        }
      });
      
      // Redémarrer le combat dans la nouvelle zone
      this.startCombat();
    }
  }

  async canAccessZone(zoneId, worldId) {
    const state = gameStore.getState();
    return state.combat.zones.unlockedWorlds[worldId] && 
           state.combat.zones.unlockedZones[zoneId];
  }
}

export const combatSystem = new CombatSystem();