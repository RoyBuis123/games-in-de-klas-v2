import React, { useEffect, useRef, useState } from 'react';
import { CONNECTIONS } from '../constants';
import { GameConfig, StudentData } from '../types';

interface SkillTreeProps {
  student: StudentData;
  gamesConfig: GameConfig;
  onOpenGame: (gameId: number) => void;
}

const SkillTree: React.FC<SkillTreeProps> = ({ student, gamesConfig, onOpenGame }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgLines, setSvgLines] = useState<React.ReactNode[]>([]);
  // Trigger redraw on window resize
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate connections
  useEffect(() => {
    if (!containerRef.current) return;

    const calculateLines = () => {
      const containerRect = containerRef.current!.getBoundingClientRect();
      const lines: React.ReactNode[] = [];

      CONNECTIONS.forEach((conn, index) => {
        const fromEl = document.getElementById(`node-${conn.from}`);
        const toEl = document.getElementById(`node-${conn.to}`);

        if (fromEl && toEl) {
          const fromRect = fromEl.getBoundingClientRect();
          const toRect = toEl.getBoundingClientRect();

          // Calculate center relative to container
          const x1 = fromRect.left + fromRect.width / 2 - containerRect.left;
          const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
          const x2 = toRect.left + toRect.width / 2 - containerRect.left;
          const y2 = toRect.top + toRect.height / 2 - containerRect.top;

          const isUnlocked = student.progress[conn.from]?.unlocked;
          
          lines.push(
            <line
              key={`${conn.from}-${conn.to}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isUnlocked ? "#4CAF50" : "#cbd5e1"}
              strokeWidth={isUnlocked ? "4" : "3"}
              strokeDasharray={isUnlocked ? "0" : "6,6"}
              className="transition-colors duration-500"
            />
          );
        }
      });
      setSvgLines(lines);
    };

    // Small delay to ensure DOM is rendered
    const timeout = setTimeout(calculateLines, 100);
    return () => clearTimeout(timeout);
  }, [student, windowWidth]);

  const renderNode = (id: number) => {
    const config = gamesConfig[id];
    const progress = student.progress[id];
    const isUnlocked = !!progress?.unlocked;
    const isCompleted = student.scores[id] !== undefined;

    let baseClasses = "relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 border-4 z-10 select-none";
    let stateClasses = "";

    if (isCompleted) {
      stateClasses = "bg-gradient-to-br from-amber-200 to-amber-400 border-amber-500 shadow-lg shadow-amber-500/40 hover:scale-110";
    } else if (isUnlocked) {
      stateClasses = "bg-gradient-to-br from-emerald-200 to-emerald-400 border-emerald-500 shadow-lg shadow-emerald-500/40 hover:scale-110 animate-pulse-slow";
    } else {
      stateClasses = "bg-gray-200 border-gray-300 opacity-80 cursor-not-allowed grayscale";
    }

    return (
      <div 
        id={`node-${id}`}
        className={`${baseClasses} ${stateClasses}`}
        onClick={() => isUnlocked && onOpenGame(id)}
      >
        {isCompleted && (
           <div className="absolute -top-2 -right-2 bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm">
             {student.scores[id]}
           </div>
        )}
        
        {isUnlocked ? (
          <div className="text-center">
             <span className="block text-2xl font-bold text-gray-800 drop-shadow-sm">{id}</span>
             <span className="block text-[10px] sm:text-xs font-medium text-gray-800 px-2 leading-tight">{config.name}</span>
          </div>
        ) : (
          <div className="text-center">
             <span className="text-3xl grayscale opacity-50">🔒</span>
             <span className="block text-[10px] sm:text-xs text-gray-500 mt-1">{config.name}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative py-12 px-4 min-h-[600px] overflow-x-auto" ref={containerRef}>
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        {svgLines}
      </svg>
      
      {/* Manually Layout Rows according to original design */}
      <div className="flex flex-col items-center gap-16 relative z-10 w-full min-w-[600px]">
        
        {/* Row 1 */}
        <div className="flex justify-center gap-24">
          {renderNode(1)}
        </div>

        {/* Row 2 */}
        <div className="flex justify-center gap-24">
          {renderNode(2)}
        </div>

        {/* Row 3 */}
        <div className="flex justify-center gap-48">
          {renderNode(3)}
          {renderNode(6)}
        </div>

        {/* Row 4 */}
        <div className="flex justify-center gap-48">
          {renderNode(4)}
          {renderNode(7)}
        </div>

        {/* Row 5 */}
        <div className="flex justify-center gap-48">
          {renderNode(5)}
          {renderNode(8)}
        </div>

        {/* Row 6 (Finale) */}
        <div className="flex justify-center gap-24">
          {renderNode(9)}
        </div>
      </div>
    </div>
  );
};

export default SkillTree;