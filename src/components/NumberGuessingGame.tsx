import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type GameStatus = 'start' | 'playing' | 'won' | 'lost';
type Difficulty = { id: string; name: string; max: number; chances: number };

const DIFFICULTIES: Difficulty[] = [
  { id: 'easy', name: '簡單', max: 50, chances: 10 },
  { id: 'medium', name: '普通', max: 100, chances: 7 },
  { id: 'hard', name: '困難', max: 200, chances: 5 },
];

interface GuessRecord {
  value: number;
  hint: 'high' | 'low';
  minAfter: number;
  maxAfter: number;
}

const NumberGuessingGame: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>('start');
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTIES[1]);
  const [targetNumber, setTargetNumber] = useState<number>(0);
  const [guesses, setGuesses] = useState<GuessRecord[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [bestScores, setBestScores] = useState<Record<string, number>>({});
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showStrategy, setShowStrategy] = useState<boolean>(false);

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setTargetNumber(Math.floor(Math.random() * diff.max) + 1);
    setGuesses([]);
    setCurrentGuess('');
    setShowHint(false);
    setShowStrategy(false);
    setStatus('playing');
  };

  // Calculate current bounds based on history
  let currentMin = 1;
  let currentMax = difficulty.max;
  
  // Calculate bounds optimally by traversing from oldest to newest guess
  [...guesses].reverse().forEach(g => {
    if (g.hint === 'low') currentMin = Math.max(currentMin, g.value + 1);
    if (g.hint === 'high') currentMax = Math.min(currentMax, g.value - 1);
  });

  const handleGuess = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (status !== 'playing') return;

    const num = parseInt(currentGuess);
    if (isNaN(num) || num < 1 || num > difficulty.max) {
      return; // Invalid guess
    }
    
    // Check if already guessed
    if (guesses.some(g => g.value === num)) {
        return;
    }

    if (num === targetNumber) {
      setStatus('won');
      const diffId = difficulty.id;
      const finalGuesses = guesses.length + 1;
      const currentBest = bestScores[diffId];
      if (!currentBest || finalGuesses < currentBest) {
        setBestScores({ ...bestScores, [diffId]: finalGuesses });
      }
      return;
    }

    const hint = num > targetNumber ? 'high' : 'low';
    
    let newMin = currentMin;
    let newMax = currentMax;
    if (hint === 'low') newMin = Math.max(newMin, num + 1);
    if (hint === 'high') newMax = Math.min(newMax, num - 1);

    const newGuesses = [{ value: num, hint, minAfter: newMin, maxAfter: newMax }, ...guesses];
    setGuesses(newGuesses);

    if (newGuesses.length >= difficulty.chances) {
      setStatus('lost');
    } else {
      setCurrentGuess('');
    }
  };

  const remainingChances = difficulty.chances - guesses.length;
  const latestHint = guesses.length > 0 ? guesses[0].hint : null;

  let emoji = '🤔';
  let feedback = '等待您的猜測...';
  let subFeedback = `當前可能範圍：${currentMin} 到 ${currentMax}`;
  let bgColor = 'bg-indigo-50';
  let borderColor = 'border-indigo-200';
  let iconBorderColor = 'border-indigo-500';

  if (latestHint === 'high') {
    emoji = '📉';
    feedback = '太大了！';
    bgColor = 'bg-pink-50';
    borderColor = 'border-pink-200';
    iconBorderColor = 'border-pink-500';
  } else if (latestHint === 'low') {
    emoji = '📈';
    feedback = '太小了！';
    bgColor = 'bg-blue-50';
    borderColor = 'border-blue-200';
    iconBorderColor = 'border-blue-500';
  }

  // Visualizer percentages
  const rangeWidth = difficulty.max;
  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
  const leftPercent = clamp(((currentMin - 1) / rangeWidth) * 100, 0, 100);
  const goodPercent = clamp(((currentMax - currentMin + 1) / rangeWidth) * 100, 0, 100);
  const rightPercent = clamp(((rangeWidth - currentMax) / rangeWidth) * 100, 0, 100);

  const suggestedGuess = Math.floor((currentMin + currentMax) / 2);
  const idealGuesses = Math.ceil(Math.log2(difficulty.max));

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-10 dot-pattern pt-[100px] sm:pt-10 overflow-y-auto">
      <div className="vibrant-card w-full max-w-[600px] rounded-[40px] p-6 sm:p-12 flex flex-col gap-6 relative bg-white shrink-0 my-auto">
        
        {status === 'start' && (
          <div className="absolute -top-6 -right-6 sm:-top-8 sm:-right-8 bg-yellow-400 border-4 border-black px-4 sm:px-6 py-2 rounded-full transform rotate-12 shadow-lg z-10">
            <span className="font-black text-lg sm:text-xl text-black">新遊戲</span>
          </div>
        )}
        
        {status === 'playing' && (
           <div className="absolute -top-6 -right-6 sm:-top-8 sm:-right-8 bg-black border-4 border-black px-4 sm:px-6 py-2 rounded-full transform rotate-12 shadow-lg z-10">
             <span className="font-black text-lg sm:text-xl text-white">剩餘 {remainingChances} 次</span>
           </div>
        )}

        <AnimatePresence mode="wait">
          {/* ----- START SCREEN ----- */}
          {status === 'start' && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col gap-8"
            >
              <header className="text-center space-y-2 mb-4">
                <h1 className="text-5xl sm:text-7xl font-black text-indigo-900 italic tracking-tighter uppercase">猜測數字</h1>
                <p className="text-indigo-500 font-bold uppercase tracking-widest text-sm">選擇遊戲難度</p>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {DIFFICULTIES.map((diff) => (
                  <button
                    key={diff.id}
                    onClick={() => startGame(diff)}
                    className="p-6 rounded-3xl border-4 border-indigo-100 bg-white hover:border-indigo-400 hover:bg-indigo-50 transition-all flex flex-col items-center gap-2 group cursor-pointer active:scale-95"
                  >
                    <span className="text-3xl font-black text-indigo-900 group-hover:text-pink-500 transition-colors">{diff.name}</span>
                    <span className="text-sm font-bold text-indigo-500">1 - {diff.max}</span>
                    <span className="text-xs font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">{diff.chances} 次機會</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ----- PLAYING SCREEN ----- */}
          {status === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col gap-6"
            >
              <header className="flex justify-between items-end border-b-4 border-indigo-100 pb-4">
                <div>
                  <h1 className="text-3xl font-black text-indigo-900 italic uppercase leading-none mb-1">挑戰模式</h1>
                  <span className="text-indigo-400 font-bold text-sm flex items-center gap-2">
                    難度: {difficulty.name}
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">策略達標: {idealGuesses} 次</span>
                  </span>
                </div>
                <button onClick={() => setStatus('start')} className="text-xs font-black bg-slate-200 text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-300 transition-colors">
                  放棄
                </button>
              </header>

              <div className={`${bgColor} border-4 ${borderColor} rounded-3xl p-6 sm:p-8 flex flex-col items-center gap-4 justify-center transition-colors shadow-sm`}>
                <div className={`w-20 h-20 sm:w-24 sm:h-24 bg-white border-4 ${iconBorderColor} rounded-full flex items-center justify-center shadow-inner`}>
                  <span className="text-4xl sm:text-5xl">{emoji}</span>
                </div>
                <div className="text-center space-y-1">
                  <p className={`text-2xl sm:text-3xl font-black ${latestHint === 'high' ? 'text-pink-600' : latestHint === 'low' ? 'text-blue-600' : 'text-indigo-900'}`}>{feedback}</p>
                  {showHint && <p className="text-indigo-500 font-bold">{subFeedback}</p>}
                </div>
              </div>

              {/* Helper Buttons */}
              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className={`px-4 py-2 rounded-xl text-sm font-black border-4 transition-all active:scale-95 ${
                    showHint ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-white border-indigo-100 text-indigo-400 hover:border-indigo-300'
                  }`}
                >
                  {showHint ? '👁️ 隱藏範圍提示' : '💡 顯示範圍提示'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowStrategy(!showStrategy)}
                  className={`px-4 py-2 rounded-xl text-sm font-black border-4 transition-all active:scale-95 ${
                    showStrategy ? 'bg-yellow-100 border-yellow-300 text-yellow-700' : 'bg-white border-yellow-100 text-yellow-500 hover:border-yellow-300'
                  }`}
                >
                  {showStrategy ? '❌ 隱藏策略建議' : '🎯 顯示策略建議'}
                </button>
              </div>

              {/* Visualizer */}
              {showHint && (
                <AnimatePresence>
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col gap-2 relative mt-2">
                    <div className="flex justify-between text-xs font-black text-indigo-300">
                      <span>1</span>
                      <span>{difficulty.max}</span>
                    </div>
                    <div className="h-8 bg-slate-100 rounded-full flex overflow-hidden border-4 border-indigo-100 relative">
                      <div className="bg-slate-300 h-full transition-all duration-300" style={{ width: `${leftPercent}%` }} />
                      <div className="bg-green-400 h-full transition-all duration-300 flex items-center justify-center border-l-2 border-r-2 border-green-500 overflow-hidden relative" style={{ width: `${goodPercent}%` }}>
                        {goodPercent > 15 && <span className="text-xs font-black text-green-900 tabular-nums whitespace-nowrap px-1">{currentMin} - {currentMax}</span>}
                      </div>
                      <div className="bg-slate-300 h-full transition-all duration-300" style={{ width: `${rightPercent}%` }} />
                      
                      {/* Guess Markers */}
                      {guesses.map(g => {
                        const pct = clamp(((g.value - 1) / rangeWidth) * 100, 0, 100);
                        return (
                          <div 
                            key={g.value}
                            className={`absolute top-0 bottom-0 w-1 ${g.hint === 'high' ? 'bg-pink-500' : 'bg-blue-500'} bg-opacity-70`}
                            style={{ left: `${pct}%` }}
                          />
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Strategy Suggestion */}
              {showStrategy && currentMin < currentMax && (
                <AnimatePresence>
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setCurrentGuess(suggestedGuess.toString())}
                      className="bg-yellow-100 border-2 border-yellow-300 text-yellow-800 px-4 py-2 rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:bg-yellow-200 transition-colors active:scale-95"
                    >
                      🤖 (二分搜尋法) 最佳猜測: {suggestedGuess} {"->"} 點擊代入
                    </button>
                  </motion.div>
                </AnimatePresence>
              )}

              <form onSubmit={handleGuess} className="flex flex-col gap-4 mt-2">
                <input
                  type="range"
                  min={1}
                  max={difficulty.max}
                  value={currentGuess || currentMin}
                  onChange={(e) => setCurrentGuess(e.target.value)}
                  className="w-full h-4 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-pink-500 outline-none focus:ring-4 focus:ring-pink-200"
                />

                <div className="flex gap-3 sm:gap-4 mt-2">
                  <input
                    type="number"
                    min={1}
                    max={difficulty.max}
                    value={currentGuess}
                    onChange={(e) => setCurrentGuess(e.target.value)}
                    className="huge-input flex-1 w-full text-4xl sm:text-5xl font-black text-center p-4 border-8 border-indigo-100 rounded-3xl focus:border-pink-500 focus:outline-none placeholder-indigo-200 transition-colors text-indigo-900"
                    placeholder="?"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!currentGuess}
                    className="bg-pink-500 border-b-8 border-pink-700 hover:bg-pink-400 text-white px-6 sm:px-10 rounded-3xl flex flex-col items-center justify-center transition-all active:border-b-0 active:translate-y-2 shrink-0 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <span className="text-2xl sm:text-3xl font-black italic uppercase leading-none">猜測</span>
                  </button>
                </div>
              </form>

              {/* History list */}
              {guesses.length > 0 && (
                <div className="mt-2 border-t-4 border-indigo-50 pt-4">
                  <p className="text-xs font-black text-indigo-300 uppercase mb-3 text-center sm:text-left">猜測歷史紀錄</p>
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2">
                    {guesses.map((g, i) => (
                      <div key={i} className={`px-4 py-2 rounded-2xl flex items-center justify-between border-4 ${
                        g.hint === 'high' ? 'bg-pink-50 border-pink-200 text-pink-700' : 'bg-blue-50 border-blue-200 text-blue-700'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-black w-10 text-center">{g.value}</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${g.hint === 'high' ? 'bg-pink-100' : 'bg-blue-100'}`}>
                            {g.hint === 'high' ? '太大了' : '太小了'}
                          </span>
                        </div>
                        <span className="text-xs font-bold opacity-60 tabular-nums">範圍縮小至 {g.minAfter}-{g.maxAfter}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ----- RESULT SCREEN ----- */}
          {(status === 'won' || status === 'lost') && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6"
            >
              <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full border-8 flex items-center justify-center shadow-inner ${
                status === 'won' ? 'bg-green-100 border-green-500 text-green-500' : 'bg-pink-100 border-pink-500 text-pink-500'
              }`}>
                <span className="text-7xl sm:text-8xl">{status === 'won' ? '🏆' : '💀'}</span>
              </div>
              
              <header className="text-center space-y-2 mt-2">
                <h2 className={`text-5xl sm:text-6xl font-black italic tracking-tighter uppercase ${
                  status === 'won' ? 'text-green-600' : 'text-pink-600'
                }`}>
                  {status === 'won' ? '挑戰成功！' : '遊戲結束'}
                </h2>
                <div className="bg-indigo-50 px-6 py-4 rounded-3xl inline-block mt-4 border-4 border-indigo-100">
                  <p className="text-indigo-900 font-bold text-xl mb-1">{status === 'won' ? '答案就是' : '殘念...答案是'}</p>
                  <span className="text-pink-500 text-6xl font-black block">{targetNumber}</span>
                </div>
              </header>

              {/* Strategy Analysis */}
              <div className="w-full bg-slate-50 border-4 border-slate-200 rounded-3xl p-5 form-col items-center">
                <h3 className="text-sm font-black text-slate-500 uppercase flex items-center justify-center gap-2 mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  策略分析
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-400 mb-1">你的猜測次數</p>
                    <p className="text-2xl font-black text-slate-800">{status === 'won' ? guesses.length + 1 : guesses.length}</p>
                  </div>
                  <div className="text-center border-l-2 border-slate-200">
                    <p className="text-xs font-bold text-slate-400 mb-1">最佳策略預期</p>
                    <p className="text-2xl font-black text-indigo-600">≤ {idealGuesses}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t-2 border-slate-200 text-center">
                  <p className="text-sm font-bold text-slate-600">
                    使用<strong className="text-indigo-600 mx-1">二分搜尋策略</strong> (每次猜範圍中間的數字)<br/>
                    在 1 到 {difficulty.max} 的數字中，最多只需要 {idealGuesses} 次就能找到答案！
                  </p>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-4 mt-2">
                <div className="bg-yellow-100 border-4 border-yellow-300 p-4 sm:p-6 rounded-3xl flex flex-col items-center">
                  <span className="text-xs sm:text-sm font-black uppercase text-yellow-700 mb-1 leading-tight text-center">總猜測次數</span>
                  <span className="text-5xl font-black text-yellow-900">
                    {status === 'won' ? guesses.length + 1 : guesses.length}
                  </span>
                </div>
                <div className="bg-green-100 border-4 border-green-300 p-4 sm:p-6 rounded-3xl flex flex-col items-center text-center">
                  <span className="text-xs sm:text-sm font-black uppercase text-green-700 mb-1 leading-tight">最佳成績 ({difficulty.name})</span>
                  <span className="text-5xl font-black text-green-900">
                    {bestScores[difficulty.id] ? bestScores[difficulty.id].toString().padStart(2, '0') : '--'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setStatus('start')}
                className="w-full bg-indigo-600 border-b-8 border-indigo-900 hover:bg-indigo-500 text-white p-6 rounded-3xl transition-all active:border-b-0 active:translate-y-2 flex flex-col items-center justify-center mt-4"
              >
                <span className="text-3xl font-black italic uppercase">再次挑戰</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NumberGuessingGame;
