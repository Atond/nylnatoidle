import { globalInventory } from './inventory.js';
import { globalResourceManager } from './resourceManager.js';
import { globalTranslationManager } from './translations/translationManager.js';

let currentPage = 1;
const itemsPerPage = 10;
const rowSize = 5;

export function updateInventoryDisplay() {
    const inventoryElement = document.getElementById('profession-inventory');
    if (!inventoryElement) return;

    const allItems = globalInventory.getAllItems();
    const totalItems = allItems.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    inventoryElement.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const itemsToDisplay = allItems.slice(startIndex, endIndex);

    const grid = document.createElement('div');
    grid.className = 'inventory-grid';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${rowSize}, 1fr)`;
    grid.style.gap = '10px';

    for (let i = 0; i < itemsPerPage; i++) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';

        if (i < itemsToDisplay.length) {
            const { resource, quantity } = itemsToDisplay[i];
            if (resource) {
                const resourceName = globalResourceManager.getResourceName(resource.id);
                slot.innerHTML = `
                    <img src="/${resource.image}" alt="${resourceName}">
                    <div class="item-count">${quantity}</div>
                    <div class="tooltip">${resourceName}</div>
                `;
                slot.title = resourceName;
            }
        } else {
            slot.innerHTML = '<div class="empty-slot"></div>';
        }

        grid.appendChild(slot);
    }

    inventoryElement.appendChild(grid);

    // Mise à jour de la pagination
    const paginationElement = document.getElementById('pagination');
    if (paginationElement) {
        paginationElement.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.innerText = i;
            if (i === currentPage) {
                pageButton.classList.add('current-page');
            }
            pageButton.addEventListener('click', () => {
                currentPage = i;
                updateInventoryDisplay();
            });
            paginationElement.appendChild(pageButton);
        }
    }
}