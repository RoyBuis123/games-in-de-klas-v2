import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- CONSTANTS ---
const INITIAL_LIVES = 3;
const TIME_LIMIT = 20;
const QUESTIONS_TO_WIN = 3;

// --- SUB-COMPONENTS ---

const Lives = ({ count }: { count: number }) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-lg font-bold text-slate-700">Levens:</span>
      <div className="flex space-x-1">
        {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
           <i key={i} className={`fa-solid fa-heart text-2xl transition-colors duration-300 ${i < count ? 'text-red-500' : 'text-slate-300'}`} />
        ))}
      </div>
    </div>
  );
};

const Car = () => (
  <div className="relative w-12 h-8">
    {/* Car Body */}
    <div className="absolute bottom-2 left-0 w-full h-5 bg-red-500 rounded-t-md border-2 border-red-800" />
     {/* Roof */}
    <div className="absolute bottom-7 left-2 w-8 h-3 bg-red-400 rounded-t-sm border-2 border-red-800" />
    {/* Wheels */}
    <div className="absolute bottom-0 left-1 w-4 h-4 bg-gray-700 rounded-full border-2 border-gray-800" />
    <div className="absolute bottom-0 right-1 w-4 h-4 bg-gray-700 rounded-full border-2 border-gray-800" />
  </div>
);

