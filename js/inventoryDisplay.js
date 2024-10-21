import { getResourceData } from './resourceManager.js';
import { playerInventory, currentTranslations } from './main.js';

let currentPage = 1;
const itemsPerPage = 10;

export function updateInventoryDisplay(translations) {
    const inventoryElement = document.getElementById('profession-inventory');
    const allItems = playerInventory.getAllItems();
    const totalItems = Object.keys(allItems).length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    inventoryElement.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const itemsToDisplay = Object.entries(allItems).slice(startIndex, endIndex);

    for (const [resourceId, count] of itemsToDisplay) {
        const resource = resourceManager.getResource(resourceId); // Use resourceManager to get resource data
        if (resource) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.innerHTML = `
                <img src="${resource.image}" alt="${translations.resources[resourceId]}">
                <div class="item-count">${count}</div>
                <div class="tooltip">${translations.resources[resourceId]}</div>
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