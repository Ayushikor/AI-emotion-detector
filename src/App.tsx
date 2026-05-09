import { useState, useEffect, useRef } from 'react';
import { domToJpeg } from 'modern-screenshot';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  Brain, 
  TrendingUp, 
  MousePointer2, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Timer,
  LayoutDashboard,
  Settings,
  History,
  ShieldCheck,
  Video,
  Monitor,
  Plus,
  ExternalLink,
  BookOpen,
  Camera,
  Trash2,
  Pause,
  Play,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as faceDetection from '@tensorflow-models/face-detection';

// Types
interface LearningResource {
  id: number;
  title: string;
  url: string;
  added_at: string;
}

// Mock data for initial load
const MOCK_ANALYTICS = [
  { time: '10:00', engagement: 65, focus: 70, emotion: 'Neutral' },
  { time: '10:05', engagement: 85, focus: 90, emotion: 'Engaged' },
  { time: '10:10', engagement: 40, focus: 35, emotion: 'Confused' },
  { time: '10:15', engagement: 20, focus: 15, emotion: 'Frustrated' },
  { time: '10:20', engagement: 95, focus: 98, emotion: 'Engaged' },
  { time: '10:25', engagement: 55, focus: 60, emotion: 'Neutral' },
  { time: '10:30', engagement: 15, focus: 10, emotion: 'Bored' },
];

