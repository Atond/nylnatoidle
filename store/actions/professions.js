import { ActionTypes } from './types';

// Gain d'expérience pour un métier
export const gainProfessionExperience = (characterId, professionId, amount) => ({
  type: ActionTypes.PROFESSION_GAIN_XP,
  paths: ['professions'],
  reducer: (state) => {
    const newState = structuredClone(state);
    const charProfessions = newState.professions.characters[characterId];
    if (!charProfessions?.levels[professionId]) return state;

    const profLevel = charProfessions.levels[professionId];
    profLevel.exp += amount;

    // Check level up
    const expForNextLevel = Math.floor(100 * Math.pow(1.5, profLevel.level - 1));
    if (profLevel.exp >= expForNextLevel) {
      profLevel.level += 1;
      profLevel.exp = profLevel.exp - expForNextLevel;
    }

    return newState;
  }
});

// Débloquer un nouveau métier (globalement)
export const unlockProfession = (professionId) => ({
  type: ActionTypes.PROFESSION_UNLOCK,
  paths: ['professions'],
  reducer: (state) => {
    const newState = structuredClone(state);
    if (!newState.professions.slots.unlocked.includes(professionId)) {
      newState.professions.slots.unlocked.push(professionId);
    }
    return newState;
  }
});

// Assigner un métier à un personnage
export const assignProfession = (characterId, professionId) => ({
  type: ActionTypes.PROFESSION_ASSIGN,
  paths: ['professions'],
  reducer: (state) => {
    const newState = structuredClone(state);
    const charProfessions = newState.professions.characters[characterId];
    
    // Vérifier si le personnage a un slot disponible
    if (charProfessions.active.length >= state.professions.slots.perCharacter) {
      return state;
    }

    // Ajouter le métier
    charProfessions.active.push(professionId);
    charProfessions.levels[professionId] = { level: 1, exp: 0 };
    
    return newState;
  }
});

// Collecter une ressource
export const collectResource = (characterId, professionId) => ({
  type: ActionTypes.PROFESSION_COLLECT_RESOURCE,
  paths: ['professions', 'inventory'],
  reducer: (state) => {
    const newState = structuredClone(state);
    const profLevel = newState.professions.characters[characterId].levels[professionId];
    
    // Logique de collecte basée sur le niveau
    const resources = getProfessionResources(professionId, profLevel.level);
    const resource = selectRandomResource(resources);
    
    if (resource) {
      // Ajouter à l'inventaire
      const currentQuantity = newState.inventory.items.get(resource.id) || 0;
      newState.inventory.items.set(resource.id, currentQuantity + 1);
      
      // Ajouter de l'XP
      const expGain = calculateExpGain(profLevel.level);
      profLevel.exp += expGain;
    }
    
    return newState;
  }
});

// Sélecteurs
export const professionSelectors = {
  getProfessionLevel: (state, characterId, professionId) => 
    state.professions.characters[characterId]?.levels[professionId]?.level || 0,
  
  getActiveProfessions: (state, characterId) => 
    state.professions.characters[characterId]?.active || [],
  
  getAvailableSlots: (state, characterId) => {
    const active = state.professions.characters[characterId]?.active.length || 0;
    return state.professions.slots.perCharacter - active;
  },

  getUnlockedProfessions: (state) => state.professions.slots.unlocked,
  
  isProfessionUnlocked: (state, professionId) => 
    state.professions.slots.unlocked.includes(professionId)
};

// Fonctions utilitaires
const getProfessionResources = (professionId, level) => {
  // Retourne les ressources disponibles pour ce métier à ce niveau
  // À implémenter selon la configuration des ressources
  return [];
};

const selectRandomResource = (resources) => {
  // Sélectionne une ressource aléatoire de la liste
  if (!resources.length) return null;
  return resources[Math.floor(Math.random() * resources.length)];
};

const calculateExpGain = (level) => {
  // Calcule l'XP gagnée basée sur le niveau
  return Math.floor(10 * Math.pow(1.1, level - 1));
};