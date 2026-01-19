import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';

// --- Types & Constants ---

const ForceType = {
  Zwaartekracht: 'Zwaartekracht',
  Normaalkracht: 'Normaalkracht',
  Wrijvingskracht: 'Wrijvingskracht',
} as const;

type ForceTypeKey = keyof typeof ForceType;

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 20;
const PLAYER_SPEED = 10;
const PLAYER_Y_OFFSET = 30;
const ARROW_WIDTH = 50;
const ARROW_HEIGHT = 50;
const BASE_ARROW_SPEED = 1.5;
const ARROW_SPAWN_INTERVAL = 2000;
const PROJECTILE_WIDTH = 8;
const PROJECTILE_HEIGHT = 40;
const PROJECTILE_SPEED = 7;
const INITIAL_LIVES = 3;
const MAX_LIVES = 5;
const MAX_SCORE = 100;

const FORCES_CONFIG = {
  [ForceType.Zwaartekracht]: {
    name: 'Zwaartekracht',
    color: 'stroke-red-400',
    bgColor: 'bg-red-500/80',
    borderColor: 'border-red-400',
    rotation: 0,
  },
  [ForceType.Normaalkracht]: {
    name: 'Normaalkracht',
    color: 'stroke-blue-400',
    bgColor: 'bg-blue-500/80',
    borderColor: 'border-blue-400',
    rotation: 180,
  },
  [ForceType.Wrijvingskracht]: {
    name: 'Wrijvingskracht',
    color: 'stroke-yellow-400',
    bgColor: 'bg-yellow-500/80',
    borderColor: 'border-yellow-400',
  },
};

// --- Sound Utils ---

let audioContext: AudioContext | null = null;
const initAudio = async () => {
  if (!audioContext) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioCtx();
    } catch (e) {
      console.error("Web Audio API is not supported in this browser");
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
    await audioContext.resume();
  }
};

const playSound = (type: OscillatorType, frequency: number, duration: number, volume = 0.5) => {
  if (!audioContext || audioContext.state !== 'running') return;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

const playShoot = () => {
  playSound('sine', 880, 0.05, 0.2);
  playSound('square', 440, 0.05, 0.1);
};
const playHitCorrect = () => {
  if (!audioContext) return;
  playSound('sine', 523.25, 0.1, 0.4);
  setTimeout(() => playSound('sine', 783.99, 0.15, 0.4), 60);
};
const playHitIncorrect = () => playSound('sawtooth', 164.81, 0.15, 0.3);
const playLoseLife = () => {
  if (!audioContext) return;
  playSound('square', 130.81, 0.1, 0.4);
  setTimeout(() => playSound('square', 123.47, 0.2, 0.4), 50);
};
const playLevelUp = () => {
  if (!audioContext) return;
  const baseVol = 0.3;
  const playNote = (freq: number, delay: number) => setTimeout(() => playSound('triangle', freq, 0.1, baseVol), delay);
  playNote(523.25, 0);
  playNote(659.25, 80);
  playNote(783.99, 160);
  playNote(1046.50, 240);
};
const playGameOver = () => {
  if (!audioContext) return;
  playSound('sawtooth', 200, 0.4, 0.4);
  setTimeout(() => playSound('sawtooth', 100, 0.5, 0.4), 100);
};
const playWinGame = () => {
    if (!audioContext) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((note, index) => {
        setTimeout(() => playSound('sine', note, 0.2, 0.4), index * 150);
    });
};
const playButtonClick = () => playSound('sine', 1200, 0.08, 0.2);

// --- Sub-Components ---

const ArrowIcon = ({ type, rotation }: { type: ForceTypeKey; rotation: number }) => {
  const config = FORCES_CONFIG[type];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={`w-full h-full ${config.color}`}
      style={{ transform: `rotate(${rotation}deg)` }}
      strokeWidth={1.5}
    >
        <filter id={`glow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
        <g style={{ filter: `url(#glow-${type})` }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25 12 21m0 0-3.75-3.75M12 21V3" />
        </g>
    </svg>
  );
};

const Player = ({ x }: { x: number }) => {
  const points = `${PLAYER_WIDTH / 2},0 ${PLAYER_WIDTH},${PLAYER_HEIGHT} 0,${PLAYER_HEIGHT}`;
  return (
    <svg
      className="absolute"
      style={{
        transform: `translateX(${x}px)`,
        willChange: 'transform',
        bottom: PLAYER_Y_OFFSET - PLAYER_HEIGHT,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.7)) drop-shadow(0 0 4px rgba(150, 255, 255, 0.8))',
      }}
      viewBox={`0 0 ${PLAYER_WIDTH} ${PLAYER_HEIGHT}`}
    >
      <polygon
          points={points}
          className="fill-cyan-500 stroke-cyan-300"
          strokeWidth="2"
          strokeLinejoin="round"
      />
    </svg>
  );
};

