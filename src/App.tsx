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
  Zap
} from 'lucide-react';
import { RAGNAROK_EVENTS, ROEvent } from './constants';

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

// Helper to play a notification sound (Bell-like)
const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Create a "ding" sound with harmonics for a bell-like effect
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); 
    oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.5); 

    const oscillator2 = audioContext.createOscillator();
    oscillator2.connect(gainNode);
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(1760, audioContext.currentTime); 
    oscillator2.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.5); 

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

    oscillator.start();
    oscillator2.start();
    oscillator.stop(audioContext.currentTime + 0.5);
    oscillator2.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.warn('Não foi possível tocar o som de notificação:', e);
  }
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
      }
    });

    if (newAlerts.length > activeAlerts.length && soundEnabled && notificationsEnabled) {
      playNotificationSound();
      console.log('ALERTA: Evento em 2 minutos!');
    }
    
    setActiveAlerts(newAlerts);
  }, [processedEvents, dismissedAlerts, soundEnabled, notificationSettings, notificationsEnabled]);

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
      {/* Leprechaun Background GIF */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <img 
          src="https://i.pinimg.com/originals/12/a9/b5/12a9b50719fbdef8ae7a18f9bb883963.gif" 
          alt="Background" 
          className="w-full h-full object-cover opacity-95"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-emerald-950/5" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-emerald-950/5 backdrop-blur-[1px] border-b border-emerald-500/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-gradient-to-br from-emerald-500 to-yellow-500 rounded-lg shadow-lg shadow-emerald-500/20">
              <img 
                src="https://images.habbo.com/web_images/habbo-web-articles/spromo_emeralds_rebrand2023.png" 
                alt="Leprechaun Icon" 
                className="w-10 h-10 object-contain animate-pulse"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-yellow-400 to-emerald-400 bg-clip-text text-transparent">
                Notify Events OmegaRO - Leprechaun Edition
              </h1>
              <p className="text-xs text-emerald-400/70 font-mono flex items-center gap-2">
                <Coins size={12} className="text-yellow-500" />
                SERVER TIME: {currentTime.toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
                      className="absolute right-0 mt-2 w-64 bg-emerald-950/80 backdrop-blur-2xl border border-emerald-500/30 rounded-2xl p-4 shadow-2xl z-50"
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
          </div>
        </div>
      </header>


      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Active Alerts Section */}
        <AnimatePresence>
          {activeAlerts.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="space-y-3">
                {activeAlerts.map(alertId => {
                  const [eventId, time] = alertId.split('-');
                  const event = [...RAGNAROK_EVENTS, ...customEvents].find(e => e.id === eventId);
                  if (!event) return null;
                  return (
                    <motion.div 
                      key={alertId}
                      layout
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="bg-yellow-500/5 backdrop-blur-[1px] border border-yellow-500/10 p-4 rounded-xl flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center animate-bounce">
                          <Coins className="text-emerald-950" />
                        </div>
                        <div>
                          <h3 className="font-bold text-yellow-500 flex items-center gap-2">
                            SORTE GRANDE! EVENTO COMEÇANDO! <Sparkles size={14} />
                          </h3>
                          <p className="text-sm text-emerald-50">
                            <span className="font-semibold text-white">{event.name}</span> às {time} (em menos de 2 min)
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => dismissAlert(alertId)}
                        className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 rounded-lg text-sm font-medium transition-colors"
                      >
                        Entendi
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all backdrop-blur-[1px] ${
                selectedCategory === cat 
                ? 'bg-gradient-to-r from-emerald-500 to-yellow-500 text-white shadow-md shadow-emerald-500/20' 
                : 'bg-emerald-950/5 text-emerald-400 border border-emerald-500/5 hover:bg-emerald-900/10 hover:text-white'
              }`}
            >
              {cat}
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
              className={`group relative bg-emerald-950/5 backdrop-blur-[1px] border border-emerald-500/5 rounded-2xl p-5 hover:border-yellow-500/20 hover:bg-emerald-900/10 transition-all ${
                instance.diff <= 10 ? 'ring-2 ring-emerald-500/10' : ''
              }`}
            >
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
                {instance.event.category === 'MvP' && <Sword className="w-4 h-4 text-red-500" />}
                {instance.event.category === 'PvP' && <Trophy className="w-4 h-4 text-yellow-600" />}
                {instance.event.category === 'Minigame' && <Gamepad2 className="w-4 h-4 text-blue-500" />}
                {instance.event.category === 'Special' && <Sparkles className="w-4 h-4 text-emerald-500" />}
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-black font-mono bg-gradient-to-br from-white to-emerald-400 bg-clip-text text-transparent tracking-tighter">
                    {instance.time}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                    instance.diff <= 10 ? 'bg-yellow-500 text-emerald-950' : 'bg-emerald-900/60 text-emerald-400'
                  }`}>
                    {instance.diff <= 0 ? 'AGORA' : `em ${Math.floor(instance.diff)}m`}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-emerald-50 group-hover:text-yellow-400 transition-colors flex items-center gap-2">
                  {instance.isCustom && <Plus size={14} className="text-yellow-500" />}
                  {instance.event.name}
                </h2>
              </div>

              <p className="text-sm text-emerald-100/60 line-clamp-2 mb-4 leading-relaxed">
                {instance.event.description}
              </p>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
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

              <div className="mt-6 pt-4 border-t border-emerald-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-emerald-700">
                  <span>{instance.event.category}</span>
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
      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-emerald-500/5 mt-12 bg-emerald-950/5 backdrop-blur-[1px] rounded-t-3xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-emerald-100/30">
          <div>
            <h4 className="text-emerald-400 font-bold mb-3 uppercase tracking-wider text-xs">Sobre o App</h4>
            <p>Sincronizado com o horário do servidor. Alertas automáticos 2 minutos antes de cada evento para você não perder nenhum drop da sorte.</p>
          </div>
          <div>
            <h4 className="text-emerald-400 font-bold mb-3 uppercase tracking-wider text-xs">Legenda da Sorte</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><Sword size={14} className="text-red-400" /> MvP - Chefes de Mundo</li>
              <li className="flex items-center gap-2"><Trophy size={14} className="text-yellow-400" /> PvP - Batalhas entre jogadores</li>
              <li className="flex items-center gap-2"><Gamepad2 size={14} className="text-blue-400" /> Minigames - Diversão e sorte</li>
              <li className="flex items-center gap-2">
                <img 
                  src="https://images.habbo.com/web_images/habbo-web-articles/spromo_emeralds_rebrand2023.png" 
                  alt="Leprechaun Icon" 
                  className="w-4 h-4 object-contain"
                  referrerPolicy="no-referrer"
                /> 
                Leprechaun - Eventos Especiais
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-emerald-400 font-bold mb-3 uppercase tracking-wider text-xs">Configurações</h4>
            <p>Ative as notificações do navegador para receber alertas mesmo com a aba em segundo plano. Que a sorte esteja com você!</p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-emerald-500/10 text-center text-xs text-emerald-700">
          &copy; 2026 Ragnarok Event Tracker - Leprechaun Sorte Edition.
        </div>
      </footer>

    </div>
  );
}
