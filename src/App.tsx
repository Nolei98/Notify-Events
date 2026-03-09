import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  Bell, 
  BellOff, 
  Trophy, 
  Sword, 
  Gamepad2, 
  Sparkles, 
  AlertCircle,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  X,
  Coins,
  Zap,
  ChevronUp,
  Check,
  CheckCircle2,
  XCircle,
  Users,
  Settings,
  Calendar,
  ShieldCheck,
  Sword as SwordIcon,
  Wand2,
  Music,
  FlaskConical,
  Target,
  Ghost,
  Flame,
  Layout,
  BookOpen,
  Activity
} from 'lucide-react';
import { RAGNAROK_EVENTS, ROEvent } from './constants';

export interface BuildEquipment {
  name: string;
  card: string;
  slots?: number;
}

export interface BuildAttributes {
  str: number;
  agi: number;
  vit: number;
  int: number;
  dex: number;
  luk: number;
}

export interface ClassBuild {
  id: string;
  className: string;
  version?: string;
  image: string;
  attributes: BuildAttributes;
  equipment: {
    elmo: BuildEquipment;
    meio: BuildEquipment;
    baixo: BuildEquipment;
    arma: BuildEquipment;
    capa: BuildEquipment;
    armadura: BuildEquipment;
    escudo: BuildEquipment;
    acessorio1: BuildEquipment;
    acessorio2: BuildEquipment;
  };
}

export interface RosterMember {
  id: string;
  name: string;
  className: string;
  confirmed: boolean | null;
}

export interface WoESchedule {
  days: string[];
  time: string;
}

// Helper to parse time string to minutes since midnight
const timeToMinutes = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper to format minutes to HH:mm
const minutesToTime = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Helper to play a notification sound
const playNotificationSound = async () => {
  try {
    // Direct link to the Flauta Doce sound provided by the user
    const soundUrl = 'https://www.myinstants.com/media/sounds/flauta-doce-effect.mp3';
    const audio = new Audio(soundUrl);
    
    audio.volume = 0.6;
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn('Autoplay bloqueado ou erro no áudio:', error);
      });
    }

    // Stop after 5 seconds as requested
    /* 
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 5000);
    */
  } catch (e) {
    console.warn('Não foi possível tocar o som de notificação:', e);
  }
};