const FallingArrow = ({ arrow }: { arrow: any }) => {
  return (
    <div
      className="absolute"
      style={{
        left: arrow.x,
        top: arrow.y,
        width: arrow.width,
        height: arrow.height,
      }}
    >
      <ArrowIcon type={arrow.type} rotation={arrow.rotation} />
    </div>
  );
};

const ProjectileComponent = ({ projectile }: { projectile: any }) => {
  const config = FORCES_CONFIG[projectile.type as ForceTypeKey];
  return (
    <div
      className={`absolute rounded-full ${config.bgColor}`}
      style={{
        left: projectile.x - projectile.width / 2,
        top: projectile.y - projectile.height / 2,
        width: projectile.width,
        height: projectile.height,
        boxShadow: `0 0 20px 4px var(--tw-shadow-color)`,
        // @ts-ignore
        '--tw-shadow-color': `var(--fallback-color, ${config.borderColor.replace('border-','').replace('-400','')})`
      }}
    >
    </div>
  );
};

const ExplosionComponent = ({ explosion, onComplete }: { explosion: any; onComplete: (id: number) => void }) => {
  const { x, y, type, id } = explosion;
  const config = FORCES_CONFIG[type as ForceTypeKey];
  const PARTICLE_COUNT = 12;
  const SPREAD = 60;
  const DURATION = 600;

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(id);
    }, DURATION);
    return () => clearTimeout(timer);
  }, [id, onComplete]);

  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }).map((_, index) => {
      const angle = (index / PARTICLE_COUNT) * 2 * Math.PI;
      const randomSpread = SPREAD * (0.5 + Math.random() * 0.5);
      const endX = Math.cos(angle) * randomSpread;
      const endY = Math.sin(angle) * randomSpread;
      const size = 4 + Math.random() * 4;
      return {
        id: index,
        style: {
          '--transform-end': `translate(${endX}px, ${endY}px)`,
          width: `${size}px`,
          height: `${size}px`,
        } as React.CSSProperties,
      };
    });
  }, []);

  return (
    <div className="absolute" style={{ left: x, top: y, pointerEvents: 'none' }}>
      <style>
      {`
        @keyframes particle-fade-out {
          from { transform: translate(0, 0) scale(1); opacity: 1; }
          to { transform: var(--transform-end); opacity: 0; scale: 0; }
        }
        .particle-animation {
          animation: particle-fade-out 0.6s ease-out forwards;
        }
      `}
      </style>
      {particles.map(p => (
        <div
          key={p.id}
          className={`absolute rounded-full particle-animation ${config.bgColor}`}
          style={p.style}
        />
      ))}
    </div>
  );
};

const HeartIcon = ({className}: {className: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-1.344-.682 15.64 15.64 0 0 1-1.292-1.043A3.856 3.856 0 0 1 6.5 12.645V12.5A2.5 2.5 0 0 1 9 10h6a2.5 2.5 0 0 1 2.5 2.5v.145c0 .252.039.5.118.742l.022.068a15.64 15.64 0 0 1-1.292 1.043 15.247 15.247 0 0 1-1.344.682l-.022.012-.007.003-.001.001a.752.752 0 0 1-.704 0l-.001-.001Z" />
    </svg>
);

const HUD = ({ score, lives }: { score: number; lives: number; }) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-lg z-10 bg-black/20">
      <div className="font-bold">
        SCORE: <span className="text-yellow-300 tabular-nums">{score}</span> / {MAX_SCORE}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold">LEVEN:</span>
        <div className="flex">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
                <HeartIcon key={i} className={`w-6 h-6 transition-colors ${i < lives ? 'text-red-500' : 'text-slate-600'}`} />
            ))}
        </div>
      </div>
    </div>
  );
};

