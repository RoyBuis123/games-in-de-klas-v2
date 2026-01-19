import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
enum GamePhase {
    Start = 'Start',
    Playing = 'Playing',
    Animating = 'Animating',
    Result = 'Result',
    Quiz = 'Quiz',
    GameOver = 'GameOver',
}

interface Challenge {
    id: number;
    description: string;
    targetVelocity: number;
}

interface Game6Props {
  onComplete: (score: number) => void;
  onClose: () => void;
}

// --- Constants ---
const INITIAL_LIVES = 3;
const GRAVITY = 9.81; // m/s^2
const RAMP_LENGTH = 10; // meters
const NUM_CHALLENGES = 5;

const CHALLENGES: Challenge[] = [
    { id: 1, description: "Bereik een snelheid van 6.0 m/s", targetVelocity: 6.0 },
    { id: 2, description: "Bereik een snelheid van 9.0 m/s", targetVelocity: 9.0 },
    { id: 3, description: "Bereik een snelheid van 4.5 m/s", targetVelocity: 4.5 },
    { id: 4, description: "Bereik een snelheid van 7.5 m/s", targetVelocity: 7.5 },
    { id: 5, description: "Bereik een snelheid van 8.0 m/s", targetVelocity: 8.0 },
    { id: 6, description: "Bereik een snelheid van 5.0 m/s", targetVelocity: 5.0 },
    { id: 7, description: "Bereik een snelheid van 6.5 m/s", targetVelocity: 6.5 },
    { id: 8, description: "Bereik een snelheid van 8.5 m/s", targetVelocity: 8.5 },
    { id: 9, description: "Bereik een snelheid van 7.0 m/s", targetVelocity: 7.0 },
];

const QUIZ_QUESTION = {
    text: "Wat is de relatie tussen de hellingshoek en de versnelling van het blok (zonder wrijving)?",
    options: [
        "Een grotere hoek zorgt voor een lagere versnelling.",
        "Een grotere hoek zorgt voor een hogere versnelling.",
        "De hoek heeft geen invloed op de versnelling."
    ],
    correctAnswerIndex: 1
};

// --- Service ---
// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getExplanation = async (topic: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "De expert is momenteel niet beschikbaar omdat de API-sleutel niet is geconfigureerd.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Je bent een vriendelijke en behulpzame natuurkundedocent voor MBO-studenten in Nederland. Leg het volgende concept in het Nederlands uit op een simpele en duidelijke manier. Gebruik een analogie als dat helpt. Houd het antwoord kort en bondig (maximaal 3-4 zinnen). Concept: "${topic}"`,
      config: {
        temperature: 0.5,
        topP: 0.95,
        topK: 64
      }
    });
    
    return response.text || "Geen antwoord ontvangen.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Het lukte niet om de expert te bereiken. Probeer het later opnieuw.";
  }
};

// --- Components ---

const StatusBar = ({ lives, score }: { lives: number, score: number }) => {
    return (
        <div className="w-full max-w-4xl flex justify-between items-center bg-white/70 backdrop-blur-sm p-4 rounded-t-2xl shadow-md mb-[-1px]">
            <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-slate-700">Levens:</span>
                <div className="flex space-x-1">
                    {Array.from({ length: lives }).map((_, i) => (
                        <i key={i} className="fa-solid fa-heart text-red-500 text-2xl" />
                    ))}
                    {Array.from({ length: Math.max(0, 3 - lives) }).map((_, i) => (
                         <i key={`empty-${i}`} className="fa-solid fa-heart text-slate-300 text-2xl" />
                    ))}
                </div>
            </div>
            <div className="text-xl font-bold text-slate-700">
                Score: <span className="text-sky-600">{score}</span> / 100
            </div>
        </div>
    );
};

