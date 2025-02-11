import { gameStore } from '../store/GameStore';
import { combatSelectors } from '../store/actions/combat';
import { globalTranslationManager } from '../translations/translationManager.js';

class CombatUI {
    constructor() {
        this.elements = {};
        this.initializeElements();
        this.bindEvents();
        this.setupStoreSubscriptions();
    }

    initializeElements() {
        // Player elements
        this.elements.player = {
            health: document.getElementById('player-health'),
            healthText: document.getElementById('player-health-text'),
            attack: document.getElementById('player-attack'),
            defense: document.getElementById('player-defense'),
            exp: document.getElementById('player-exp'),
            expBar: document.getElementById('player-exp-bar')
        };

        // Monster elements
        this.elements.monster = {
            health: document.getElementById('monster-health'),
            healthText: document.getElementById('monster-health-text'),
            name: document.getElementById('monster-name'),
            level: document.getElementById('monster-level'),
            image: document.getElementById('monster-image'),
            attack: document.getElementById('monster-attack'),
            defense: document.getElementById('monster-defense')
        };

        // Combat controls
        this.elements.controls = {
            attackButton: document.getElementById('attack-btn'),
            autoCombatButton: document.getElementById('auto-combat-btn')
        };

        // Logs
        this.elements.logs = {
            combat: document.getElementById('combat-log'),
            progression: document.getElementById('progression-log')
        };

        // Zone progress
        this.elements.zone = {
            progress: document.getElementById('zone-progress'),
            progressText: document.getElementById('zone-progress-text'),
            currentZone: document.getElementById('current-zone')
        };
    }

    setupStoreSubscriptions() {
        // Écouter les changements de combat
        gameStore.subscribe('combat', (state) => {
            this.updateCombatUI(state);
        });

        // Écouter les changements du personnage actif
        gameStore.subscribe('party.characters', (state) => {
            this.updatePlayerUI(state);
        });

        // Écouter les changements de zone
        gameStore.subscribe('combat.zones', (state) => {
            this.updateZoneUI(state);
        });
    }

    bindEvents() {
        // Combat controls
        if (this.elements.controls.attackButton) {
            this.elements.controls.attackButton.addEventListener('click', () => {
                combatSystem.attack();
            });
        }

        if (this.elements.controls.autoCombatButton) {
            this.elements.controls.autoCombatButton.addEventListener('click', () => {
                combatSystem.toggleAutoCombat();
            });
        }
    }

    // src/ui/combat/CombatUI.js (suite)

    updateCombatUI(state) {
        const monster = combatSelectors.getCurrentMonster(state);
        const inCombat = combatSelectors.isInCombat(state);

        // Mise à jour du monstre
        if (monster && inCombat) {
            this.updateMonsterStats(monster);
        } else {
            this.resetMonsterDisplay();
        }

        // Mise à jour des contrôles
        this.updateCombatControls(state);
    }

    updateMonsterStats(monster) {
        const elements = this.elements.monster;
        
        // Barre de vie
        const healthPercent = (monster.currentHp / monster.maxHp) * 100;
        elements.health.style.width = `${healthPercent}%`;
        elements.healthText.textContent = globalTranslationManager.translate('ui.health')
            .replace('{current}', Math.round(monster.currentHp))
            .replace('{max}', monster.maxHp);

        // Informations du monstre
        elements.name.textContent = globalTranslationManager.translate(`monsters.${monster.id}`);
        elements.level.textContent = globalTranslationManager.translate('ui.level')
            .replace('{level}', monster.level);
        elements.attack.textContent = globalTranslationManager.translate('ui.monster_attack_stat')
            .replace('{value}', monster.stats.attack);
        elements.defense.textContent = globalTranslationManager.translate('ui.monster_defense_stat')
            .replace('{value}', monster.stats.defense);

        // Image
        elements.image.style.visibility = 'visible';
        elements.image.src = monster.image || '/api/placeholder/150/150';
    }

    resetMonsterDisplay() {
        const elements = this.elements.monster;
        
        elements.health.style.width = '0%';
        elements.healthText.textContent = '???/???';
        elements.name.textContent = globalTranslationManager.translate('ui.noMonster');
        elements.level.textContent = '';
        elements.attack.textContent = '';
        elements.defense.textContent = '';
        elements.image.style.visibility = 'hidden';
    }

