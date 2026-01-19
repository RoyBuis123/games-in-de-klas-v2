import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- TYPES ---
const ForceType = {
  Gravity: 'Zwaartekracht',
  Normal: 'Normaalkracht',
  Friction: 'Wrijvingskracht',
  Downslope: 'Fhelling',
} as const;

type ForceTypeKey = typeof ForceType[keyof typeof ForceType];

// --- CONSTANTS ---
const INCLINE_ANGLE_DEGREES = 30;
const CART_CENTER = { x: 223, y: 127 }; 
const VECTOR_LENGTH = 70;
const TOLERANCE_DEGREES = 15;
const START_POINT_TOLERANCE = 25;
const INITIAL_LIVES = 3;

interface ForceDefinition {
  type: ForceTypeKey;
  color: string;
  glowColor: string;
  icon: React.ReactNode;
  getCorrectAngle: (inclineAngle: number) => number;
  getCorrectVector: (inclineAngle: number) => { x1: number, y1: number, x2: number, y2: number };
}

const FORCE_DEFINITIONS: Record<string, ForceDefinition> = {
  [ForceType.Gravity]: {
    type: ForceType.Gravity,
    color: 'stroke-blue-500',
    glowColor: 'drop-shadow-[0_0_4px_#3b82f6]',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" /></svg>,
    getCorrectAngle: () => 90,
    getCorrectVector: () => ({
      x1: CART_CENTER.x, y1: CART_CENTER.y,
      x2: CART_CENTER.x, y2: CART_CENTER.y + VECTOR_LENGTH,
    }),
  },
  [ForceType.Normal]: {
    type: ForceType.Normal,
    color: 'stroke-emerald-500',
    glowColor: 'drop-shadow-[0_0_4px_#10b981]',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-11a1 1 0 10-2 0v3.586L5.293 9.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L9 10.586V7z" clipRule="evenodd" transform="rotate(180 10 10)" /></svg>,
    getCorrectAngle: (inclineAngle) => -inclineAngle - 90,
    getCorrectVector: (inclineAngle) => {
      const angleRad = ((-inclineAngle - 90) * Math.PI) / 180;
      return {
        x1: CART_CENTER.x, y1: CART_CENTER.y,
        x2: CART_CENTER.x + VECTOR_LENGTH * Math.cos(angleRad),
        y2: CART_CENTER.y + VECTOR_LENGTH * Math.sin(angleRad),
      };
    },
  },
  [ForceType.Friction]: {
    type: ForceType.Friction,
    color: 'stroke-red-500',
    glowColor: 'drop-shadow-[0_0_4px_#ef4444]',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" /></svg>,
    getCorrectAngle: (inclineAngle) => -inclineAngle,
    getCorrectVector: (inclineAngle) => {
      const angleRad = ((-inclineAngle) * Math.PI) / 180;
      return {
        x1: CART_CENTER.x, y1: CART_CENTER.y,
        x2: CART_CENTER.x + VECTOR_LENGTH * Math.cos(angleRad),
        y2: CART_CENTER.y + VECTOR_LENGTH * Math.sin(angleRad),
      };
    },
  },
  [ForceType.Downslope]: {
      type: ForceType.Downslope,
      color: 'stroke-violet-500',
      glowColor: 'drop-shadow-[0_0_4px_#8b5cf6]',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path transform="rotate(60 10 10)" fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" /></svg>,
      getCorrectAngle: (inclineAngle) => -inclineAngle + 180,
      getCorrectVector: (inclineAngle) => {
        const angleRad = ((-inclineAngle + 180) * Math.PI) / 180;
        return {
          x1: CART_CENTER.x, y1: CART_CENTER.y,
          x2: CART_CENTER.x + VECTOR_LENGTH * Math.cos(angleRad),
          y2: CART_CENTER.y + VECTOR_LENGTH * Math.sin(angleRad),
        };
      },
  },
};

// --- COMPONENTS ---

const CheckIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
);

