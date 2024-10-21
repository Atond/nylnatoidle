import { globalInventory } from './inventory.js';
import { globalResourceManager } from './resourceManager.js';

let currentPage = 1;
const itemsPerPage = 10;
const rowSize = 5; // Nombre d'éléments par ligne

export function updateInventoryDisplay(translations) {
    const inventoryElement = document.getElementById('profession-inventory');
    const allItems = globalInventory.getAllItems();
    const totalItems = allItems.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    inventoryElement.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const itemsToDisplay = allItems.slice(startIndex, endIndex);

    // Créer une grille de 2x5
    const grid = document.createElement('div');
    grid.className = 'inventory-grid';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${rowSize}, 1fr)`;
    grid.style.gap = '10px';

    // Remplir la grille avec des emplacements (vides ou avec des ressources)
    for (let i = 0; i < itemsPerPage; i++) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';

        if (i < itemsToDisplay.length) {
            const { resource, quantity } = itemsToDisplay[i];
            if (resource) {
                slot.innerHTML = `
                    <img src="${resource.image}" alt="${translations && translations.resources ? translations.resources[resource.id] : resource.id}">
                    <div class="item-count">${quantity}</div>
                    <div class="tooltip">${translations && translations.resources ? translations.resources[resource.id] : resource.id}</div>
                `;
            }
        } else {
            slot.innerHTML = '<div class="empty-slot"></div>';
        }

        grid.appendChild(slot);
    }

    inventoryElement.appendChild(grid);

    // Mise à jour de la pagination
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