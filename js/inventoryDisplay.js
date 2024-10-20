// inventoryDisplay.js

import { playerInventory, resourceManager } from './main.js';

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
        const resource = resourceManager.getResource(resourceId);
        if (resource) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.innerHTML = `
                <img src="${resource.image}" alt="${translations.resources[resourceId] || resourceId}">
                <div class="item-count">${count}</div>
                <div class="tooltip">${translations.resources[resourceId] || resourceId}</div>
            `;
            inventoryElement.appendChild(slot);
        }
    }

    updatePagination(totalPages, translations);
}

function updatePagination(totalPages, translations) {
    const paginationElement = document.getElementById('pagination');
    paginationElement.innerHTML = '';

    if (currentPage > 1) {
        const prevButton = createPaginationButton(translations.previousPage || 'Previous', () => {
            currentPage--;
            updateInventoryDisplay(translations);
        });
        paginationElement.appendChild(prevButton);
    }

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = createPaginationButton(i.toString(), () => {
            currentPage = i;
            updateInventoryDisplay(translations);
        });
        if (i === currentPage) {
            pageButton.classList.add('current-page');
        }
        paginationElement.appendChild(pageButton);
    }

    if (currentPage < totalPages) {
        const nextButton = createPaginationButton(translations.nextPage || 'Next', () => {
            currentPage++;
            updateInventoryDisplay(translations);
        });
        paginationElement.appendChild(nextButton);
    }
}

function createPaginationButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
}