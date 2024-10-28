import { loadGame, saveGame } from './saveLoad.js';
import { Miner } from './professions/miner.js';
import { Lumberjack } from './professions/lumberjack.js';
import { globalInventory } from './inventory.js'; 
import { updateInventoryDisplay } from './inventoryDisplay.js';
import { globalResourceManager } from './resourceManager.js';
import { globalTranslationManager } from './translations/translationManager.js';
import { character } from './character.js';
import { experienceManager } from './combat/experience.js';

let worlds = [];
let zones = [];
export let professions = {};

// Fonction pour charger un fichier JSON
async function loadJsonData(path) {
    try {
        const response = await fetch(`data/${path}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error loading ${path}:`, error);
        return null;
    }
}

// Fonction pour initialiser toutes les ressources du jeu
async function initializeGameData() {
    try {
        // Charger d'abord les traductions
        await globalTranslationManager.loadTranslations('fr');
        
        // Chargement de tous les fichiers de données
        const [
            professionResources,
            monsterResources,
            monstersData,
            worldMapData
        ] = await Promise.all([
            loadJsonData('professionResources.json'),
            loadJsonData('monsterResources.json'),
            loadJsonData('monsters.json'),
            loadJsonData('worldMap.json')
        ]);
        
        if (!professionResources || !monsterResources || !monstersData || !worldMapData) {
            throw new Error('Failed to load one or more required data files');
        }
        
        // Initialiser les ressources
        if (professionResources.miner) {
            professionResources.miner.forEach(resource => 
                globalResourceManager.addResource(resource, 'profession'));
            }
            if (professionResources.lumberjack) {
                professionResources.lumberjack.forEach(resource => 
                    globalResourceManager.addResource(resource, 'profession'));
                }
                
                monsterResources.resources.forEach(resource => 
                    globalResourceManager.addResource(resource, 'monster'));
                    
                    // Stockage des données des monstres et du monde
                    worlds = worldMapData.worlds;
                    zones = worlds.flatMap(world => world.zones);
                    
                    // Création des instances de profession
                    professions = {
                        miner: new Miner(professionResources.miner.map(r => r.id)),
                        lumberjack: new Lumberjack(professionResources.lumberjack.map(r => r.id))
                    };
                    
                    return true;
                } catch (error) {
                    console.error('Error initializing game data:', error);
                    return false;
                }
            }
            
            function initializeUI() {
                const professionsTab = document.querySelector('[data-tab="professions"]');
                if (professionsTab) {
                    professionsTab.style.display = 'none';
                }
                
                const navTabs = document.querySelectorAll('.nav-tab');
                navTabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        // Retirer la classe active de tous les onglets
                        navTabs.forEach(t => t.classList.remove('active'));
                        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                        
                        // Ajouter la classe active à l'onglet cliqué
                        tab.classList.add('active');
                        
                        // Afficher le contenu correspondant
                        const tabId = tab.getAttribute('data-tab') + '-tab';
                        document.getElementById(tabId).classList.add('active');
                    });
                });
                
                // Écouter l'événement de complétion de quête
                window.addEventListener('questCompleted', (event) => {
                    if (event.detail.questId === 'beginnerQuest') {
                        const professionsTab = document.querySelector('[data-tab="professions"]');
                        if (professionsTab) {
                            professionsTab.style.display = 'block';
                            // Animation optionnelle pour l'apparition
                            professionsTab.classList.add('tab-appear');
                        }
                    }
                });
                
                // Charger l'expérience initiale
                experienceManager.updateExperience(
                    character.experience,
                    character.getExperienceToNextLevel(),
                    character.level
                );
                
                // Language handler
                document.getElementById('language-select')?.addEventListener('change', async (event) => {
                    await globalTranslationManager.setLanguage(event.target.value);
                    updateUITranslations();
                });
                
                // Initialize displays
                displayProfessionsList();
            }
            
            async function initializeGame() {
                try {
                    // Initialiser les données
                    const dataInitialized = await initializeGameData();
                    if (!dataInitialized) {
                        throw new Error('Failed to initialize game data');
                    }
                    
                    // Initialiser l'UI
                    initializeUI();
                    
                    // Charger la sauvegarde
                    loadGame();
                    
                    // Mettre à jour l'affichage
                    updateInventoryDisplay();
                    updateUITranslations();
                    
                    // Démarrer l'auto-save
                    setInterval(saveGame, 30000);
                    
                } catch (error) {
                    console.error("Error starting game:", error);
                    const errorElement = document.createElement('div');
                    errorElement.className = 'error-message';
                    errorElement.textContent = globalTranslationManager.translate('ui.errorLoading');
                    document.body.prepend(errorElement);
                }
            }
            
            document.addEventListener('DOMContentLoaded', initializeGame);
            
            function displayProfessionsList() {
                // Mise à jour de la liste des professions
                const professionsList = document.getElementById('professions-list');
                if (professionsList) {
                    professionsList.innerHTML = '';
                    
                    for (const [professionName, profession] of Object.entries(professions)) {
                        const professionButton = document.createElement('button');
                        professionButton.textContent = globalTranslationManager.translate(`professions.${professionName}.title`);
                        professionButton.className = 'profession-button';
                        professionButton.addEventListener('click', () => selectProfession(professionName));
                        professionsList.appendChild(professionButton);
                    }
                }
            }
            
            function selectProfession(professionName) {
                document.querySelectorAll('.profession-details').forEach(el => {
                    if (el.id === `${professionName}-details`) {
                        el.style.display = 'block';
                    } else {
                        el.style.display = 'none';
                    }
                });
                
                if (professions[professionName]) {
                    professions[professionName].updateDisplay();
                }
            }
            
            function updateUITranslations() {
                const elements = {
                    'title': 'ui.title',
                    'character-title': 'ui.characterTitle',
                    'character-name-label': 'ui.characterNameLabel',
                    'change-name': 'ui.changeName',
                    'save-name': 'ui.saveName',
                    'character-level-label': 'ui.characterLevelLabel',
                    'professions-title': 'ui.professionsTitle',
                    'inventory-title': 'ui.inventoryTitle',
                    'attack-monster': 'ui.attack'
                };
                
                for (const [id, translationKey] of Object.entries(elements)) {
                    const element = document.getElementById(id);
                    if (element) {
                        element.innerText = globalTranslationManager.translate(translationKey);
                    }
                }
                
                updateInventoryDisplay();
                for (const profession of Object.values(professions)) {
                    if (typeof profession.updateDisplay === 'function') {
                        profession.updateDisplay();
                    }
                }
            }
            
            window.showTab = function (tabId) {
                const tabs = document.querySelectorAll('.tab-content');
                tabs.forEach(tab => {
                    tab.style.display = 'none';
                });
                document.getElementById(tabId).style.display = 'block';
            }
            
            // Exports
            export function getWorlds() { return worlds; }
            export function getZones() { return zones; }
            export function getZoneById(zoneId) { return zones.find(zone => zone.id === zoneId); }
            export function getWorldById(worldId) { return worlds.find(world => world.id === worldId); }
            
            export function updateDisplays(selectedProfession = null) {
                updateInventoryDisplay();
                
                // Mettre à jour l'expérience
                experienceManager.updateExperience(
                    character.experience,
                    character.getExperienceToNextLevel(),
                    character.level
                );
                
                if (selectedProfession && professions[selectedProfession]) {
                    const profession = professions[selectedProfession];
                    if (typeof profession.updateDisplay === 'function') {
                        profession.updateDisplay();
                    }
                }
            }