const Controls = ({ selectedAmmo, onSelectAmmo }: { selectedAmmo: string; onSelectAmmo: (t: ForceTypeKey) => void }) => {
  const forceTypes = Object.values(ForceType);
  return (
    <div className="mt-4 p-2 bg-slate-800/80 rounded-lg w-full max-w-[800px] border-2 border-slate-700">
        <p className="text-center text-sm text-slate-400 mb-2">Selecteer een kracht om te schieten</p>
        <div className="grid grid-cols-3 gap-2">
            {forceTypes.map(type => {
                const config = FORCES_CONFIG[type];
                const isSelected = selectedAmmo === type;
                return (
                <button
                    key={type}
                    onClick={() => onSelectAmmo(type)}
                    className={`p-3 rounded-md text-center font-bold text-sm md:text-base transition-all duration-200 border-2 ${
                    isSelected
                        ? `${config.borderColor} ${config.bgColor} scale-105 shadow-lg`
                        : 'bg-slate-700 border-transparent hover:bg-slate-600'
                    }`}
                >
                    {config.name}
                </button>
                );
            })}
        </div>
    </div>
  );
};

const GameOver = ({ score, onRestart, onMenu, onSave }: { score: number; onRestart: () => void; onMenu: () => void; onSave: () => void }) => {
  const handleRestart = () => { playButtonClick(); onRestart(); };
  const handleMenu = () => { playButtonClick(); onMenu(); };
  const handleSave = () => { playButtonClick(); onSave(); };
  const isWin = score >= MAX_SCORE;

  return (
    <div className="bg-slate-800/90 p-8 rounded-lg text-center flex flex-col items-center gap-4 border-2 border-slate-700 shadow-2xl backdrop-blur-sm z-50">
      <h2 className={`text-3xl font-bold ${isWin ? 'text-green-500' : 'text-red-500'}`}>
          {isWin ? 'GEWONNEN!' : 'Game Over'}
      </h2>
      <p className="text-xl text-slate-300">Je eindscore is:</p>
      <p className="text-5xl font-bold text-yellow-300 mb-4">{score}</p>
      {isWin && <p className="text-green-300 mb-4 font-bold">Maximale score bereikt!</p>}
      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={handleSave}
          className="bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105"
        >
          Score Opslaan & Afsluiten
        </button>
        <div className="flex gap-4 justify-center mt-2">
            <button
                onClick={handleRestart}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-2 px-4 rounded-lg text-base transition-transform transform hover:scale-105"
            >
                Opnieuw
            </button>
            <button
                onClick={handleMenu}
                className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg text-base transition-transform transform hover:scale-105"
            >
                Menu
            </button>
        </div>
      </div>
    </div>
  );
};

const MainMenu = ({ onStartGame }: { onStartGame: () => void }) => {
  return (
    <div className="bg-slate-800/90 p-8 rounded-lg text-center flex flex-col items-center gap-6 border-2 border-slate-700 shadow-2xl backdrop-blur-sm z-50">
      <h2 className="text-3xl font-bold text-yellow-300">Welkom!</h2>
      <div className="max-w-md text-slate-300 space-y-4">
        <p>In dit spel vallen krachten (als pijlen) naar beneden. Jouw taak is om de juiste kracht te selecteren en op de corresponderende pijl te schieten.</p>
        <p>Probeer <strong>100 punten</strong> te halen om te winnen!</p>
        <p className="font-semibold">Besturing:</p>
        <ul className="list-disc list-inside text-left mx-auto max-w-xs">
          <li><span className="font-bold text-cyan-400">Pijltjes</span>: Beweeg je schieter</li>
          <li><span className="font-bold text-cyan-400">1, 2, 3 / Klikken</span>: Selecteer een kracht</li>
          <li><span className="font-bold text-cyan-400">Spatiebalk</span>: Schiet de geselecteerde kracht</li>
        </ul>
      </div>
      <button
        onClick={onStartGame}
        className="bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-3 px-8 rounded-lg text-xl transition-transform transform hover:scale-105 shadow-lg shadow-green-500/30"
      >
        Start Spel
      </button>
    </div>
  );
};

// --- Game Logic Component ---

const checkCollision = (obj1: any, obj2: any) => {
  return obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y;
};

