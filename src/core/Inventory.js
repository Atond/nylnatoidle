import { gameStore } from '../store/GameStore';
import * as inventoryActions from '../store/actions/inventory';
import { inventorySelectors } from '../store/actions/inventory';

class Inventory {
  constructor() {
    // Rien à initialiser car tout est géré par le store
  }

  addItem(itemId, quantity = 1) {
    if (quantity <= 0) return false;
    
    const state = gameStore.getState();
    const remainingSpace = inventorySelectors.getRemainingSpace(state);
    
    if (remainingSpace >= quantity) {
      gameStore.dispatch(inventoryActions.addItem(itemId, quantity));
      return true;
    }
    return false;
  }

  removeItem(itemId, quantity = 1) {
    if (quantity <= 0) return false;
    
    const state = gameStore.getState();
    const currentQuantity = inventorySelectors.getItemQuantity(state, itemId);
    
    if (currentQuantity >= quantity) {
      gameStore.dispatch(inventoryActions.removeItem(itemId, quantity));
      return true;
    }
    return false;
  }

  getItemQuantity(itemId) {
    return inventorySelectors.getItemQuantity(gameStore.getState(), itemId);
  }

  hasEnoughItems(requirements) {
    const state = gameStore.getState();
    return Object.entries(requirements).every(([itemId, quantity]) => 
      inventorySelectors.getItemQuantity(state, itemId) >= quantity
    );
  }

  getAllItems() {
    return inventorySelectors.getAllItems(gameStore.getState());
  }
}

export const inventory = new Inventory();