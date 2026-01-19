import React, { useState, useEffect } from 'react';
import { User, StudentData, GameConfig } from './types';
import { INITIAL_GAMES_CONFIG, CONNECTIONS } from './constants';
import * as Storage from './utils/storage';
import SkillTree from './components/SkillTree';
import Game1 from './components/games/Game1';
import Game2 from './components/games/Game2';
import Game3 from './components/games/Game3';
import Game4 from './components/games/Game4';
import Game5 from './components/games/Game5';
import Game6 from './components/games/Game6';
import Game7 from './components/games/Game7';
import Game8 from './components/games/Game8';
import Game9 from './components/games/Game9';
import PlaceholderGame from './components/games/PlaceholderGame';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [gamesConfig, setGamesConfig] = useState<GameConfig>(INITIAL_GAMES_CONFIG);
  
  // Login State
  const [userType, setUserType] = useState<'student' | 'teacher'>('student');
  const [loginName, setLoginName] = useState('');
  const [loginClass, setLoginClass] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Game State
  const [activeGameId, setActiveGameId] = useState<number | null>(null);

  // Load initial config
  useEffect(() => {
    setGamesConfig(Storage.getGamesConfig());
  }, []);

  // --- Actions ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userType === 'student') {
      if (!loginName || !loginClass) return alert("Vul alle velden in.");
      
      const id = loginName.toLowerCase().replace(/\s+/g, '_') + '_' + loginClass.toLowerCase();
      
      let data = Storage.getStudentData(id);
      if (!data) {
        data = {
          id,
          name: loginName,
          class: loginClass,
          progress: { 1: { unlocked: true } },
          scores: {},
          lastActive: new Date().toISOString()
        };
        Storage.saveStudentData(data);
      }
      
      setStudentData(data);
      setUser({ type: 'student', id, name: loginName, class: loginClass });
    } else {
      const storedPass = Storage.getTeacherPassword();
      if (loginPassword === storedPass) {
        setUser({ type: 'teacher' });
      } else {
        alert("Incorrect wachtwoord");
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setStudentData(null);
    setLoginName('');
    setLoginClass('');
    setLoginPassword('');
    setActiveGameId(null);
  };

  const handleGameComplete = (score: number) => {
    if (!studentData || !activeGameId) return;

    const config = gamesConfig[activeGameId];
    const passed = score >= config.minScore;

    const newData = { ...studentData };
    newData.scores[activeGameId] = score;
    newData.lastActive = new Date().toISOString();

    if (passed) {
      config.unlocks.forEach(nextId => {
        // Special logic for final level 9
        if (nextId === 9) {
           // Need 5 and 8 to unlock 9
           const passed5 = (newData.scores[5] || 0) >= gamesConfig[5].minScore;
           const passed8 = (newData.scores[8] || 0) >= gamesConfig[8].minScore;
           if (passed5 && passed8) {
              if (!newData.progress[9]) newData.progress[9] = { unlocked: true };
           }
        } else {
           if (!newData.progress[nextId]) newData.progress[nextId] = { unlocked: true };
        }
      });
    }

    Storage.saveStudentData(newData);
    setStudentData(newData);
    setActiveGameId(null);
    
    // Show feedback
    if(passed) {
        alert(`🎉 Gefeliciteerd! Score: ${score}. Je hebt het level gehaald!`);
    } else {
        alert(`Score: ${score}. Je hebt minimaal ${config.minScore} nodig. Probeer opnieuw!`);
    }
  };

  // --- Views ---

  const renderLogin = () => (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center">
           <h1 className="text-3xl font-bold text-white mb-2">🎓 Leer Platform</h1>
           <p className="text-indigo-100">Start je avontuur!</p>
        </div>
        
        <div className="p-8">
          <div className="flex gap-4 mb-6 p-1 bg-gray-100 rounded-lg">
             <button 
               className={`flex-1 py-2 rounded-md font-medium transition-all ${userType === 'student' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
               onClick={() => setUserType('student')}
             >
               Leerling
             </button>
             <button 
               className={`flex-1 py-2 rounded-md font-medium transition-all ${userType === 'teacher' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
               onClick={() => setUserType('teacher')}
             >
               Docent
             </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {userType === 'student' ? (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Jouw Naam</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                    placeholder="Bijv. Jan Jansen"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Klas</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                    placeholder="Bijv. 3A"
                    value={loginClass}
                    onChange={(e) => setLoginClass(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Wachtwoord</label>
                  <input 
                    required
                    type="password" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                    placeholder="••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
              </div>
            )}
            
            <button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-[1.02] active:scale-95"
            >
              {userType === 'student' ? 'Start met Leren' : 'Inloggen'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const renderTeacherDashboard = () => {
    const students = Storage.getAllStudents();
    
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden min-h-[80vh]">
          <div className="bg-gray-800 text-white p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold">👨‍🏫 Docenten Dashboard</h2>
            <button onClick={handleLogout} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors">Uitloggen</button>
          </div>
          
          <div className="p-6">
             <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Leerling Voortgang</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 text-sm uppercase">
                        <th className="p-4 border-b">Naam</th>
                        <th className="p-4 border-b">Klas</th>
                        <th className="p-4 border-b">Voortgang</th>
                        <th className="p-4 border-b">Laatst Actief</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {students.map(s => {
                        const sData = Storage.getStudentData(s.id);
                        if(!sData) return null;
                        const completed = Object.keys(sData.scores).length;
                        const percent = Math.round((completed / 9) * 100);
                        return (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="p-4 font-medium">{s.name}</td>
                            <td className="p-4 text-gray-500">{s.class}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full max-w-[100px]">
                                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percent}%` }}></div>
                                </div>
                                <span className="text-sm font-semibold">{completed}/9</span>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-gray-400">{new Date(sData.lastActive).toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
             </div>
             
             {/* Note: Settings UI could be added here similar to original JS */}
          </div>
        </div>
      </div>
    );
  };

  const renderGameModal = () => {
    if (!activeGameId) return null;

    let gameComponent;
    if (activeGameId === 1) {
      gameComponent = <Game1 onComplete={handleGameComplete} onClose={() => setActiveGameId(null)} />;
    } else if (activeGameId === 2) {
      gameComponent = <Game2 onComplete={handleGameComplete} onClose={() => setActiveGameId(null)} />;
    } else if (activeGameId === 3) {
      gameComponent = <Game3 onComplete={handleGameComplete} onClose={() => setActiveGameId(null)} />;
    } else if (activeGameId === 4) {
      gameComponent = <Game4 onComplete={handleGameComplete} onClose={() => setActiveGameId(null)} />;
    } else if (activeGameId === 5) {
      gameComponent = <Game5 onComplete={handleGameComplete} onClose={() => setActiveGameId(null)} />;
    } else if (activeGameId === 6) {
      gameComponent = <Game6 onComplete={handleGameComplete} onClose={() => setActiveGameId(null)} />;
    } else if (activeGameId === 7) {
      gameComponent = <Game7 onComplete={handleGameComplete} onClose={() => setActiveGameId(null)} />;
    } else if (activeGameId === 8) {
      gameComponent = <Game8 onComplete={handleGameComplete} onClose={() => setActiveGameId(null)} />;
    } else if (activeGameId === 9) {
      gameComponent = <Game9 onComplete={handleGameComplete} onClose={() => setActiveGameId(null)} />;
    } else {
      gameComponent = <PlaceholderGame id={activeGameId} onComplete={handleGameComplete} onClose={() => setActiveGameId(null)} />;
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
           <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-700">
                {gamesConfig[activeGameId].name}
              </h3>
              <button 
                onClick={() => setActiveGameId(null)}
                className="p-2 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50 p-2 sm:p-4">
              {gameComponent}
           </div>
        </div>
      </div>
    );
  };

  const renderStudentView = () => {
    if (!studentData) return null;
    
    const completedCount = Object.keys(studentData.scores).length;
    const progressPercent = Math.round((completedCount / 9) * 100);

    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-100 p-6 flex flex-wrap gap-4 justify-between items-center sticky top-0 z-20 shadow-sm">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold">
                  {studentData.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{studentData.name}</h2>
                  <p className="text-gray-500 text-sm">Klas {studentData.class}</p>
                </div>
             </div>
             
             <div className="flex-1 max-w-xs mx-4 hidden sm:block">
                <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                  <span>Voortgang</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                </div>
             </div>

             <button 
               onClick={handleLogout}
               className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
             >
               Uitloggen
             </button>
          </div>

          {/* Skill Tree Canvas */}
          <div className="flex-1 bg-slate-50 relative overflow-hidden">
             <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
             <SkillTree student={studentData} gamesConfig={gamesConfig} onOpenGame={setActiveGameId} />
          </div>
        </div>
        {renderGameModal()}
      </div>
    );
  };

  if (!user) return renderLogin();
  return user.type === 'teacher' ? renderTeacherDashboard() : renderStudentView();
}

export default App;