export const initialState = {
  party: {
    characters: {
      'hero-1': {  // Changé de Map à objet simple
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
        }
      }
    },
    activeCharacterId: 'hero-1',
    unlockedSlots: 1
  },

  professions: {
    slots: {
      perCharacter: 3,  // Nombre de slots de métiers par personnage
      available: ['miner', 'lumberjack', 'blacksmith', 'herbalist', 'alchemist'],  // Tous les métiers du jeu
      unlocked: ['miner', 'lumberjack', 'blacksmith']  // Métiers débloqués au début
    },
    characters: {
      'hero-1': {
        active: ['miner', 'lumberjack'],  // Métiers actifs pour ce héros
        levels: {  // Niveaux et expérience de chaque métier
          miner: { level: 1, exp: 0 },
          lumberjack: { level: 1, exp: 0 }
        },
        upgrades: {  // Upgrades débloqués pour chaque métier
          miner: new Set(),
          lumberjack: new Set()
        },
        stats: {  // Stats spécifiques à chaque métier
          miner: {
            miningPower: 1,
            autoCollectors: 0,
            resourceQuality: 1,
            multiCollect: 1
          },
          lumberjack: {
            miningPower: 1,
            autoCollectors: 0,
            resourceQuality: 1,
            multiCollect: 1
          }
        }
      }
    }
  },

  town: {  // Structure pour la ville
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
    },
    scaling: {  // Paramètres de scaling des monstres
      zoneMultiplier: 0.4,
      scalingPower: 2,
      levelScaling: 0.1,
      stats: {
        hp: { useFullScaling: true },
        attack: { useFullScaling: false },
        defense: { useFullScaling: false }
      }
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
    language: 'fr',
    notifications: true,
    sound: {
      effects: true,
      music: true,
      volume: 0.5
    }
  }
};