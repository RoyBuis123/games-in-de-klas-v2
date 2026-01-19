import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

// --- CONSTANTS ---
const PHYSICS_TERMS = [
  {
    term: "inclined plane",
    explanation: "Een plat oppervlak dat onder een hoek helt ten opzichte van de horizontaal, waardoor een component van de zwaartekracht langs het oppervlak werkt."
  },
  {
    term: "angle",
    explanation: "De maat voor de helling tussen twee lijnen of oppervlakken, vaak uitgedrukt in graden of radialen."
  },
  {
    term: "distance",
    explanation: "De totale lengte van de weg die een object heeft afgelegd, gemeten in lengte-eenheden (bijv. meters)."
  },
  {
    term: "speed",
    explanation: "De snelheid waarmee de afstand in de tijd verandert (v = d/t), zonder rekening te houden met de richting."
  },
  {
    term: "constant speed",
    explanation: "Een beweging waarbij de snelheid in de loop van de tijd onveranderd blijft."
  },
  {
    term: "acceleration",
    explanation: "De mate van verandering van snelheid met betrekking tot tijd (a = Δv/Δt)."
  },
  {
    term: "deceleration",
    explanation: "Een versnelling die de grootte van de snelheid vermindert; een negatieve versnelling ten opzichte van de bewegingsrichting."
  },
  {
    term: "friction coefficient",
    explanation: "Een dimensieloze grootheid die de verhouding beschrijft tussen de wrijvingskracht en de normaalkracht tussen twee oppervlakken (μ = F_f / F_n)."
  }
];

// Helper function to shuffle an array
const shuffleArray = (array: any[]) => {
  return [...array].sort(() => Math.random() - 0.5);
};

const AnswersModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-[60] animate-fade-in">
      <div className="bg-slate-800 rounded-xl shadow-2xl p-6 md:p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative border border-slate-700">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-emerald-400">Alle Termen en Uitleg</h2>
              <button 
                  onClick={onClose} 
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label="Sluit venster"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
              </button>
          </div>
          <ul className="space-y-4">
              {PHYSICS_TERMS.map((item, index) => (
                  <li key={index} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                      <h3 className="font-bold text-lg text-white capitalize">{item.term}</h3>
                      <p className="text-slate-300 mt-1">{item.explanation}</p>
                  </li>
              ))}
          </ul>
      </div>
  </div>
);

interface Game2Props {
  onComplete: (score: number) => void;
  onClose: () => void;
}

