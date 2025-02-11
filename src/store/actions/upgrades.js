import { ActionTypes } from './types';

// Types d'actions spécifiques aux upgrades
export const UPGRADE_TYPES = {
  MINING_POWER: 'MINING_POWER',
  AUTO_COLLECT: 'AUTO_COLLECT',
  RESOURCE_QUALITY: 'RESOURCE_QUALITY',
  MULTI_COLLECT: 'MULTI_COLLECT'
};

// Structure des upgrades par métier
export const PROFESSION_UPGRADES = {
  miner: [
    {
      id: 'better_pickaxe_1',
      type: UPGRADE_TYPES.MINING_POWER,
      value: 1,
      costs: { iron_ore: 10 },
      requiredLevel: 1
    },
    {
      id: 'auto_miner_1',
      type: UPGRADE_TYPES.AUTO_COLLECT,
      value: 1,
      costs: { iron_ore: 50, copper_ore: 20 },
      requiredLevel: 2
    }
  ],
  lumberjack: [
    {
      id: 'better_axe_1',
      type: UPGRADE_TYPES.MINING_POWER,
      value: 1,
      costs: { oak_wood: 10 },
      requiredLevel: 1
    },
    {
      id: 'auto_chop_1',
      type: UPGRADE_TYPES.AUTO_COLLECT,
      value: 1,
      costs: { oak_wood: 50, pine_wood: 20 },
      requiredLevel: 2
    }
  ]
};

// Action pour acheter un upgrade
export const purchaseUpgrade = (characterId, professionId, upgradeId) => ({
  type: ActionTypes.PROFESSION_BUY_UPGRADE,
  paths: ['professions', 'inventory'],
  reducer: (state) => {
    const newState = structuredClone(state);
    const charProfessions = newState.professions.characters[characterId];
    
    // Vérifier que l'upgrade existe
    const upgrade = PROFESSION_UPGRADES[professionId]?.find(u => u.id === upgradeId);
    if (!upgrade) return state;
    
    // Vérifier le niveau requis
    const profLevel = charProfessions.levels[professionId]?.level || 0;
    if (profLevel < upgrade.requiredLevel) return state;
    
    // Vérifier que l'upgrade n'est pas déjà acheté
    const unlockedUpgrades = charProfessions.upgrades[professionId] || new Set();
    if (unlockedUpgrades.has(upgradeId)) return state;
    
    // Vérifier les ressources
    for (const [resourceId, amount] of Object.entries(upgrade.costs)) {
      const currentAmount = newState.inventory.items.get(resourceId) || 0;
      if (currentAmount < amount) return state;
    }
    
    // Déduire les ressources
    for (const [resourceId, amount] of Object.entries(upgrade.costs)) {
      const currentAmount = newState.inventory.items.get(resourceId) || 0;
      newState.inventory.items.set(resourceId, currentAmount - amount);
    }
    
    // Ajouter l'upgrade aux upgrades débloqués
    if (!charProfessions.upgrades[professionId]) {
      charProfessions.upgrades[professionId] = new Set();
    }
    charProfessions.upgrades[professionId].add(upgradeId);
    
    // Appliquer les effets de l'upgrade
    applyUpgradeEffects(newState, characterId, professionId, upgrade);
    
    return newState;
  }
});

// Appliquer les effets d'un upgrade
const applyUpgradeEffects = (state, characterId, professionId, upgrade) => {
  const professionState = state.professions.characters[characterId].stats[professionId];
  
  switch (upgrade.type) {
    case UPGRADE_TYPES.MINING_POWER:
      professionState.miningPower = (professionState.miningPower || 1) + upgrade.value;
      break;
    case UPGRADE_TYPES.AUTO_COLLECT:
      professionState.autoCollectors = (professionState.autoCollectors || 0) + upgrade.value;
      break;
    case UPGRADE_TYPES.RESOURCE_QUALITY:
      professionState.resourceQuality = (professionState.resourceQuality || 1) + upgrade.value;
      break;
    case UPGRADE_TYPES.MULTI_COLLECT:
      professionState.multiCollect = (professionState.multiCollect || 1) + upgrade.value;
      break;
  }
};

// Sélecteurs pour les upgrades
export const upgradeSelectors = {
  getAvailableUpgrades: (state, characterId, professionId) => {
    const profLevel = state.professions.characters[characterId]?.levels[professionId]?.level || 0;
    const unlockedUpgrades = state.professions.characters[characterId]?.upgrades[professionId] || new Set();
    
    return PROFESSION_UPGRADES[professionId]?.filter(upgrade => 
      profLevel >= upgrade.requiredLevel && !unlockedUpgrades.has(upgrade.id)
    ) || [];
  },
  
  getProfessionStats: (state, characterId, professionId) => 
    state.professions.characters[characterId]?.stats[professionId] || {
      miningPower: 1,
      autoCollectors: 0,
      resourceQuality: 1,
      multiCollect: 1
    }
};