const Ramp = ({ angle, onAngleChange, gameState, animationDuration }: any) => {
    const isAnimating = gameState === GamePhase.Animating;
    const isControlDisabled = gameState === GamePhase.Animating || gameState === GamePhase.Result || gameState === GamePhase.GameOver;
    const travelDistance = 600; 

    const cartPositionStyle = {
        transition: isAnimating && animationDuration > 0 ? `transform ${animationDuration}s ease-in` : 'none',
        transform: isAnimating && animationDuration > 0 ? `translateX(-${travelDistance}px)` : 'translateX(0px)',
    };

    return (
        <div className="w-full h-[400px] flex items-end justify-center relative bg-sky-100 rounded-lg shadow-inner overflow-hidden">
            <div className="absolute top-8 left-12 w-16 h-16 bg-yellow-300 rounded-full opacity-80" />
            <div
                className="absolute bottom-20 left-10 transition-transform duration-300 ease-out"
                style={{
                    transform: `rotate(-${angle}deg)`,
                    transformOrigin: 'bottom left',
                }}
            >
                <div className="w-[650px] h-5 bg-green-500 border-t-4 border-green-700" />
                <div className="absolute -top-10 right-2" style={cartPositionStyle}>
                    <div className="relative w-12 h-8">
                        <div className="w-full h-6 bg-slate-100 rounded-t-md border-2 border-slate-500" />
                        <div className="absolute -bottom-2 left-1 w-5 h-5 bg-slate-300 rounded-full border-2 border-slate-600" />
                        <div className="absolute -bottom-2 right-1 w-5 h-5 bg-slate-300 rounded-full border-2 border-slate-600" />
                    </div>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-20 bg-green-600" />
             <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-1/2 flex flex-col items-center z-10">
                <label htmlFor="angle-slider" className="font-semibold mb-1 text-white text-shadow">
                    Hellingshoek: <span className="font-bold text-amber-300 text-lg">{angle.toFixed(0)}°</span>
                </label>
                <input
                    id="angle-slider"
                    type="range"
                    min="0"
                    max="25"
                    value={angle}
                    onChange={(e) => onAngleChange(Number(e.target.value))}
                    disabled={isControlDisabled}
                    className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer accent-sky-300 disabled:opacity-50"
                />
            </div>
            <div className="absolute bottom-4 left-24 text-slate-700 font-bold text-xl bg-white/50 px-2 py-1 rounded">
                {angle.toFixed(0)}°
            </div>
            <div className="absolute bottom-20 left-10 w-24 h-24 border-l-2 border-b-2 border-dashed border-slate-400 rounded-bl-lg -translate-y-px" />
        </div>
    );
};

const Controls = ({ onLaunch, gameState, result, onNext }: any) => {
    const isControlDisabled = gameState === GamePhase.Animating || gameState === GamePhase.Result || gameState === GamePhase.GameOver;

    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[100px]">
          {gameState !== GamePhase.Result && (
              <button
                  onClick={onLaunch}
                  disabled={isControlDisabled}
                  className="bg-sky-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-sky-600 transition-transform transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:scale-100"
              >
                  {gameState === GamePhase.Animating ? 'Bezig...' : 'Lanceer!'}
              </button>
          )}
          {gameState === GamePhase.Result && result && (
              <div className="text-center animate-fade-in">
                  <p className={`text-2xl font-bold ${result.success ? 'text-green-500' : 'text-red-500'}`}>
                      {result.message}
                  </p>
                  <button
                      onClick={onNext}
                      className="mt-4 bg-green-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-green-600 transition-transform transform hover:scale-105"
                  >
                      Volgende
                  </button>
              </div>
          )}
      </div>
    );
};

