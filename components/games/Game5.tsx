import React, { useState, useCallback, useEffect, useRef } from 'react';

// --- Constants ---
const TOTAL_LIVES = 3;
const TOTAL_QUESTIONS = 10;
const QUESTION_TIME_LIMIT = 15;
const BASE_POINTS_PER_QUESTION = 10; // Max 100 points

// --- Sub-Components ---

const HeartIcon = ({ filled = true }: { filled?: boolean }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      className={`w-6 h-6 transition-all duration-300 ${filled ? 'text-red-500' : 'text-slate-300'}`}
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
      />
    </svg>
  );
};

const Diagram = ({ forceUp, forceDown }: { forceUp: number; forceDown: number }) => {
  const width = 400;
  const height = 250;
  const angleDegrees = 20;
  const angleRad = angleDegrees * (Math.PI / 180);

  const slopeStartX = 30;
  const slopeEndX = width - 30;
  const slopeStartY = height - 50;
  const slopeEndY = slopeStartY - (slopeEndX - slopeStartX) * Math.tan(angleRad);

  const mountainPath = `M -5 250 L ${slopeStartX - 20} 250 L ${slopeStartX} ${slopeStartY} L ${slopeEndX} ${slopeEndY} L ${width + 5} ${slopeEndY} L ${width + 5} 250 Z`;

  const cartHeight = 30;
  const wheelRadius = 8;

  const cartX = width / 2;
  const cartBottomYOnSlope = slopeStartY - (cartX - slopeStartX) * Math.tan(angleRad);
  const cartTransformY = cartBottomYOnSlope - wheelRadius;
  
  const cartBodyCenterY = cartTransformY - cartHeight / 2;

  const scaleFactor = 0.8;
  const fHellingLength = forceDown * scaleFactor;
  const fWrijvingLength = forceUp * scaleFactor;

  const fHellingStartX = cartX;
  const fHellingStartY = cartBodyCenterY;
  const fHellingEndX = fHellingStartX - fHellingLength * Math.cos(angleRad);
  const fHellingEndY = fHellingStartY + fHellingLength * Math.sin(angleRad);

  const fWrijvingStartX = cartX;
  const fWrijvingStartY = cartBodyCenterY;
  const fWrijvingEndX = fWrijvingStartX + fWrijvingLength * Math.cos(angleRad);
  const fWrijvingEndY = fWrijvingStartY - fWrijvingLength * Math.sin(angleRad);

  return (
    <div className="bg-white rounded-xl shadow-inner p-4 flex justify-center items-center overflow-hidden border border-slate-200">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="rounded-lg">
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#bae6fd', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#f0f9ff', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#4ade80', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#16a34a', stopOpacity: 1 }} />
          </linearGradient>
          <marker
            id="arrow-blue" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse" fill="#3b82f6"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
          <marker
            id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse" fill="#ef4444"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        <rect width="100%" height="100%" fill="url(#skyGradient)" />
        <path d={mountainPath} fill="url(#mountainGradient)" stroke="#15803d" strokeWidth="1.5" />

        {/* Karretje */}
        <g transform={`translate(${cartX}, ${cartTransformY}) rotate(${-angleDegrees})`}>
          <path d="M -25 -25 L 25 -25 L 20 -5 L -20 -5 Z" fill="#f8fafc" stroke="#64748b" strokeWidth="2" />
          <circle cx="-15" cy="0" r={wheelRadius} fill="#334155" />
          <circle cx="15" cy="0" r={wheelRadius} fill="#334155" />
        </g>

        {/* F Helling */}
        <line
          x1={fHellingStartX} y1={fHellingStartY}
          x2={fHellingEndX} y2={fHellingEndY}
          stroke="#3b82f6" strokeWidth="4" markerEnd="url(#arrow-blue)"
        />
        <text
          x={fHellingEndX} y={fHellingEndY + 20} fill="#1d4ed8" className="font-bold text-xs" textAnchor="middle"
        >
          Fh = {forceDown}N
        </text>

        {/* F Wrijving */}
        <line
          x1={fWrijvingStartX} y1={fWrijvingStartY}
          x2={fWrijvingEndX} y2={fWrijvingEndY}
          stroke="#ef4444" strokeWidth="4" markerEnd="url(#arrow-red)"
        />
        <text
          x={fWrijvingEndX} y={fWrijvingEndY - 10} fill="#b91c1c" className="font-bold text-xs" textAnchor="middle"
        >
          Fw = {forceUp}N
        </text>
      </svg>
    </div>
  );
};