const Game = ({ onGameOver }: { onGameOver: (score: number) => void }) => {
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
  const [arrows, setArrows] = useState<any[]>([]);
  const [projectiles, setProjectiles] = useState<any[]>([]);
  const [explosions, setExplosions] = useState<any[]>([]);
  const [selectedAmmo, setSelectedAmmo] = useState<ForceTypeKey>(ForceType.Zwaartekracht);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const keysPressed = useRef<{[key: string]: boolean}>({});
  const gameLoopRef = useRef<number | null>(null);
  const lastArrowSpawnTime = useRef(Date.now());
  const gameStateRef = useRef({ score, lives, level, arrows, projectiles, playerX, selectedAmmo });

  useEffect(() => {
    gameStateRef.current = { score, lives, level, arrows, projectiles, playerX, selectedAmmo };
  }, [score, lives, level, arrows, projectiles, playerX, selectedAmmo]);

  const removeExplosion = useCallback((id: number) => {
    setExplosions(prev => prev.filter(exp => exp.id !== id));
  }, []);

  const spawnArrow = useCallback(() => {
    const forceTypes = Object.values(ForceType);
    const type = forceTypes[Math.floor(Math.random() * forceTypes.length)];
    const x = Math.random() * (GAME_WIDTH - ARROW_WIDTH);
    let rotation;
    if (type === ForceType.Wrijvingskracht) {
      rotation = Math.random() < 0.5 ? 90 : 270;
    } else {
      rotation = FORCES_CONFIG[type].rotation;
    }
    const newArrow = { id: Date.now(), x, y: -ARROW_HEIGHT, type, width: ARROW_WIDTH, height: ARROW_HEIGHT, rotation };
    setArrows(prev => [...prev, newArrow]);
  }, []);

  const fireProjectile = useCallback(() => {
    playShoot();
    setProjectiles(prev => [
      ...prev,
      {
        id: Date.now(),
        x: gameStateRef.current.playerX + PLAYER_WIDTH / 2,
        y: GAME_HEIGHT - PLAYER_Y_OFFSET,
        type: gameStateRef.current.selectedAmmo,
        width: PROJECTILE_WIDTH,
        height: PROJECTILE_HEIGHT,
      },
    ]);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysPressed.current[e.key] = true;
    if (e.code === 'Space') {
      e.preventDefault();
      fireProjectile();
    }
    switch (e.key) {
      case '1': setSelectedAmmo(ForceType.Zwaartekracht); break;
      case '2': setSelectedAmmo(ForceType.Normaalkracht); break;
      case '3': setSelectedAmmo(ForceType.Wrijvingskracht); break;
    }
  }, [fireProjectile]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysPressed.current[e.key] = false;
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    const gameLoop = () => {
      if (keysPressed.current['ArrowLeft'] || keysPressed.current['ArrowRight']) {
        setPlayerX(prevX => {
          let newX = prevX;
          if (keysPressed.current['ArrowLeft']) newX -= PLAYER_SPEED;
          if (keysPressed.current['ArrowRight']) newX += PLAYER_SPEED;
          return Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, newX));
        });
      }

      const { level: currentLevel, arrows: currentArrows, projectiles: currentProjectiles, lives: previousLives, score: previousScore } = gameStateRef.current;
      const arrowSpeed = BASE_ARROW_SPEED + (currentLevel - 1) * 0.3;

      let livesToLose = 0;
      let scoreToAdd = 0;
      const explosionsToAdd: any[] = [];
      const hitArrowIds = new Set();
      
      // 1. Calculate projectile and collision outcomes
      const nextProjectiles = currentProjectiles
          .map(p => ({ ...p, y: p.y - PROJECTILE_SPEED }))
          .filter(p => {
              if (p.y <= -PROJECTILE_HEIGHT) return false;

              const hitArrow = currentArrows.find(arrow => !hitArrowIds.has(arrow.id) && checkCollision(p, arrow));
              if (hitArrow) {
                  hitArrowIds.add(hitArrow.id);
                  explosionsToAdd.push({ id: Date.now() + Math.random(), x: p.x, y: p.y, type: p.type });
                  if (p.type === hitArrow.type) {
                      playHitCorrect();
                      scoreToAdd += 10;
                  } else {
                      playHitIncorrect();
                      livesToLose += 1;
                  }
                  return false; // Projectile is consumed
              }
              return true; // Projectile continues
          });

      // 2. Calculate arrow outcomes
      const nextArrows = currentArrows
          .filter(a => !hitArrowIds.has(a.id))
          .map(arrow => ({ ...arrow, y: arrow.y + arrowSpeed }))
          .filter(arrow => {
              if (arrow.y > GAME_HEIGHT) {
                  playLoseLife();
                  livesToLose += 1;
                  return false;
              }
              return true;
          });
      
      // 3. Apply all state changes at once
      setProjectiles(nextProjectiles);
      setArrows(nextArrows);
      if (explosionsToAdd.length > 0) setExplosions(prev => [...prev, ...explosionsToAdd]);
      if (livesToLose > 0) setLives(l => Math.max(0, l - livesToLose));
      if (scoreToAdd > 0) setScore(s => s + scoreToAdd);

      // 4. Check for game over or win
      const newScore = previousScore + scoreToAdd;
      if (newScore >= MAX_SCORE) {
          playWinGame();
          onGameOver(MAX_SCORE);
          return;
      }
      
      if (previousLives > 0 && (previousLives - livesToLose) <= 0) {
        onGameOver(newScore);
        return;
      }

      // 5. Spawn new arrows
      if (Date.now() - lastArrowSpawnTime.current > ARROW_SPAWN_INTERVAL / (1 + (currentLevel - 1) * 0.15)) {
        spawnArrow();
        lastArrowSpawnTime.current = Date.now();
      }

      // 6. Update Level
      // Level up every 30 points instead of 100 since max is 100
      if (newScore > currentLevel * 30 && currentLevel < 4) {
        playLevelUp();
        setLevel(l => l + 1);
        setLives(l => Math.min(MAX_LIVES, l + 1));
      }
      
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [onGameOver, spawnArrow]);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative bg-slate-800 border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20 overflow-hidden"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        <HUD score={score} lives={lives} />
        <Player x={playerX} />
        {arrows.map(arrow => <FallingArrow key={arrow.id} arrow={arrow} />)}
        {projectiles.map(p => <ProjectileComponent key={p.id} projectile={p} />)}
        {explosions.map(exp => <ExplosionComponent key={exp.id} explosion={exp} onComplete={removeExplosion} />)}
      </div>
      <Controls selectedAmmo={selectedAmmo} onSelectAmmo={setSelectedAmmo} />
    </div>
  );
};