const ForceButton = ({ forceDef, isSelected, isCompleted, onClick, disabled }: any) => {
  const baseClasses = "w-full text-left p-3 my-2 rounded-lg transition-all duration-200 ease-in-out flex items-center font-bold shadow-md transform active:translate-y-px border-b-4";
  
  const stateClasses = isCompleted
    ? "bg-green-500 border-green-700 text-white"
    : isSelected
    ? "bg-yellow-400 border-yellow-600 text-black ring-4 ring-yellow-300 ring-offset-2 ring-offset-white"
    : "bg-gray-200 hover:bg-gray-300 border-gray-400 text-gray-800";

  const disabledClasses = disabled && !isCompleted ? "bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed" : "hover:-translate-y-1";

  return (
    <button onClick={() => onClick(forceDef.type)} className={`${baseClasses} ${stateClasses} ${disabledClasses}`} disabled={disabled || isCompleted}>
      <div className="mr-3">{isCompleted ? <CheckIcon className="w-6 h-6"/> : forceDef.icon}</div>
      <span className="flex-grow text-sm uppercase tracking-wider">{forceDef.type}</span>
    </button>
  );
};

const InclinedPlaneDiagram = ({ correctForces, drawingLine, onDrawStart, onDrawing, onDrawEnd }: any) => {
  const rampPath = useMemo(() => {
    const angleRad = (INCLINE_ANGLE_DEGREES * Math.PI) / 180;
    const startX = 50;
    const startY = 250;
    const length = 400;
    const endX = startX + length * Math.cos(angleRad);
    const endY = startY - length * Math.sin(angleRad);
    return `M ${startX-40} ${startY+20} L ${startX} ${startY} L ${endX} ${endY} L ${endX+20} ${endY+40} L ${startX-40} ${startY+20} Z`;
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-1 shadow-inner select-none touch-none">
    <svg 
      viewBox="0 0 500 300" 
      className="w-full h-auto rounded-lg cursor-crosshair"
      style={{ background: 'radial-gradient(circle, #f0f9ff 0%, #e0f2fe 100%)' }}
      onMouseDown={onDrawStart}
      onMouseMove={onDrawing}
      onMouseUp={onDrawEnd}
      onMouseLeave={onDrawEnd}
      // Touch events support
      onTouchStart={onDrawStart}
      onTouchMove={onDrawing}
      onTouchEnd={onDrawEnd}
    >
      <defs>
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor: '#a5f3fc', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#e0f2fe', stopOpacity: 1}} />
        </linearGradient>
        <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{stopColor: '#22c55e', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: '#16a34a', stopOpacity: 1}} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#skyGradient)" />
      
      <path d="M -5 255 C 80 280, 130 240, 180 260 S 280 290, 330 260 S 430 250, 505 280 L 505 305 L -5 305 Z" fill="#0ea5e9" opacity="0.7">
         <animate attributeName="d"
            values="M -5 255 C 80 280, 130 240, 180 260 S 280 290, 330 260 S 430 250, 505 280 L 505 305 L -5 305 Z;
                    M -5 260 C 80 270, 130 250, 180 255 S 280 280, 330 270 S 430 260, 505 270 L 505 305 L -5 305 Z;
                    M -5 255 C 80 280, 130 240, 180 260 S 280 290, 330 260 S 430 250, 505 280 L 505 305 L -5 305 Z"
            dur="4s" repeatCount="indefinite" />
      </path>

      <path d={rampPath} fill="url(#mountainGradient)" stroke="#15803d" strokeWidth="1.5" />
      
      <g transform={`translate(${CART_CENTER.x}, ${CART_CENTER.y}) rotate(-${INCLINE_ANGLE_DEGREES})`}>
        <path d="M -25 -15 L 25 -15 L 20 5 L -20 5 Z" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5"/>
        <circle cx="-15" cy="12" r="7" fill="#d1d5db" stroke="#4b5563" strokeWidth="1.5"/>
        <circle cx="15" cy="12" r="7" fill="#d1d5db" stroke="#4b5563" strokeWidth="1.5"/>
      </g>
      
      <circle cx={CART_CENTER.x} cy={CART_CENTER.y} r="3" fill="black" />

      {Array.from(correctForces).map((forceType: any) => {
          const def = FORCE_DEFINITIONS[forceType];
          const vector = def.getCorrectVector(INCLINE_ANGLE_DEGREES);
          const colorClass = def.color.replace('stroke-', 'text-');
          return (
              <g key={forceType} className={def.glowColor}>
                  <defs>
                      <marker id={`arrowhead-${forceType}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse" fill="currentColor">
                          <path d="M 0 0 L 10 5 L 0 10 z" />
                      </marker>
                  </defs>
                  <line 
                      x1={vector.x1} y1={vector.y1} 
                      x2={vector.x2} y2={vector.y2} 
                      className={`${def.color} ${colorClass} transition-all duration-500`}
                      strokeWidth="2.5" 
                      markerEnd={`url(#arrowhead-${forceType})`} 
                  />
              </g>
          );
      })}
      {drawingLine && (
        <line 
          x1={drawingLine.x1} y1={drawingLine.y1}
          x2={drawingLine.x2} y2={drawingLine.y2}
          stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4"
        />
      )}
    </svg>
    </div>
  );
};

const GameHUD = ({ score, lives, time }: { score: number, lives: number, time: number }) => {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div className="flex justify-between items-center bg-gray-50 text-gray-700 p-3 rounded-t-lg border-b border-gray-200 mb-4 font-sans">
            <div className="flex items-center space-x-2">
                <span className="text-blue-600 text-lg font-bold">SCORE:</span>
                <span className="text-2xl tracking-widest text-gray-800 font-black">{score.toString().padStart(3, '0')}/100</span>
            </div>
             <div className="flex items-center space-x-2">
                <span className="text-gray-500 text-lg font-bold">TIJD:</span>
                <span className="text-2xl tracking-widest text-gray-800 font-black">{formatTime(time)}</span>
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-red-500 text-lg font-bold">LEVENS:</span>
                <div className="flex items-center space-x-2">
                    {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                         <svg key={i} className={`w-6 h-6 transition-all duration-300 ${i < lives ? 'text-red-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                    ))}
                </div>
            </div>
        </div>
    );
};

const GameStartScreen = ({ onStart }: { onStart: () => void }) => {
    return (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10 p-4">
            <div className="text-center p-8 rounded-xl shadow-2xl bg-white text-gray-800 border border-gray-200 max-w-lg">
                <h2 className="text-4xl font-sans font-black tracking-wider text-blue-600 mb-4">KLAAR VOOR DE START?</h2>
                <p className="text-lg mb-3">Een karretje staat bovenaan een berg en dreigt naar beneden te rollen, het water in!</p>
                <p className="text-lg mb-6">Jouw opdracht: Teken de <strong>Zwaartekracht</strong>, <strong>Normaalkracht</strong>, <strong>Wrijvingskracht</strong> en <strong>Fhelling</strong> om het karretje te redden.</p>
                <button
                    onClick={onStart}
                    className="px-10 py-4 bg-blue-500 text-white font-bold text-xl rounded-lg hover:bg-blue-600 transition-transform transform hover:scale-105 shadow-lg border-b-4 border-blue-700 active:translate-y-px font-sans"
                >
                    START SPEL
                </button>
            </div>
        </div>
    );
};

const GameEndScreen = ({ gameState, score, time, onRestart, onSave }: any) => {
    const isWin = gameState === 'won';
    // Remove time bonus from final score calculation to keep cap at 100
    const finalScore = score;

    return (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-10">
            <div className={`max-w-sm w-full text-center p-8 rounded-xl shadow-2xl bg-white text-gray-800 border-2 ${isWin ? 'border-green-500' : 'border-red-600'}`}>
                <h2 className="text-4xl font-sans font-black tracking-wider mb-2">{isWin ? 'KARRETJE GERED!' : 'PLONS! MISLUKT!'}</h2>
                <p className="text-md mb-2">{isWin ? `Goed gedaan! Het karretje staat veilig.` : 'Helaas, het karretje is in het water gerold.'}</p>
                <div className="text-left bg-gray-100 text-gray-800 rounded-lg p-4 my-4 w-full">
                   <div className="flex justify-between font-bold text-lg pt-1"><span>EINDSCORE:</span> <span>{finalScore}/100</span></div>
                </div>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => onSave(finalScore)}
                        className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105 shadow-lg font-sans w-full"
                    >
                        SCORE OPSLAAN
                    </button>
                    <button
                        onClick={onRestart}
                        className="px-8 py-2 text-blue-600 font-bold hover:bg-blue-50 rounded-lg transition-colors font-sans w-full"
                    >
                        PROBEER OPNIEUW
                    </button>
                </div>
            </div>
        </div>
    );
};

interface Game4Props {
  onComplete: (score: number) => void;
  onClose: () => void;
}

const Game4: React.FC<Game4Props> = ({ onComplete, onClose }) => {
  const [gameState, setGameState] = useState<'pre-game' | 'playing' | 'won' | 'lost'>('pre-game');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [time, setTime] = useState(0);
  
  const [correctForces, setCorrectForces] = useState(new Set<ForceTypeKey>());
  const [selectedForce, setSelectedForce] = useState<ForceTypeKey | null>(null);
  const [drawingLine, setDrawingLine] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [feedback, setFeedback] = useState({ message: "Wacht op de start van het spel...", type: 'info' });
  
  useEffect(() => {
    let intervalId: number;
    if (gameState === 'playing') {
      intervalId = window.setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [gameState]);

  const getSVGPoint = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent, svg: SVGSVGElement) => {
    const pt = svg.createSVGPoint();
    // @ts-ignore
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    // @ts-ignore
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    pt.x = clientX;
    pt.y = clientY;
    const CTM = svg.getScreenCTM();
    if (CTM) return pt.matrixTransform(CTM.inverse());
    return { x: 0, y: 0 };
  };
  
  const handleSelectForce = (force: ForceTypeKey) => {
    if (correctForces.has(force) || gameState !== 'playing') return;
    setSelectedForce(force);
    setFeedback({ message: `Geselecteerd: ${force}. Teken de kracht vanuit de zwarte stip.`, type: 'info' });
  };

  const handleDrawStart = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!selectedForce || gameState !== 'playing') return;
    // e.preventDefault(); // Prevents touch scroll
    setIsDrawing(true);
    const { x, y } = getSVGPoint(e.nativeEvent, e.currentTarget);
    setDrawingLine({ x1: x, y1: y, x2: x, y2: y });
  };
  
  const handleDrawing = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!isDrawing || !drawingLine) return;
    // e.preventDefault();
    const { x, y } = getSVGPoint(e.nativeEvent, e.currentTarget);
    setDrawingLine({ ...drawingLine, x2: x, y2: y });
  };

  const handleDrawEnd = useCallback(() => {
    if (!isDrawing || !drawingLine || !selectedForce) return;

    setIsDrawing(false);
    
    const startDistance = Math.hypot(drawingLine.x1 - CART_CENTER.x, drawingLine.y1 - CART_CENTER.y);
    if (startDistance > START_POINT_TOLERANCE) {
      setFeedback({ message: "Fout: Je moet tekenen vanuit de zwarte stip (zwaartepunt).", type: 'error' });
      setDrawingLine(null); return;
    }

    const dx = drawingLine.x2 - drawingLine.x1;
    const dy = drawingLine.y2 - drawingLine.y1;
    if (Math.hypot(dx, dy) < 10) { setDrawingLine(null); return; }

    let drawnAngleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    const forceDef = FORCE_DEFINITIONS[selectedForce];
    let correctAngleDeg = forceDef.getCorrectAngle(INCLINE_ANGLE_DEGREES);
    
    const angleDiff = Math.abs(drawnAngleDeg - correctAngleDeg);
    const normalizedAngleDiff = Math.min(angleDiff, 360 - angleDiff);
    const isCorrect = normalizedAngleDiff <= TOLERANCE_DEGREES;

    if (isCorrect) {
      const newCorrectForces = new Set(correctForces).add(selectedForce);
      setCorrectForces(newCorrectForces);
      
      // Update scoring: 4 forces total. Max 100 points.
      // Base points 15. Bonus up to 10. Max 25 per force.
      const precisionBonus = Math.round(10 * (1 - (normalizedAngleDiff / TOLERANCE_DEGREES)));
      const points = 15 + precisionBonus;
      
      const isGameWon = newCorrectForces.size === Object.keys(FORCE_DEFINITIONS).length;
      
      if (isGameWon) {
        setScore(prev => prev + points);
        setFeedback({ message: `Alle krachten correct! +${points} punten. Karretje gered!`, type: 'success' });
        setGameState('won');
      } else {
        setScore(prev => prev + points);
        setSelectedForce(null);
        setFeedback({ message: `Correct! +${points} punten voor ${selectedForce}.`, type: 'success' });
      }
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setFeedback({ message: "Incorrecte richting. Het karretje wiebelt! Probeer het opnieuw.", type: 'error' });
      if (newLives <= 0) {
          setGameState('lost');
      }
    }
    setDrawingLine(null);
  }, [isDrawing, drawingLine, selectedForce, correctForces, lives]);

  const handleStartGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(INITIAL_LIVES);
    setTime(0);
    setCorrectForces(new Set());
    setSelectedForce(null);
    setDrawingLine(null);
    setFeedback({ message: "Selecteer een kracht om het spel te starten.", type: 'info' });
  };
  
  const handleRestart = () => {
    setGameState('pre-game');
  };
  
  const feedbackClasses = {
    info: 'bg-blue-100 text-blue-800 border-blue-300',
    success: 'bg-green-100 text-green-800 border-green-300',
    error: 'bg-red-100 text-red-800 border-red-300',
  }[feedback.type as 'info' | 'success' | 'error'];

  return (
    <div className="flex items-center justify-center p-4 bg-gray-100 w-full h-full min-h-[600px] rounded-xl relative overflow-hidden">
        {gameState === 'pre-game' && <GameStartScreen onStart={handleStartGame} />}
        {(gameState === 'lost' || gameState === 'won') && (
            <GameEndScreen 
                gameState={gameState} 
                score={score} 
                time={time} 
                onRestart={handleRestart}
                onSave={onComplete}
            />
        )}
        
        <div className="w-full max-w-4xl mx-auto bg-white text-gray-800 rounded-2xl shadow-sm relative border border-gray-200">
          <div className="text-center p-5 border-b border-gray-200">
            <h1 className="text-3xl font-sans font-black tracking-wider text-blue-600">Krachten op een Helling</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            <div className="md:col-span-2 flex flex-col">
               <GameHUD score={score} lives={lives} time={time} />
               <InclinedPlaneDiagram 
                  correctForces={correctForces}
                  drawingLine={drawingLine}
                  onDrawStart={handleDrawStart}
                  onDrawing={handleDrawing}
                  onDrawEnd={handleDrawEnd}
              />
            </div>
            <div className="flex flex-col justify-center bg-gray-50 p-4 rounded-lg border border-gray-200 h-fit">
                <h2 className="font-sans text-xl text-gray-600 mb-2 text-center font-bold">KRACHTEN</h2>
                {Object.values(FORCE_DEFINITIONS).map(def => (
                  <ForceButton 
                    key={def.type}
                    forceDef={def}
                    isSelected={selectedForce === def.type}
                    isCompleted={correctForces.has(def.type)}
                    onClick={handleSelectForce}
                    disabled={gameState !== 'playing'}
                  />
                ))}
            </div>
          </div>
          
          <div className={`m-6 mt-0 p-3 rounded-lg text-center transition-all duration-300 border ${feedbackClasses}`}>
              <p className="font-bold">{feedback.message}</p>
          </div>
        </div>
    </div>
  );
};

export default Game4;