const EMOTION_COLORS: Record<string, string> = {
  Engaged: '#10b981',
  Neutral: '#94a3b8',
  Confused: '#f59e0b',
  Frustrated: '#ef4444',
  Bored: '#6366f1',
  Happy: '#fbbf24',
  Surprised: '#ec4899'
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'learning' | 'history' | 'settings'>('dashboard');
  const [currentEmotion, setCurrentEmotion] = useState('Engaged');
  const [history, setHistory] = useState(MOCK_ANALYTICS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Learning Board State
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [activeResource, setActiveResource] = useState<LearningResource | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');

  // Webcam State
  const [isWebcamEnabled, setIsWebcamEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const appRef = useRef<HTMLDivElement>(null);
  const [faceScore, setFaceScore] = useState(0);

  // Timer State
  const [seconds, setSeconds] = useState(() => {
    const saved = localStorage.getItem('study_seconds');
    return saved ? parseInt(saved) : 0;
  }); 
  const [timerActive, setTimerActive] = useState(() => {
    const saved = localStorage.getItem('study_timer_active');
    return saved === 'true';
  });
  const [sessionActive, setSessionActive] = useState(() => {
    const saved = localStorage.getItem('study_session_active');
    return saved === 'true';
  });
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // UI State
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [notificationLog, setNotificationLog] = useState([
    { id: 1, type: 'warning', title: 'Focus Slip', time: '2m ago', message: 'Frequent tabs changes detected.' },
    { id: 3, type: 'info', title: 'Hydration', time: '1h ago', message: 'First hydration check of the day.' }
  ]);

  // Hydration Timer Logic (30 mins = 1800 seconds)
  const [hydrationSeconds, setHydrationSeconds] = useState(0);
  
  useEffect(() => {
    let interval: any;
    if (timerActive && sessionActive) {
      interval = setInterval(() => {
        setHydrationSeconds(prev => {
          if (prev >= 1800) { // 30 minutes
            // Trigger Alarm
            const newId = Date.now();
            setNotificationLog(current => [
              { id: newId, type: 'info', title: 'Hydration Recall', time: 'Just now', message: 'Half hour reached! Drink 200ml of water now.' },
              ...current
            ]);
            return 0; // Reset for next 30 mins
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, sessionActive]);

  // Persist Timer state
  useEffect(() => {
    localStorage.setItem('study_seconds', seconds.toString());
    localStorage.setItem('study_timer_active', timerActive.toString());
    localStorage.setItem('study_session_active', sessionActive.toString());
  }, [seconds, timerActive, sessionActive]);

  // Behavior Toggles
  const [behaviorTracking, setBehaviorTracking] = useState(true);
  const [viewingSnapshot, setViewingSnapshot] = useState<any | null>(null);

  const captureSnapshot = async () => {
    if (!appRef.current || isCapturing) return null;
    setIsCapturing(true);
    try {
      const dataUrl = await domToJpeg(appRef.current, {
        quality: 0.6,
        scale: 0.4,
        backgroundColor: '#f8fafc',
      });
      return dataUrl;
    } catch (e) {
      console.error("Snapshot failed", e);
      if (videoRef.current && isWebcamEnabled) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            return canvas.toDataURL('image/jpeg', 0.6);
          }
        } catch (err) {
          console.error("Fallback snapshot failed", err);
        }
      }
    } finally {
      setIsCapturing(false);
    }
    return null;
  };

  const endSession = async () => {
    setIsEndingSession(true);
    setTimerActive(false);
    
    const endTime = formatTime(seconds);
    const finalSnapshot = await captureSnapshot();
    
    const avgEngagement = history.length > 0 
      ? Math.floor(history.reduce((acc, curr) => acc + curr.engagement, 0) / history.length) 
      : 85;
    const avgFocus = history.length > 0 
      ? Math.floor(history.reduce((acc, curr) => acc + curr.focus, 0) / history.length) 
      : 90;

    const finalEntry = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      engagement: avgEngagement,
      focus: avgFocus,
      emotion: currentEmotion,
      snapshot: finalSnapshot,
      note: `Session Complete: ${endTime}`,
      isSummary: true
    };

    setHistory(prev => [...prev, finalEntry]);
    setSessionActive(false);
    setSeconds(0);
    setIsEndingSession(false);
    alert(`Session ended successfully!\nDuration: ${endTime}\nData saved to logs.`);
  };

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (timerActive) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map(v => v < 10 ? "0" + v : v).join(":");
  };

  // Initialize face detection
  useEffect(() => {
    let detector: any = null;
    let stream: MediaStream | null = null;
    let rafId: number;

    const setupDetector = async () => {
      await tf.ready();
      const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
      const detectorConfig: any = {
        runtime: 'tfjs',
      };
      detector = await faceDetection.createDetector(model, detectorConfig);
    };

    const startWebcam = async () => {
      if (!isWebcamEnabled) return;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        const detect = async () => {
          if (videoRef.current && detector) {
            const faces = await detector.estimateFaces(videoRef.current);
            if (faces.length > 0) {
              setFaceScore(faces[0].box.width * faces[0].box.height / 50000); // Simple score
            } else {
              setFaceScore(0);
            }
          }
          rafId = requestAnimationFrame(detect);
        };
        detect();
      } catch (err) {
        console.error("Camera access denied", err);
        setIsWebcamEnabled(false);
      }
    };

    setupDetector();
    if (isWebcamEnabled) startWebcam();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isWebcamEnabled]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(async () => {
      const emotions = ['Engaged', 'Neutral', 'Confused', 'Frustrated', 'Bored', 'Happy', 'Surprised'];
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      setCurrentEmotion(randomEmotion);
      
      const snapshot = await captureSnapshot();
      
      const newEntry = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engagement: Math.floor(Math.random() * 100),
        focus: Math.floor(Math.random() * 100),
        emotion: randomEmotion,
        snapshot: snapshot
      };
      
      setHistory(prev => [...prev.slice(-19), newEntry]);
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const addResource = () => {
    if (!newUrl || !newTitle) return;
    const res: LearningResource = {
      id: Date.now(),
      title: newTitle,
      url: newUrl,
      added_at: new Date().toISOString()
    };
    setResources([res, ...resources]);
    setNewUrl('');
    setNewTitle('');
    if (!activeResource) setActiveResource(res);
  };

  const getEmbedUrl = (url: string) => {
    try {
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
      const match = url.match(youtubeRegex);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&enablejsapi=1`;
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  return (
    <div ref={appRef} className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 240 : 80 }}
        className="bg-slate-900 text-white flex flex-col shrink-0"
      >
        <div className="p-6 flex items-center gap-3">
          <Brain className="text-emerald-400 shrink-0" size={32} />
          {isSidebarOpen && <span className="font-bold text-lg tracking-tight">EmotionSense</span>}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            isOpen={isSidebarOpen} 
            onClick={() => setActiveTab('dashboard')}
          />
          <SidebarItem 
            icon={<BookOpen size={20} />} 
            label="Learning Board" 
            active={activeTab === 'learning'} 
            isOpen={isSidebarOpen} 
            onClick={() => setActiveTab('learning')}
          />
          <SidebarItem 
            icon={<History size={20} />} 
            label="Session logs" 
            active={activeTab === 'history'} 
            isOpen={isSidebarOpen} 
            onClick={() => setActiveTab('history')}
          />
          <SidebarItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            active={activeTab === 'settings'} 
            isOpen={isSidebarOpen} 
            onClick={() => setActiveTab('settings')}
          />
        </nav>

        {/* Webcam Preview in Sidebar */}
        <div className="p-4 border-t border-slate-800">
          <div className="relative group">
            <div className={`
              aspect-video rounded-xl bg-slate-800 overflow-hidden relative shadow-lg
              ${!isWebcamEnabled ? 'flex items-center justify-center' : ''}
            `}>
              {isWebcamEnabled ? (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale" />
              ) : (
                <Camera className="text-slate-600" size={24} />
              )}
              {isWebcamEnabled && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-full backdrop-blur-sm border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">AI Live</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => setIsWebcamEnabled(!isWebcamEnabled)}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              <Video size={14} />
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className={`flex items-center gap-3 ${isSidebarOpen ? 'bg-slate-800' : ''} p-2 rounded-lg`}>
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-sm">S</div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Student</p>
                <p className="text-xs text-slate-400 truncate">Premium Plan</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.main 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-y-auto p-4 md:p-8"
            >
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight underline decoration-emerald-500/30 decoration-4">Learning Dashboard</h1>
                  <p className="text-slate-500 font-medium">Real-time emotional tracking & study insights</p>
                </div>
                <div className="flex items-center gap-4">
                  {!sessionActive ? (
                    <button 
                      onClick={() => {
                        setSessionActive(true);
                        setTimerActive(true);
                        setSeconds(0);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      Start New Session
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                       <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
                        <button 
                          onClick={() => setTimerActive(!timerActive)}
                          disabled={isEndingSession}
                          className={`p-2 rounded-lg transition-colors ${timerActive ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}
                        >
                          {timerActive ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Live Session</p>
                          <span className="font-mono font-bold text-slate-700">{formatTime(seconds)}</span>
                        </div>
                      </div>
                      <button 
                        onClick={endSession}
                        disabled={isEndingSession}
                        className={`bg-slate-900 hover:bg-slate-800 text-white p-3.5 rounded-2xl transition-all active:scale-95 shadow-lg flex items-center justify-center ${isEndingSession ? 'opacity-50 cursor-wait' : ''}`}
                        title="End Session"
                      >
                        {isEndingSession ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Clock size={20} /></motion.div> : <XCircle size={20} />}
                      </button>
                    </div>
                  )}
                </div>
              </header>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatusCard 
                  title="Emotional State" 
                  value={currentEmotion} 
                  color={EMOTION_COLORS[currentEmotion]}
                  icon={<Brain size={20} />}
                  score={currentEmotion === 'Engaged' ? 95 : 60}
                  onClick={() => setSelectedStat('emotion')}
                  active={selectedStat === 'emotion'}
                />
                <StatCard 
                  title="Engagement" 
                  value="78%" 
                  trend="+12%" 
                  icon={<TrendingUp size={20} className="text-emerald-500" />}
                  onClick={() => setSelectedStat('engagement')}
                  active={selectedStat === 'engagement'}
                />
                <StatCard 
                  title="Attention Score" 
                  value={faceScore > 0 ? "High" : "Low"} 
                  trend={faceScore > 0 ? "Tracking" : "Idle"} 
                  icon={<Video size={20} className="text-blue-500" />}
                  onClick={() => setSelectedStat('attention')}
                  active={selectedStat === 'attention'}
                />
                <StatCard 
                  title="Productivity" 
                  value="8.4" 
                  trend="Optimal" 
                  icon={<CheckCircle2 size={20} className="text-indigo-500" />}
                  onClick={() => setSelectedStat('productivity')}
                  active={selectedStat === 'productivity'}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <section className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                        {selectedStat === 'engagement' ? 'Engagement' : selectedStat === 'attention' ? 'Attention' : 'Session'} Analysis
                      </h2>
                      <p className="text-sm font-medium text-slate-400 mt-1">Timeline of your emotional focus</p>
                    </div>
                    <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100 italic">
                      <div className="px-3 py-1 bg-white shadow-sm rounded-lg text-xs font-bold text-slate-700">Live</div>
                      <button onClick={() => setSelectedStat(null)} className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Reset View</button>
                    </div>
                  </div>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history}>
                        <defs>
                          <linearGradient id="colorEngage" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={selectedStat === 'engagement' ? '#10b981' : '#cbd5e1'} stopOpacity={0.15}/>
                            <stop offset="95%" stopColor={selectedStat === 'engagement' ? '#10b981' : '#cbd5e1'} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="time" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}} 
                          dy={10}
                        />
                        <YAxis 
                          hide 
                          domain={[0, 100]} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '16px', 
                            border: '1px solid #f1f5f9', 
                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey={selectedStat === 'attention' ? 'focus' : 'engagement'} 
                          stroke={selectedStat === 'attention' ? '#6366f1' : '#10b981'} 
                          strokeWidth={4}
                          fillOpacity={1} 
                          fill="url(#colorEngage)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* Side Panel: Suggestions */}
                <section className="space-y-6">
                  <div className="bg-slate-900 text-white p-8 rounded-[2rem] overflow-hidden relative group">
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30">
                        <AlertCircle className="text-emerald-400" size={24} />
                      </div>
                      <h3 className="text-xl font-extrabold mb-3 tracking-tight italic">Smart Insight</h3>
                      <p className="text-slate-400 text-sm font-medium leading-relaxed mb-0">
                        {getSuggestionText(currentEmotion)}
                      </p>
                    </div>
                    <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px]" />
                  </div>

                {/* Interactive Status Alerts */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-extrabold flex items-center gap-2">
                        <LayoutDashboard size={20} className="text-slate-400" />
                        Live Feed
                      </h2>
                      <button 
                        onClick={() => setNotificationLog([])} 
                        className="text-[10px] font-black text-slate-300 hover:text-slate-500 transition-colors uppercase tracking-widest"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="space-y-4">
                      {notificationLog.map(note => (
                        <NotificationItem 
                          key={note.id}
                          type={note.type} 
                          title={note.title} 
                          time={note.time} 
                          message={note.message} 
                          onClick={() => {
                            if (note.title.includes('Focus')) {
                              setActiveTab('settings');
                            } else if (note.title.includes('AI Feedback')) {
                              alert("AI Reflection: You are performing 15% better than your morning session. Keep your focus on the current material.");
                            } else if (note.title.includes('Hydration')) {
                              if (confirm("Did you drink water?")) {
                                setNotificationLog(prev => prev.filter(n => n.id !== note.id));
                                alert("Stay hydrated! Goal progress: 1.2L / 2.0L");
                              }
                            }
                          }}
                        />
                      ))}
                      {notificationLog.length === 0 && (
                        <div className="text-center py-8 text-slate-300 text-xs font-bold uppercase tracking-widest">No active alerts</div>
                      )}
                    </div>
                  </div>

                  {sessionActive && (
                    <div className="bg-emerald-500 text-white p-8 rounded-[2rem] overflow-hidden relative shadow-lg shadow-emerald-500/20">
                      <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 border border-white/30">
                          <Clock className="text-white" size={24} />
                        </div>
                        <h3 className="text-xl font-extrabold mb-2 tracking-tight italic">Active Goal</h3>
                        <p className="text-emerald-100 text-sm font-medium leading-relaxed mb-4">
                          Session running for {formatTime(seconds)}. Stay focused!
                        </p>
                        <div className="mb-4">
                          <p className="text-[9px] font-black text-emerald-200 uppercase tracking-[0.2em] mb-2">Next Hydration Break: {Math.ceil((1800 - hydrationSeconds) / 60)}m</p>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden border border-white/10">
                            <motion.div 
                              animate={{ width: `${(hydrationSeconds / 1800) * 100}%` }}
                              className="h-full bg-emerald-300 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                            />
                          </div>
                        </div>
                        <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            animate={{ width: `${Math.min((seconds / 3600) * 100, 100)}%` }}
                            className="h-full bg-white"
                          />
                        </div>
                      </div>
                      <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-[60px]" />
                    </div>
                  )}
                </section>
              </div>
            </motion.main>
          )}

          {activeTab === 'history' && (
            <motion.main 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-y-auto p-4 md:p-8"
            >
              <header className="mb-8">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Session History</h1>
                <p className="text-slate-500 font-medium">Review your past learning performance</p>
              </header>

              <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-100">
                      <th className="px-8 py-5 text-xs font-black uppercase text-slate-400 tracking-widest">Date & Time</th>
                      <th className="px-8 py-5 text-xs font-black uppercase text-slate-400 tracking-widest">Dominant Mood</th>
                      <th className="px-8 py-5 text-xs font-black uppercase text-slate-400 tracking-widest">Engagement</th>
                      <th className="px-8 py-5 text-xs font-black uppercase text-slate-400 tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {history.slice().reverse().map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-5">
                          <p className="text-sm font-bold text-slate-700">{item.time}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Today</p>
                        </td>
                        <td className="px-8 py-5">
                          <span 
                            className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                            style={{ 
                              backgroundColor: `${EMOTION_COLORS[item.emotion] || '#94a3b8'}20`, 
                              color: EMOTION_COLORS[item.emotion] || '#94a3b8' 
                            }}
                          >
                            {item.emotion}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm font-black text-slate-900 italic">
                          {item.engagement}%
                        </td>
                        <td className="px-8 py-5">
                          <button 
                            onClick={() => {
                              if (item.snapshot) {
                                setViewingSnapshot(item);
                              } else {
                                alert(`Snapshot from ${item.time}:\nMood: ${item.emotion}\nEngagement: ${item.engagement}%\nAttention Score: ${item.focus > 50 ? 'Optimal' : 'Needs Improvement'}`);
                              }
                            }}
                            className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all hover:scale-105 flex items-center gap-1.5"
                          >
                             <Camera size={14} />
                            {item.snapshot ? 'View Capture' : 'View Data'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.main>
          )}

          {activeTab === 'settings' && (
            <motion.main 
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-y-auto p-4 md:p-8"
            >
              <header className="mb-8">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Preferences</h1>
                <p className="text-slate-500 font-medium">Fine-tune the emotion detection engine</p>
              </header>

              <div className="max-w-2xl space-y-6">
                <SettingsToggle 
                  title="Webcam AI Analysis" 
                  description="Enable facial expression recognition via TensorFlow.js" 
                  enabled={isWebcamEnabled}
                  onChange={() => setIsWebcamEnabled(!isWebcamEnabled)}
                />
                <SettingsToggle 
                  title="Behavior Tracking" 
                  description="Monitor mouse, scroll, and typing patterns" 
                  enabled={behaviorTracking}
                  onChange={() => setBehaviorTracking(!behaviorTracking)}
                />
                
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-black text-slate-900 mb-6 italic">Detection Sensitivity</h3>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Low Precision</span>
                        <span>High Precision</span>
                      </div>
                      <input type="range" className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-emerald-500 cursor-pointer" />
                    </div>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      Higher sensitivity will detect more subtle emotional shifts but may increase false positives during casual interaction.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (confirm("Clear all session data? This cannot be undone.")) {
                      setHistory([]);
                      alert("History cleared.");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 p-5 bg-red-50 hover:bg-red-100 text-red-500 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-colors border border-red-100"
                >
                  <Trash2 size={18} />
                  Reset Local Data
                </button>
              </div>
            </motion.main>
          )}

          {activeTab === 'learning' && (
            <motion.main 
              key="learning"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-hidden flex flex-col p-4 md:p-8"
            >
              <header className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Learning Board</h1>
                  <p className="text-slate-500 font-medium">Study with AI assistance</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
                    <button 
                      onClick={() => {
                        const elem = document.documentElement;
                        try {
                          if (!document.fullscreenElement) {
                            elem.requestFullscreen().catch(err => {
                              console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                            });
                          } else {
                            document.exitFullscreen();
                          }
                        } catch (e) {
                          alert("Fullscreen not supported in this browser mode.");
                        }
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      {typeof document !== 'undefined' && document.fullscreenElement ? 'Exit Full' : 'Full Screen'}
                    </button>
                    {activeResource ? (
                      <a 
                        href={activeResource.url.startsWith('http') ? activeResource.url : `https://${activeResource.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl text-xs font-black text-emerald-600 hover:bg-emerald-50 transition-all flex items-center gap-2 border border-transparent hover:border-emerald-100"
                      >
                        <ExternalLink size={14} /> Popout
                      </a>
                    ) : (
                      <button 
                        onClick={() => alert("Select a learning resource first to use popout feature.")}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 cursor-not-allowed flex items-center gap-2"
                      >
                        <ExternalLink size={14} /> Popout
                      </button>
                    )}
                  </div>
                </div>
              </header>

              <div className="flex-1 flex gap-8 overflow-hidden">
                {/* Resources Sidebar */}
                <div className="w-72 flex flex-col gap-6 overflow-hidden">
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Add Course Material</h3>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="Title (e.g. Intro to ML)" 
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <input 
                        type="text" 
                        placeholder="Paste URL here..." 
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <button 
                        onClick={addResource}
                        className="w-full bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
                      >
                        <Plus size={18} />
                        Add Material
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest sticky top-0 bg-slate-50 py-2">Your Library</h3>
                    {resources.map(res => (
                      <div 
                        key={res.id}
                        onClick={() => setActiveResource(res)}
                        className={`
                          p-4 rounded-2xl border transition-all cursor-pointer group
                          ${activeResource?.id === res.id 
                            ? 'bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500/10' 
                            : 'bg-white border-slate-200 hover:border-slate-300'}
                        `}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold truncate leading-tight group-hover:text-emerald-600">{res.title}</h4>
                            <p className="text-[10px] text-slate-400 truncate mt-1 italic">{res.url}</p>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setResources(resources.filter(r => r.id !== res.id)); }}
                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {resources.length === 0 && (
                      <div className="py-12 text-center">
                        <Monitor className="mx-auto text-slate-200 mb-4" size={40} />
                        <p className="text-xs font-bold text-slate-400">No resources added yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Viewer (Iframe) */}
                <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative group flex flex-col">
                  {activeResource ? (
                    <>
                      <div className="bg-slate-50 px-6 py-2 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Protected Session</span>
                        </div>
                        <a 
                          href={activeResource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors uppercase tracking-wider"
                        >
                          Open in new tab <ExternalLink size={10} />
                        </a>
                      </div>
                      <div className="flex-1 relative">
                        <iframe 
                          src={getEmbedUrl(activeResource.url)} 
                          className="w-full h-full border-none"
                          title={activeResource.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center bg-slate-50/50">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100 mb-6 animate-bounce">
                        <ExternalLink className="text-emerald-500" size={32} />
                      </div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2 italic">Ready to Learn?</h2>
                      <p className="text-slate-400 text-sm font-medium max-w-sm">Select a course material from your library on the left to begin your AI-assisted session.</p>
                    </div>
                  )}
                  {/* Floating AI Status Overlay */}
                  {activeResource && (
                    <div className="absolute bottom-6 right-6 flex items-center gap-4">
                      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3 shadow-2xl">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Brain className="text-white" size={16} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">State</p>
                          <p className="text-xs font-bold text-white tracking-tight">{currentEmotion}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.main>
          )}
        </AnimatePresence>
      </div>

      {/* Snapshot Modal */}
      <AnimatePresence>
        {viewingSnapshot && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewingSnapshot(null)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[3rem] overflow-hidden max-w-2xl w-full shadow-2xl border border-white/20"
            >
              <div className="relative aspect-video bg-slate-100">
                <img 
                  src={viewingSnapshot.snapshot} 
                  alt="Session Snapshot" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-6 left-6 flex items-center gap-3">
                  <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest">AI Capture</span>
                  </div>
                </div>
              </div>
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight italic">Session Moment</h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">{viewingSnapshot.time} • Today</p>
                  </div>
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: `${EMOTION_COLORS[viewingSnapshot.emotion] || '#94a3b8'}10`, color: EMOTION_COLORS[viewingSnapshot.emotion] }}
                  >
                    <Brain size={28} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-10">
                  <SnapshotMeta label="Mood" value={viewingSnapshot.emotion} color={EMOTION_COLORS[viewingSnapshot.emotion]} />
                  <SnapshotMeta label="Engagement" value={`${viewingSnapshot.engagement}%`} color="#10b981" />
                  <SnapshotMeta label="Attention" value={viewingSnapshot.focus > 50 ? "High" : "Low"} color="#6366f1" />
                </div>

                <button 
                  onClick={() => setViewingSnapshot(null)}
                  className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
                >
                  Return to Dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SnapshotMeta({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
      <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">{label}</p>
      <p className="text-lg font-black italic tracking-tight" style={{ color }}>{value}</p>
    </div>
  );
}

function SidebarItem({ icon, label, active, isOpen, onClick }: { icon: any, label: string, active?: boolean, isOpen: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`
        flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border border-transparent
        ${active ? 'bg-emerald-500 text-slate-900 font-black shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
        ${!isOpen ? 'justify-center' : ''}
      `}
    >
      <div className={`${active ? 'text-slate-900' : ''}`}>{icon}</div>
      {isOpen && <span className="text-sm tracking-tight">{label}</span>}
    </div>
  );
}

function StatusCard({ title, value, color, icon, score, onClick, active }: any) {
  return (
    <motion.div 
      layout
      onClick={onClick}
      className={`
        p-8 rounded-[2rem] shadow-sm border transition-all cursor-pointer relative overflow-hidden group
        ${active ? 'bg-white border-emerald-500 ring-4 ring-emerald-500/5 scale-[1.02]' : 'bg-white border-slate-200 hover:border-slate-300 hover:scale-[1.01]'}
      `}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</span>
          <div className={`p-2.5 rounded-xl transition-all ${active ? 'bg-emerald-50' : 'bg-slate-50'}`} style={{ color }}>{icon}</div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div 
            key={value}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="text-4xl font-black italic tracking-tighter"
            style={{ color }}
          >
            {value}
          </motion.div>
        </AnimatePresence>
        <div className="mt-6 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              className="h-full rounded-full transition-all duration-1000"
              style={{ backgroundColor: color }}
            />
          </div>
          <span className="text-[10px] font-black text-slate-300">{score}%</span>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, trend, icon, onClick, active }: any) {
  return (
    <div 
      onClick={onClick}
      className={`
        p-8 rounded-[2rem] shadow-sm border transition-all cursor-pointer group
        ${active ? 'bg-white border-emerald-500 ring-4 ring-emerald-500/5 scale-[1.02]' : 'bg-white border-slate-200 hover:border-slate-300 hover:scale-[1.01]'}
      `}
    >
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</span>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-emerald-50' : 'bg-slate-50'}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-3xl font-black text-slate-900 tracking-tight italic">{value}</div>
        <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase tracking-wider">{trend}</span>
      </div>
    </div>
  );
}

function SettingsToggle({ title, description, enabled, onChange }: any) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between gap-6">
      <div className="min-w-0">
        <h3 className="text-lg font-black text-slate-900 mb-1 italic leading-tight">{title}</h3>
        <p className="text-xs font-medium text-slate-400 leading-relaxed">{description}</p>
      </div>
      <button 
        onClick={onChange}
        className={`
          relative w-14 h-8 rounded-full transition-all shrink-0
          ${enabled ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-200'}
        `}
      >
        <motion.div 
          animate={{ x: enabled ? 26 : 4 }}
          className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md" 
        />
      </button>
    </div>
  );
}

function NotificationItem({ type, title, time, message, onClick }: any) {
  const iconMap: any = {
    warning: <AlertCircle className="text-amber-500" size={18} />,
    success: <CheckCircle2 className="text-emerald-500" size={18} />,
    info: <Clock className="text-blue-500" size={18} />
  };

  return (
    <div 
      onClick={onClick}
      className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 cursor-pointer group"
    >
      <div className="mt-0.5 shrink-0 p-2 bg-white rounded-xl shadow-sm border border-slate-50 group-hover:border-slate-200 transition-all">{iconMap[type]}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className="text-sm font-black text-slate-900 tracking-tight truncate group-hover:text-emerald-600 transition-colors">{title}</h4>
          <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest shrink-0">{time}</span>
        </div>
        <p className="text-xs text-slate-400 font-medium leading-relaxed truncate">{message}</p>
      </div>
    </div>
  );
}

function getSuggestionText(emotion: string) {
  const suggestions: Record<string, string> = {
    Engaged: "Deep work state active. Optimal neuroplasticity occurring. Avoid interruptions at all costs.",
    Neutral: "Cognitive load is balanced. Consider introducing a deliberate challenge to spike engagement.",
    Confused: "Working memory overload detected. Semantic structure is breaking. Try a concept map.",
    Frustrated: "Cortisol spike detected. Emotional friction is impeding logic. High risk of abandonment.",
    Bored: "Default Mode Network activation high. Passive consumption detected. Switch to active recall.",
    Happy: "Positive reinforcement state. Learning retention is high. Keep enjoying the process!",
    Surprised: "Cognitive gap identified. Your mental model was just challenged. Great for memory!"
  };
  return suggestions[emotion] || "Maintain cognitive equilibrium. Study smarter, not harder.";
}
