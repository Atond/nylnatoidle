import { ActionTypes } from './types';

export const addItem = (itemId, quantity) => ({
  type: ActionTypes.INVENTORY_ADD_ITEM,
  paths: ['inventory'],
  reducer: (state) => {
    const newState = structuredClone(state);
    const currentQuantity = newState.inventory.items.get(itemId) || 0;
    newState.inventory.items.set(itemId, currentQuantity + quantity);
    return newState;
  }
});

export const removeItem = (itemId, quantity) => ({
  type: ActionTypes.INVENTORY_REMOVE_ITEM,
  paths: ['inventory'],
  reducer: (state) => {
    const newState = structuredClone(state);
    const currentQuantity = newState.inventory.items.get(itemId) || 0;
    const newQuantity = Math.max(0, currentQuantity - quantity);
    
    if (newQuantity === 0) {
      newState.inventory.items.delete(itemId);
    } else {
      newState.inventory.items.set(itemId, newQuantity);
    }
    
    return newState;
  }
});

// Sélecteurs
export const inventorySelectors = {
  getItemQuantity: (state, itemId) => state.inventory.items.get(itemId) || 0,
  getAllItems: (state) => Array.from(state.inventory.items.entries()),
  getInventorySpace: (state) => state.inventory.capacity,
  getRemainingSpace: (state) => {
    const usedSpace = Array.from(state.inventory.items.values()).reduce((a, b) => a + b, 0);
    return state.inventory.capacity - usedSpace;
  }
};