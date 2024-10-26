import { globalResourceManager } from '../resourceManager.js';
import { combatUI } from './combatUI.js';
import { globalInventory } from '../inventory.js';
import { questSystem } from '../quests/questSystem.js';
import { globalTranslationManager } from '../translations/translationManager.js';
import { character } from '../character.js'

class CombatSystem {
    constructor() {
        this.currentZone = null;
        this.currentWorld = null;
        this.monstersDefeated = 0;
        this.inCombat = false;
        this.autoCombatEnabled = false;
        this.autoCombatUnlocked = false;
        this.currentMonster = null;
        this.autoAttackInterval = null;
        this.progression = null;
        this.loadProgressionConfig();
        this.completedZones = {}; // Pour suivre les zones terminées
        this.savedProgress = new Map();
        
        this.unlockedWorlds = { 'green_fields': true }; // Premier monde débloqué par défaut
        this.unlockedZones = { 'peaceful_meadow': true }; // Première zone débloquée par défaut
        
        this.loadProgress();
        this.initialize();
        
        // Ajouter un écouteur d'événement pour le level up
        window.addEventListener('characterLevelUp', (event) => {
            const newStats = event.detail;
            if (this.player) {
                this.player.maxHp = newStats.maxHp || this.player.maxHp;
                this.player.baseAttack = newStats.attack || this.player.baseAttack;
                this.player.baseDefense = newStats.defense || this.player.baseDefense;
                this.player.currentHp = this.player.maxHp; // Restaurer les PV au maximum
                combatUI.updateUI();

            // Débloquer les quêtes au niveau 2
            if (character.level === 2) {
                this.unlockQuests();
            }
        }
        });
    }
    
    // Stats de base du joueur
    player = {
        maxHp: 100,
        currentHp: 100,
        baseAttack: 1,
        baseDefense: 0,
        equipment: {
            weapon: null,
            armor: null,
            accessory: null
        },
        
        // Calcul des stats totales avec l'équipement
        getTotalStats() {
            let totalAttack = this.baseAttack;
            let totalDefense = this.baseDefense;
            
            Object.values(this.equipment).forEach(item => {
                if (item) {
                    totalAttack += item.attack || 0;
                    totalDefense += item.defense || 0;
                }
            });
            
            return { 
                attack: totalAttack, 
                defense: totalDefense,
                maxHp: this.maxHp // Ajouter maxHp aux stats
            };
        }
    };
    