const StatusBar = ({ lives, score, questionNumber, totalQuestions }: any) => {
  return (
    <div className="flex justify-between items-center bg-white rounded-xl shadow-md p-4 w-full border border-slate-100">
      <div className="flex items-center space-x-2">
        <div className="flex">
          {Array.from({ length: TOTAL_LIVES }).map((_, i) => <HeartIcon key={i} filled={i < lives} />)}
        </div>
      </div>
      <div className="font-black text-slate-700">
        Vraag {questionNumber} / {totalQuestions}
      </div>
      <div className="font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
        Score: {score}
      </div>
    </div>
  );
};

const GameScreen = ({ question, onAnswer, lives, score, questionNumber, totalQuestions }: any) => {
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [feedback, setFeedback] = useState<{correct: boolean; message: string} | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const answeredRef = useRef(false);

  const translateAnswer = (answer: string) => {
      if (answer === 'accelerate') return 'Versnellen';
      if (answer === 'decelerate') return 'Vertragen';
      return 'Constante snelheid';
  };

  const handleAnswer = useCallback((answer: string) => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

      const isCorrect = question.correctAnswer === answer;
      setFeedback({
          correct: isCorrect,
          message: isCorrect ? 'Helemaal juist!' : `Niet goed. Het juiste antwoord was: ${translateAnswer(question.correctAnswer)}`
      });

      onAnswer(answer);
  }, [question, onAnswer]);

  useEffect(() => {
      setTimeLeft(QUESTION_TIME_LIMIT);
      setFeedback(null);
      answeredRef.current = false;
      startTimeRef.current = Date.now();

      const tick = () => {
          if (answeredRef.current) return;
          const elapsed = (Date.now() - (startTimeRef.current || 0)) / 1000;
          const remaining = Math.max(0, QUESTION_TIME_LIMIT - elapsed);
          setTimeLeft(remaining);
          if (remaining === 0) {
              handleAnswer('timeout');
          } else {
              animationFrameRef.current = requestAnimationFrame(tick);
          }
      };
      animationFrameRef.current = requestAnimationFrame(tick);
      return () => {
        if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
  }, [question.id, handleAnswer]);
  
  const progressPercentage = (timeLeft / QUESTION_TIME_LIMIT) * 100;

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <StatusBar lives={lives} score={score} questionNumber={questionNumber} totalQuestions={totalQuestions} />
        <Diagram forceUp={question.forceUp} forceDown={question.forceDown} />
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-black text-slate-800">Wat gebeurt er met de snelheid?</h2>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="bg-indigo-500 h-full transition-all duration-100 linear"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          {!feedback ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <button
                onClick={() => handleAnswer('accelerate')}
                className="bg-white border-2 border-blue-500 text-blue-600 font-black py-4 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-md active:scale-95"
              >
                Versnellen
              </button>
              <button
                onClick={() => handleAnswer('constant')}
                className="bg-white border-2 border-green-500 text-green-600 font-black py-4 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-md active:scale-95"
              >
                Constant
              </button>
              <button
                onClick={() => handleAnswer('decelerate')}
                className="bg-white border-2 border-red-500 text-red-600 font-black py-4 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-md active:scale-95"
              >
                Vertragen
              </button>
            </div>
          ) : (
            <div
              className={`p-6 rounded-xl text-xl font-black animate-fade-in shadow-lg ${feedback.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
            >
              {feedback.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GameOverOverlay = ({ score, onRestart, reason, onSave }: any) => {
  return (
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 rounded-xl">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl max-w-md w-full text-center animate-fade-in">
        <div className="text-6xl mb-4">{reason === 'lives' ? '❌' : '🏆'}</div>
        <h1 className="text-4xl font-black text-slate-800 mb-2">{reason === 'lives' ? 'Helaas!' : 'Geweldig!'}</h1>
        <p className="text-slate-600 mb-6 font-bold">
          {reason === 'lives' ? 'Je levens zijn helaas op.' : 'Je hebt alle vragen beantwoord!'}
        </p>
        <div className="bg-slate-100 rounded-2xl p-6 mb-8">
          <p className="text-slate-500 uppercase tracking-widest font-black text-sm mb-1">Eindscore</p>
          <p className="text-6xl font-black text-indigo-600">{score}/100</p>
        </div>
        <div className="flex flex-col gap-3">
            <button
            onClick={onSave}
            className="w-full py-4 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all shadow-xl active:scale-95 text-lg"
            >
            Opslaan & Sluiten
            </button>
            <button
            onClick={onRestart}
            className="w-full py-2 text-indigo-600 font-bold hover:bg-indigo-50 rounded-lg transition-all"
            >
            Nog een keer
            </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Game Component ---

interface Game5Props {
  onComplete: (score: number) => void;
  onClose: () => void;
}

const Game5: React.FC<Game5Props> = ({ onComplete, onClose }) => {
  const [gameStatus, setGameStatus] = useState<'start' | 'playing' | 'game-over'>('start');
  const [gameOverReason, setGameOverReason] = useState<'lives' | 'completed' | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(TOTAL_LIVES);

  const generateQuestions = useCallback(() => {
    const newQuestions = [];
    const answerTypes = ['accelerate', 'constant', 'decelerate'];
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      const correctAnswer = answerTypes[Math.floor(Math.random() * answerTypes.length)];
      let forceDown, forceUp;
      if (correctAnswer === 'accelerate') {
          forceUp = Math.floor(Math.random() * 40) + 10;
          forceDown = forceUp + Math.floor(Math.random() * 30) + 10;
      } else if (correctAnswer === 'decelerate') {
          forceDown = Math.floor(Math.random() * 40) + 10;
          forceUp = forceDown + Math.floor(Math.random() * 30) + 10;
      } else {
          forceDown = Math.floor(Math.random() * 50) + 20;
          forceUp = forceDown;
      }
      newQuestions.push({ id: i, forceDown, forceUp, correctAnswer });
    }
    setQuestions(newQuestions);
  }, []);

  const handleStartGame = () => {
    setScore(0);
    setLives(TOTAL_LIVES);
    setCurrentQuestionIndex(0);
    setGameOverReason(null);
    generateQuestions();
    setGameStatus('playing');
  };

  const handleSave = () => {
      onComplete(score);
  };

  const handleAnswer = useCallback((answer: string) => {
      const isCorrect = questions[currentQuestionIndex].correctAnswer === answer;
      
      setTimeout(() => {
          if (isCorrect) {
              setScore(s => s + BASE_POINTS_PER_QUESTION);
          } else {
              setLives(l => {
                  const newLives = l - 1;
                  if (newLives <= 0) {
                      setGameOverReason('lives');
                      setGameStatus('game-over');
                  }
                  return newLives;
              });
          }

          if (gameStatus !== 'game-over') {
              // Note: using refs for current state in callbacks can be tricky, relying on React state updates here
              // We perform check in the next render cycle effectively
              setLives(currentLives => {
                 if (currentLives > 0) {
                     setCurrentQuestionIndex(curr => {
                        if (curr + 1 >= TOTAL_QUESTIONS) {
                            setGameOverReason('completed');
                            setGameStatus('game-over');
                            return curr;
                        }
                        return curr + 1;
                     });
                 }
                 return currentLives;
              });
          }
      }, 2000);
  }, [currentQuestionIndex, questions, gameStatus]);

  if (gameStatus === 'start') {
    return (
      <div className="min-h-[600px] h-full bg-slate-100 flex flex-col items-center justify-center p-4 rounded-xl">
        <div className="bg-white p-10 md:p-16 rounded-3xl shadow-2xl max-w-2xl text-center border-b-8 border-indigo-200">
          <h1 className="text-5xl md:text-7xl font-black text-slate-800 mb-6">Hellingproef</h1>
          <p className="text-xl text-slate-600 mb-10 leading-relaxed font-bold">
            Versnelt het karretje of vertraagt het? Vergelijk de krachten en scoor maximaal 100 punten!
          </p>
          <button
            onClick={handleStartGame}
            className="px-12 py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl active:scale-95 text-2xl"
          >
            Start Spel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[600px] bg-slate-100 overflow-hidden rounded-xl font-sans">
      <GameScreen
          question={questions[currentQuestionIndex]}
          onAnswer={handleAnswer}
          lives={lives}
          score={score}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={TOTAL_QUESTIONS}
      />
      {gameStatus === 'game-over' && (
        <GameOverOverlay 
          score={score} 
          onRestart={() => setGameStatus('start')}
          reason={gameOverReason}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Game5;