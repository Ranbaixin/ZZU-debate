import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DebateStage, MatchInfo, SoundType } from './types';
import { DEBATE_FLOW, DEFAULT_LOGO } from './constants';
import Clock from './components/Clock';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  // --- State ---
  const [stageIndex, setStageIndex] = useState(0);
  const [matchInfo, setMatchInfo] = useState<MatchInfo>({
    title: '',
    affSchool: '',
    negSchool: '',
    affTopic: '',
    negTopic: '',
    logoUrl: null
  });

  // Timers
  const [timeAff, setTimeAff] = useState(0);
  const [timeNeg, setTimeNeg] = useState(0);
  
  // Who is currently ticking?
  const [activeSide, setActiveSide] = useState<'aff' | 'neg' | 'none'>('none');
  const [isRunning, setIsRunning] = useState(false);
  
  // Sound Check State
  const [soundTestStep, setSoundTestStep] = useState(0);

  // Victory State
  const [winner, setWinner] = useState<'aff' | 'neg' | null>(null);

  // Refs
  const lastTickRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- Helpers ---
  const currentStage = DEBATE_FLOW[stageIndex];

  // Initialize stage time
  useEffect(() => {
    // Stop any running timer when stage changes
    setIsRunning(false);
    setActiveSide('none');
    // Reset winner when moving between stages (though mostly relevant when entering victory stage)
    if (currentStage.type !== 'victory') {
        setWinner(null);
    }

    if (['normal', 'free_debate', 'dual_debate'].includes(currentStage.type)) {
        if (currentStage.type === 'normal') {
            // Normal: One side active (usually), other side 0 or hidden
            if (currentStage.activeSide === 'aff') {
                setTimeAff(currentStage.time);
                setTimeNeg(0);
                setActiveSide('aff');
            } else {
                setTimeNeg(currentStage.time);
                setTimeAff(0);
                setActiveSide('neg');
            }
        } else if (currentStage.type === 'free_debate' || currentStage.type === 'dual_debate') {
            // Both have independent time banks
            setTimeAff(currentStage.time);
            setTimeNeg(currentStage.time);
            // Default start side usually Aff for Free Debate, but for Dual it might vary.
            // Let's default to Aff, user can switch.
            setActiveSide('aff'); 
        }
    }
  }, [stageIndex]);

  // Scroll current stage into view in the center list
  useEffect(() => {
    if (scrollRef.current) {
        // Find the active element by index. 
        // We slice the first 3 elements (Setup, Intro, Test) from the display list usually, 
        // so we need to account for that offset if we are rendering sliced list.
        // Below we render the FULL list but hide the first 3 conditionally or just slice.
        // Let's assume we render the sliced list (starting from index 3).
        
        const listIndex = stageIndex - 3;
        if (listIndex >= 0) {
            const activeEl = scrollRef.current.children[listIndex];
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
  }, [stageIndex]);

  // --- Timer Logic ---
  const tick = useCallback((timestamp: number) => {
    if (!lastTickRef.current) lastTickRef.current = timestamp;
    const delta = (timestamp - lastTickRef.current) / 1000;
    lastTickRef.current = timestamp;

    if (isRunning && activeSide !== 'none') {
      if (activeSide === 'aff') {
        setTimeAff(prev => {
           const next = Math.max(0, prev - delta);
           checkSoundTriggers(prev, next);
           if (next === 0) setIsRunning(false);
           return next;
        });
      } else if (activeSide === 'neg') {
        setTimeNeg(prev => {
            const next = Math.max(0, prev - delta);
            checkSoundTriggers(prev, next);
            if (next === 0) setIsRunning(false);
            return next;
         });
      }
    }

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [isRunning, activeSide]);

  useEffect(() => {
    if (isRunning) {
      lastTickRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(tick);
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      lastTickRef.current = 0;
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRunning, tick]);

  const checkSoundTriggers = (prevTime: number, currTime: number) => {
     if (prevTime > 30 && currTime <= 30) {
        audioService.playSound(SoundType.WARN_30);
     }
     if (prevTime > 5 && currTime <= 5) {
        audioService.playSound(SoundType.WARN_5);
     }
     if (prevTime > 0 && currTime <= 0) {
        audioService.playSound(SoundType.END);
     }
  };

  // --- Input Handlers ---
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setMatchInfo(prev => ({ ...prev, logoUrl: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMatchPreset = (val: string) => {
     if (val.includes('理工杯')) {
        let title = '郑州大学理工杯辩论赛';
        if (val.includes('决赛')) title += '决赛';
        else if (val.includes('初赛')) title += '初赛';
        setMatchInfo(prev => ({...prev, title}));
     } else {
        setMatchInfo(prev => ({...prev, title: val}));
     }
  };

  // --- Helper for Visual Cues (Subtle changes) ---
  const getVisualCueClass = (isActive: boolean, time: number) => {
    if (!isActive) return '';
    // Critical (<=5s): Red Glow + Pulse + Ring
    if (time <= 5 && time > 0) return 'shadow-[0_0_60px_rgba(239,68,68,0.6)] bg-red-100 ring-4 ring-red-200 ring-opacity-50'; 
    // Warning (<=30s): Yellow/Amber Glow
    if (time <= 30 && time > 0) return 'shadow-[0_0_40px_rgba(234,179,8,0.4)] bg-yellow-50'; 
    return '';
  };

  // --- Keyboard Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (stageIndex === 0 && (e.target as HTMLElement).tagName === 'INPUT') return;
        if (stageIndex === 0 && (e.target as HTMLElement).tagName === 'TEXTAREA') return;

        switch (e.code) {
            case 'KeyN': // Prev
                if (stageIndex > 0) {
                    setStageIndex(prev => prev - 1);
                    setSoundTestStep(0);
                    setWinner(null); // Reset winner if going back
                }
                break;
            case 'KeyM': // Next
                if (stageIndex < DEBATE_FLOW.length - 1) {
                    setStageIndex(prev => prev + 1);
                    setSoundTestStep(0);
                }
                break;
            case 'Space': // Pause/Start
                e.preventDefault();
                if (['normal', 'free_debate', 'dual_debate'].includes(currentStage.type)) {
                    setIsRunning(prev => !prev);
                }
                break;
            case 'Tab': // Switch Side
                e.preventDefault();
                if (['free_debate', 'dual_debate'].includes(currentStage.type) || currentStage.activeSide === 'both') {
                    setActiveSide(prev => prev === 'aff' ? 'neg' : 'aff');
                    // Keep running if it was running (User Request: don't stop)
                    if (!isRunning) setIsRunning(true);
                }
                break;
            case 'KeyQ': // Start Aff OR Select Aff Winner
                if (['normal', 'free_debate', 'dual_debate'].includes(currentStage.type)) {
                   setActiveSide('aff');
                   setIsRunning(true);
                } else if (currentStage.type === 'victory' && !winner) {
                   setWinner('aff');
                }
                break;
            case 'KeyW': // Start Neg OR Select Neg Winner
                if (['normal', 'free_debate', 'dual_debate'].includes(currentStage.type)) {
                   setActiveSide('neg');
                   setIsRunning(true);
                } else if (currentStage.type === 'victory' && !winner) {
                   setWinner('neg');
                }
                break;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stageIndex, currentStage, isRunning, winner]); // Added winner to dependency


  // --- Render Views ---

  // 1. SETUP
  if (currentStage.type === 'setup') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-zzu-dark">
        <h1 className="text-4xl font-serif font-bold mb-8 text-zzu-red">郑州大学辩论计时系统配置</h1>
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl space-y-4 border-t-4 border-zzu-red">
            <div className="grid grid-cols-1 gap-2">
                <label className="font-bold">比赛名称 (输入"理工杯"等自动补全)</label>
                <input 
                    className="border p-2 rounded w-full" 
                    value={matchInfo.title} 
                    onChange={(e) => handleMatchPreset(e.target.value)} 
                    placeholder="例如：郑州大学理工杯辩论赛决赛"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block font-bold mb-1">正方学院</label>
                    <input className="border p-2 rounded w-full" value={matchInfo.affSchool} onChange={e => setMatchInfo({...matchInfo, affSchool: e.target.value})} placeholder="例如：法学院"/>
                </div>
                <div>
                    <label className="block font-bold mb-1">反方学院</label>
                    <input className="border p-2 rounded w-full" value={matchInfo.negSchool} onChange={e => setMatchInfo({...matchInfo, negSchool: e.target.value})} placeholder="例如：新闻与传播学院"/>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block font-bold mb-1">正方辩题</label>
                    <textarea className="border p-2 rounded w-full h-20" value={matchInfo.affTopic} onChange={e => setMatchInfo({...matchInfo, affTopic: e.target.value})} placeholder="观点..."/>
                </div>
                <div>
                    <label className="block font-bold mb-1">反方辩题</label>
                    <textarea className="border p-2 rounded w-full h-20" value={matchInfo.negTopic} onChange={e => setMatchInfo({...matchInfo, negTopic: e.target.value})} placeholder="观点..."/>
                </div>
            </div>
            <div>
                 <label className="block font-bold mb-1">校徽上传 (可选)</label>
                 <input type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zzu-red file:text-white hover:file:bg-zzu-dark"/>
            </div>
            <div className="pt-4 text-center text-gray-500 text-sm">
                按 'M' 键进入下一环节
            </div>
        </div>
      </div>
    );
  }

  // 2. INTRO
  if (currentStage.type === 'intro') {
      return (
          <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
              <div className="h-32 bg-zzu-red flex items-center justify-center shadow-lg relative z-10">
                  <h1 className="text-white text-5xl font-serif font-bold tracking-widest shadow-black drop-shadow-md">
                      {matchInfo.title || '郑州大学辩论赛'}
                  </h1>
              </div>
              <div className="flex-1 flex flex-row items-center justify-center relative">
                  <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                      <img src={matchInfo.logoUrl || DEFAULT_LOGO} className="w-[800px] h-[800px] object-contain animate-pulse-slow" alt="bg" />
                  </div>
                  <div className="w-1/2 h-full flex flex-col items-center justify-center p-12 border-r border-gray-200 bg-red-50/30">
                      <div className="text-4xl font-bold text-zzu-dark mb-8">{matchInfo.affSchool || '正方'}</div>
                      <div className="text-2xl font-serif text-gray-800 text-center leading-relaxed whitespace-pre-wrap max-w-lg">
                          <span className="block text-sm text-zzu-light mb-2 font-bold">正方观点</span>
                          {matchInfo.affTopic || '暂无观点'}
                      </div>
                  </div>
                  <div className="w-1/2 h-full flex flex-col items-center justify-center p-12 bg-blue-50/30">
                      <div className="text-4xl font-bold text-gray-800 mb-8">{matchInfo.negSchool || '反方'}</div>
                      <div className="text-2xl font-serif text-gray-800 text-center leading-relaxed whitespace-pre-wrap max-w-lg">
                          <span className="block text-sm text-gray-500 mb-2 font-bold">反方观点</span>
                          {matchInfo.negTopic || '暂无观点'}
                      </div>
                  </div>
              </div>
              <div className="absolute bottom-4 left-0 w-full text-center text-gray-400 text-xs font-mono">
                  [M] 下一环节 &nbsp;&nbsp; [N] 上一环节
              </div>
          </div>
      );
  }

  // 3. SOUND CHECK
  if (currentStage.type === 'sound_check') {
      const handleSoundTest = () => {
          if (soundTestStep === 0) {
              audioService.playSound(SoundType.WARN_30);
              setSoundTestStep(1);
          } else if (soundTestStep === 1) {
              audioService.playSound(SoundType.WARN_5);
              setSoundTestStep(2);
          } else {
              audioService.playSound(SoundType.END);
              setSoundTestStep(0);
          }
      };

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 relative">
             <div className="absolute top-0 w-full h-24 bg-zzu-red flex items-center justify-between px-8 shadow-md">
                <div className="text-white text-xl font-bold">{matchInfo.title}</div>
                <img src={matchInfo.logoUrl || DEFAULT_LOGO} className="h-16 w-16 object-contain bg-white rounded-full p-1" alt="logo"/>
            </div>
            <div className="text-center space-y-8">
                <h2 className="text-4xl font-serif font-bold text-zzu-dark">音效测试环节</h2>
                <div className="p-8 bg-white rounded-xl shadow-lg border border-gray-200">
                     <p className="text-lg text-gray-600 mb-6">点击下方按钮依次测试提示音</p>
                     <button 
                        onClick={handleSoundTest}
                        className="px-8 py-4 bg-zzu-red text-white text-xl rounded shadow hover:bg-zzu-dark transition-all active:scale-95"
                     >
                         {soundTestStep === 0 && "测试 30秒 提示音"}
                         {soundTestStep === 1 && "测试 5秒 提示音"}
                         {soundTestStep === 2 && "测试 结束 提示音"}
                     </button>
                     <div className="mt-4 text-sm text-gray-400">
                        当前状态: {['待机', '30秒音效已播放', '5秒音效已播放'][soundTestStep] || '结束音效已播放'}
                     </div>
                </div>
            </div>
            <div className="absolute bottom-4 left-0 w-full text-center text-gray-400 text-xs font-mono">
                  [M] 下一环节 &nbsp;&nbsp; [N] 上一环节 &nbsp;&nbsp; 鼠标点击按钮测试
            </div>
        </div>
      );
  }

  // 5. VICTORY SCREEN
  if (currentStage.type === 'victory') {
     return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Phantom Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
                <img src={matchInfo.logoUrl || DEFAULT_LOGO} className="w-[800px] h-[800px] object-contain" alt="bg" />
            </div>

            {winner ? (
                 // RESULT DISPLAY
                 <div className="z-10 text-center space-y-8 animate-fade-in-up">
                      <div className="text-2xl text-gray-500 font-serif mb-4">本场比赛获胜方</div>
                      <h1 className="text-7xl font-bold text-zzu-red font-serif drop-shadow-lg">
                          {winner === 'aff' ? (matchInfo.affSchool || '正方') : (matchInfo.negSchool || '反方')}
                      </h1>
                      <div className="w-32 h-1 bg-zzu-red mx-auto mt-6 mb-6"></div>
                      <div className="text-xl text-gray-600 font-serif">
                          恭喜 {winner === 'aff' ? (matchInfo.affSchool || '正方') : (matchInfo.negSchool || '反方')} 取得胜利
                      </div>
                  </div>
            ) : (
                // SELECTION SCREEN
                <div className="z-10 flex flex-col items-center w-full">
                    <h1 className="text-4xl font-serif font-bold text-zzu-dark mb-16">比赛结束，请选择获胜方</h1>
                    
                    <div className="flex gap-12">
                        <button 
                            onClick={() => setWinner('aff')}
                            className="w-80 h-96 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border-t-8 border-zzu-red flex flex-col items-center justify-center group cursor-pointer"
                        >
                            <div className="text-4xl font-serif font-bold text-gray-800 group-hover:text-zzu-red transition-colors mb-4">
                                {matchInfo.affSchool || '正方'}
                            </div>
                            <div className="text-gray-400 mb-2">点击选择</div>
                            <div className="text-xs text-gray-300 font-mono">[Q]</div>
                        </button>

                        <button 
                            onClick={() => setWinner('neg')}
                            className="w-80 h-96 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border-t-8 border-gray-800 flex flex-col items-center justify-center group cursor-pointer"
                        >
                             <div className="text-4xl font-serif font-bold text-gray-800 group-hover:text-black transition-colors mb-4">
                                {matchInfo.negSchool || '反方'}
                            </div>
                            <div className="text-gray-400 mb-2">点击选择</div>
                            <div className="text-xs text-gray-300 font-mono">[W]</div>
                        </button>
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 left-0 w-full text-center text-gray-400 text-xs font-mono z-20">
                  {winner ? '[N] 返回重新选择' : '[N] 返回上一环节 &nbsp;&nbsp; [Q] 选择正方 &nbsp;&nbsp; [W] 选择反方'}
            </div>
        </div>
     );
  }

  // 4. MAIN TIMER
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <div className="h-auto py-2 bg-zzu-red flex items-start justify-between px-6 shadow-md z-20">
            <div className="w-1/3 text-white flex flex-col items-start">
                 {/* INCREASED FONT SIZES HERE */}
                 <div className="text-3xl font-bold border-b-2 border-white/40 pb-2 mb-2 shadow-sm">{matchInfo.affSchool || "正方"}</div>
                 <div className="text-base font-medium opacity-95 whitespace-pre-wrap leading-snug">{matchInfo.affTopic}</div>
            </div>
            <div className="flex-1 flex flex-col items-center pt-2">
                 <img src={matchInfo.logoUrl || DEFAULT_LOGO} className="h-20 w-20 object-contain bg-white rounded-full p-1 mb-1 shadow-sm" alt="logo"/>
                 <div className="text-white font-serif font-bold text-lg">{matchInfo.title}</div>
            </div>
            <div className="w-1/3 text-white flex flex-col items-end text-right">
                 {/* INCREASED FONT SIZES HERE */}
                 <div className="text-3xl font-bold border-b-2 border-white/40 pb-2 mb-2 shadow-sm">{matchInfo.negSchool || "反方"}</div>
                 <div className="text-base font-medium opacity-95 whitespace-pre-wrap leading-snug">{matchInfo.negTopic}</div>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex relative">
            
            {/* Center Stage List - Floating Above Backgrounds */}
            {/* ADJUSTED POSITION: -mt-52 to move it even higher */}
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none -mt-52">
                 {/* REDUCED CONTAINER HEIGHT TO 320px & ADDED MASK-IMAGE TO FADE TOP/BOTTOM */}
                 <div className="h-[320px] w-[280px] relative overflow-hidden flex flex-col items-center justify-center [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
                    {/* Scrollable Container with adjusted padding for centering in 320px height */}
                    <div 
                        ref={scrollRef} 
                        className="w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar py-[140px] space-y-4 px-4 text-center"
                        style={{ scrollBehavior: 'smooth' }}
                    >
                        {DEBATE_FLOW.slice(3).map((s, idx) => (
                            <div 
                                key={idx} 
                                className={`
                                    transition-all duration-300 py-2 rounded-lg backdrop-blur-md
                                    ${currentStage.id === s.id 
                                        /* REDUCED FONT SIZES */
                                        ? 'text-zzu-red font-bold text-xl scale-110 bg-white/90 shadow-xl border border-zzu-red z-50 opacity-100' 
                                        : 'text-gray-400 font-medium text-xs opacity-40 grayscale'}
                                `}
                            >
                                {s.label.replace(/\n/g, ' ')}
                            </div>
                        ))}
                    </div>
                 </div>
            </div>

            {/* Left Side (Aff) */}
            {/* ADDED CONDITIONAL VISUAL CUE CLASSES FOR SUBTLE BACKGROUND CHANGE */}
            <div className={`w-1/2 border-r border-gray-200 flex flex-col items-center justify-center relative transition-all duration-500 z-10 ${activeSide === 'aff' ? 'bg-red-50' : 'bg-transparent'} ${getVisualCueClass(activeSide === 'aff', timeAff)}`}>
                <div className="absolute top-4 left-0 w-full text-center px-4">
                     <div className={`text-3xl font-serif font-bold whitespace-pre-wrap ${activeSide === 'aff' ? 'text-zzu-red scale-110 transition-transform' : 'text-gray-400'}`}>
                         {currentStage.affTitle}
                     </div>
                </div>

                <div className={`mt-8 transition-opacity duration-300 ${(activeSide === 'neg' && !['free_debate', 'dual_debate'].includes(currentStage.type)) ? 'opacity-20 grayscale' : 'opacity-100'}`}>
                    <Clock 
                        totalTime={['free_debate', 'dual_debate'].includes(currentStage.type) ? currentStage.time : (currentStage.activeSide === 'aff' ? currentStage.time : 0)}
                        currentTime={timeAff}
                        isActive={activeSide === 'aff'}
                        isFinished={timeAff === 0}
                        label="正方用时"
                        size={220} 
                    />
                </div>
            </div>

            {/* Right Side (Neg) */}
            {/* ADDED CONDITIONAL VISUAL CUE CLASSES FOR SUBTLE BACKGROUND CHANGE */}
            <div className={`w-1/2 flex flex-col items-center justify-center relative transition-all duration-500 z-10 ${activeSide === 'neg' ? 'bg-red-50' : 'bg-transparent'} ${getVisualCueClass(activeSide === 'neg', timeNeg)}`}>
                <div className="absolute top-4 left-0 w-full text-center px-4">
                     <div className={`text-3xl font-serif font-bold whitespace-pre-wrap ${activeSide === 'neg' ? 'text-zzu-red scale-110 transition-transform' : 'text-gray-400'}`}>
                         {currentStage.negTitle}
                     </div>
                </div>

                 <div className={`mt-8 transition-opacity duration-300 ${(activeSide === 'aff' && !['free_debate', 'dual_debate'].includes(currentStage.type)) ? 'opacity-20 grayscale' : 'opacity-100'}`}>
                    <Clock 
                        totalTime={['free_debate', 'dual_debate'].includes(currentStage.type) ? currentStage.time : (currentStage.activeSide === 'neg' ? currentStage.time : 0)}
                        currentTime={timeNeg}
                        isActive={activeSide === 'neg'}
                        isFinished={timeNeg === 0}
                        label="反方用时"
                        size={220} 
                    />
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 left-0 w-full flex flex-col items-center z-40 pointer-events-none">
            <div className="text-[10px] text-gray-400 font-mono space-x-4 bg-white/90 px-4 py-1 rounded-full shadow-sm backdrop-blur border border-gray-100">
                <span>[SPACE] 暂停/开始</span>
                <span>[TAB] 切换发言方</span>
                <span>[Q] 正方计时</span>
                <span>[W] 反方计时</span>
                <span>[N] 上一环节</span>
                <span>[M] 下一环节</span>
            </div>
        </div>
    </div>
  );
};

export default App;