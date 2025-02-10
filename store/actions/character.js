import { ActionTypes } from './types';

export const gainExperience = (amount) => ({
  type: ActionTypes.CHARACTER_GAIN_XP,
  paths: ['party.characters'],
  reducer: (state) => {
    const newState = structuredClone(state);
    const activeChar = newState.party.characters.get(newState.party.activeCharacterId);
    
    activeChar.experience += amount;
    
    // Vérifier le level up
    const expForNextLevel = calculateExpForLevel(activeChar.level);
    if (activeChar.experience >= expForNextLevel) {
      activeChar.level += 1;
      activeChar.stats.maxHp += 5;
      activeChar.stats.attack += 1;
      activeChar.stats.defense += 0.1;
      activeChar.stats.currentHp = activeChar.stats.maxHp; // Full heal on level up
    }
    
    return newState;
  }
});

export const takeDamage = (amount) => ({
  type: ActionTypes.CHARACTER_TAKE_DAMAGE,
  paths: ['party.characters'],
  reducer: (state) => {
    const newState = structuredClone(state);
    const activeChar = newState.party.characters.get(newState.party.activeCharacterId);
    
    activeChar.stats.currentHp = Math.max(0, activeChar.stats.currentHp - amount);
    return newState;
  }
});