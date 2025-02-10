export const initialState = {
  party: {
    characters: new Map([
      ['hero-1', {  // Premier héros débloqué par défaut
        id: 'hero-1',
        name: 'Hero',
        unlockDate: Date.now(),
        level: 1,
        experience: 0,
        stats: {
          maxHp: 100,
          currentHp: 100,
          attack: 1,
          defense: 0
        },
        equipment: {
          weapon: null,
          armor: null,
          accessory: null
        },
        professions: {  // Chaque héros a ses propres niveaux de métiers
          miner: {
            level: 1,
            experience: 0
          },
          lumberjack: {
            level: 1,
            experience: 0
          }
        }
      }]
    ]),
    activeCharacterId: 'hero-1',  // Héros actuellement joué
    unlockedSlots: 1  // Nombre de slots de héros débloqués
  },

  town: {  // On prépare déjà la structure pour la ville
    level: 1,
    buildings: new Map(),
    resources: new Map(),
    unlocked: false
  },

  dungeons: {  // Structure pour les donjons multi-héros
    available: new Map(),
    completed: new Set(),
    inProgress: new Map()
  },

  raids: {  // Structure pour les raids
    available: new Map(),
    completed: new Set(),
    unlocked: false
  },

  combat: {
    zones: {  // Organisation par zones accessibles individuellement
      currentWorld: null,
      currentZone: null,
      monstersDefeated: 0,
      unlockedWorlds: { 'green_fields': true },
      unlockedZones: { 'peaceful_meadow': true }
    },
    state: {
      inCombat: false,
      autoCombatEnabled: false,
      autoCombatUnlocked: false,
      currentMonster: null
    }
  },

  inventory: {  // Inventaire global partagé
    items: new Map(),
    capacity: 50
  },

  quests: {
    individual: {  // Quêtes par héros
      active: new Map(),
      completed: new Map()  // Map de Sets pour chaque héros
    },
    global: {  // Quêtes globales (ville, raids...)
      active: new Map(),
      completed: new Set()
    }
  },

  // Paramètres globaux
  settings: {
    autoSave: true,
    language: 'fr'
  }
};