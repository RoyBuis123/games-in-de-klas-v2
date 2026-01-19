import React, { useState, useMemo, useCallback, useEffect } from 'react';

// --- CONSTANTS ---
const INITIAL_LIVES = 3;
const GRAVITY = 9.81;
const GAME_DURATION = 300; // 5 minutes

const degToRad = (degrees: number) => degrees * (Math.PI / 180);

interface GameParams {
  mass: number;
  angle: number;
  frictionCoefficient: number;
  inclineLength: number;
  gravity: number;
}

const generateGameParameters = (): GameParams => ({
  mass: parseFloat((Math.random() * 10 + 5).toFixed(2)),
  angle: parseFloat((Math.random() * 20 + 20).toFixed(2)),
  frictionCoefficient: parseFloat((Math.random() * 0.2 + 0.1).toFixed(2)),
  inclineLength: parseFloat((Math.random() * 15 + 5).toFixed(2)),
  gravity: GRAVITY,
});

const QUESTIONS = [
  {
    id: 1,
    text: (params: GameParams) => `Welcome to the Stunt Challenge! A stunt car with a mass of ${params.mass} kg is at the top of a ramp. First, calculate its total weight (the force of gravity). Use g = ${params.gravity} m/s².`,
    unit: "N",
    calculateCorrectAnswer: (params: GameParams) => params.mass * params.gravity,
  },
  {
    id: 2,
    text: (params: GameParams) => `The ramp is tilted at ${params.angle} degrees. What's the Normal Force (Fn)? This is the perpendicular force the ramp exerts on the car.`,
    unit: "N",
    calculateCorrectAnswer: (params: GameParams, prevAnswers: number[]) => {
      const weight = prevAnswers[0]; 
      return weight * Math.cos(degToRad(params.angle));
    },
  },
  {
    id: 3,
    text: (params: GameParams) => `The ramp surface has a kinetic friction coefficient (μk) of ${params.frictionCoefficient}. Calculate the Force of Friction (Ff) that will resist the car's motion.`,
    unit: "N",
    calculateCorrectAnswer: (params: GameParams, prevAnswers: number[]) => {
      const normalForce = prevAnswers[1];
      return params.frictionCoefficient * normalForce;
    },
  },
  {
    id: 4,
    text: (params: GameParams) => `Now, let's find the force pulling the car down the ramp. Calculate the component of gravity that acts parallel to the incline.`,
    unit: "N",
    calculateCorrectAnswer: (params: GameParams, prevAnswers: number[]) => {
      const weight = prevAnswers[0];
      return weight * Math.sin(degToRad(params.angle));
    },
  },
  {
    id: 5,
    text: () => `Time to put it together! What is the Net Force (Fnet) that will actually push the car down the ramp? (Hint: it's the downhill force minus friction).`,
    unit: "N",
    calculateCorrectAnswer: (params: GameParams, prevAnswers: number[]) => {
      const frictionForce = prevAnswers[2];
      const downhillForce = prevAnswers[3];
      return downhillForce - frictionForce;
    },
  },
  {
    id: 6,
    text: (params: GameParams) => `Based on that Net Force, what will be the car's acceleration (a) down the ramp? Remember, the car's mass is ${params.mass} kg.`,
    unit: "m/s²",
    calculateCorrectAnswer: (params: GameParams, prevAnswers: number[]) => {
      const netForce = prevAnswers[4];
      return netForce / params.mass;
    },
  },
  {
    id: 7,
    text: (params: GameParams) => `This is it, the final calculation! The ramp is ${params.inclineLength} meters long. What's the car's final velocity (v) at the bottom? If you get this right, we'll see the stunt!`,
    unit: "m/s",
    calculateCorrectAnswer: (params: GameParams, prevAnswers: number[]) => {
      const acceleration = prevAnswers[5];
      if (acceleration <= 0) return 0;
      return Math.sqrt(2 * acceleration * params.inclineLength);
    },
  }
];

