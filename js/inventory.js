import { globalResourceManager } from './resourceManager.js';

export class Inventory {
    constructor() {
        this.items = new Map();
    }

    addItem(resourceId, quantity = 1) {
        const currentQuantity = this.items.get(resourceId) || 0;
        this.items.set(resourceId, currentQuantity + quantity);
    }

    removeItem(resourceId, quantity = 1) {
        const currentQuantity = this.items.get(resourceId) || 0;
        const newQuantity = Math.max(0, currentQuantity - quantity);
        if (newQuantity === 0) {
            this.items.delete(resourceId);
        } else {
            this.items.set(resourceId, newQuantity);
        }
    }

    getItemQuantity(resourceId) {
        return this.items.get(resourceId) || 0;
    }

    getAllItems() {
        return Array.from(this.items.entries()).map(([resourceId, quantity]) => {
            const resource = globalResourceManager.getResource(resourceId);
            return { resource, quantity };
        });
    }
}

// Créer une instance globale
export const globalInventory = new Inventory();