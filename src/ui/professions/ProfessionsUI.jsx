import React, { useState, useEffect } from 'react';
import { gameStore } from '../../store/state/GameStore';
import { professionSelectors } from '../../store/actions/professions';
import { globalTranslationManager } from '../../translations/translationManager';

const ProfessionsUI = () => {
  const [selectedProfession, setSelectedProfession] = useState(null);
  const [activeProfessions, setActiveProfessions] = useState([]);
  const [availableSlots, setAvailableSlots] = useState(3);

  useEffect(() => {
    const state = gameStore.getState();
    const charId = state.party.activeCharacterId;
    setActiveProfessions(professionSelectors.getActiveProfessions(state, charId));
    setAvailableSlots(professionSelectors.getAvailableSlots(state, charId));
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Liste des métiers actifs */}
      <div className="card">
        <h2 className="card-title">Métiers Actifs</h2>
        <div className="flex flex-col gap-2">
          {activeProfessions.map(profId => (
            <button
              key={profId}
              onClick={() => setSelectedProfession(profId)}
              className={`btn ${selectedProfession === profId ? 'btn-primary' : 'btn-secondary'}`}
            >
              {globalTranslationManager.translate(`professions.${profId}.title`)}
            </button>
          ))}
          {[...Array(availableSlots)].map((_, i) => (
            <div key={`slot-${i}`} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
              Slot Disponible
            </div>
          ))}
        </div>
      </div>

      {/* Détails du métier sélectionné */}
      {selectedProfession && (
        <div className="card col-span-2">
          <ProfessionDetails professionId={selectedProfession} />
        </div>
      )}
    </div>
  );
};

// Composant pour les détails d'un métier
const ProfessionDetails = ({ professionId }) => {
  const [professionData, setProfessionData] = useState(null);
  const [resources, setResources] = useState([]);

  useEffect(() => {
    const state = gameStore.getState();
    const charId = state.party.activeCharacterId;
    setProfessionData({
      level: professionSelectors.getProfessionLevel(state, charId, professionId),
      exp: 0, // À implémenter
      nextLevelExp: 100 // À implémenter
    });

    // Charger les ressources disponibles pour ce métier
    // À implémenter
  }, [professionId]);

  if (!professionData) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="card-title">
          {globalTranslationManager.translate(`professions.${professionId}.title`)}
        </h2>
        <div className="text-sm text-gray-600">
          Niveau {professionData.level}
        </div>
      </div>

      {/* Barre d'expérience */}
      <div className="space-y-1">
        <div className="progress-bar">
          <div 
            className="progress-fill exp" 
            style={{ width: `${(professionData.exp / professionData.nextLevelExp) * 100}%` }} 
          />
        </div>
        <div className="text-sm text-center text-gray-600">
          {professionData.exp} / {professionData.nextLevelExp} XP
        </div>
      </div>

      {/* Zone de collecte */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="font-medium">Ressources Disponibles</h3>
          <div className="grid grid-cols-3 gap-2">
            {resources.map(resource => (
              <div 
                key={resource.id}
                className="p-2 bg-gray-100 rounded-lg text-center text-sm"
              >
                <img 
                  src={resource.image || '/api/placeholder/32/32'} 
                  alt={resource.name}
                  className="mx-auto mb-1 w-8 h-8"
                />
                {resource.name}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Améliorations</h3>
          <div className="space-y-2">
            {/* Liste des améliorations disponibles */}
            <button className="btn btn-primary w-full">
              Amélioration 1 (100 or)
            </button>
            <button className="btn btn-secondary w-full opacity-50" disabled>
              Amélioration 2 (Niveau 5 requis)
            </button>
          </div>
        </div>
      </div>

      {/* Zone d'action */}
      <div className="flex justify-center">
        <button className="btn btn-primary px-8">
          {globalTranslationManager.translate(`professions.${professionId}.action`)}
        </button>
      </div>
    </div>
  );
};

export default ProfessionsUI;