// Glitter Effect Component for selected filters
const GlitterEffect = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-yellow-200 rounded-full"
          initial={{ 
            opacity: 0, 
            scale: 0,
            x: (Math.random() - 0.5) * 20,
            y: 0
          }}
          animate={{ 
            opacity: [0, 1, 0.8, 0], 
            scale: [0, 1.5, 1, 0],
            y: [-20, -40, -70],
            x: (Math.random() - 0.5) * 80,
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 2 + Math.random(), 
            repeat: Infinity, 
            delay: Math.random() * 2,
            ease: "easeOut"
          }}
          style={{
            left: "50%",
            top: "50%",
            boxShadow: '0 0 10px 2px rgba(253, 224, 71, 0.9)',
          }}
        />
      ))}
    </div>
  );
};

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('omega_notif_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [notificationSettings, setNotificationSettings] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('omega_notif_settings');
    return saved ? JSON.parse(saved) : {
      MvP: true,
      PvP: true,
      Minigame: true,
      Special: true,
      Galhos: true,
      Arca: true,
      Staff: true
    };
  });
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('omega_sound_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeAlerts, setActiveAlerts] = useState<string[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [notifiedAlerts, setNotifiedAlerts] = useState<Set<string>>(new Set());
  
  // Staff Panel State
  const [isStaffPanelOpen, setIsStaffPanelOpen] = useState(false);
  const [customEvents, setCustomEvents] = useState<ROEvent[]>(() => {
    const saved = localStorage.getItem('omega_custom_events');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Form State
  const [formTime, setFormTime] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formPrize, setFormPrize] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<ROEvent['category']>('Special');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Roster State
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [woeSchedule, setWoeSchedule] = useState<WoESchedule>({ days: ['Terça', 'Quinta', 'Sábado'], time: '20:00' });
  const [dataLoaded, setDataLoaded] = useState(false);

  // Fetch initial data from server
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        if (response.ok) {
          const data = await response.json();
          setRoster(data.roster || []);
          setWoeSchedule(data.woeSchedule || { days: ['Terça', 'Quinta', 'Sábado'], time: '20:00' });
          setDataLoaded(true);
        }
      } catch (error) {
        console.error("Failed to fetch shared data:", error);
      }
    };
    fetchData();
  }, []);

  // Save data to server whenever it changes
  useEffect(() => {
    if (!dataLoaded) return;
    
    const saveData = async () => {
      try {
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roster, woeSchedule })
        });
      } catch (error) {
        console.error("Failed to save shared data:", error);
      }
    };
    
    const timer = setTimeout(saveData, 500); // Debounce saves
    return () => clearTimeout(timer);
  }, [roster, woeSchedule, dataLoaded]);

  // Admin Form for Roster
  const [isRosterAdminOpen, setIsRosterAdminOpen] = useState(false);
  const [rosterFormName, setRosterFormName] = useState('');
  const [rosterFormClass, setRosterFormClass] = useState('');

  // Builds State
  const [isBuildsOpen, setIsBuildsOpen] = useState(false);
  const [builds, setBuilds] = useState<ClassBuild[]>([]);
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null);
  const [isBuildAdminOpen, setIsBuildAdminOpen] = useState(false);
  const [buildsLoaded, setBuildsLoaded] = useState(false);

  // Build Form State
  const [buildForm, setBuildForm] = useState<Partial<ClassBuild>>({
    className: 'Paladin',
    version: '',
    attributes: { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 },
    equipment: {
      elmo: { name: '', card: '', slots: 0 },
      meio: { name: '', card: '', slots: 0 },
      baixo: { name: '', card: '', slots: 0 },
      arma: { name: '', card: '', slots: 0 },
      capa: { name: '', card: '', slots: 0 },
      armadura: { name: '', card: '', slots: 0 },
      escudo: { name: '', card: '', slots: 0 },
      acessorio1: { name: '', card: '', slots: 0 },
      acessorio2: { name: '', card: '', slots: 0 },
    }
  });

  // Fetch builds from server
  useEffect(() => {
    const fetchBuilds = async () => {
      try {
        const response = await fetch('/api/builds');
        if (response.ok) {
          const data = await response.json();
          setBuilds(data.builds || []);
          setBuildsLoaded(true);
          if (data.builds?.length > 0) {
            setSelectedBuildId(data.builds[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch builds:", error);
      }
    };
    fetchBuilds();
  }, []);

  // Save builds to server
  useEffect(() => {
    if (!buildsLoaded) return;
    const saveBuilds = async () => {
      try {
        await fetch('/api/builds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ builds })
        });
      } catch (error) {
        console.error("Failed to save builds:", error);
      }
    };
    const timer = setTimeout(saveBuilds, 500);
    return () => clearTimeout(timer);
  }, [builds, buildsLoaded]);

  const handleAddBuild = (e: React.FormEvent) => {
    e.preventDefault();
    const newBuild: ClassBuild = {
      ...buildForm as ClassBuild,
      id: Date.now().toString(),
      image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${buildForm.className}${buildForm.version}`
    };
    setBuilds(prev => [...prev, newBuild]);
    setSelectedBuildId(newBuild.id);
    setIsBuildAdminOpen(false);
  };

  const handleDeleteBuild = (id: string) => {
    setBuilds(prev => prev.filter(b => b.id !== id));
    if (selectedBuildId === id) {
      setSelectedBuildId(builds.find(b => b.id !== id)?.id || null);
    }
  };

  const selectedBuild = useMemo(() => builds.find(b => b.id === selectedBuildId), [builds, selectedBuildId]);

  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('leprechaun_logged_in') === 'true';
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('leprechaun_is_admin') === 'true';
  });
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Admin credentials: admin / admin123
    // Player credentials: player / 1234
    if (loginUser === 'admin' && loginPass === 'admin123') {
      setIsLoggedIn(true);
      setIsAdmin(true);
      localStorage.setItem('leprechaun_logged_in', 'true');
      localStorage.setItem('leprechaun_is_admin', 'true');
      setLoginError(false);
    } else if (loginUser === 'player' && loginPass === '1234') {
      setIsLoggedIn(true);
      setIsAdmin(false);
      localStorage.setItem('leprechaun_logged_in', 'true');
      localStorage.setItem('leprechaun_is_admin', 'false');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    localStorage.removeItem('leprechaun_logged_in');
    localStorage.removeItem('leprechaun_is_admin');
  };

  // Roster CRUD
  const addRosterMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rosterFormName || !rosterFormClass) return;
    const newMember: RosterMember = {
      id: Date.now().toString(),
      name: rosterFormName,
      className: rosterFormClass,
      confirmed: null
    };
    setRoster(prev => [...prev, newMember]);
    setRosterFormName('');
    setRosterFormClass('');
  };

  const deleteRosterMember = (id: string) => {
    setRoster(prev => prev.filter(m => m.id !== id));
  };

  const updateConfirmation = (id: string, status: boolean | null) => {
    setRoster(prev => prev.map(m => m.id === id ? { ...m, confirmed: status } : m));
  };

  // Scroll to top logic
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save custom events to localStorage
  useEffect(() => {
    localStorage.setItem('omega_custom_events', JSON.stringify(customEvents));
  }, [customEvents]);

  // Save notification settings to localStorage
  useEffect(() => {
    localStorage.setItem('omega_notif_enabled', JSON.stringify(notificationsEnabled));
    localStorage.setItem('omega_notif_settings', JSON.stringify(notificationSettings));
    localStorage.setItem('omega_sound_enabled', JSON.stringify(soundEnabled));
  }, [notificationsEnabled, notificationSettings, soundEnabled]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Process events to find upcoming ones
  const processedEvents = useMemo(() => {
    const allInstances: { event: ROEvent; time: string; minutes: number; diff: number; isCustom?: boolean }[] = [];
    const allEvents = [...RAGNAROK_EVENTS, ...customEvents];
    
    allEvents.forEach(event => {
      event.times.forEach(time => {
        const eventMinutes = timeToMinutes(time);
        let diff = eventMinutes - currentMinutes;
        
        // If event is tomorrow
        if (diff < -10) { // Allow 10 mins grace period to see past event
          diff += 1440;
        }
        
        allInstances.push({
          event,
          time,
          minutes: eventMinutes,
          diff,
          isCustom: customEvents.some(ce => ce.id === event.id)
        });
      });
    });

    return allInstances.sort((a, b) => a.diff - b.diff);
  }, [currentMinutes, customEvents]);

  // Check for alerts (2 minutes before)
  useEffect(() => {
    const newAlerts: string[] = [];
    const alertsToPlaySound: string[] = [];

    processedEvents.forEach(instance => {
      const alertId = `${instance.event.id}-${instance.time}`;
      
      const prizes = instance.event.prizes.join(' ').toLowerCase();
      const hasGalhos = prizes.includes('galho') || prizes.includes('sangrento') || prizes.includes('pandora');
      const hasArca = prizes.includes('arca ancestral') || prizes.includes('svartalfheim');

      // Check if this category or specific item is enabled for notifications
      const isCategoryEnabled = notificationSettings[instance.event.category] === true;
      const isGalhosEnabled = notificationSettings['Galhos'] === true && hasGalhos;
      const isArcaEnabled = notificationSettings['Arca'] === true && hasArca;
      const isStaffEnabled = notificationSettings['Staff'] === true && instance.isCustom;

      const shouldNotify = isCategoryEnabled || isGalhosEnabled || isArcaEnabled || isStaffEnabled;

      // Alert if exactly 2 minutes or 1 minute before, not dismissed, and enabled
      if (instance.diff <= 2 && instance.diff > 0 && !dismissedAlerts.has(alertId) && shouldNotify) {
        newAlerts.push(alertId);
        
        // If not already notified for this specific event instance, mark for sound
        if (!notifiedAlerts.has(alertId)) {
          alertsToPlaySound.push(alertId);
        }
      }
    });

    // Play sound if there are new alerts to notify
    if (alertsToPlaySound.length > 0 && soundEnabled && notificationsEnabled && isLoggedIn) {
      playNotificationSound();
      setNotifiedAlerts(prev => {
        const next = new Set(prev);
        alertsToPlaySound.forEach(id => next.add(id));
        return next;
      });
      console.log('ALERTA SONORO: Novos eventos detectados!');
    }
    
    // Update active alerts for visual display
    setActiveAlerts(newAlerts);

    // Cleanup notifiedAlerts for events that are now in the past
    if (currentTime.getSeconds() === 0) { // Clean up once a minute
      setNotifiedAlerts(prev => {
        const next = new Set(prev);
        let changed = false;
        prev.forEach(id => {
          const [eventId, time] = id.split('-');
          const eventInstance = processedEvents.find(pi => pi.event.id === eventId && pi.time === time);
          if (!eventInstance || eventInstance.diff <= 0) {
            next.delete(id);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [processedEvents, dismissedAlerts, soundEnabled, notificationSettings, notificationsEnabled, notifiedAlerts, currentTime]);

  const categories = ['All', 'MvP', 'PvP', 'Minigame', 'Special', 'Premiação: Galhos', 'Premiação: Arca'];

  const filteredEvents = processedEvents.filter(instance => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Premiação: Galhos') {
      const prizes = instance.event.prizes.join(' ').toLowerCase();
      return prizes.includes('galho') || prizes.includes('sangrento') || prizes.includes('pandora');
    }
    if (selectedCategory === 'Premiação: Arca') {
      const prizes = instance.event.prizes.join(' ').toLowerCase();
      return prizes.includes('arca ancestral') || prizes.includes('svartalfheim');
    }
    return instance.event.category === selectedCategory;
  });

  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => new Set(prev).add(id));
    setActiveAlerts(prev => prev.filter(a => a !== id));
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTime || !formTitle) return;

    const newEvent: ROEvent = {
      id: `custom-${Date.now()}`,
      name: formTitle,
      description: formDesc || 'Evento criado pela Staff.',
      prizes: formPrize ? formPrize.split(',').map(p => p.trim()) : ['Premiação a definir'],
      times: [formTime],
      category: formCategory
    };

    setCustomEvents(prev => [...prev, newEvent]);
    
    // Reset form
    setFormTime('');
    setFormTitle('');
    setFormPrize('');
    setFormDesc('');
    setIsStaffPanelOpen(false);
  };

  const handleDeleteEvent = (id: string) => {
    setCustomEvents(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-emerald-50 font-sans selection:bg-yellow-500/30">
      {/* Background Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Main Background GIF */}
        <img 
          src="https://i.pinimg.com/originals/7e/7a/8b/7e7a8bf3cfd1db0296073a856ae01776.gif" 
          alt="Background" 
          className="w-full h-full object-cover opacity-95"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-emerald-950/5" />
      </div>

      {/* Login Overlay */}
      <AnimatePresence>
        {!isLoggedIn && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full max-w-md bg-zinc-900/80 backdrop-blur-2xl border border-emerald-500/30 rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-yellow-500 rounded-full shadow-lg shadow-emerald-500/30">
                  <img 
                    src="https://images.habbo.com/web_images/habbo-web-articles/spromo_emeralds_rebrand2023.png" 
                    alt="Leprechaun Icon" 
                    className="w-12 h-12 object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              
              <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-emerald-400 to-yellow-400 bg-clip-text text-transparent">
                Leprechaun Village
              </h2>
              <p className="text-emerald-400/70 text-sm mb-8 font-medium">
                A sorte é só um detalhe, não o todo.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="text-left">
                  <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 ml-1">Usuário</label>
                  <input 
                    type="text" 
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    className="w-full bg-emerald-900/20 border border-emerald-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    placeholder="Seu usuário"
                  />
                </div>
                <div className="text-left">
                  <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 ml-1">Senha</label>
                  <input 
                    type="password" 
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="w-full bg-emerald-900/20 border border-emerald-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    placeholder="Sua senha"
                  />
                </div>

                {loginError && (
                  <motion.p 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-red-400 text-xs font-bold"
                  >
                    Usuário ou senha incorretos. Tente novamente!
                  </motion.p>
                )}

                <button 
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-yellow-500 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <Zap size={20} />
                  ENTRAR NA VILA
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Builds Section */}
      <AnimatePresence>
        {isBuildsOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[500] bg-zinc-950 flex flex-col overflow-hidden"
          >
            {/* Background for Builds */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <img 
                src="https://i.pinimg.com/originals/7e/7a/8b/7e7a8bf3cfd1db0296073a856ae01776.gif" 
                alt="Background" 
                className="w-full h-full object-cover grayscale"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-transparent to-zinc-950" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-6 border-b border-white/10 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsBuildsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-emerald-500"
                >
                  <X size={28} />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Seleção de Classe & Builds</h2>
                  <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em]">Leprechaun Knowledge Base</p>
                </div>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => setIsBuildAdminOpen(!isBuildAdminOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-yellow-500 hover:text-white transition-all"
                >
                  <Settings size={16} /> {isBuildAdminOpen ? 'FECHAR ADMIN' : 'CADASTRAR BUILD'}
                </button>
              )}
            </div>

            <div className="relative z-10 flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Sidebar: Class Selection */}
              <div className="w-full md:w-72 bg-zinc-900/30 border-r border-white/5 overflow-y-auto p-4 space-y-2">
                {['Paladin', 'Professor', 'Clown', 'High Wizard', 'Creator', 'Sniper', 'Stalker', 'Champion'].map(cls => {
                  const classBuilds = builds.filter(b => b.className === cls);
                  return (
                    <div key={cls} className="space-y-1">
                      <div className="px-3 py-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-1">
                        {cls}
                      </div>
                      {classBuilds.length > 0 ? (
                        classBuilds.map(b => (
                          <button
                            key={b.id}
                            onClick={() => setSelectedBuildId(b.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${selectedBuildId === b.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-400 hover:bg-white/5'}`}
                          >
                            <span className="font-bold text-sm">{b.version || 'Default'}</span>
                            <ChevronUp className={`rotate-90 transition-transform ${selectedBuildId === b.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} size={14} />
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-[10px] text-zinc-600 italic">Nenhuma build cadastrada</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Main Content: Build Details */}
              <div className="flex-1 overflow-y-auto p-6 md:p-12">
                <AnimatePresence mode="wait">
                  {isBuildAdminOpen ? (
                    <motion.div 
                      key="admin"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="max-w-4xl mx-auto bg-zinc-900/80 border border-emerald-500/20 rounded-3xl p-8 shadow-2xl"
                    >
                      <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                        <Plus className="text-emerald-500" /> Cadastrar Nova Build
                      </h3>
                      <form onSubmit={handleAddBuild} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Classe</label>
                            <select 
                              value={buildForm.className}
                              onChange={e => setBuildForm({...buildForm, className: e.target.value})}
                              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                            >
                              {['Paladin', 'Professor', 'Clown', 'High Wizard', 'Creator', 'Sniper', 'Stalker', 'Champion'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Versão (ex: Song, Banshee)</label>
                            <input 
                              type="text"
                              value={buildForm.version}
                              onChange={e => setBuildForm({...buildForm, version: e.target.value})}
                              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                              placeholder="Padrão"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {['str', 'agi', 'vit', 'int', 'dex', 'luk'].map(attr => (
                              <div key={attr}>
                                <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">{attr}</label>
                                <input 
                                  type="number"
                                  value={buildForm.attributes?.[attr as keyof BuildAttributes]}
                                  onChange={e => setBuildForm({
                                    ...buildForm, 
                                    attributes: { ...buildForm.attributes!, [attr]: parseInt(e.target.value) }
                                  })}
                                  className="w-full bg-zinc-950 border border-white/10 rounded-lg px-2 py-2 text-xs text-white"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Equipamentos & Cartas</label>
                          <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {['elmo', 'meio', 'baixo', 'arma', 'capa', 'armadura', 'escudo', 'acessorio1', 'acessorio2'].map(slot => (
                              <div key={slot} className="p-3 bg-zinc-950/50 border border-white/5 rounded-xl space-y-2">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{slot}</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <input 
                                    type="text"
                                    placeholder="Nome do Equipamento"
                                    value={buildForm.equipment?.[slot as keyof ClassBuild['equipment']].name}
                                    onChange={e => setBuildForm({
                                      ...buildForm,
                                      equipment: {
                                        ...buildForm.equipment!,
                                        [slot]: { ...buildForm.equipment![slot as keyof ClassBuild['equipment']], name: e.target.value }
                                      }
                                    })}
                                    className="w-full bg-zinc-900 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white"
                                  />
                                  <input 
                                    type="number"
                                    placeholder="Slots"
                                    min="0"
                                    max="4"
                                    value={buildForm.equipment?.[slot as keyof ClassBuild['equipment']].slots || 0}
                                    onChange={e => setBuildForm({
                                      ...buildForm,
                                      equipment: {
                                        ...buildForm.equipment!,
                                        [slot]: { ...buildForm.equipment![slot as keyof ClassBuild['equipment']], slots: parseInt(e.target.value) }
                                      }
                                    })}
                                    className="w-full bg-zinc-900 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white"
                                  />
                                </div>
                                <input 
                                  type="text"
                                  placeholder="Carta"
                                  value={buildForm.equipment?.[slot as keyof ClassBuild['equipment']].card}
                                  onChange={e => setBuildForm({
                                    ...buildForm,
                                    equipment: {
                                      ...buildForm.equipment!,
                                      [slot]: { ...buildForm.equipment![slot as keyof ClassBuild['equipment']], card: e.target.value }
                                    }
                                  })}
                                  className="w-full bg-zinc-900 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-emerald-400"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="md:col-span-2 pt-6">
                          <button 
                            type="submit"
                            className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 size={20} /> FINALIZAR CADASTRO
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  ) : selectedBuild ? (
                    <motion.div 
                      key={selectedBuild.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start"
                    >
                      {/* Left: Class Image & Attributes */}
                      <div className="lg:col-span-5 space-y-8">
                        <div className="relative group">
                          <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                          <img 
                            src={selectedBuild.image} 
                            alt={selectedBuild.className}
                            className="w-full aspect-square object-contain relative z-10 drop-shadow-[0_20px_50px_rgba(16,185,129,0.3)]"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-zinc-950 to-transparent text-center">
                            <h3 className="text-5xl font-black text-white tracking-tighter">{selectedBuild.className}</h3>
                            <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-xs mt-2">{selectedBuild.version || 'Build Padrão'}</p>
                          </div>
                        </div>

                        {/* Attributes Radar-like display */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                              <Activity size={14} /> Atributos Base
                            </h4>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Anti Freeze: 200 LUK</span>
                              <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">ASPD: 195</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            {Object.entries(selectedBuild.attributes).map(([key, val]) => (
                              <div key={key} className="flex items-center justify-between group">
                                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest group-hover:text-emerald-400 transition-colors">{key}</span>
                                <div className="flex items-center gap-3">
                                  <div className="h-1 w-24 bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.min(((val as number) / 99) * 100, 100)}%` }}
                                      className="h-full bg-emerald-500"
                                    />
                                  </div>
                                  <span className="text-sm font-black text-white w-8 text-right">{val}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Equipment Grid */}
                      <div className="lg:col-span-7 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                            <SwordIcon size={14} /> Configuração de Equipamentos
                          </h4>
                          {isAdmin && (
                            <button 
                              onClick={() => handleDeleteBuild(selectedBuild.id)}
                              className="text-red-500 hover:text-red-400 transition-colors p-2"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(selectedBuild.equipment).map(([slot, data]) => (
                            <motion.div 
                              key={slot}
                              whileHover={{ scale: 1.02 }}
                              className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4 group hover:border-emerald-500/30 transition-all"
                            >
                              <div className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center text-zinc-600 group-hover:text-emerald-500 transition-colors border border-white/5">
                                {slot.includes('acessorio') ? <Zap size={20} /> : 
                                 slot === 'arma' ? <SwordIcon size={20} /> :
                                 slot === 'escudo' ? <ShieldCheck size={20} /> :
                                 <Plus size={20} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{slot}</p>
                                  {(data as BuildEquipment).slots !== undefined && (data as BuildEquipment).slots! > 0 && (
                                    <div className="flex gap-0.5">
                                      {[...Array((data as BuildEquipment).slots)].map((_, i) => (
                                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 border border-emerald-500/60" />
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs font-bold text-white truncate">{(data as BuildEquipment).name || 'Vazio'}</p>
                                {(data as BuildEquipment).card && (
                                  <p className="text-[10px] font-bold text-emerald-500/80 truncate flex items-center gap-1">
                                    <Sparkles size={10} /> {(data as BuildEquipment).card}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {/* Class Intro (Placeholder text) */}
                        <div className="mt-8 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl italic text-emerald-400/60 text-sm leading-relaxed">
                          "O {selectedBuild.className} é essencial para a estratégia da WoE. Esta build de {selectedBuild.version || 'Padrão'} foca em maximizar a eficiência do clã durante os embates mais intensos."
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                      <div className="p-6 bg-zinc-900 rounded-full border border-white/5">
                        <Layout size={48} className="text-zinc-700" />
                      </div>
                      <h3 className="text-xl font-black text-zinc-500">Selecione uma classe para ver a build</h3>
                      <p className="text-sm text-zinc-600 max-w-xs">Escolha no menu à esquerda a classe e versão que deseja consultar.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isRosterOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRosterOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-full md:w-[450px] bg-emerald-950/95 backdrop-blur-2xl border-r border-emerald-500/30 z-[300] shadow-2xl flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="p-6 border-b border-emerald-500/20 flex items-center justify-between bg-emerald-900/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-xl border border-yellow-500/40">
                    <ShieldCheck className="text-yellow-500" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Plantel/Confirmação WoE</h2>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Leprechaun Village</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsRosterOpen(false)}
                  className="p-2 text-emerald-500 hover:text-white hover:bg-emerald-800/40 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* War Schedule Info */}
                <div className="bg-emerald-900/30 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-yellow-500" size={20} />
                    <div>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Próxima Guerra</p>
                      <p className="text-sm font-bold text-white">{woeSchedule.days.join(', ')} às {woeSchedule.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Status</p>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-black animate-pulse">EM BREVE</span>
                  </div>
                </div>

                {/* Roster Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                      <Users size={14} /> Integrantes ({roster.length})
                    </h3>
                    {isAdmin && (
                      <button 
                        onClick={() => setIsRosterAdminOpen(!isRosterAdminOpen)}
                        className="text-[10px] font-black text-yellow-500 uppercase tracking-widest hover:underline flex items-center gap-1"
                      >
                        <Settings size={12} /> {isRosterAdminOpen ? 'Fechar Admin' : 'Gerenciar'}
                      </button>
                    )}
                  </div>

                  {/* Admin CRUD Form */}
                  <AnimatePresence>
                    {isAdmin && isRosterAdminOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-emerald-900/40 border border-yellow-500/30 rounded-2xl p-4 mb-4 space-y-4">
                          <form onSubmit={addRosterMember} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <input 
                                type="text" 
                                placeholder="Nome"
                                value={rosterFormName}
                                onChange={(e) => setRosterFormName(e.target.value)}
                                className="bg-emerald-950/50 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                              />
                              <input 
                                type="text" 
                                placeholder="Classe"
                                value={rosterFormClass}
                                onChange={(e) => setRosterFormClass(e.target.value)}
                                className="bg-emerald-950/50 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                              />
                            </div>
                            <button 
                              type="submit"
                              className="w-full py-2 bg-emerald-500 text-white text-xs font-black rounded-lg hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
                            >
                              <Plus size={14} /> ADICIONAR AO PLANTEL
                            </button>
                          </form>

                          <div className="pt-3 border-t border-emerald-500/20">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Configurar Horário</p>
                            <div className="grid grid-cols-2 gap-3">
                              <input 
                                type="text" 
                                placeholder="Dias (ex: Seg, Qua)"
                                value={woeSchedule.days.join(', ')}
                                onChange={(e) => setWoeSchedule(prev => ({ ...prev, days: e.target.value.split(',').map(d => d.trim()) }))}
                                className="bg-emerald-950/50 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                              />
                              <input 
                                type="time" 
                                value={woeSchedule.time}
                                onChange={(e) => setWoeSchedule(prev => ({ ...prev, time: e.target.value }))}
                                className="bg-emerald-950/50 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="bg-emerald-900/20 border border-emerald-500/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-emerald-900/40 border-b border-emerald-500/20">
                        <tr>
                          <th className="px-4 py-3 font-black text-emerald-500 uppercase tracking-widest">Nome</th>
                          <th className="px-4 py-3 font-black text-emerald-500 uppercase tracking-widest">Classe</th>
                          <th className="px-4 py-3 font-black text-emerald-500 uppercase tracking-widest text-center">Confirmação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-500/10">
                        {roster.map(member => (
                          <tr key={member.id} className="group hover:bg-emerald-800/20 transition-colors">
                            <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                              {isAdmin && isRosterAdminOpen && (
                                <button 
                                  onClick={() => deleteRosterMember(member.id)}
                                  className="text-red-500 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                              {member.name}
                            </td>
                            <td className="px-4 py-3 text-emerald-300/80 font-medium italic">{member.className}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => updateConfirmation(member.id, true)}
                                  className={`p-1.5 rounded-lg transition-all ${member.confirmed === true ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-emerald-900/40 text-emerald-700 hover:text-emerald-400'}`}
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                                <button 
                                  onClick={() => updateConfirmation(member.id, false)}
                                  className={`p-1.5 rounded-lg transition-all ${member.confirmed === false ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-emerald-900/40 text-emerald-700 hover:text-red-400'}`}
                                >
                                  <XCircle size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {roster.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-emerald-700 font-bold italic">Nenhum integrante cadastrado.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="p-6 border-t border-emerald-500/20 bg-emerald-900/20">
                <div className="flex items-center justify-between text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  <span>Confirmados: {roster.filter(m => m.confirmed === true).length}</span>
                  <span>Ausentes: {roster.filter(m => m.confirmed === false).length}</span>
                  <span>Pendentes: {roster.filter(m => m.confirmed === null).length}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <header className="relative z-[150] bg-white/10 backdrop-blur-[2px] border-b border-white/20 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col items-center text-center md:flex-row md:text-left md:items-center gap-3">
            <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-yellow-500 rounded-full shadow-lg shadow-emerald-500/30">
              <img 
                src="https://images.habbo.com/web_images/habbo-web-articles/spromo_emeralds_rebrand2023.png" 
                alt="Leprechaun Icon" 
                className="w-10 h-10 object-contain animate-pulse"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-yellow-400 to-emerald-400 bg-clip-text text-transparent">
                Leprechaun Village
              </h1>
              <p className="text-xs text-emerald-400/70 font-mono flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="flex items-center gap-2">
                  <Coins size={12} className="text-yellow-500" />
                  SERVER TIME: {currentTime.toLocaleTimeString()}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 ${
                  notificationsEnabled && soundEnabled 
                  ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' 
                  : 'bg-red-500/20 text-red-400'
                }`}>
                  <Zap size={10} />
                  {notificationsEnabled && soundEnabled ? 'Notificações Ativas' : 'Alertas Desligados'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-end gap-3">
            <button 
              onClick={() => setIsBuildsOpen(true)}
              className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/30 shadow-lg shadow-emerald-500/10 flex items-center gap-2"
              title="Builds das Classes"
            >
              <BookOpen size={20} />
              <span className="hidden lg:inline text-xs font-black uppercase tracking-tighter">Builds</span>
            </button>

            <button 
              onClick={() => setIsRosterOpen(true)}
              className="p-2 rounded-lg bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500 hover:text-white transition-all border border-yellow-500/30 shadow-lg shadow-yellow-500/10 flex items-center gap-2"
              title="Plantel WoE"
            >
              <div className="relative">
                <ShieldCheck size={20} />
                <Check size={10} className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full text-white p-0.5" />
              </div>
              <span className="hidden lg:inline text-xs font-black uppercase tracking-tighter">Plantel</span>
            </button>

            <div className="relative">
              <button 
                onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
                className={`p-2 rounded-lg transition-colors ${isNotifMenuOpen ? 'bg-emerald-500 text-white' : 'bg-emerald-900/40 text-emerald-400 hover:text-white hover:bg-emerald-800/40'}`}
                title="Configurar Notificações"
              >
                <Bell size={20} />
              </button>
              
              <AnimatePresence>
                {isNotifMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifMenuOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-64 bg-emerald-950/80 backdrop-blur-2xl border border-emerald-500/30 rounded-2xl p-4 shadow-2xl z-[200]"
                    >
                      <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <Zap size={12} /> Notificar Categorias
                      </h3>
                      <div className="space-y-1">
                        {['MvP', 'PvP', 'Minigame', 'Special', 'Galhos', 'Arca', 'Staff'].map(cat => (
                          <label key={cat} className="flex items-center justify-between p-2 hover:bg-emerald-800/40 rounded-lg cursor-pointer transition-colors group">
                            <span className="text-sm font-bold text-emerald-100 group-hover:text-yellow-400">{cat === 'Staff' ? 'Eventos da Staff' : cat}</span>
                            <input 
                              type="checkbox" 
                              checked={notificationSettings[cat]}
                              onChange={() => setNotificationSettings(prev => ({ ...prev, [cat]: !prev[cat] }))}
                              className="w-4 h-4 rounded border-emerald-700 bg-emerald-900 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-emerald-950"
                            />
                          </label>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-emerald-500/20 space-y-2">
                        <button 
                          onClick={() => playNotificationSound()}
                          className="w-full flex items-center justify-between p-2 rounded-lg bg-emerald-900/40 text-emerald-400 hover:text-white transition-all"
                        >
                          <span className="text-[10px] font-black uppercase tracking-wider">Testar Som</span>
                          <Volume2 size={14} />
                        </button>
                        <button 
                          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg transition-all ${
                            notificationsEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-900/40 text-emerald-600'
                          }`}
                        >
                          <span className="text-xs font-black uppercase tracking-wider">Alertas Gerais</span>
                          {notificationsEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setIsStaffPanelOpen(true)}
              className="p-2 rounded-lg bg-emerald-900/40 text-emerald-400 hover:text-white hover:bg-emerald-800/40 transition-colors"
              title="Adicionar Evento Staff"
            >
              <Plus size={20} />
            </button>
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'bg-emerald-900/40 text-yellow-400' : 'bg-emerald-900/20 text-emerald-700'}`}
              title={soundEnabled ? "Som Ativado" : "Som Desativado"}
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            {isLoggedIn && (
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                title="Sair"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      </header>


      <main className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        {/* Magic Stone Decorative Section */}
        <div className="flex justify-center mb-6">
          <img 
            src="https://i.pinimg.com/originals/3f/05/d8/3f05d83924eef0ed0561fa2352a7b9d4.gif" 
            alt="Magic Stone" 
            className="w-32 h-32 object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Active Alerts Section moved to floating action center */}
        <div className="mb-8"></div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`relative px-4 py-1.5 rounded-full text-sm font-bold transition-all backdrop-blur-md border ${
                selectedCategory === cat 
                ? 'bg-gradient-to-r from-emerald-500 to-yellow-500 text-white shadow-md shadow-emerald-500/20 border-emerald-400' 
                : 'bg-emerald-950/70 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/80 hover:text-white'
              }`}
            >
              {selectedCategory === cat && <GlitterEffect />}
              <span className="relative z-10">{cat}</span>
            </button>
          ))}
        </div>

        {/* Event Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((instance, idx) => (
            <motion.div
              layout
              key={`${instance.event.id}-${instance.time}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`group relative bg-white/10 backdrop-blur-[2px] border border-white/20 rounded-2xl p-5 hover:border-yellow-500/40 hover:bg-white/20 transition-all overflow-hidden ${
                instance.diff <= 10 ? 'ring-2 ring-emerald-500/30' : ''
              }`}
            >
              {/* Shine effect on hover */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -inset-[100%] w-[200%] h-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -rotate-45 translate-x-[-150%] group-hover:animate-shine-once" />
              </div>

              {/* Gold top border on hover */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-yellow-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
              
              {/* Delete button for custom events */}
              {instance.isCustom && (
                <button 
                  onClick={() => handleDeleteEvent(instance.event.id)}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                >
                  <Trash2 size={12} />
                </button>
              )}

              {/* Category Badge */}
              <div className="absolute top-5 right-5">
                <div className={`p-[3px] bg-emerald-950/90 backdrop-blur-md rounded-full border border-emerald-500/40 shadow-xl flex items-center justify-center ${
                  (instance.event.category === 'Minigame' || instance.event.category === 'Special') ? 'animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.4)]' : ''
                }`}>
                  {instance.event.category === 'MvP' && <Sword className="w-4 h-4 text-red-500" />}
                  {instance.event.category === 'PvP' && <Trophy className="w-4 h-4 text-yellow-600" />}
                  {instance.event.category === 'Minigame' && <Gamepad2 className="w-4 h-4 text-blue-500" />}
                  {instance.event.category === 'Special' && <Sparkles className="w-4 h-4 text-emerald-500" />}
                </div>
              </div>

              <div className="mb-4 flex flex-col items-center text-center md:items-start md:text-left">
                <div className="flex flex-col items-center md:flex-row md:items-baseline md:gap-2 mb-1">
                  <span className="text-3xl font-black font-mono bg-gradient-to-br from-white to-emerald-400 bg-clip-text text-transparent tracking-tighter">
                    {instance.time}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase mt-1 md:mt-0 ${
                    instance.diff <= 10 ? 'bg-yellow-500 text-emerald-950' : 'bg-emerald-900/60 text-emerald-400'
                  }`}>
                    {instance.diff <= 0 ? 'AGORA' : `em ${Math.floor(instance.diff)}m`}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-emerald-50 group-hover:text-yellow-400 transition-colors flex items-center justify-center md:justify-start gap-2">
                  {instance.isCustom && (
                    <span className="p-1 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                      <Plus size={12} className="text-yellow-500" />
                    </span>
                  )}
                  {instance.event.name}
                </h2>
              </div>

              <p className="text-sm text-emerald-100/60 line-clamp-2 mb-4 leading-relaxed text-center md:text-left">
                {instance.event.description}
              </p>

              <div className="space-y-3 flex flex-col items-center md:items-start">
                <div className="flex flex-wrap justify-center md:justify-start gap-1.5">
                  {instance.event.prizes.slice(0, 3).map((prize, i) => (
                    <span key={i} className="text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-1 rounded-md border border-emerald-500/20">
                      {prize}
                    </span>
                  ))}
                  {instance.event.prizes.length > 3 && (
                    <span className="text-[10px] text-emerald-600 px-1 py-1">
                      +{instance.event.prizes.length - 3} mais
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-emerald-500/10 flex items-center justify-center md:justify-between">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black">
                  <span className="bg-gradient-to-r from-emerald-400 via-yellow-400 to-emerald-400 bg-clip-text text-transparent underline underline-offset-4 decoration-emerald-400/40 animate-shimmer">
                    {instance.event.category}
                  </span>
                  {instance.isCustom && <span className="text-yellow-600 font-black">• STAFF</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Staff Panel Modal */}
      <AnimatePresence>
        {isStaffPanelOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStaffPanelOpen(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-emerald-950/80 backdrop-blur-2xl border border-emerald-500/30 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <Plus className="text-yellow-500" /> Criar Evento Staff
                </h2>
                <button 
                  onClick={() => setIsStaffPanelOpen(false)}
                  className="p-2 text-emerald-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1.5">Título do Evento</label>
                  <input 
                    required
                    type="text" 
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ex: Invasão de Natal"
                    className="w-full bg-emerald-900/50 border border-emerald-500/20 rounded-xl px-4 py-3 text-white placeholder:text-emerald-800 focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1.5">Horário</label>
                    <input 
                      required
                      type="time" 
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full bg-emerald-900/50 border border-emerald-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1.5">Categoria</label>
                    <select 
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as ROEvent['category'])}
                      className="w-full bg-emerald-900/50 border border-emerald-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors appearance-none"
                    >
                      <option value="MvP">MvP</option>
                      <option value="PvP">PvP</option>
                      <option value="Minigame">Minigame</option>
                      <option value="Special">Special</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1.5">Premiação (separada por vírgula)</label>
                  <input 
                    type="text" 
                    value={formPrize}
                    onChange={(e) => setFormPrize(e.target.value)}
                    placeholder="Ex: 1x Galho Sangrento, 5x Moedas"
                    className="w-full bg-emerald-900/50 border border-emerald-500/20 rounded-xl px-4 py-3 text-white placeholder:text-emerald-800 focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1.5">Descrição</label>
                  <textarea 
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="O que os jogadores devem fazer?"
                    rows={3}
                    className="w-full bg-emerald-900/50 border border-emerald-500/20 rounded-xl px-4 py-3 text-white placeholder:text-emerald-800 focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-yellow-500 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  CRIAR EVENTO DA SORTE
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-emerald-500/30 mt-12 bg-emerald-950/70 backdrop-blur-md rounded-t-3xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-sm text-emerald-50/80 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-emerald-400 font-bold mb-3 uppercase tracking-wider text-xs">Sobre o App</h4>
            <p className="leading-relaxed max-w-xs md:max-w-none">Sincronizado com o horário do servidor. Alertas automáticos 2 minutos antes de cada evento para você não perder nenhum drop da sorte.</p>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-emerald-400 font-bold mb-3 uppercase tracking-wider text-xs">Legenda da Sorte</h4>
            <ul className="space-y-3">
              <li className="flex items-center justify-center md:justify-start gap-2">
                <Sword size={14} className="text-red-400" /> 
                <span className="text-red-400 font-bold underline underline-offset-4 decoration-red-400/30">MvP - Chefes de Mundo</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                <Trophy size={14} className="text-yellow-400" /> 
                <span className="text-yellow-400 font-bold underline underline-offset-4 decoration-yellow-400/30">PvP - Batalhas entre jogadores</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                <Gamepad2 size={14} className="text-blue-400" /> 
                <span className="text-blue-400 font-bold underline underline-offset-4 decoration-blue-400/30">Minigames - Diversão e sorte</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                <img 
                  src="https://images.habbo.com/web_images/habbo-web-articles/spromo_emeralds_rebrand2023.png" 
                  alt="Leprechaun Icon" 
                  className="w-4 h-4 object-contain"
                  referrerPolicy="no-referrer"
                /> 
                <span className="text-emerald-400 font-bold underline underline-offset-4 decoration-emerald-400/30">Leprechaun - Eventos Especiais</span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-emerald-400 font-bold mb-3 uppercase tracking-wider text-xs">Configurações</h4>
            <p className="leading-relaxed max-w-xs md:max-w-none">Ative as notificações do navegador para receber alertas mesmo com a aba em segundo plano. Que a sorte esteja com você!</p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-emerald-500/20 text-center text-xs text-emerald-400 font-medium space-y-2">
          <p>&copy; 2026 Ragnarok Event Tracker - Leprechaun Sorte Edition.</p>
          <p className="text-emerald-500/60 tracking-widest uppercase text-[10px]">Desenvolvido por <span className="text-emerald-400 font-black">Nolei creative</span></p>
        </div>
      </footer>

      {/* Floating Action Center */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="hidden md:flex fixed bottom-28 right-8 z-[100] flex-col gap-5 items-end pointer-events-none"
          >
            {/* Active Alerts (Toasts) */}
            <div className="flex flex-col gap-3 w-full max-w-[320px] pointer-events-auto">
              <AnimatePresence>
                {activeAlerts.map(alertId => {
                  const [eventId, time] = alertId.split('-');
                  const event = [...RAGNAROK_EVENTS, ...customEvents].find(e => e.id === eventId);
                  if (!event) return null;
                  return (
                    <motion.div 
                      key={alertId}
                      layout
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 50, opacity: 0 }}
                      className="bg-red-500/90 backdrop-blur-md border border-red-400 p-4 rounded-xl flex items-center justify-between gap-4 shadow-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-full flex items-center justify-center animate-pulse shrink-0">
                          <Zap size={16} className="text-red-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-[10px] text-white uppercase tracking-wider">
                            ALERTA DE EVENTO!
                          </h3>
                          <p className="text-xs text-white font-bold truncate">
                            {event.name} às {time}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => dismissAlert(alertId)}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors shrink-0"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Control Buttons */}
            <div className="flex flex-col gap-5 pointer-events-auto">
              {/* Notification Settings */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
                  className={`p-4 rounded-full shadow-2xl transition-all ${isNotifMenuOpen ? 'bg-emerald-500 text-white' : 'bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white'}`}
                  title="Configurar Notificações"
                >
                  <Bell size={24} />
                </button>
                
                <AnimatePresence>
                  {isNotifMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsNotifMenuOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full right-0 mb-4 w-64 bg-emerald-950/90 backdrop-blur-2xl border border-emerald-500/30 rounded-2xl p-4 shadow-2xl z-[200]"
                      >
                        <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                          <Zap size={12} /> Notificar Categorias
                        </h3>
                        <div className="space-y-1">
                          {['MvP', 'PvP', 'Minigame', 'Special', 'Galhos', 'Arca', 'Staff'].map(cat => (
                            <label key={cat} className="flex items-center justify-between p-2 hover:bg-emerald-800/40 rounded-lg cursor-pointer transition-colors group">
                              <span className="text-sm font-bold text-emerald-100 group-hover:text-yellow-400">{cat === 'Staff' ? 'Eventos da Staff' : cat}</span>
                              <input 
                                type="checkbox" 
                                checked={notificationSettings[cat]}
                                onChange={() => setNotificationSettings(prev => ({ ...prev, [cat]: !prev[cat] }))}
                                className="w-4 h-4 rounded border-emerald-700 bg-emerald-900 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-emerald-950"
                              />
                            </label>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-emerald-500/20 space-y-2">
                          <button 
                            onClick={() => playNotificationSound()}
                            className="w-full flex items-center justify-between p-2 rounded-lg bg-emerald-900/40 text-emerald-400 hover:text-white transition-all"
                          >
                            <span className="text-[10px] font-black uppercase tracking-wider">Testar Som</span>
                            <Volume2 size={14} />
                          </button>
                          <button 
                            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg transition-all ${
                              notificationsEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-900/40 text-emerald-600'
                            }`}
                          >
                            <span className="text-xs font-black uppercase tracking-wider">Alertas Gerais</span>
                            {notificationsEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Staff Button */}
              <button 
                onClick={() => setIsStaffPanelOpen(true)}
                className="p-4 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white shadow-2xl transition-all"
                title="Adicionar Evento Staff"
              >
                <Plus size={24} />
              </button>

              {/* Sound Toggle */}
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-4 rounded-full shadow-2xl transition-all ${soundEnabled ? 'bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 text-yellow-400 hover:bg-emerald-500 hover:text-white' : 'bg-emerald-900/20 text-emerald-700 hover:bg-emerald-500 hover:text-white'}`}
                title={soundEnabled ? "Som Ativado" : "Som Desativado"}
              >
                {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-[100] p-4 bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 text-emerald-400 rounded-full shadow-2xl hover:bg-emerald-500 hover:text-white transition-all group"
            title="Voltar ao Topo"
          >
            <ChevronUp size={24} className="group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
}