const Quiz = ({ question, onAnswer }: any) => {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    const handleSelectOption = (index: number) => {
        if (isAnswered) return;
        setSelectedOption(index);
    };

    const handleSubmit = () => {
        if (selectedOption === null) return;
        setIsAnswered(true);
        const isCorrect = selectedOption === question.correctAnswerIndex;
        setTimeout(() => {
            onAnswer(isCorrect);
        }, 1500);
    };

    const getButtonClass = (index: number) => {
        if (!isAnswered) {
            return selectedOption === index
                ? 'bg-sky-500 text-white'
                : 'bg-white hover:bg-sky-100';
        }
        if (index === question.correctAnswerIndex) {
            return 'bg-green-500 text-white';
        }
        if (index === selectedOption) {
            return 'bg-red-500 text-white';
        }
        return 'bg-slate-200 text-slate-500';
    };

    return (
        <div className="w-full max-w-xl text-center p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Kennistoets!</h2>
            <p className="text-lg text-slate-600 mb-6">{question.text}</p>
            <div className="space-y-4">
                {question.options.map((option: string, index: number) => (
                    <button
                        key={index}
                        onClick={() => handleSelectOption(index)}
                        className={`w-full text-left p-4 rounded-lg border-2 border-slate-200 shadow-sm transition-all duration-300 ${getButtonClass(index)}`}
                        disabled={isAnswered}
                    >
                        <span className="font-semibold">{option}</span>
                    </button>
                ))}
            </div>
            {!isAnswered && (
                <button
                    onClick={handleSubmit}
                    disabled={selectedOption === null}
                    className="mt-8 bg-amber-400 text-slate-800 font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-amber-500 transition-transform transform hover:scale-105 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                    Bevestig Antwoord
                </button>
            )}
             {isAnswered && (
                <div className="mt-6 text-xl font-bold">
                    {selectedOption === question.correctAnswerIndex ? (
                        <p className="text-green-600">Correct! +25 punten!</p>
                    ) : (
                        <p className="text-red-600">Helaas, het juiste antwoord was gemarkeerd in groen.</p>
                    )}
                </div>
             )}
        </div>
    );
};

const GameOver = ({ score, onRestart, isWin, onSave }: any) => {
    const titleColor = isWin ? "text-sky-700" : "text-red-500";
    const titleText = isWin ? "Goed Gedaan!" : "Helaas!";
    const messageText = isWin ?
        "Je hebt alle uitdagingen voltooid!" :
        "Je levens zijn op, het spel is voorbij.";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
                <h1 className={`text-5xl font-black mb-4 ${titleColor}`}>
                    {titleText}
                </h1>
                <p className="text-lg text-slate-600 mb-2">{messageText}</p>
                <p className="text-2xl text-slate-800 mb-8">
                    Eindscore: <span className="font-bold text-amber-500">{score}</span> / 100
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onSave}
                        className="bg-green-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-green-600 transition-transform transform hover:scale-105"
                    >
                        Opslaan & Afsluiten
                    </button>
                    <button
                        onClick={onRestart}
                        className="bg-sky-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-sky-600 transition-transform transform hover:scale-105"
                    >
                        Opnieuw Spelen
                    </button>
                </div>
            </div>
        </div>
    );
};

