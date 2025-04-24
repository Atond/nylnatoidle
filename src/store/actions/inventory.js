import { ActionTypes } from './types';

export const addItem = (itemId, quantity) => ({
  type: ActionTypes.INVENTORY_ADD_ITEM,
  paths: ['inventory'],
  reducer: (state) => {
    const newState = structuredClone(state);
    if (!newState.inventory) {
      newState.inventory = { items: new Map(), capacity: 100 };
    }
    if (!newState.inventory.items) {
      newState.inventory.items = new Map();
    }
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
    if (!newState.inventory || !newState.inventory.items) {
      return newState;
    }
    
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

// Sélecteurs with safety checks
export const inventorySelectors = {
  getItemQuantity: (state, itemId) => {
    if (!state || !state.inventory || !state.inventory.items) return 0;
    return state.inventory.items.get(itemId) || 0;
  },
  getAllItems: (state) => {
    if (!state || !state.inventory || !state.inventory.items) return [];
    return Array.from(state.inventory.items.entries());
  },
  getInventorySpace: (state) => {
    if (!state || !state.inventory) return 100;
    return state.inventory.capacity || 100;
  },
  getRemainingSpace: (state) => {
    if (!state || !state.inventory || !state.inventory.items) return 100;
    const capacity = state.inventory.capacity || 100;
    const usedSpace = Array.from(state.inventory.items.values()).reduce((a, b) => a + b, 0);
    return capacity - usedSpace;
  }
};