const Diagram = ({ angle, inclineLength, isAnimating = false }: { angle: number, inclineLength: number, isAnimating: boolean }) => {
  const rampLength = 400; // Visual length in pixels
  const carWidth = 48; // car width in pixels (w-12 tailwind)
  const travelDistance = rampLength - carWidth;
  
  const pixelsPerMeter = rampLength / inclineLength;

  const angleInRadians = angle * (Math.PI / 180);
  const rampHeight = rampLength * Math.sin(angleInRadians);
  const rampWidth = rampLength * Math.cos(angleInRadians);

  return (
    <div className="w-full h-64 flex items-end justify-center mb-4 relative overflow-hidden" aria-hidden="true">
      <div className="relative" style={{ width: `${rampLength}px`, height: '200px' }}>
        {/* Ramp */}
        <div 
          className="absolute bottom-0 left-0 transition-transform duration-300 ease-out"
          style={{
              transform: `rotate(${-angle}deg)`,
              transformOrigin: 'bottom left',
          }}
        >
          <div className="bg-slate-500 w-[400px] h-3 rounded-full shadow-inner" />
          
          {/* Car */}
          <div
              className="absolute"
              style={{
                  left: '0px',
                  bottom: '6px',
                  transition: isAnimating ? 'transform 1.5s ease-in' : 'none',
                  transform: isAnimating ? `translateX(${travelDistance}px)` : `translateX(0px)`,
              }}
          >
            <Car />
          </div>
        </div>
        
        {/* Ground and angle indicator */}
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-600" />
        <div
            className="absolute bottom-0 left-0 w-24 h-24 border-l-2 border-b-2 border-dashed border-white/70 rounded-bl-full"
            style={{ transform: 'translateY(1px)'}}
        />
        <div className="absolute bottom-2 left-8 text-white font-semibold text-lg text-shadow">
          {angle.toFixed(0)}°
        </div>

        {/* Height indicator */}
        {angle > 2 && (
          <>
            <div 
                className="absolute bottom-0 border-r-2 border-dashed border-white/70 transition-all duration-300 ease-out"
                style={{
                    left: `${rampWidth}px`,
                    height: `${rampHeight}px`,
                }}
            />
             <div 
                className="absolute text-white font-semibold transition-all duration-300 ease-out text-shadow"
                style={{
                    bottom: `${rampHeight / 2 - 10}px`,
                    left: `${rampWidth + 10}px`,
                }}
            >
              {(rampHeight / pixelsPerMeter).toFixed(1)} m
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const StartScreen = ({ onStart }: { onStart: () => void }) => {
  return (
    <div className="text-center z-10 max-w-lg">
      <h1 className="text-5xl font-bold text-white mb-4 text-shadow-md">Speed Stunt!</h1>
      <p className="text-lg text-sky-100 mb-2 text-shadow">
          Jij bent een stunt-ontwerper. Jouw missie is om de fysica voor een gewaagde autosprong te berekenen.
      </p>
       <p className="text-lg text-sky-100 mb-6 text-shadow">
          Bekijk de rit van de auto om de afstand en tijd te zien, en bereken daarna de snelheid.
      </p>
      <div className="mb-8">
        <code className="bg-black/30 text-white px-4 py-2 rounded-lg text-xl font-mono shadow-inner">
            v = s / t
        </code>
        <p className="text-sky-200 text-sm mt-1">snelheid = afstand / tijd</p>
      </div>
      <button onClick={onStart} className="bg-white text-sky-600 font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-sky-100 transition-transform transform hover:scale-105">
        Start Challenge
      </button>
    </div>
  );
};

const EndScreen = ({ onRestart, didWin, score, onSave }: { onRestart: () => void; didWin: boolean; score: number; onSave: () => void }) => {
  return (
    <div className="text-center z-10 max-w-md bg-white/10 p-8 rounded-xl backdrop-blur-md shadow-2xl border border-white/20">
        <div className="mb-4 text-6xl">{didWin ? '🏆' : '💥'}</div>
        <h1 className="text-4xl font-bold text-white mb-2 text-shadow-md">{didWin ? 'Stunt Geslaagd!' : 'Stunt Mislukt!'}</h1>
        <p className={`text-xl mb-6 text-shadow ${didWin ? 'text-green-200' : 'text-red-200'}`}>
            {didWin ? 'Geweldig werk! Je berekeningen waren perfect.' : 'Je berekeningen waren niet nauwkeurig genoeg.'}
        </p>
        
        <div className="bg-white/20 rounded-lg p-4 mb-6">
            <p className="text-sky-100 text-sm uppercase font-bold tracking-wider">Eindscore</p>
            <p className="text-5xl font-black text-white text-shadow">{score}</p>
        </div>

        <div className="flex flex-col gap-3">
            <button onClick={onSave} className="bg-green-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-green-600 transition-transform transform hover:scale-105">
                Score Opslaan & Sluiten
            </button>
            <button onClick={onRestart} className="bg-sky-500/20 text-white border-2 border-sky-200/50 font-bold py-2 px-8 rounded-lg hover:bg-sky-500/40 transition-colors">
                Opnieuw Proberen
            </button>
        </div>
    </div>
  );
};

// Helper for rounding numbers
const round = (num: number, decimals: number) => {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};

const GameScreen = ({ onGameEnd }: { onGameEnd: (win: boolean, score: number) => void }) => {
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [status, setStatus] = useState<'idle' | 'animating' | 'question' | 'feedback'>('idle'); 
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<{message: string, type: 'correct' | 'incorrect'} | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  
  const countdownIntervalRef = useRef<number | null>(null);

  const generateLevelData = useCallback(() => {
    const angle = Math.floor(Math.random() * 20) + 15;
    const distance = round(Math.random() * 5 + 5, 1);
    // Add some variance so simpler math is sometimes possible, but generally keep it realistic
    const time = round(distance / (angle * 0.15 + 1), 2);
    const speed = round(distance / time, 2);
    return { angle, distance, time, speed };
  }, []);

  const [levelData, setLevelData] = useState(generateLevelData);

  // Check for Game Over via lives
  useEffect(() => {
    if (lives <= 0) {
      setTimeout(() => {
         // Score calculation for loss: Partial score for questions answered?
         // Let's keep it simple: if you lose all lives, you fail the stunt.
         // But maybe give some pity points based on progress.
         const score = questionNumber * 20; 
         onGameEnd(false, score);
      }, 1500);
    }
  }, [lives, onGameEnd, questionNumber]);

  const handleIncorrectAnswer = useCallback((message: string) => {
    setFeedback({ message, type: 'incorrect' });
    setIsShaking(true);
    setLives(prev => prev - 1);
    setStatus('feedback');

    // Only auto-advance/reset if we still have lives. If lives == 0, the useEffect above handles it.
    // Actually, logic dictates we retry or move on? The original code retried the same question.
    // Let's keep retrying the same question until lives run out.
    setTimeout(() => {
        if (lives > 1) { // Check against current state (which will be updated next render) or assume decremented
            setStatus('question');
            setUserInput('');
            setFeedback(null);
            setIsShaking(false);
        }
    }, 2000);
  }, [lives]);

  // Timer Logic
  useEffect(() => {
    if (status === 'question') {
      setTimeLeft(TIME_LIMIT);
      countdownIntervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
           if (prev <= 1) {
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
              handleIncorrectAnswer('De tijd is op!');
              return 0;
           }
           return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
    }
    return () => {
      if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
    };
  }, [status, handleIncorrectAnswer]);

  const resetForNextQuestion = useCallback(() => {
      setLevelData(generateLevelData());
      setStatus('idle');
      setUserInput('');
      setFeedback(null);
  }, [generateLevelData]);

  const handleStartAnimation = () => {
    setStatus('animating');
    setTimeout(() => {
      setStatus('question');
    }, 1500);
  };

  const handleCheckAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'question' || feedback) return;
    if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
    
    const userAnswer = parseFloat(userInput.replace(',', '.'));
    if (isNaN(userAnswer)) {
      setFeedback({ message: 'Voer een geldig getal in.', type: 'incorrect' });
      setTimeout(() => setFeedback(null), 2000);
      return;
    }

    const isCorrect = Math.abs(userAnswer - levelData.speed) < 0.05;

    if (isCorrect) {
      const newQuestionNumber = questionNumber + 1;
      setQuestionNumber(newQuestionNumber);
      setFeedback({ message: 'Perfect Berekend!', type: 'correct' });
      setStatus('feedback');

      if (newQuestionNumber >= QUESTIONS_TO_WIN) {
        setTimeout(() => {
            // Calculate Score: 100 points max. Deduct for lost lives.
            const score = 100 - (INITIAL_LIVES - lives) * 10;
            onGameEnd(true, Math.max(0, score));
        }, 2000);
      } else {
        setTimeout(resetForNextQuestion, 2000);
      }
    } else {
      handleIncorrectAnswer(`Niet helemaal. Het juiste antwoord was ${levelData.speed.toFixed(2)} m/s.`);
    }
  };
  
  const StatusBar = () => (
    <div className="w-full flex justify-between items-center bg-white/70 backdrop-blur-sm p-3 rounded-t-2xl shadow-md mb-[-1px] z-10">
      <Lives count={lives} />
      <div className={`text-xl font-mono font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
         00:{timeLeft.toString().padStart(2, '0')}
      </div>
      <div className="text-lg font-bold text-slate-700">
        Stunt: <span className="text-sky-600">{questionNumber + 1} / {QUESTIONS_TO_WIN}</span>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col items-center">
      <StatusBar />
      <Diagram 
        angle={levelData.angle}
        inclineLength={levelData.distance}
        isAnimating={status === 'animating'}
      />
      <div className="w-full max-w-md flex flex-col items-center p-6 rounded-xl bg-black/20 backdrop-blur-sm shadow-lg border border-white/10">
        {status === 'idle' && (
           <div className="text-center animate-fade-in">
            <p className="text-md text-white text-shadow mb-4">
                De auto zal <span className="font-bold text-yellow-300">{levelData.distance} meter</span> afleggen. Start de rit om de tijd te meten.
            </p>
            <button onClick={handleStartAnimation} className="bg-white text-sky-600 font-bold py-2 px-6 rounded-lg text-lg hover:bg-sky-100 transition shadow-lg">
              Start Rit
            </button>
           </div>
        )}
        
        {status === 'animating' && (
            <div className="text-center animate-pulse">
                <p className="text-lg text-white text-shadow">Tijd meten...</p>
                <div className="text-4xl font-mono font-bold text-white mt-2">
                    ...
                </div>
            </div>
        )}

        {(status === 'question' || status === 'feedback') && (
           <div className="w-full animate-fade-in">
            <div className="grid grid-cols-2 gap-4 mb-4 text-xl">
                <div className="p-3 bg-sky-100/20 rounded-md text-center border border-white/10">
                    <div className="text-xs text-sky-200 font-semibold uppercase tracking-wider">Afstand (s)</div>
                    <div className="text-2xl text-white font-bold">{levelData.distance} m</div>
                </div>
                <div className="p-3 bg-sky-100/20 rounded-md text-center border border-white/10">
                    <div className="text-xs text-sky-200 font-semibold uppercase tracking-wider">Tijd (t)</div>
                    <div className="text-2xl text-white font-bold">{levelData.time} s</div>
                </div>
            </div>

            <form onSubmit={handleCheckAnswer} className="w-full">
                <label htmlFor="speed-input" className="block text-center text-md font-medium text-white mb-2 text-shadow">
                  Wat is de gemiddelde snelheid in m/s?
                  <br/>
                  <span className="text-sm text-sky-200 opacity-80">(Rond af op 2 decimalen)</span>
                </label>
                <div className={`flex items-center gap-4 ${isShaking ? 'animate-shake' : ''}`}>
                  <input
                    id="speed-input"
                    type="number"
                    step="0.01"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="flex-grow w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition text-center text-xl text-slate-800 font-bold"
                    placeholder="0.00"
                    disabled={status === 'feedback'}
                    autoFocus
                  />
                  <span className="text-xl font-bold text-white text-shadow">m/s</span>
                </div>
                <button 
                  type="submit" 
                  className="w-full mt-6 bg-white text-sky-600 font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-sky-100 transition-transform transform hover:scale-105 disabled:bg-slate-400/50 disabled:text-white disabled:cursor-not-allowed disabled:scale-100"
                  disabled={!userInput || status === 'feedback'}
                >
                  Controleer Berekening
                </button>
              </form>
           </div>
        )}

        {status === 'feedback' && feedback && (
            <div className="text-center mt-4 animate-fade-in h-8">
                <p className={`text-xl font-bold text-shadow ${feedback.type === 'correct' ? 'text-green-300' : 'text-red-300'}`}>
                    {feedback.message}
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

interface Game7Props {
  onComplete: (score: number) => void;
  onClose: () => void;
}

const Game7: React.FC<Game7Props> = ({ onComplete, onClose }) => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'completed' | 'gameOver'>('start');
  const [finalScore, setFinalScore] = useState(0);

  const handleStart = () => {
    setGameState('playing');
  };

  const handleGameEnd = (win: boolean, score: number) => {
    setFinalScore(score);
    setGameState(win ? 'completed' : 'gameOver');
  };

  const handleRestart = () => {
    setGameState('start');
  };
  
  const handleSave = () => {
      onComplete(finalScore);
  };

  const renderContent = () => {
    switch (gameState) {
      case 'start':
        return <StartScreen onStart={handleStart} />;
      case 'playing':
        return <GameScreen onGameEnd={handleGameEnd} />;
      case 'completed':
        return <EndScreen onRestart={handleRestart} didWin={true} score={finalScore} onSave={handleSave} />;
      case 'gameOver':
        return <EndScreen onRestart={handleRestart} didWin={false} score={finalScore} onSave={handleSave} />;
      default:
        return <StartScreen onStart={handleStart} />;
    }
  };

  return (
      <div className="flex flex-col items-center justify-center p-4 font-sans text-slate-800 w-full h-full min-h-[600px] bg-slate-200 rounded-xl relative overflow-hidden">
          <style>{`
            @keyframes shake {
                10%, 90% { transform: translate3d(-1px, 0, 0); }
                20%, 80% { transform: translate3d(2px, 0, 0); }
                30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                40%, 60% { transform: translate3d(4px, 0, 0); }
            }
            .animate-shake { animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both; }
          `}</style>
        <main className="w-full max-w-4xl bg-gradient-to-b from-sky-400 to-sky-600 rounded-2xl shadow-xl p-6 md:p-10 flex flex-col items-center justify-center min-h-[600px] relative overflow-hidden border border-white/20">
            <div className="absolute top-8 right-12 w-20 h-20 bg-yellow-300 rounded-full shadow-lg animate-pulse" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/10 rounded-full" />
            {renderContent()}
        </main>
      </div>
  );
};

export default Game7;