const ExpertHelper = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const PRESET_QUESTIONS = [
      "Wat is de relatie tussen hellingshoek en versnelling?",
      "Wat is zwaartekracht?",
      "Waarom gaat een object sneller op een steilere helling?",
    ];

    const handleAsk = useCallback(async (q: string) => {
        if (!q || isLoading) return;
        setIsLoading(true);
        setError('');
        setAnswer('');
        try {
            const explanation = await getExplanation(q);
            setAnswer(explanation);
        } catch (err) {
            setError('Er ging iets mis bij het ophalen van het antwoord. Probeer het opnieuw.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    const handlePresetQuestion = (q: string) => {
        setQuestion(q);
        handleAsk(q);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleAsk(question);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <i className="fa-solid fa-xmark text-2xl" />
                </button>
                <div className="flex items-center mb-4">
                    <i className="fa-solid fa-graduation-cap text-3xl text-amber-500 mr-3" />
                    <h2 className="text-2xl font-bold text-slate-800">Vraag de Expert</h2>
                </div>
                
                <div className="mb-4">
                    <p className="text-sm text-slate-500 mb-2">Of kies een van deze vragen:</p>
                    <div className="flex flex-wrap gap-2">
                        {PRESET_QUESTIONS.map((q, i) => (
                            <button key={i} onClick={() => handlePresetQuestion(q)} className="text-xs bg-sky-100 text-sky-800 font-semibold px-3 py-1 rounded-full hover:bg-sky-200">
                                {q}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Stel hier je eigen vraag..."
                        className="w-full p-3 border border-slate-300 rounded-lg mb-2"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !question} className="w-full bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 disabled:bg-slate-400">
                        {isLoading ? 'Denken...' : 'Vraag'}
                    </button>
                </form>

                <div className="mt-4 p-4 bg-slate-50 rounded-lg min-h-[150px] max-h-60 overflow-y-auto">
                    {isLoading && <p className="text-slate-500 animate-pulse">De expert is aan het typen...</p>}
                    {error && <p className="text-red-500">{error}</p>}
                    {answer && <p className="text-slate-700 whitespace-pre-wrap">{answer}</p>}
                    {!isLoading && !error && !answer && <p className="text-slate-400">Het antwoord verschijnt hier.</p>}
                </div>
            </div>
        </div>
    );
};

// --- Main Game Component ---

const Game6: React.FC<Game6Props> = ({ onComplete, onClose }) => {
    const [gameState, setGameState] = useState<GamePhase>(GamePhase.Start);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [gameChallenges, setGameChallenges] = useState<Challenge[]>([]);
    const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
    const [currentAngle, setCurrentAngle] = useState(15);
    const [result, setResult] = useState<any>(null);
    const [isExpertHelperOpen, setIsExpertHelperOpen] = useState(false);
    const [animationDuration, setAnimationDuration] = useState(2);

    const currentChallenge = useMemo(() => gameChallenges[currentChallengeIndex], [gameChallenges, currentChallengeIndex]);

    const handleStartGame = useCallback(() => {
        const shuffled = [...CHALLENGES].sort(() => 0.5 - Math.random());
        setGameChallenges(shuffled.slice(0, NUM_CHALLENGES));

        setScore(0);
        setLives(INITIAL_LIVES);
        setCurrentChallengeIndex(0);
        setCurrentAngle(15);
        setResult(null);
        setGameState(GamePhase.Playing);
    }, []);
    
    const handleRestart = useCallback(() => {
        setGameState(GamePhase.Start);
    }, []);

    const handleSave = useCallback(() => {
        onComplete(score);
    }, [score, onComplete]);

    const handleLaunch = useCallback(() => {
        if (!currentChallenge) return;

        const angleInRadians = currentAngle * (Math.PI / 180);
        const acceleration = GRAVITY * Math.sin(angleInRadians);
        const finalVelocity = Math.sqrt(2 * acceleration * RAMP_LENGTH);

        let duration = 0;
        if (finalVelocity > 0.1) {
            duration = 15 / finalVelocity;
            duration = Math.max(1, Math.min(duration, 4));
        }
        setAnimationDuration(duration);
        setGameState(GamePhase.Animating);
        
        setTimeout(() => {
            const tolerance = 1.0;
            const perfectTolerance = 0.2;
            const maxPoints = 15; // Max 15 points per round (5 * 15 = 75 total for challenges)
            const minPoints = 5;

            const difference = Math.abs(finalVelocity - currentChallenge.targetVelocity);
            const success = difference <= tolerance;
            
            let message = '';
            let pointsAwarded = 0;

            if (success) {
                if (difference <= perfectTolerance) {
                    pointsAwarded = maxPoints;
                    message = `Perfect! ${finalVelocity.toFixed(1)} m/s (+${pointsAwarded} ptn)`;
                } else {
                    const scoreFraction = (difference - perfectTolerance) / (tolerance - perfectTolerance);
                    pointsAwarded = Math.round(maxPoints - scoreFraction * (maxPoints - minPoints));
                    message = `Goed! ${finalVelocity.toFixed(1)} m/s (+${pointsAwarded} ptn)`;
                }
                setScore(prev => prev + pointsAwarded);
                setGameState(GamePhase.Result);
            } else {
                if (finalVelocity > currentChallenge.targetVelocity + tolerance) {
                    message = `Te snel! (${finalVelocity.toFixed(1)} m/s)`;
                } else {
                    message = `Te langzaam! (${finalVelocity.toFixed(1)} m/s)`;
                }
                setLives(prevLives => {
                    const newLives = prevLives - 1;
                    if (newLives <= 0) {
                        setGameState(GamePhase.GameOver);
                        return 0;
                    }
                    setGameState(GamePhase.Result);
                    return newLives;
                });
            }
            
            setResult({ finalVelocity, success, message, pointsAwarded });

        }, duration * 1000);
    }, [currentAngle, currentChallenge]);

    const handleNext = useCallback(() => {
        setResult(null);
        const nextIndex = currentChallengeIndex + 1;
        
        if (nextIndex < NUM_CHALLENGES) {
            setCurrentChallengeIndex(nextIndex);
            setGameState(GamePhase.Playing);
        } else {
            setGameState(GamePhase.Quiz);
        }
    }, [currentChallengeIndex]);
    
    const handleQuizAnswer = useCallback((isCorrect: boolean) => {
        if(isCorrect) {
            setScore(prev => prev + 25); // Quiz is 25 points
        }
        setGameState(GamePhase.GameOver);
    }, []);

    const renderContent = () => {
        if (!currentChallenge && (gameState === GamePhase.Playing || gameState === GamePhase.Animating || gameState === GamePhase.Result || gameState === GamePhase.GameOver)) {
            return <div className="text-center">Laden...</div>;
        }

        switch (gameState) {
            case GamePhase.Start:
                return (
                    <div className="text-center max-w-lg animate-fade-in">
                        <h1 className="text-5xl font-black text-sky-700 mb-4">Welkom bij Helling Hero!</h1>
                        <p className="text-lg text-slate-600 mb-6">
                            Jouw missie: kies de juiste hellingshoek om het karretje de gevraagde snelheid te geven. Hoe preciezer je bent, hoe meer punten je verdient.
                        </p>
                            <p className="text-md text-slate-500 mb-8">
                            Je kunt in totaal 100 punten verdienen: 75 met de uitdagingen en 25 met de kennistoets op het einde. Zet 'm op!
                        </p>
                        <button onClick={handleStartGame} className="bg-sky-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-sky-600 transition-transform transform hover:scale-105">
                            Start Spel
                        </button>
                    </div>
                );
            case GamePhase.Playing:
            case GamePhase.Animating:
            case GamePhase.Result:
            case GamePhase.GameOver:
                    return (
                    <div className="w-full flex flex-col items-center justify-start gap-4">
                        <div className="text-center">
                            <h2 className="text-lg font-bold text-slate-700">Uitdaging {currentChallengeIndex + 1} / {NUM_CHALLENGES}</h2>
                            <p className="text-md text-slate-600">{currentChallenge.description}</p>
                        </div>
                        <div className="w-full">
                            <Ramp
                                angle={currentAngle}
                                onAngleChange={setCurrentAngle}
                                gameState={gameState}
                                animationDuration={animationDuration}
                            />
                        </div>
                            <div className="w-full">
                            <Controls
                                onLaunch={handleLaunch}
                                gameState={gameState}
                                result={result}
                                onNext={handleNext}
                            />
                        </div>
                    </div>
                );
            case GamePhase.Quiz:
                return <Quiz question={QUIZ_QUESTION} onAnswer={handleQuizAnswer} />;
            default:
                return null;
        }
    };
    
    return (
        <div className="min-h-[600px] flex flex-col items-center justify-center p-4 text-slate-800 bg-slate-100 rounded-xl w-full h-full overflow-auto">
            {(gameState !== GamePhase.Start && gameState !== GamePhase.GameOver) && (
                <StatusBar lives={lives} score={score} />
            )}
            <main className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6 md:p-10 flex flex-col items-center justify-center min-h-[600px] relative">
                {renderContent()}
            </main>
            <button
                onClick={() => setIsExpertHelperOpen(true)}
                className="fixed bottom-10 right-10 bg-amber-400 text-slate-800 font-bold w-14 h-14 rounded-full shadow-lg hover:bg-amber-500 transition-transform transform hover:scale-110 flex items-center justify-center z-50"
                aria-label="Vraag de expert"
            >
                <i className="fa-solid fa-graduation-cap text-2xl" />
            </button>
            <ExpertHelper isOpen={isExpertHelperOpen} onClose={() => setIsExpertHelperOpen(false)} />
            {gameState === GamePhase.GameOver && <GameOver score={score} onRestart={handleRestart} isWin={lives > 0} onSave={handleSave} />}
        </div>
    );
};

export default Game6;