// --- Main Wrapper ---

interface Game3Props {
  onComplete: (score: number) => void;
  onClose: () => void;
}

const Game3: React.FC<Game3Props> = ({ onComplete, onClose }) => {
  const [gameState, setGameState] = useState<'MainMenu' | 'Playing' | 'GameOver'>('MainMenu');
  const [score, setScore] = useState(0);

  const startGame = useCallback(async () => {
    await initAudio();
    playButtonClick();
    setScore(0);
    setGameState('Playing');
  }, []);

  const endGame = useCallback((finalScore: number) => {
    // Only play game over sound if not a win (win sound played in game loop)
    if (finalScore < MAX_SCORE) {
        playGameOver();
    }
    setScore(finalScore);
    setGameState('GameOver');
  }, []);

  const returnToMenu = useCallback(() => {
    setGameState('MainMenu');
  }, []);
  
  const handleSaveAndExit = useCallback(() => {
      onComplete(score);
  }, [score, onComplete]);

  return (
    <div className="w-full flex justify-center bg-slate-900 rounded-xl p-4 overflow-auto min-h-[700px]">
        {gameState === 'Playing' && <Game onGameOver={endGame} />}
        {gameState === 'GameOver' && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
                <GameOver score={score} onRestart={startGame} onMenu={returnToMenu} onSave={handleSaveAndExit} />
            </div>
        )}
        {gameState === 'MainMenu' && (
             <div className="absolute inset-0 flex items-center justify-center z-20">
                <MainMenu onStartGame={startGame} />
             </div>
        )}
        
        {/* Render background elements only when in menu/gameover if needed, but Game component handles game view */}
        {gameState !== 'Playing' && (
             <div className="relative bg-slate-800 border-2 border-slate-700 w-[800px] h-[600px] opacity-20 pointer-events-none"></div>
        )}
    </div>
  );
};

export default Game3;