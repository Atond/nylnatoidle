import { ActionTypes } from './types';

export const startCombat = (monster) => ({
  type: ActionTypes.COMBAT_START,
  paths: ['combat'],
  reducer: (state) => {
    const newState = structuredClone(state);
    // Check if combat property exists
    if (!newState.combat) {
      newState.combat = {
        state: { 
          currentMonster: null,
          inCombat: false,
          autoCombatEnabled: false
        },
        zones: { monstersDefeated: 0 }
      };
    }
    newState.combat.state.currentMonster = monster;
    newState.combat.state.inCombat = true;
    return newState;
  }
});

export const endCombat = (victory = false) => ({
  type: ActionTypes.COMBAT_END,
  paths: ['combat', 'party.characters'],
  reducer: (state) => {
    const newState = structuredClone(state);
    // Ensure combat property exists
    if (!newState.combat) {
      return state;
    }
    const combat = newState.combat;
    
    if (victory) {
      // Ensure zones property exists
      if (!combat.zones) {
        combat.zones = { monstersDefeated: 0 };
      }
      combat.zones.monstersDefeated++;
    }
    
    combat.state.inCombat = false;
    combat.state.currentMonster = null;
    
    // Réinitialiser les PV du personnage actif si défaite
    if (!victory && newState.party && newState.party.characters) {
      const activeCharId = newState.party.activeCharacterId;
      if (activeCharId && newState.party.characters[activeCharId]) {
        const activeChar = newState.party.characters[activeCharId];
        if (activeChar.stats) {
          activeChar.stats.currentHp = activeChar.stats.maxHp;
        }
      }
    }
    
    return newState;
  }
});

export const attack = () => ({
  type: ActionTypes.COMBAT_ATTACK,
  paths: ['combat', 'party.characters'],
  reducer: (state) => {
    const newState = structuredClone(state);
    // Ensure party and combat properties exist
    if (!newState.party || !newState.combat || !newState.combat.state) {
      return state;
    }
    
    const activeCharId = newState.party.activeCharacterId;
    if (!activeCharId || !newState.party.characters[activeCharId]) {
      return state;
    }
    
    const activeChar = newState.party.characters[activeCharId];
    const monster = newState.combat.state.currentMonster;
    
    if (!monster || !newState.combat.state.inCombat) return state;
    
    // Calcul des dégâts du joueur
    const playerDamage = calculateDamage(
      activeChar.stats.attack, 
      monster.stats.defense
    );
    monster.currentHp -= playerDamage;
    
    // Si le monstre est encore vivant, il contre-attaque
    if (monster.currentHp > 0) {
      const monsterDamage = calculateDamage(
        monster.stats.attack,
        activeChar.stats.defense
      );
      activeChar.stats.currentHp -= monsterDamage;
    }
    
    return newState;
  }
});

export const toggleAutoCombat = () => ({
  type: ActionTypes.COMBAT_TOGGLE_AUTO,
  paths: ['combat'],
  reducer: (state) => {
    const newState = structuredClone(state);
    // Ensure combat property and state exist
    if (!newState.combat) {
      newState.combat = { 
        state: { autoCombatEnabled: false },
        zones: { monstersDefeated: 0 }
      };
    }
    if (!newState.combat.state) {
      newState.combat.state = { autoCombatEnabled: false };
    }
    newState.combat.state.autoCombatEnabled = !newState.combat.state.autoCombatEnabled;
    return newState;
  }
});

// Sélecteurs pour le combat
export const combatSelectors = {
  getCurrentMonster: (state) => state.combat?.state?.currentMonster || null,
  isInCombat: (state) => state.combat?.state?.inCombat || false,
  getMonstersDefeated: (state) => state.combat?.zones?.monstersDefeated || 0,
  isAutoCombatEnabled: (state) => state.combat?.state?.autoCombatEnabled || false
};

// Fonctions utilitaires
const calculateDamage = (attack, defense) => {
  const baseDamage = Math.max(0, attack - defense/2);
  return Math.floor(baseDamage * (0.9 + Math.random() * 0.2));
};