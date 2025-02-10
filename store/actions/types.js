export const ActionTypes = {
  // Character
  CHARACTER_GAIN_XP: 'character/gainExperience',
  CHARACTER_LEVEL_UP: 'character/levelUp',
  CHARACTER_TAKE_DAMAGE: 'character/takeDamage',
  CHARACTER_HEAL: 'character/heal',
  
  // Combat
  COMBAT_START: 'combat/start',
  COMBAT_END: 'combat/end',
  COMBAT_ATTACK: 'combat/attack',
  COMBAT_TOGGLE_AUTO: 'combat/toggleAuto',
  
  // Inventory
  INVENTORY_ADD_ITEM: 'inventory/addItem',
  INVENTORY_REMOVE_ITEM: 'inventory/removeItem',
  
  // Professions
  PROFESSION_GAIN_XP: 'profession/gainExperience',
  PROFESSION_LEVEL_UP: 'profession/levelUp',
  PROFESSION_COLLECT: 'profession/collect'
};