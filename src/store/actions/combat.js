import { ActionTypes } from './types';

export const startCombat = (monster) => ({
  type: ActionTypes.COMBAT_START,
  paths: ['combat'],
  reducer: (state) => {
    const newState = structuredClone(state);
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
    const combat = newState.combat;
    
    if (victory) {
      combat.zones.monstersDefeated++;
    }
    
    combat.state.inCombat = false;
    combat.state.currentMonster = null;
    
    // Réinitialiser les PV du personnage actif si défaite
    if (!victory) {
      const activeChar = newState.party.characters[newState.party.activeCharacterId];
      activeChar.stats.currentHp = activeChar.stats.maxHp;
    }
    
    return newState;
  }
});

export const attack = () => ({
  type: ActionTypes.COMBAT_ATTACK,
  paths: ['combat', 'party.characters'],
  reducer: (state) => {
    const newState = structuredClone(state);
    const activeChar = newState.party.characters[newState.party.activeCharacterId];
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
    newState.combat.state.autoCombatEnabled = !newState.combat.state.autoCombatEnabled;
    return newState;
  }
});

// Sélecteurs pour le combat
export const combatSelectors = {
  getCurrentMonster: (state) => state.combat.state.currentMonster,
  isInCombat: (state) => state.combat.state.inCombat,
  getMonstersDefeated: (state) => state.combat.zones.monstersDefeated,
  isAutoCombatEnabled: (state) => state.combat.state.autoCombatEnabled
};

// Fonctions utilitaires
const calculateDamage = (attack, defense) => {
  const baseDamage = Math.max(0, attack - defense/2);
  return Math.floor(baseDamage * (0.9 + Math.random() * 0.2));
};