import React, { useState, useEffect, useCallback } from 'react';

// --- CONSTANTS ---
const GRAVITY = 9.81;
const MAX_ROUNDS = 5;
const POINTS_PER_ROUND = 20;

// --- SUB-COMPONENTS ---

const Instructions = () => (
    <div className="w-full p-4 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg text-sm md:text-base">
        <h3 className="font-bold text-white mb-2 drop-shadow-md">Jouw Opdracht</h3>
        <p className="text-white/90 drop-shadow-md mb-3">
            Pas de hellingshoek (θ) en de wrijvingscoëfficiënt (μ) aan om de gevraagde doelversnelling te evenaren.
        </p>
        <div className="bg-black/20 p-2 rounded-md text-center">
            <p className="font-mono text-white font-bold drop-shadow-md">a = g(sin θ – μ cos θ)</p>
        </div>
        <p className="text-xs text-sky-100 mt-2 text-right drop-shadow-sm">* g ≈ 9.81 m/s²</p>
    </div>
);

const SliderInput = ({ label, value, min, max, step, onChange, unit, disabled }: any) => (
    <div>
        <label className="block text-sm font-bold text-white drop-shadow-md mb-1">
            {label}: <span className="font-semibold text-yellow-300">{value.toFixed(2)}{unit}</span>
        </label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full h-3 bg-white/30 rounded-lg appearance-none cursor-pointer accent-sky-300 disabled:cursor-not-allowed disabled:accent-slate-400"
        />
    </div>
);

const ControlPanel = ({
    angle,
    setAngle,
    frictionCoefficient,
    setFrictionCoefficient,
    onSubmitAnswer,
    isShaking,
    isDisabled,
}: any) => {
    return (
        <div className={`w-full p-6 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg space-y-6 ${isShaking ? 'animate-shake' : ''}`}>
            <h3 className="text-xl font-bold text-white drop-shadow-md border-b border-white/30 pb-2">Instellingen</h3>
            <SliderInput
                label="Hellingshoek (θ)"
                value={angle}
                min={0}
                max={60}
                step={0.5}
                onChange={(e: any) => setAngle(parseFloat(e.target.value))}
                unit="°"
                disabled={isDisabled}
            />
            <SliderInput
                label="Wrijvingscoëfficiënt (μ)"
                value={frictionCoefficient}
                min={0}
                max={1.2}
                step={0.01}
                onChange={(e: any) => setFrictionCoefficient(parseFloat(e.target.value))}
                unit=""
                disabled={isDisabled}
            />
            <div className="pt-4 border-t border-white/30">
                <button
                    onClick={onSubmitAnswer}
                    disabled={isDisabled}
                    className="w-full bg-white text-sky-600 font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-sky-100 transition-transform transform hover:scale-105 disabled:bg-slate-400/50 disabled:text-white disabled:cursor-not-allowed disabled:scale-100"
                >
                    Check Antwoord
                </button>
            </div>
        </div>
    );
};

const ResultsDisplay = ({ acceleration }: { acceleration: number }) => {
    const statusText = acceleration > 0.05 ? "De kar versnelt!" : "De kar staat (bijna) stil.";
    const statusColor = acceleration > 0.05 ? "text-green-300" : "text-red-300";
    
    return (
        <div className="w-full p-4 md:p-6 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg text-center">
            <h3 className="text-lg font-bold text-white drop-shadow-md mb-2">Huidige Versnelling (a)</h3>
            <p className="text-4xl md:text-5xl font-bold text-white drop-shadow-md mb-2">
                {acceleration.toFixed(2)} <span className="text-2xl md:text-3xl opacity-80">m/s²</span>
            </p>
            <p className={`text-md font-bold h-6 drop-shadow-md ${statusColor}`}>
                {statusText}
            </p>
        </div>
    );
};

