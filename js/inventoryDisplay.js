import { globalInventory } from './inventory.js';
import { globalResourceManager } from './resourceManager.js';
import { globalTranslationManager } from './translations/translationManager.js';

let currentPage = 1;
const itemsPerPage = 10;
const rowSize = 5;

// inventoryDisplay.js
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
                // Déterminer si c'est une ressource de profession ou de monstre
                let translationKey;
                if (resource.category === 'profession') {
                    // Pour les ressources de profession, on doit déterminer le type (miner, lumberjack, etc.)
                    const professionType = resource.id.includes('ore') ? 'miner' : 
                                         resource.id.includes('wood') ? 'lumberjack' : 'unknown';
                    translationKey = `resources.professions.${professionType}.${resource.id}`;
                } else {
                    // Pour les ressources de monstre
                    translationKey = `resources.monsters.${resource.id}`;
                }

                const translatedName = globalTranslationManager.translate(translationKey);
                slot.innerHTML = `
                    <img src="/${resource.image}" alt="${translatedName}">
                    <div class="item-count">${quantity}</div>
                    <div class="tooltip">${translatedName}</div>
                `;
                slot.title = translatedName;
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