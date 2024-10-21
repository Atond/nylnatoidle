import { globalInventory } from './inventory.js';
import { globalResourceManager } from './resourceManager.js';

let currentPage = 1;
const itemsPerPage = 10;

export function updateInventoryDisplay(translations) {
    const inventoryElement = document.getElementById('profession-inventory');
    const allItems = globalInventory.getAllItems();
    const totalItems = allItems.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    inventoryElement.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const itemsToDisplay = allItems.slice(startIndex, endIndex);

    for (const { resource, quantity } of itemsToDisplay) {
        if (resource) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.innerHTML = `
                <img src="${resource.image}" alt="${translations.resources[resource.id]}">
                <div class="item-count">${quantity}</div>
                <div class="tooltip">${translations.resources[resource.id]}</div>
            `;
            inventoryElement.appendChild(slot);
        }
    }

    const paginationElement = document.getElementById('pagination');
    paginationElement.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.innerText = i;
        pageButton.addEventListener('click', () => {
            currentPage = i;
            updateInventoryDisplay(translations);
        });
        paginationElement.appendChild(pageButton);
    }
}