    updatePlayerUI(state) {
        const activeChar = state.party.characters.get(state.party.activeCharacterId);
        const elements = this.elements.player;

        // Barre de vie
        const healthPercent = (activeChar.stats.currentHp / activeChar.stats.maxHp) * 100;
        elements.health.style.width = `${healthPercent}%`;
        elements.healthText.textContent = globalTranslationManager.translate('ui.health')
            .replace('{current}', Math.round(activeChar.stats.currentHp))
            .replace('{max}', activeChar.stats.maxHp);

        // Stats
        elements.attack.textContent = globalTranslationManager.translate('ui.attack_stat')
            .replace('{value}', activeChar.stats.attack);
        elements.defense.textContent = globalTranslationManager.translate('ui.defense_stat')
            .replace('{value}', activeChar.stats.defense);

        // Expérience
        const expForNextLevel = this.calculateExpForNextLevel(activeChar.level);
        const expPercent = (activeChar.experience / expForNextLevel) * 100;
        elements.expBar.style.width = `${expPercent}%`;
        elements.exp.textContent = `${activeChar.experience}/${expForNextLevel}`;
    }

    updateZoneUI(state) {
        const elements = this.elements.zone;
        const currentZone = state.combat.zones.currentZone;
        
        if (currentZone) {
            const progress = (state.combat.zones.monstersDefeated / 10) * 100;
            elements.progress.style.width = `${progress}%`;
            elements.progressText.textContent = globalTranslationManager.translate('ui.progress')
                .replace('{current}', state.combat.zones.monstersDefeated)
                .replace('{max}', 10);
            elements.currentZone.textContent = globalTranslationManager.translate('ui.zone')
                .replace('{name}', globalTranslationManager.translate(`zones.${currentZone}`));
        }
    }

    updateCombatControls(state) {
        const elements = this.elements.controls;
        const activeChar = state.party.characters.get(state.party.activeCharacterId);
        
        // Bouton d'attaque
        const attackDisabled = !combatSelectors.isInCombat(state) || activeChar.stats.currentHp <= 0;
        elements.attackButton.disabled = attackDisabled;
        elements.attackButton.classList.toggle('opacity-50', attackDisabled);
        elements.attackButton.classList.toggle('cursor-not-allowed', attackDisabled);

        // Bouton d'auto-combat
        if (state.combat.state.autoCombatUnlocked) {
            elements.autoCombatButton.style.display = 'flex';
            const autoCombatDisabled = activeChar.stats.currentHp <= 0;
            elements.autoCombatButton.disabled = autoCombatDisabled;
            elements.autoCombatButton.classList.toggle('opacity-50', autoCombatDisabled);
            
            // Mise à jour de l'icône
            const isEnabled = combatSelectors.isAutoCombatEnabled(state);
            elements.autoCombatButton.innerHTML = `
                <i data-lucide="${isEnabled ? 'pause' : 'play'}" class="w-4 h-4"></i>
                ${globalTranslationManager.translate('ui.autoCombat').replace(
                    '{state}', 
                    globalTranslationManager.translate(isEnabled ? 'ui.autoCombatOn' : 'ui.autoCombatOff')
                )}
            `;
            lucide.createIcons();
        }
    }

    addCombatLog(message, type = 'combat') {
        const logElement = document.createElement('div');
        logElement.className = `${type}-message`;
        logElement.textContent = message;
        
        const targetLog = this.elements.logs[type === 'combat' ? 'combat' : 'progression'];
        if (targetLog) {
            targetLog.appendChild(logElement);
            while (targetLog.children.length > 50) {
                targetLog.removeChild(targetLog.firstChild);
            }
            targetLog.scrollTop = targetLog.scrollHeight;
        }
    }

    addDamageLog(attacker, defender, amount) {
        const attackerName = attacker === 'player' ? 
            gameStore.getState().party.characters.get(gameStore.getState().party.activeCharacterId).name : 
            globalTranslationManager.translate(`monsters.${attacker.id}`);
            
        const defenderName = defender === 'player' ? 
            gameStore.getState().party.characters.get(gameStore.getState().party.activeCharacterId).name : 
            globalTranslationManager.translate(`monsters.${defender.id}`);
            
        this.addCombatLog(
            globalTranslationManager.translate('combat.damage')
                .replace('{attacker}', attackerName)
                .replace('{defender}', defenderName)
                .replace('{amount}', amount)
        );
    }

    addVictoryLog(monster) {
        this.addCombatLog(
            globalTranslationManager.translate('combat.victory')
                .replace('{monster}', globalTranslationManager.translate(`monsters.${monster.id}`)),
            'progression'
        );
    }

    addLootLog(itemId, quantity) {
        this.addCombatLog(
            globalTranslationManager.translate('combat.loot')
                .replace('{quantity}', quantity)
                .replace('{item}', globalTranslationManager.translate(`items.${itemId}`)),
            'progression'
        );
    }

    addExperienceLog(amount) {
        this.addCombatLog(
            globalTranslationManager.translate('combat.experience')
                .replace('{amount}', amount),
            'progression'
        );
    }

    calculateExpForNextLevel(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }
}

export const combatUI = new CombatUI();