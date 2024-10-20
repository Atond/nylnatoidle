export class Inventory {
    constructor() {
        this.items = {};
    }

    addItem(itemId, quantity = 1) {
        if (this.items[itemId]) {
            this.items[itemId] += quantity;
        } else {
            this.items[itemId] = quantity;
        }
    }

    removeItem(itemId, quantity = 1) {
        if (this.items[itemId]) {
            this.items[itemId] = Math.max(0, this.items[itemId] - quantity);
            if (this.items[itemId] === 0) {
                delete this.items[itemId];
            }
        }
    }

    getItemQuantity(itemId) {
        return this.items[itemId] || 0;
    }

    getAllItems() {
        return { ...this.items };
    }
}