// --- COMPONENTS ---

const Timer = ({ secondsRemaining }: { secondsRemaining: number }) => {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isLowTime = secondsRemaining <= 30;

  return (
    <div className="flex items-center space-x-2">
      <i className={`fa-solid fa-stopwatch text-2xl ${isLowTime ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}></i>
      <span className={`text-xl font-bold font-mono ${isLowTime ? 'text-red-600' : 'text-slate-700'}`}>
        {formattedTime}
      </span>
    </div>
  );
};

const Lives = ({ count }: { count: number }) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-xl font-bold text-slate-700">Lives:</span>
      <div className="flex space-x-1">
        {[...Array(INITIAL_LIVES)].map((_, i) => (
          <i key={i} className={`fa-solid fa-heart text-2xl ${i < count ? 'text-red-500' : 'text-slate-300'}`} />
        ))}
      </div>
    </div>
  );
};

const Car = () => (
  <div className="relative w-12 h-8">
    {/* Car Body - White */}
    <div className="absolute bottom-2 left-0 w-full h-5 bg-white rounded-t-md border-2 border-gray-400" />
    {/* Wheels - Grey */}
    <div className="absolute bottom-0 left-1 w-4 h-4 bg-gray-500 rounded-full border-2 border-gray-600" />
    <div className="absolute bottom-0 right-1 w-4 h-4 bg-gray-500 rounded-full border-2 border-gray-600" />
  </div>
);

const Diagram = ({ angle, inclineLength, isAnimating = false }: { angle: number; inclineLength: number; isAnimating: boolean }) => {
  const rampLength = 400; 
  const carWidth = 48; 
  const travelDistance = rampLength - carWidth;
  const pixelsPerMeter = rampLength / inclineLength;
  const angleInRadians = angle * (Math.PI / 180);
  const rampHeight = rampLength * Math.sin(angleInRadians);
  const rampWidth = rampLength * Math.cos(angleInRadians);

  return (
    <div className="w-full h-80 flex items-end justify-center mb-8 relative" aria-hidden="true">
      <div className="relative" style={{ width: `${rampLength}px`, height: '250px' }}>
        {/* Ramp Group */}
        <div 
          className="absolute bottom-0 left-0 transition-transform duration-300 ease-out"
          style={{
            transform: `rotate(${-angle}deg)`,
            transformOrigin: 'bottom left',
          }}
        >
          {/* Green Ramp */}
          <div className="bg-green-500 w-[400px] h-3 rounded-full shadow-inner" />
          
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
        
        {/* Green Ground */}
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-green-600" />
        
        {/* Angle Indicator */}
        <div
          className="absolute bottom-0 left-0 w-24 h-24 border-l-2 border-b-2 border-dashed border-white/70 rounded-bl-full"
          style={{ transform: 'translateY(1px)'}}
        />
        <div className="absolute bottom-2 left-8 text-white font-semibold text-lg text-shadow">
          {angle.toFixed(0)}°
        </div>

        {/* Height Indicator */}
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

const StartScreen = ({ onStart }: { onStart: () => void }) => (
  <div className="text-center">
    <h1 className="text-5xl font-bold text-white mb-4 text-shadow-md">Stunt Challenge!</h1>
    <p className="text-lg text-sky-100 mb-8 max-w-2xl text-shadow mx-auto">
      Jij bent de stuntontwerper. Jouw missie is om de fysica voor een gewaagde autosprong te berekenen. Krijg de cijfers goed voordat de tijd om is!
    </p>
    <button onClick={onStart} className="bg-white text-sky-600 font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-sky-100 transition-transform transform hover:scale-105">
      Start Challenge
    </button>
  </div>
);

const GameOverScreen = ({ onRestart, reason }: { onRestart: () => void; reason?: 'time' | 'lives' }) => (
  <div className="text-center">
    <h1 className="text-5xl font-bold text-white mb-4 text-shadow-md">Stunt Mislukt!</h1>
    <p className="text-xl text-red-200 mb-8 text-shadow">
      {reason === 'time' ? "Je tijd is op!" : "Je berekeningen klopten niet helemaal. Probeer het opnieuw!"}
    </p>
    <button onClick={onRestart} className="bg-sky-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-sky-600 transition-transform transform hover:scale-105">
      Probeer Opnieuw
    </button>
  </div>
);

const GameCompleteScreen = ({ onComplete }: { onComplete: () => void }) => (
  <div className="text-center">
    <h1 className="text-5xl font-bold text-white mb-4 text-shadow-md">Stunt Geslaagd!</h1>
    <p className="text-xl text-green-200 mb-8 text-shadow">Fantastisch werk! Je berekeningen waren perfect en de stunt was een meesterwerk.</p>
    <button onClick={onComplete} className="bg-sky-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-sky-600 transition-transform transform hover:scale-105">
      Voltooien & Score Opslaan
    </button>
  </div>
);

const StatusBar = ({ lives, currentQuestion, totalQuestions, timeLeft }: { lives: number; currentQuestion: number; totalQuestions: number; timeLeft: number }) => (
  <div className="w-full max-w-4xl flex justify-between items-center bg-white/70 backdrop-blur-sm p-4 rounded-t-2xl shadow-md mb-[-1px] z-10">
    <Lives count={lives} />
    <Timer secondsRemaining={timeLeft} />
    <div className="text-xl font-bold text-slate-700">
      Stap: <span className="text-sky-600">{currentQuestion} / {totalQuestions}</span>
    </div>
  </div>
);

// --- MAIN GAME COMPONENT ---

interface Game9Props {
  onComplete: (score: number) => void;
  onClose: () => void;
}

const Game9: React.FC<Game9Props> = ({ onComplete, onClose }) => {
  const [gameParams, setGameParams] = useState(generateGameParameters());
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver' | 'completed'>('start');
  const [gameOverReason, setGameOverReason] = useState<'time' | 'lives' | undefined>(undefined);
  const [feedback, setFeedback] = useState<{message: string, type: 'correct' | 'incorrect'} | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const currentQuestion = useMemo(() => QUESTIONS[currentQuestionIndex], [currentQuestionIndex]);
  
  const correctAnswer = useMemo(() => {
    if (!currentQuestion) return 0;
    return currentQuestion.calculateCorrectAnswer(gameParams, userAnswers);
  }, [currentQuestion, gameParams, userAnswers]);

  // Timer Logic
  useEffect(() => {
    let timer: number;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            window.clearInterval(timer);
            setGameOverReason('time');
            setGameState('gameOver');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => window.clearInterval(timer);
  }, [gameState, timeLeft]);

  const handleRestart = useCallback(() => {
    setGameParams(generateGameParameters());
    setLives(INITIAL_LIVES);
    setTimeLeft(GAME_DURATION);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setInputValue('');
    setFeedback(null);
    setIsAnimating(false);
    setIsShaking(false);
    setGameOverReason(undefined);
    setGameState('start');
  }, []);

  const handleStart = useCallback(() => {
    setGameState('playing');
  }, []);

  const handleWin = () => {
    // Score calculation: 100 points if completed. 
    // We can subtract points based on time used or lives lost if we want, 
    // but for now, let's give a high score for finishing the finale.
    const score = 100 - ((INITIAL_LIVES - lives) * 5); // Small penalty for lost lives
    onComplete(Math.max(70, score)); // Minimum 70 points for finishing
  };

  const checkAnswer = () => {
    const userAnswer = parseFloat(inputValue);
    if (isNaN(userAnswer)) {
      setFeedback({ message: 'Voer een geldig getal in.', type: 'incorrect' });
      return;
    }
    
    // Allow a margin of error (2% or absolute 0.1)
    const tolerance = Math.max(Math.abs(correctAnswer * 0.02), 0.1);
    const isCorrect = Math.abs(userAnswer - correctAnswer) < tolerance;

    if (isCorrect) {
      setFeedback({ message: 'Correcte Berekening!', type: 'correct' });
      const newAnswers = [...userAnswers, correctAnswer];
      setUserAnswers(newAnswers);
      
      setTimeout(() => {
        setFeedback(null);
        setInputValue('');
        if (currentQuestionIndex < QUESTIONS.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          setIsAnimating(true);
          setTimeout(() => {
            setGameState('completed');
          }, 2000); 
        }
      }, 1500);

    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setFeedback({ message: `Niet helemaal. Correct: ${correctAnswer.toFixed(2)}.`, type: 'incorrect' });
      setIsShaking(true);

      if (newLives <= 0) {
        setGameOverReason('lives');
        setTimeout(() => setGameState('gameOver'), 2000);
      } else {
        setTimeout(() => {
          setFeedback(null);
          setIsShaking(false);
        }, 2000);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback) return;
    checkAnswer();
  };
  
  const isGameActive = gameState === 'playing';

  const renderContent = () => {
    switch(gameState) {
      case 'start':
        return <StartScreen onStart={handleStart} />;
      case 'gameOver':
        return <GameOverScreen onRestart={handleRestart} reason={gameOverReason} />;
      case 'completed':
        return <GameCompleteScreen onComplete={handleWin} />;
      case 'playing':
        return (
          <div className="w-full flex flex-col items-center">
            <Diagram 
              angle={gameParams.angle} 
              isAnimating={isAnimating} 
              inclineLength={gameParams.inclineLength} 
            />
            <div className="glass-panel w-full max-w-md flex flex-col items-center p-6 rounded-xl shadow-lg mt-4">
              <div className="text-center mb-4">
                <p className="text-md text-white text-shadow font-medium">{currentQuestion.text(gameParams)}</p>
              </div>
              <form onSubmit={handleSubmit} className="w-full">
                <div className={`flex items-center gap-4 ${isShaking ? 'shake' : ''}`}>
                  <input
                    type="number"
                    step="0.01"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-grow w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition text-gray-800"
                    placeholder="Voer antwoord in..."
                    disabled={!!feedback || isAnimating}
                    autoFocus
                  />
                  <span className="text-xl font-bold text-white text-shadow">{currentQuestion.unit}</span>
                </div>
                <button 
                  type="submit" 
                  className="w-full mt-6 bg-white text-sky-600 font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-sky-100 transition-transform transform hover:scale-105 disabled:bg-slate-400/50 disabled:text-white disabled:cursor-not-allowed disabled:scale-100"
                  disabled={!inputValue || !!feedback || isAnimating}
                >
                  Controleer Antwoord
                </button>
                {feedback && (
                  <div className="text-center mt-4 animate-fade-in">
                    <p className={`text-2xl font-bold text-shadow ${feedback.type === 'correct' ? 'text-green-300' : 'text-red-300'}`}>
                      {feedback.message}
                    </p>
                  </div>
                )}
              </form>
            </div>
          </div>
        );
      default:
        return null;
    }
  }
  
  return (
    <div className="flex flex-col items-center justify-center p-4 font-sans text-slate-800 w-full h-full min-h-[600px] bg-sky-200 rounded-xl">
      {isGameActive && (
        <StatusBar 
          lives={lives} 
          currentQuestion={currentQuestionIndex + 1} 
          totalQuestions={QUESTIONS.length}
          timeLeft={timeLeft} 
        />
      )}
      <main className="w-full max-w-4xl bg-gradient-to-b from-sky-400 to-sky-600 rounded-2xl shadow-xl p-6 md:p-10 flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden">
        <div className="absolute top-8 right-12 w-20 h-20 bg-yellow-300 rounded-full shadow-lg animate-pulse" />
        {renderContent()}
      </main>
    </div>
  );
};

export default Game9;