const Game2: React.FC<Game2Props> = ({ onComplete, onClose }) => {
  const [terms, setTerms] = useState<typeof PHYSICS_TERMS>([]);
  const [currentTermIndex, setCurrentTermIndex] = useState(0);
  const [userExplanation, setUserExplanation] = useState('');
  const [showModelExplanation, setShowModelExplanation] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  const startGame = useCallback(() => {
    setTerms(shuffleArray(PHYSICS_TERMS));
    setCurrentTermIndex(0);
    setUserExplanation('');
    setShowModelExplanation(false);
    setIsFinished(false);
    setScore(0);
    setFeedback(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const handleCheckAnswer = async () => {
    if (!userExplanation.trim()) return;

    setIsLoading(true);
    setFeedback(null);

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const currentTerm = terms[currentTermIndex];

    const systemInstruction = `You are a helpful physics teacher evaluating a student's answer in Dutch.
    Compare the student's explanation with the provided model answer.
    The student's answer does not need to be a word-for-word match, but it must capture the core physics concept correctly.
    Respond with a JSON object containing two fields:
    1. "isCorrect": a boolean (true if the student's answer is conceptually correct, otherwise false).
    2. "feedback": a short string in Dutch explaining why the answer is correct or incorrect.`;
    
    const prompt = `Term: "${currentTerm.term}". Model Answer: "${currentTerm.explanation}". Student's Answer: "${userExplanation}".`;

    try {
      if (!process.env.API_KEY) {
          // Fallback simulation if no API key for testing UI
          console.warn("No API Key found, simulating correct answer for testing.");
          await new Promise(resolve => setTimeout(resolve, 1000));
          const result = { isCorrect: true, feedback: "Simulatie: Dit antwoord lijkt correct (geen API key)." };
          if (result.isCorrect) setScore(prevScore => prevScore + 12.5);
          setFeedback({ isCorrect: result.isCorrect, text: result.feedback });
      } else {
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  isCorrect: { type: Type.BOOLEAN },
                  feedback: { type: Type.STRING },
                },
                required: ["isCorrect", "feedback"],
              },
            },
          });

          const result = JSON.parse(response.text?.trim() || '{}');
          
          if (result.isCorrect) {
            setScore(prevScore => prevScore + 12.5);
          }
          setFeedback({ isCorrect: result.isCorrect, text: result.feedback });
      }

    } catch (error) {
      console.error("Error checking answer with AI:", error);
      setFeedback({ isCorrect: false, text: "Er is een fout opgetreden bij het controleren van het antwoord. Ga door naar de volgende vraag." });
    } finally {
      setShowModelExplanation(true);
      setIsLoading(false);
    }
  };

  const handleNextTerm = () => {
    if (currentTermIndex < terms.length - 1) {
      setCurrentTermIndex(prevIndex => prevIndex + 1);
      setUserExplanation('');
      setShowModelExplanation(false);
      setFeedback(null);
    } else {
      setIsFinished(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!showModelExplanation && !isLoading && userExplanation.trim() !== '') {
        handleCheckAnswer();
      }
    }
  };
  
  const handleSaveScore = () => {
    onComplete(Math.round(score));
  };

  if (terms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px] bg-slate-900 text-slate-200">
        <div className="text-xl text-slate-400">Laden...</div>
      </div>
    );
  }

  if (isFinished) {
    const hasPassed = score >= 60; // minScore from constants
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] bg-slate-900 p-4 rounded-xl">
        <div className="bg-slate-800 rounded-xl shadow-2xl p-8 text-center max-w-md w-full border border-slate-700">
          <h1 className={`text-4xl font-bold mb-4 ${hasPassed ? 'text-emerald-400' : 'text-red-400'}`}>
            {hasPassed ? 'Voltooid!' : 'Niet gehaald'}
          </h1>
          <p className="text-slate-300 mb-2 text-lg">Je score is: <span className="font-bold text-white">{Math.round(score)} / 100</span></p>
          <p className="text-slate-400 mb-6 text-sm">
            {hasPassed
              ? 'Goed gedaan! Je beheerst de basisconcepten.'
              : 'Probeer het opnieuw om de stof beter te begrijpen.'}
          </p>
          <div className="flex flex-col gap-3">
              <button
                onClick={handleSaveScore}
                className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-emerald-500 transition-all duration-200 shadow-lg"
              >
                Score Opslaan & Sluiten
              </button>
              <button
                onClick={startGame}
                className="w-full bg-slate-700 text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-600 focus:outline-none transition-all duration-200"
              >
                Opnieuw Spelen
              </button>
          </div>
        </div>
      </div>
    );
  }

  const currentTerm = terms[currentTermIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] bg-slate-900 p-4 font-sans rounded-xl w-full">
       {showAnswers && <AnswersModal onClose={() => setShowAnswers(false)} />}
      <div className="w-full max-w-2xl bg-slate-800 rounded-xl shadow-2xl p-6 md:p-8 space-y-6 border border-slate-700">
        <header className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-700 pb-4">
          <h1 className="text-xl md:text-2xl font-bold text-emerald-400">Natuurkunde Termen</h1>
          <div className="flex items-center space-x-4">
            <div className="text-lg font-bold text-slate-300">
                Score: <span className="text-emerald-400 w-12 inline-block text-right">{Math.round(score)}</span>
            </div>
            <div className="text-sm font-medium text-slate-400 bg-slate-700 px-3 py-1 rounded-full">
              {currentTermIndex + 1} / {terms.length}
            </div>
            <button 
                onClick={() => setShowAnswers(true)}
                className="text-slate-400 hover:text-white transition-colors"
                title="Toon alle antwoorden"
            >
                <i className="fa-solid fa-book-open"></i>
            </button>
          </div>
        </header>

        <div className="bg-slate-700/50 p-6 rounded-lg border border-slate-600">
          <p className="text-sm text-slate-400 uppercase tracking-wider font-bold mb-1">Beschrijf de term:</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white capitalize mb-2">{currentTerm.term}</h2>
        </div>

        <div className="space-y-4">
          <label htmlFor="user-explanation" className="block text-md font-medium text-slate-300">
            Jouw uitleg (in het Nederlands):
          </label>
          <textarea
            id="user-explanation"
            rows={4}
            value={userExplanation}
            onChange={(e) => setUserExplanation(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Schrijf hier je uitleg in je eigen woorden..."
            className="w-full p-3 bg-slate-900 border-2 border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors placeholder-slate-600"
            disabled={showModelExplanation || isLoading}
          />
        </div>

        {showModelExplanation && (
          <div className="space-y-4 animate-fade-in">
            {feedback && (
              <div className={`border p-4 rounded-lg ${feedback.isCorrect ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                <h3 className={`text-lg font-bold mb-2 ${feedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {feedback.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">{feedback.text}</p>
              </div>
            )}
            <div className="bg-slate-700/30 p-4 rounded-lg border-l-4 border-slate-500">
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-1">Modeluitleg:</h3>
              <p className="text-slate-200 italic">{currentTerm.explanation}</p>
            </div>
          </div>
        )}

        <div className="pt-2">
          {!showModelExplanation ? (
            <button
              onClick={handleCheckAnswer}
              disabled={userExplanation.trim() === '' || isLoading}
              className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-900 transition-all duration-200 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Controleren...
                  </span>
              ) : 'Controleer antwoord'}
            </button>
          ) : (
            <button
              onClick={handleNextTerm}
              className="w-full bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-white focus:outline-none focus:ring-4 focus:ring-slate-500 transition-all duration-200 shadow-lg"
            >
              {currentTermIndex === terms.length - 1 ? 'Bekijk Resultaat' : 'Volgende Term'} <i className="fa-solid fa-arrow-right ml-2"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Game2;