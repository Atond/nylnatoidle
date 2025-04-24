import React, { useEffect, useRef } from 'react';
import { inventoryUI } from './InventoryUI';
import './inventory.css';


const InventoryComponent = () => {
  const inventoryContainerRef = useRef(null);
  const paginationRef = useRef(null);
  const professionTabRef = useRef(null);
  const combatTabRef = useRef(null);

  useEffect(() => {
    // Set up DOM elements for the InventoryUI class to use
    const container = inventoryContainerRef.current;
    const pagination = paginationRef.current;
    const professionTab = professionTabRef.current;
    const combatTab = combatTabRef.current;

    // Override the elements in the inventoryUI instance
    if (inventoryUI && container) {
      inventoryUI.elements = {
        ...inventoryUI.elements,
        container,
        pagination,
        tabs: {
          profession: professionTab,
          combat: combatTab
        }
      };

      // Re-initialize the grid
      if (!inventoryUI.elements.grid) {
        const grid = document.createElement('div');
        grid.className = 'inventory-grid';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = `repeat(${inventoryUI.rowSize}, 1fr)`;
        grid.style.gap = '10px';
        container.appendChild(grid);
        inventoryUI.elements.grid = grid;
      }

      // Update the display to show inventory items
      inventoryUI.updateDisplay();
    }
  }, []);

  return (
    <div className="inventory-container">
      <h2 className="text-xl font-bold mb-4">Inventory</h2>
      
      <div className="flex mb-4">
        <button 
          ref={professionTabRef}
          id="profession-resources"
          className="px-4 py-2 mr-2 bg-blue-500 text-white rounded"
        >
          Profession Resources
        </button>
        <button 
          ref={combatTabRef}
          id="combat-resources"
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Combat Resources
        </button>
      </div>

      <div 
        ref={inventoryContainerRef}
        id="profession-inventory"
        className="bg-gray-100 p-4 rounded-lg mb-4"
        style={{ minHeight: '300px' }}
      >
        {/* The inventory grid will be inserted here by InventoryUI */}
      </div>

      <div 
        ref={paginationRef}
        id="pagination"
        className="flex justify-center space-x-2"
      >
        {/* Pagination buttons will be inserted here by InventoryUI */}
      </div>
    </div>
  );
};

export default InventoryComponent;