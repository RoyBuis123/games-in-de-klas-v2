import React, { useState, useEffect, useCallback } from 'react';
import { TERM_PAIRS } from '../../constants';
import { playFlipSound, playMatchSound, playNoMatchSound, playWinSound } from '../../utils/audio';

interface CardData {
  id: number;
  pairId: number;
  text: string;
  lang: 'en' | 'nl';
}

interface Game1Props {
  onComplete: (score: number) => void;
  onClose: () => void;
}

const Card = ({ card, isFlipped, isMatched, onClick }: { card: CardData; isFlipped: boolean; isMatched: boolean; onClick: () => void }) => {
  const isVisible = isFlipped || isMatched;

  return (
    <button
      type="button"
      className={`group relative h-24 sm:h-28 w-full rounded-xl cursor-pointer perspective-1000 transition-transform duration-150 ${isMatched ? "cursor-default" : "hover:-translate-y-1"}`}
      onClick={onClick}
      aria-pressed={isVisible}
    >
      <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isVisible ? "rotate-y-180" : ""}`}>
        {/* Front Face (Question Mark) */}
        <div className="absolute w-full h-full flex items-center justify-center p-2 text-center rounded-xl border font-semibold select-none backface-hidden bg-white border-gray-200 shadow-md group-hover:shadow-lg">
          <span className="text-3xl font-bold text-gray-400">?</span>
        </div>
        
        {/* Back Face (Content) */}
        <div className={`absolute w-full h-full flex items-center justify-center p-2 text-center rounded-xl border font-semibold select-none backface-hidden rotate-y-180 text-sm sm:text-base text-gray-800 ${
          isMatched
          ? "bg-green-100 border-green-500 shadow-lg shadow-green-500/20"
          : "bg-indigo-50 border-indigo-400"
        }`}>
          <span>{card.text}</span>
        </div>
      </div>
    </button>
  );
};

const Game1: React.FC<Game1Props> = ({ onComplete, onClose }) => {
  const [deck, setDeck] = useState<CardData[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [lockBoard, setLockBoard] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [gameFinished, setGameFinished] = useState(false);

  const shuffleArray = (array: CardData[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const startNewGame = useCallback(() => {
    let uniqueId = 0;
    const newDeck = TERM_PAIRS.flatMap((pair, index) => {
      const pairId = index + 1;
      return [
        { id: ++uniqueId, pairId, text: pair.en, lang: 'en' } as CardData,
        { id: ++uniqueId, pairId, text: pair.nl, lang: 'nl' } as CardData,
      ];
    });

    setDeck(shuffleArray(newDeck));
    setFlippedIndices([]);
    setMatchedPairIds([]);
    setMoves(0);
    setLockBoard(false);
    setGameFinished(false);
    setMessage({ text: 'Zoek steeds één Engelse en één Nederlandse term die bij elkaar horen.', type: 'info' });
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  useEffect(() => {
    if (flippedIndices.length < 2) return;

    setLockBoard(true);
    setMoves((prevMoves) => prevMoves + 1);

    const [firstIndex, secondIndex] = flippedIndices;
    const firstCard = deck[firstIndex];
    const secondCard = deck[secondIndex];

    if (firstCard.pairId === secondCard.pairId && firstCard.lang !== secondCard.lang) {
      playMatchSound();
      setMessage({ text: 'Goed gedaan! Dat is een juiste combinatie.', type: 'info' });
      setTimeout(() => {
        setMatchedPairIds((prev) => [...prev, firstCard.pairId]);
        setFlippedIndices([]);
        setLockBoard(false);
      }, 600);
    } else {
      playNoMatchSound();
      setMessage({ text: 'Niet helemaal! Probeer deze combinatie te onthouden.', type: 'info' });
      setTimeout(() => {
        setFlippedIndices([]);
        setLockBoard(false);
      }, 1000);
    }
  }, [flippedIndices, deck]);

  useEffect(() => {
    if (matchedPairIds.length > 0 && matchedPairIds.length === TERM_PAIRS.length) {
      playWinSound();
      setGameFinished(true);
      setMessage({
        text: `Top! Je hebt alle paren gevonden in ${moves} beurten.`,
        type: 'success',
      });
      setLockBoard(true);
    }
  }, [matchedPairIds, moves]);

  const handleCardClick = (index: number) => {
    if (lockBoard || flippedIndices.includes(index) || matchedPairIds.includes(deck[index].pairId)) {
      return;
    }
    playFlipSound();
    setFlippedIndices((prev) => [...prev, index]);
  };
  
  const handleFinish = () => {
    // Calculate score: Max 100. 
    // Minimum moves = 8.
    // Penalty: 5 points per extra move over 12 moves (allowing some mistakes).
    // Floor at 10 points.
    const penalty = Math.max(0, (moves - 10) * 5);
    const score = Math.max(10, 100 - penalty);
    onComplete(score);
  };

  const revealedPairs = matchedPairIds.map(id => TERM_PAIRS[id - 1]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="text-center sm:text-left">
           <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Memory: Match de termen!</h2>
           <p className="text-sm text-gray-500">Nederlandse en Engelse natuurkunde termen.</p>
        </div>
        
        <div className="flex items-center justify-center gap-x-6 text-sm text-gray-600 font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
          <span>Beurten: <strong className="text-indigo-600 text-lg">{moves}</strong></span>
          <span>Gevonden: <strong className="text-green-600 text-lg">{matchedPairIds.length}</strong><span className="text-gray-400">/</span>{TERM_PAIRS.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {deck.map((card, index) => (
          <Card
            key={card.id}
            card={card}
            isFlipped={flippedIndices.includes(index)}
            isMatched={matchedPairIds.includes(card.pairId)}
            onClick={() => handleCardClick(index)}
          />
        ))}
      </div>

      <div className={`text-center font-semibold min-h-[1.5em] mb-6 px-4 py-2 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
        {message.text}
      </div>

      {gameFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
           <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl transform scale-100 transition-all">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🎉</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Gefeliciteerd!</h3>
              <p className="text-gray-600 mb-6">Je hebt alle {TERM_PAIRS.length} paren gevonden in {moves} beurten.</p>
              <button 
                onClick={handleFinish}
                className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 active:scale-95 transition-all"
              >
                Score Opslaan & Terug
              </button>
           </div>
        </div>
      )}

      {!gameFinished && (
        <div className="text-center">
             <button
                onClick={startNewGame}
                className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
              >
                Opnieuw beginnen
              </button>
        </div>
      )}

      {/* Helper Table */}
      <div className="mt-12 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
           <h3 className="font-semibold text-gray-700">Gevonden Termen</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Engels</th>
                <th className="px-4 py-3">Nederlands</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {revealedPairs.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-gray-400 italic">
                    Nog geen paren gevonden...
                  </td>
                </tr>
              ) : (
                revealedPairs.map((pair) => (
                  <tr key={pair.en} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{pair.en}</td>
                    <td className="px-4 py-3 text-gray-600">{pair.nl}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Game1;