const Cart = () => (
    <div className="relative w-12 h-8" aria-label="Karretje">
        <div className="absolute -bottom-1 left-2 w-5 h-5 bg-slate-700 rounded-full border-2 border-slate-300 shadow-sm"></div>
        <div className="absolute -bottom-1 right-2 w-5 h-5 bg-slate-700 rounded-full border-2 border-slate-300 shadow-sm"></div>
        <div className="absolute bottom-[6px] left-0 w-12 h-6 bg-red-600 rounded-sm border-b-4 border-red-800 shadow-lg"></div>
    </div>
);

const InclinedPlane = ({ angle, isAnimating, onAnimationEnd }: any) => {
    const [position, setPosition] = useState(0);
    const planeLength = 400; // Adjusted for better fit
    const cartWidth = 48; // Corresponds to w-12

    useEffect(() => {
        if (isAnimating) {
            setPosition(planeLength - cartWidth);
            const timer = setTimeout(() => {
                onAnimationEnd();
                // Reset position after a delay, allowing for a new round
                setTimeout(() => setPosition(0), 500);
            }, 1500); // Animation duration
            return () => clearTimeout(timer);
        } else {
            setPosition(0);
        }
    }, [isAnimating, onAnimationEnd, planeLength, cartWidth]);

    const angleRad = (angle * Math.PI) / 180;
    const baseWidth = planeLength * Math.cos(angleRad);
    const planeHeight = planeLength * Math.sin(angleRad);

    return (
        <div className="relative w-full h-[350px] flex items-center justify-center overflow-hidden">
            <div className="relative" style={{ width: `${planeLength}px`, height: '280px' }}>
                <div 
                    className="absolute bottom-10 left-0 transition-transform duration-300"
                    style={{ 
                        transformOrigin: 'bottom left',
                        transform: `rotate(${-angle}deg)`
                    }}
                >
                    <div 
                        className="relative h-2 bg-slate-600 shadow-md rounded-full"
                        style={{ width: `${planeLength}px` }}
                    >
                        <div 
                            className="absolute"
                            style={{
                                bottom: '8px',
                                transform: `translateX(${position}px)`,
                                transition: isAnimating ? 'transform 1.5s ease-in-out' : 'none',
                            }}
                        >
                            <Cart />
                        </div>
                    </div>
                </div>

                {angle > 1 && (
                    <>
                        <div 
                            className="absolute bottom-10 left-0 h-1 bg-green-700/80 rounded-full transition-all duration-300" 
                            style={{ width: `${baseWidth}px` }}
                        />
                        <div 
                            className="absolute bg-green-700/80 rounded-full transition-all duration-300" 
                            style={{ 
                                left: `${baseWidth}px`,
                                bottom: '40px',
                                height: `${planeHeight}px`,
                                width: '4px',
                            }}
                        />
                        <div className="absolute bottom-2 left-8 text-white font-semibold text-lg drop-shadow-md">
                            {angle.toFixed(0)}°
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const GameStatus = ({ targetAcceleration, lives, feedback, round, score }: any) => {
    let feedbackColor = 'text-sky-100';
    if (feedback && feedback.includes('Perfect')) {
        feedbackColor = 'text-green-300';
    } else if (feedback) {
        feedbackColor = 'text-red-300';
    }

    return (
        <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-md z-10 mx-auto gap-4">
            <div className="text-center md:text-left">
                <h3 className="text-xs uppercase font-bold text-slate-500">Doel</h3>
                <p className="text-3xl font-bold text-sky-700">
                    {targetAcceleration.toFixed(2)} <span className="text-xl text-slate-600">m/s²</span>
                </p>
            </div>
            
            <div className={`flex-1 text-center transition-opacity duration-300 ${feedback ? 'opacity-100' : 'opacity-0'}`}>
                <p className={`text-xl font-bold drop-shadow-sm ${feedbackColor}`}>
                    {feedback}
                </p>
            </div>

            <div className="flex gap-6 text-center md:text-right">
                <div>
                   <h3 className="text-xs uppercase font-bold text-slate-500">Ronde</h3>
                   <p className="text-xl font-bold text-slate-700">{round} / {MAX_ROUNDS}</p>
                </div>
                <div>
                   <h3 className="text-xs uppercase font-bold text-slate-500">Score</h3>
                   <p className="text-xl font-bold text-indigo-600">{score}</p>
                </div>
                <div>
                    <h3 className="text-xs uppercase font-bold text-slate-500 mb-1">Levens</h3>
                    <div className="flex space-x-1">
                        {[...Array(3)].map((_, i) => (
                            <i key={i} className={`fa-solid fa-heart text-xl transition-all duration-300 ${i < lives ? 'text-red-500' : 'text-slate-300/50'}`} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const GameOverlay = ({ gameState, onStartGame, score, onSave }: any) => {
    const isGameOver = gameState === 'game_over';
    const isCompleted = gameState === 'completed';

    let title = 'Helling Challenge!';
    let description = 'Jouw missie is om de hellingshoek en wrijving zo aan te passen dat je de doelversnelling bereikt. Verdien 20 punten per ronde. Maximaal 100 punten!';
    let buttonText = 'Start Challenge';

    if (isGameOver) {
        title = 'Stunt Mislukt!';
        description = `Helaas, je berekeningen waren niet nauwkeurig genoeg. Je eindscore is ${score}.`;
        buttonText = 'Score Opslaan & Sluiten';
    } else if (isCompleted) {
        title = 'Missie Voltooid!';
        description = `Geweldig! Je hebt alle rondes overleefd en ${score} punten behaald.`;
        buttonText = 'Score Opslaan & Sluiten';
    }

    return (
        <div className="absolute inset-0 bg-sky-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in rounded-xl">
            <div className="text-center max-w-lg bg-white/10 p-8 rounded-2xl border border-white/20 shadow-2xl">
                <h1 className="text-5xl font-black text-white mb-4 drop-shadow-lg">{title}</h1>
                <p className="text-lg text-sky-100 mb-8 drop-shadow-md">{description}</p>
                <button
                    onClick={isGameOver || isCompleted ? onSave : onStartGame}
                    className={`font-bold py-4 px-10 rounded-xl shadow-xl transition-all transform hover:scale-105 ${isGameOver || isCompleted ? 'bg-green-500 text-white hover:bg-green-400' : 'bg-white text-sky-600 hover:bg-sky-50'}`}
                >
                    {buttonText}
                </button>
            </div>
        </div>
    );
};

interface Game8Props {
    onComplete: (score: number) => void;
    onClose: () => void;
}

// --- MAIN COMPONENT ---
const Game8: React.FC<Game8Props> = ({ onComplete, onClose }) => {
    // Simulation State
    const [angle, setAngle] = useState(30);
    const [frictionCoefficient, setFrictionCoefficient] = useState(0.2);
    const [acceleration, setAcceleration] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    
    // Game State
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'won_round' | 'game_over' | 'completed'>('idle');
    const [lives, setLives] = useState(3);
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(1);
    const [targetAcceleration, setTargetAcceleration] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isShaking, setIsShaking] = useState(false);

    // Calculate acceleration
    useEffect(() => {
        const angleRad = (angle * Math.PI) / 180;
        const sinTheta = Math.sin(angleRad);
        const cosTheta = Math.cos(angleRad);

        let calculatedAcceleration = 0;
        if (sinTheta > frictionCoefficient * cosTheta) {
            calculatedAcceleration = GRAVITY * (sinTheta - frictionCoefficient * cosTheta);
        }
        setAcceleration(calculatedAcceleration);
    }, [angle, frictionCoefficient]);
    
    const generateNewTarget = useCallback(() => {
        let newTarget = 0;
        // Generate a target that requires some angle > 0 and some friction
        while (newTarget <= 0.5 || newTarget > 8) {
            const randomAngle = 10 + Math.random() * 50; // 10-60 deg
            const randomFriction = 0.05 + Math.random() * 0.8; // 0.05-0.85
            const angleRad = (randomAngle * Math.PI) / 180;
            const sinTheta = Math.sin(angleRad);
            const cosTheta = Math.cos(angleRad);
            
            if (sinTheta > randomFriction * cosTheta) {
                newTarget = GRAVITY * (sinTheta - randomFriction * cosTheta);
            }
        }
        setTargetAcceleration(newTarget);
    }, []);

    const handleStartGame = () => {
        setLives(3);
        setScore(0);
        setRound(1);
        generateNewTarget();
        setGameState('playing');
        setFeedback('');
        setAngle(15);
        setFrictionCoefficient(0.1);
        setIsAnimating(false);
    };

    const handleSaveScore = () => {
        onComplete(score);
    };

    const handleSubmitAnswer = () => {
        if (isAnimating || gameState !== 'playing' || feedback) return;

        const difference = Math.abs(acceleration - targetAcceleration);
        // Tolerance allows for small rounding/slider errors
        const tolerance = 0.25; 

        if (difference <= tolerance) {
            setFeedback('Perfect! De kar rijdt!');
            setScore(prev => prev + POINTS_PER_ROUND);
            setGameState('won_round');
            setIsAnimating(true);
        } else {
            const newLives = lives - 1;
            setLives(newLives);
            setIsShaking(true);
            
            if (acceleration > targetAcceleration) {
                setFeedback('Bijna! Je versnelling is te hoog.');
            } else {
                setFeedback('Oeps! Je versnelling is te laag.');
            }

            if (newLives <= 0) {
                setTimeout(() => setGameState('game_over'), 1500);
            } else {
                setTimeout(() => {
                    setFeedback('');
                    setIsShaking(false);
                }, 1500);
            }
        }
    };
    
    useEffect(() => {
        if (gameState === 'won_round' && !isAnimating) {
            // Animation finished
            if (round >= MAX_ROUNDS) {
                setGameState('completed');
            } else {
                setTimeout(() => {
                    setRound(r => r + 1);
                    generateNewTarget();
                    setGameState('playing');
                    setFeedback('');
                    // Reset sliders for next round challenge or keep them? 
                    // Let's keep them to make it slightly harder/easier depending on rng
                }, 500);
            }
        }
    }, [gameState, isAnimating, generateNewTarget, round]);

    const isGameActive = gameState === 'playing' || gameState === 'won_round';

    return (
        <div className="flex flex-col items-center justify-center p-4 font-sans text-slate-800 w-full h-full min-h-[600px] bg-slate-800 rounded-xl relative overflow-hidden">
             <style>{`
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
                .animate-shake {
                    animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}</style>

            <div className="w-full max-w-6xl bg-gradient-to-b from-sky-500 to-sky-700 rounded-2xl shadow-2xl p-4 md:p-8 flex flex-col items-center justify-center min-h-[600px] relative overflow-hidden border border-sky-400/30">
                <div className="absolute top-8 right-12 w-32 h-32 bg-yellow-300 rounded-full shadow-[0_0_50px_rgba(253,224,71,0.6)] opacity-90" />
                <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-sky-900/50 to-transparent" />

                {(gameState === 'idle' || gameState === 'game_over' || gameState === 'completed') && (
                    <GameOverlay gameState={gameState} onStartGame={handleStartGame} score={score} onSave={handleSaveScore} />
                )}

                <div className={`w-full transition-opacity duration-500 flex flex-col h-full ${isGameActive ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
                    <GameStatus 
                        targetAcceleration={targetAcceleration}
                        lives={lives}
                        feedback={feedback}
                        round={round}
                        score={score}
                    />
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
                        <div className="lg:col-span-1 flex flex-col gap-4">
                            <Instructions />
                            <ControlPanel
                                angle={angle}
                                setAngle={setAngle}
                                frictionCoefficient={frictionCoefficient}
                                setFrictionCoefficient={setFrictionCoefficient}
                                onSubmitAnswer={handleSubmitAnswer}
                                isShaking={isShaking}
                                isDisabled={!!feedback || isAnimating || gameState !== 'playing'}
                            />
                        </div>
                        <div className="lg:col-span-2 flex flex-col gap-4 justify-center">
                            <ResultsDisplay acceleration={acceleration} />
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 shadow-inner p-4">
                                <InclinedPlane
                                    angle={angle}
                                    isAnimating={isAnimating}
                                    onAnimationEnd={() => setIsAnimating(false)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Game8;