import React, { useState } from 'react';
import { GameConfig } from '../../types';
import { INITIAL_GAMES_CONFIG } from '../../constants';

interface PlaceholderGameProps {
  id: number;
  onComplete: (score: number) => void;
  onClose: () => void;
}

const PlaceholderGame: React.FC<PlaceholderGameProps> = ({ id, onComplete, onClose }) => {
  const [scoreInput, setScoreInput] = useState<string>('');
  const gameInfo = INITIAL_GAMES_CONFIG[id];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const score = parseInt(scoreInput);
    if (!isNaN(score) && score >= 0 && score <= 100) {
      onComplete(score);
    } else {
      alert("Voer een geldige score in tussen 0 en 100.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-4xl shadow-inner">
        🎮
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-2">{gameInfo?.name || `Spel ${id}`}</h2>
      <p className="text-gray-500 mb-8 max-w-md">
        Dit spel is nog in ontwikkeling. Je kunt het simuleren door handmatig een score in te voeren.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-xs bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Simuleer Score (0-100)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            max="100"
            value={scoreInput}
            onChange={(e) => setScoreInput(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
            placeholder="Bijv. 85"
            required
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium shadow-md shadow-indigo-200"
          >
            Klaar
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-400">Minimale score nodig: {gameInfo?.minScore}</p>
      </form>
    </div>
  );
};

export default PlaceholderGame;