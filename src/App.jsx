import React, { useState, useEffect } from 'react'
import ProfessionsUI from './ui/professions/ProfessionsUI'
import CombatUI from './ui/combat/CombatUI'
import InventoryComponent from './ui/inventory/InventoryComponent'
import { gameService } from './services/GameService'

function App() {
  const [activeTab, setActiveTab] = useState('combat')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const initGame = async () => {
      try {
        await gameService.initialize();
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize game:', error);
        setError('Failed to initialize game. Please try refreshing the page.');
        setIsLoading(false);
      }
    };

    initGame();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-indigo-600">Idle RPG</span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('combat')}
                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md
                  ${activeTab === 'combat' 
                    ? 'text-white bg-indigo-600 hover:bg-indigo-700' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Combat
              </button>
              <button
                onClick={() => setActiveTab('professions')}
                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md
                  ${activeTab === 'professions' 
                    ? 'text-white bg-indigo-600 hover:bg-indigo-700' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Métiers
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md
                  ${activeTab === 'inventory' 
                    ? 'text-white bg-indigo-600 hover:bg-indigo-700' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Inventaire
              </button>
              <button
                onClick={() => setActiveTab('character')}
                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md
                  ${activeTab === 'character' 
                    ? 'text-white bg-indigo-600 hover:bg-indigo-700' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Personnage
              </button>
            </div>

            {/* Character Info */}
            <div className="flex items-center">
              <div className="text-sm">
                <p className="text-gray-900 font-medium">Hero</p>
                <p className="text-gray-500">Niveau 1</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'combat' && <CombatUI />}
        {activeTab === 'professions' && <ProfessionsUI />}
        {activeTab === 'inventory' && <InventoryComponent />}
        {activeTab === 'character' && (
          <div>Character UI ici</div>
        )}
      </main>
    </div>
  )
}

export default App