    async loadProgressionConfig() {
        try {
            const response = await fetch('/data/gameProgression.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.progression = await response.json();
            
            // Vérifier que la configuration est valide
            if (!this.progression || !this.progression.worldProgression) {
                throw new Error('Invalid progression configuration');
            }
        } catch (error) {
            console.error('Failed to load progression config:', error);
            this.progression = {
                // Configuration par défaut en cas d'erreur
                worldProgression: [],
                scaling: {
                    zoneMultiplier: 0.4,
                    scalingPower: 2,
                    levelScaling: 0.1,
                    stats: {
                        hp: { useFullScaling: true },
                        attack: { useFullScaling: false },
                        defense: { useFullScaling: false }
                    }
                }
            };
        }
    }
    
    async initialize() {
        try {
            // Charger d'abord la configuration
            await this.loadProgressionConfig();
            
            // Une fois la configuration chargée, initialiser la première zone
            const success = await this.initZone('peaceful_meadow', 'green_fields');
            
            if (!success) {
                throw new Error('Failed to initialize first zone');
            }
        } catch (error) {
            console.error('Failed to initialize combat system:', error);
            combatUI.addCombatLog(globalTranslationManager.translate('ui.errorLoading'));
        }
    }
    
    async loadWorldData(worldId) {
        try {
            // Charger les données du monde et des monstres
            const [worldMapResponse, monstersResponse] = await Promise.all([
                fetch('/data/worldMap.json'),
                fetch('/data/monsters.json')
            ]);
            
            const [worldMapData, monstersData] = await Promise.all([
                worldMapResponse.json(),
                monstersResponse.json()
            ]);
            
            // Trouver le monde demandé
            const world = worldMapData.worlds.find(w => w.id === worldId);
            if (!world) return null;
            
            // Créer un dictionnaire des monstres pour un accès rapide
            const monstersDict = monstersData.monsters.reduce((acc, monster) => {
                acc[monster.id] = monster;
                return acc;
            }, {});
            
            // Enrichir les données des zones avec les informations complètes des monstres
            const enrichedWorld = {
                ...world,
                zones: world.zones.map(zone => ({
                    ...zone,
                    monsters: zone.monsters.map(monsterRef => {
                        const monsterData = monstersDict[monsterRef.id];
                        if (!monsterData) {
                            console.error(`Monster ${monsterRef.id} not found in monsters.json`);
                            return null;
                        }
                        return {
                            ...monsterData,
                            spawnRate: monsterRef.spawnRate,
                            levelRange: monsterRef.levelRange || [1, 1]
                        };
                    }).filter(Boolean) // Enlever les monstres null
                }))
            };
            
            return enrichedWorld;
        } catch (error) {
            console.error('Error loading world data:', error);
            return null;
        }
    }
    
    getCurrentZone() {
        return this.currentZone;
    }
    
    canUnlockZone(worldId, zoneId) {
        const worldConfig = this.progression.worldProgression.find(w => w.id === worldId);
        if (!worldConfig) return false;
        
        const zoneConfig = worldConfig.zones.find(z => z.id === zoneId);
        if (!zoneConfig) return false;
        
        // Vérifier les prérequis du monde si c'est un nouveau monde
        if (worldConfig.requirements) {
            if (worldConfig.requirements.completedQuests) {
                for (const questId of worldConfig.requirements.completedQuests) {
                    if (!questSystem.isQuestCompleted(questId)) return false;
                }
            }
        }
        
        // Vérifier les prérequis de la zone
        const requirements = zoneConfig.requirements;
        
        // Vérifier le nombre de monstres tués dans la zone précédente
        if (requirements.monstersPerZone) {
            const previousZone = this.getCurrentZone();
            if (previousZone && this.monstersDefeated < requirements.monstersPerZone) {
                return false;
            }
        }
        
        // Vérifier les quêtes requises
        if (requirements.completedQuests) {
            for (const questId of requirements.completedQuests) {
                if (!questSystem.isQuestCompleted(questId)) return false;
            }
        }
        
        return true;
    }
    
    isWorldUnlocked(worldId) {
        return this.unlockedWorlds[worldId] === true;
    }
    
    isZoneUnlocked(zoneId) {
        return this.unlockedZones[zoneId] === true;
    }
    
    unlockWorld(worldId) {
        if (!this.unlockedWorlds[worldId]) {
            this.unlockedWorlds[worldId] = true;
            combatUI.addCombatLog(
                globalTranslationManager.translate('ui.worldUnlocked')
                .replace('{world}', globalTranslationManager.translate(`worlds.${worldId}`))
            );
        }
    }
    
    unlockZone(zoneId) {
        if (!this.unlockedZones[zoneId]) {
            this.unlockedZones[zoneId] = true;
            combatUI.addCombatLog(
                globalTranslationManager.translate('ui.zoneUnlocked')
                .replace('{zone}', globalTranslationManager.translate(`zones.${zoneId}`))
            );
        }
    }
    
    async initZone(zoneId, worldId) {
        if (!this.isWorldUnlocked(worldId)) {
            console.warn(`Trying to access locked world: ${worldId}`);
            return false;
        }
        
        if (!this.isZoneUnlocked(zoneId)) {
            console.warn(`Trying to access locked zone: ${zoneId}`);
            return false;
        }
        
        const world = await this.loadWorldData(worldId);
        if (!world) return false;
        
        const zone = world.zones.find(z => z.id === zoneId);
        if (!zone) return false;
        
        this.currentWorld = world;
        this.currentZone = {
            ...zone,
            progress: 0,
            monstersDefeated: this.monstersDefeated, // Gardons le nombre actuel de monstres tués
            isBossZone: zone.hasBoss
        };
        
        // Réinitialiser l'état du combat
        this.inCombat = false;
        this.currentMonster = null;
        
        // Faire apparaître un monstre immédiatement
        await this.startCombat();
        
        return true;
    }
    
    
    calculateMonsterLevel(monster) {
        if (!monster.levelRange) return 1;
        const [min, max] = monster.levelRange;
        return Math.floor(min + Math.random() * (max - min + 1));
    }
    
    scaleMonsterStats(baseStats, level, zoneIndex) {
        // Paramètres de scaling
        const a = 0.4; // Facteur de progression par zone
        const b = 2;   // Exposant pour la courbe de progression
        
        // Calcul du multiplicateur de zone
        const zoneMultiplier = Math.pow(1 + a * zoneIndex, b);
        
        // Scaling de niveau classique
        const levelScaling = 1 + (level - 1) * 0.1;
        
        // Application des deux facteurs
        return Object.entries(baseStats).reduce((acc, [stat, value]) => {
            // Scaling plus important pour les HP
            if (stat === 'hp') {
                acc[stat] = Math.floor(value * zoneMultiplier * levelScaling);
            } else {
                // Scaling plus modéré pour l'attaque et la défense
                acc[stat] = Math.floor(value * Math.sqrt(zoneMultiplier) * levelScaling);
            }
            return acc;
        }, {});
    }
    
    selectRandomMonster(monsters) {
        if (!monsters || monsters.length === 0) return null;
        
        // Calculer la somme totale des taux d'apparition
        const totalSpawnRate = monsters.reduce((sum, m) => sum + m.spawnRate, 0);
        let random = Math.random() * totalSpawnRate;
        
        // Sélectionner un monstre en fonction de son taux d'apparition
        for (const monster of monsters) {
            random -= monster.spawnRate;
            if (random <= 0) {
                return {
                    ...monster,
                    maxHp: monster.baseStats.hp,
                    currentHp: monster.baseStats.hp,
                    stats: { ...monster.baseStats }
                };
            }
        }
        return null;
    }
    
    generateMonster() {
        if (!this.currentZone) return null;
        
        // S'assurer que la progression est chargée
        if (!this.progression) {
            console.error('Progression configuration not loaded');
            return null;
        }
        
        const monsterTemplate = this.currentZone.isBossZone && this.monstersDefeated >= 9
        ? this.currentZone.boss
        : this.selectRandomMonster(this.currentZone.monsters);
        
        if (!monsterTemplate) return null;
        
        const level = this.calculateMonsterLevel(monsterTemplate);
        
        // Calculer l'index global de la zone
        const zoneIndex = this.currentWorld.zones.findIndex(z => z.id === this.currentZone.id);
        const worldIndex = this.progression.worldProgression.findIndex(w => w.id === this.currentWorld.id);
        const globalZoneIndex = worldIndex * 100 + zoneIndex;
        
        const stats = this.scaleMonsterStats(monsterTemplate.baseStats, level, globalZoneIndex);
        
        return {
            ...monsterTemplate,
            level,
            maxHp: stats.hp,
            currentHp: stats.hp,
            stats
        };
    }
    
    // Combat
    async startCombat() {
        if (this.inCombat) return;
        
        this.currentMonster = await this.generateMonster();
        if (!this.currentMonster) return;
        
        this.inCombat = true;
        combatUI.updateUI();
    }
    
    attack() {
        if (!this.inCombat || !this.currentMonster) return;
        
        const playerStats = this.player.getTotalStats();
        const playerDamage = this.calculateDamage(
            playerStats.attack,
            this.currentMonster.stats.defense
        );
        
        combatUI.addDamageLog('Joueur', this.currentMonster, playerDamage);
        this.currentMonster.currentHp -= playerDamage;
        
        // Le monstre contre-attaque s'il est encore vivant
    if (this.currentMonster.currentHp > 0) {
        const monsterDamage = this.calculateDamage(
            this.currentMonster.stats.attack,
            playerStats.defense  // Utiliser les stats totales ici aussi
        );
        this.player.currentHp -= monsterDamage;
        combatUI.addDamageLog(this.currentMonster, 'Joueur', monsterDamage);
    }
        
        // Vérifier la défaite du joueur
        if (this.player.currentHp <= 0) {
            this.handleDefeat();
            return;
        }
        
        // Vérifier la victoire
        if (this.currentMonster.currentHp <= 0) {
            this.handleVictory(this.currentMonster);
        } else {
            combatUI.updateUI();
        }
    }
    
    calculateMonsterExperience(monster) {
        if (!monster.baseExperience) return 0;
        
        // Expérience de base plus modérée
        let experience = monster.baseExperience;
        
        // Bonus de niveau réduit
        const levelBonus = 1 + (monster.level - 1) * 0.05; // 5% par niveau au lieu de 10%
        
        // Bonus de zone plus modéré
        const zoneIndex = this.currentWorld.zones.findIndex(z => z.id === this.currentZone.id);
        const zoneBonus = 1 + zoneIndex * 0.1; // 10% par zone au lieu de 20%
        
        // Bonus pour les monstres spéciaux ajustés
        const rarityMultiplier = monster.isRare ? 1.5 : (monster.isBoss ? 3 : 1);
        
        experience = Math.floor(experience * levelBonus * zoneBonus * rarityMultiplier);
        
        return experience;
    }
    
    autoAttack() {
        if (!this.inCombat || !this.currentMonster) {
            this.startCombat();
            return;
        }
        
        this.attack();
    }
    
    // Gestion de la victoire
    handleVictory(monster) {
        if (!monster) return; // Protection contre monster undefined
        
        this.inCombat = false;
        this.monstersDefeated++;
        
        // Sauvegarder la progression
        this.savedProgress.set(this.currentZone.id, {
            monstersDefeated: this.monstersDefeated,
            worldId: this.currentWorld.id
        });
        
        this.saveProgress();
        
        // Générer le butin et expérience
        const loot = this.generateLoot(monster);
        const experience = this.calculateMonsterExperience(monster);

        if (experience > 0) {
            character.addExperience(experience); // Ajout de cette ligne
            combatUI.addExperienceLog(experience);
        }

        loot.forEach(item => {
            globalInventory.addItem(item.id, item.quantity);
            combatUI.addLootLog(globalResourceManager.getResourceName(item.id), item.quantity);
        });
        
        // Ajouter le message de victoire après le butin
        combatUI.addVictoryLog(monster);
        
        // Vérifier la complétion de zone
        if (this.monstersDefeated >= 10) {
            this.completeZone();
            if (!this.autoCombatUnlocked && this.currentZone?.id === 'peaceful_meadow') {
                this.unlockAutoCombat();
            }
        } 
        
        setTimeout(() => this.startCombat(), 1000);
        
        combatUI.updateUI();
    }
    
    // Gestion de la défaite
    handleDefeat() {
        combatUI.addDefeatLog();
        this.inCombat = false;
        this.player.currentHp = this.player.maxHp; // Réinitialiser les HP
        this.monstersDefeated = 0;
        this.currentMonster = null;
        
        // Arrêter l'auto-combat
        this.autoCombatEnabled = false;
        if (this.autoAttackInterval) {
            clearInterval(this.autoAttackInterval);
            this.autoAttackInterval = null;
        }
        
        // Important: Redémarrer le combat après un court délai
        setTimeout(() => {
            this.startCombat();
        }, 1000);
    }
    
    unlockAutoCombat() {
        this.autoCombatUnlocked = true;
        combatUI.showAutoCombatButton(); // Nouvelle méthode dans CombatUI
        combatUI.addCombatLog(globalTranslationManager.translate('ui.autoCombatUnlocked'));
        
        // Déclencher la quête de l'épée
        questSystem.startQuest('craft_sword_quest');
    }
    
    generateLoot(monster) {
        if (!monster.loot) return [];
        
        const lootItems = [];
        
        // Pour chaque item possible dans la table de loot du monstre
        monster.loot.forEach(lootEntry => {
            const { resourceId, chance, minQuantity, maxQuantity } = lootEntry;
            
            // Vérifier si l'item est obtenu basé sur sa chance
            if (Math.random() < chance) {
                // Calculer la quantité aléatoire entre min et max
                const quantity = minQuantity === maxQuantity ? 
                minQuantity : 
                Math.floor(Math.random() * (maxQuantity - minQuantity + 1)) + minQuantity;
                
                lootItems.push({
                    id: resourceId,
                    quantity: quantity
                });
            }
        });
        
        return lootItems;
    }
    
    returnToPreviousZone() {
        const currentZoneIndex = this.currentWorld.zones.findIndex(z => z.id === this.currentZone.id);
        if (currentZoneIndex > 0) {
            // Retourner à la zone précédente
            this.initZone(this.currentWorld.zones[currentZoneIndex - 1].id, this.currentWorld.id);
        } else {
            // Déjà dans la première zone
            this.initZone(this.currentZone.id, this.currentWorld.id);
        }
    }
    
    // Méthodes utilitaires
    calculateDamage(attack, defense) {
        attack = Number(attack) || 0;
        defense = Number(defense) || 0;
        
        const baseDamage = Math.max(0, attack - defense/2);
        const finalDamage = Math.floor(baseDamage * (0.9 + Math.random() * 0.2));
        
        return finalDamage;
    }
    
    scaleMonsterStats(baseStats, level, zoneIndex) {
        if (!this.progression || !this.progression.scaling) {
            // Valeurs par défaut si la configuration n'est pas chargée
            return this.defaultScaling(baseStats, level, zoneIndex);
        }
        
        const scaling = this.progression.scaling;
        const a = scaling.zoneMultiplier;
        const b = scaling.scalingPower;
        const levelScaling = scaling.levelScaling;
        
        // Calcul du multiplicateur de zone
        const zoneMultiplier = Math.pow(1 + a * zoneIndex, b);
        
        // Scaling de niveau
        const levelMultiplier = 1 + (level - 1) * levelScaling;
        
        return Object.entries(baseStats).reduce((acc, [stat, value]) => {
            // Vérifier si cette stat utilise le scaling complet
            const useFullScaling = scaling.stats[stat]?.useFullScaling ?? false;
            
            if (useFullScaling) {
                // Scaling complet pour les HP
                acc[stat] = Math.floor(value * zoneMultiplier * levelMultiplier);
            } else {
                // Scaling réduit pour les autres stats (racine carrée)
                acc[stat] = Math.floor(value * Math.sqrt(zoneMultiplier) * levelMultiplier);
            }
            return acc;
        }, {});
    }
    
    defaultScaling(baseStats, level, zoneIndex) {
        // Méthode de fallback avec les valeurs par défaut
        const a = 0.4;
        const b = 2;
        const levelScaling = 0.1;
        
        const zoneMultiplier = Math.pow(1 + a * zoneIndex, b);
        const levelMultiplier = 1 + (level - 1) * levelScaling;
        
        return Object.entries(baseStats).reduce((acc, [stat, value]) => {
            if (stat === 'hp') {
                acc[stat] = Math.floor(value * zoneMultiplier * levelMultiplier);
            } else {
                acc[stat] = Math.floor(value * Math.sqrt(zoneMultiplier) * levelMultiplier);
            }
            return acc;
        }, {});
    }
    
    toggleAutoCombat() {
        this.autoCombatEnabled = !this.autoCombatEnabled;
        
        if (this.autoCombatEnabled) {
            if (!this.inCombat) {
                this.startCombat();
            }
            // Démarrer les attaques automatiques
            this.autoAttackInterval = setInterval(() => this.autoAttack(), 1000);
        } else {
            // Arrêter les attaques automatiques
            if (this.autoAttackInterval) {
                clearInterval(this.autoAttackInterval);
                this.autoAttackInterval = null;
            }
        }
    }
    
    completeZone() {
        if (!this.currentWorld || !this.currentZone) return;
        
        combatUI.addCombatLog(globalTranslationManager.translate('ui.zoneCompleted'));
        
        // Chercher la prochaine zone disponible
        const currentWorldConfig = this.progression.worldProgression.find(
            w => w.id === this.currentWorld.id
        );
        
        if (!currentWorldConfig) return;
        
        const currentZoneIndex = currentWorldConfig.zones.findIndex(
            z => z.id === this.currentZone.id
        );
        
        // Vérifier la prochaine zone dans le monde actuel
        if (currentZoneIndex < currentWorldConfig.zones.length - 1) {
            const nextZone = currentWorldConfig.zones[currentZoneIndex + 1];
            if (this.canUnlockZone(this.currentWorld.id, nextZone.id)) {
                this.unlockZone(nextZone.id);
                this.initZone(nextZone.id, this.currentWorld.id);
                return;
            }
        }
        
        // Chercher le prochain monde si on est à la dernière zone
        const currentWorldIndex = this.progression.worldProgression.findIndex(
            w => w.id === this.currentWorld.id
        );
        
        if (currentWorldIndex < this.progression.worldProgression.length - 1) {
            const nextWorld = this.progression.worldProgression[currentWorldIndex + 1];
            if (nextWorld.zones.length > 0) {
                const firstZone = nextWorld.zones[0];
                if (this.canUnlockZone(nextWorld.id, firstZone.id)) {
                    this.unlockWorld(nextWorld.id);
                    this.unlockZone(firstZone.id);
                    this.initZone(firstZone.id, nextWorld.id);
                    return;
                }
            }
        }
        combatUI.addCombatLog(globalTranslationManager.translate('ui.worldCompleted'));
    }
    
    async startCombat() {
        if (this.inCombat) return;
        
        if (this.player.currentHp <= 0) {
            this.player.currentHp = this.player.maxHp;
        }
        
        this.currentMonster = await this.generateMonster();
        if (!this.currentMonster) return;
        
        this.inCombat = true;
        combatUI.updateUI();
    }

    unlockQuests() {
        // Créer et afficher la zone de quêtes
        const combatTab = document.getElementById('combat-tab');
        const questsContainer = document.createElement('div');
        questsContainer.id = 'quests-container';
        questsContainer.className = 'quests-section card mt-4';
        questsContainer.innerHTML = `
            <h2 class="card-title">Quêtes</h2>
            <div id="active-quests" class="quests-list"></div>
        `;
        combatTab.appendChild(questsContainer);

        // Démarrer la première quête
        questSystem.startQuest('beginnerQuest');
        questSystem.updateQuestDisplay();
    }
    
    saveProgress() {
        const progressData = {
            savedProgress: Array.from(this.savedProgress.entries()),
            unlockedWorlds: this.unlockedWorlds,
            unlockedZones: this.unlockedZones,
            autoCombatUnlocked: this.autoCombatUnlocked
        };
        localStorage.setItem('combatProgress', JSON.stringify(progressData));
    }
    
    loadProgress() {
        const saved = localStorage.getItem('combatProgress');
        if (saved) {
            const data = JSON.parse(saved);
            this.savedProgress = new Map(data.savedProgress);
            this.unlockedWorlds = data.unlockedWorlds;
            this.unlockedZones = data.unlockedZones;
            this.autoCombatUnlocked = data.autoCombatUnlocked;
        }
    }
}

export const combatSystem = new CombatSystem();