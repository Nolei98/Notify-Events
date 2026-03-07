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
  X
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

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<Record<string, boolean>>({
    MvP: true,
    PvP: true,
    Minigame: true,
    Special: true
  });
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
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
      
      // Check if this category is enabled for notifications
      const isCategoryEnabled = notificationSettings[instance.event.category] !== false;

      // Alert if exactly 2 minutes or 1 minute before, not dismissed, and category enabled
      if (instance.diff <= 2 && instance.diff > 0 && !dismissedAlerts.has(alertId) && isCategoryEnabled) {
        newAlerts.push(alertId);
      }
    });

    if (newAlerts.length > activeAlerts.length && soundEnabled && notificationsEnabled) {
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
    <div className="min-h-screen bg-[#0c0c0e] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0c0c0e]/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 via-yellow-500 to-purple-500 rounded-lg shadow-lg shadow-purple-500/20">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Notify Events OmegaRO - By: Nolei
              </h1>
              <p className="text-xs text-zinc-500 font-mono">SERVER TIME: {currentTime.toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
                className={`p-2 rounded-lg transition-colors ${isNotifMenuOpen ? 'bg-pink-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
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
                      className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl z-50"
                    >
                      <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 px-1">Notificar Categorias</h3>
                      <div className="space-y-1">
                        {['MvP', 'PvP', 'Minigame', 'Special'].map(cat => (
                          <label key={cat} className="flex items-center justify-between p-2 hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors group">
                            <span className="text-sm font-bold text-zinc-300 group-hover:text-white">{cat}</span>
                            <input 
                              type="checkbox" 
                              checked={notificationSettings[cat]}
                              onChange={() => setNotificationSettings(prev => ({ ...prev, [cat]: !prev[cat] }))}
                              className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-pink-500 focus:ring-pink-500 focus:ring-offset-zinc-900"
                            />
                          </label>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-zinc-800">
                        <button 
                          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg transition-all ${
                            notificationsEnabled ? 'bg-pink-500/10 text-pink-400' : 'bg-zinc-800 text-zinc-500'
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
              className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Adicionar Evento Staff"
            >
              <Plus size={20} />
            </button>
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'bg-zinc-800 text-pink-400' : 'bg-zinc-800/50 text-zinc-500'}`}
              title={soundEnabled ? "Som Ativado" : "Som Desativado"}
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button 
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                notificationsEnabled 
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20' 
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
              <span className="text-sm">{notificationsEnabled ? 'Alertas ON' : 'Alertas OFF'}</span>
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
                  const event = RAGNAROK_EVENTS.find(e => e.id === eventId);
                  if (!event) return null;
                  return (
                    <motion.div 
                      key={alertId}
                      layout
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                          <AlertCircle className="text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-red-400">EVENTO COMEÇANDO!</h3>
                          <p className="text-sm text-zinc-300">
                            <span className="font-semibold text-white">{event.name}</span> às {time} (em menos de 2 min)
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => dismissAlert(alertId)}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
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
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                selectedCategory === cat 
                ? 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-white shadow-md' 
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
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
              className={`group relative bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:border-pink-500/50 transition-all ${
                instance.diff <= 10 ? 'ring-2 ring-gradient-to-r from-pink-500 to-purple-500' : ''
              }`}
            >
              {/* Rainbow top border on hover */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
              
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
                {instance.event.category === 'MvP' && <Sword className="w-4 h-4 text-red-400" />}
                {instance.event.category === 'PvP' && <Trophy className="w-4 h-4 text-amber-400" />}
                {instance.event.category === 'Minigame' && <Gamepad2 className="w-4 h-4 text-blue-400" />}
                {instance.event.category === 'Special' && <Sparkles className="w-4 h-4 text-purple-400" />}
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-black font-mono bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent tracking-tighter">
                    {instance.time}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                    instance.diff <= 10 ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {instance.diff <= 0 ? 'AGORA' : `em ${Math.floor(instance.diff)}m`}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-zinc-100 group-hover:text-pink-400 transition-colors">
                  {instance.event.name}
                </h2>
              </div>

              <p className="text-sm text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                {instance.event.description}
              </p>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {instance.event.prizes.slice(0, 3).map((prize, i) => (
                    <span key={i} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md border border-zinc-700/50">
                      {prize}
                    </span>
                  ))}
                  {instance.event.prizes.length > 3 && (
                    <span className="text-[10px] text-zinc-500 px-1 py-1">
                      +{instance.event.prizes.length - 3} mais
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-zinc-600">
                  <span>{instance.event.category}</span>
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
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white">Adicionar Evento</h2>
                <button 
                  onClick={() => setIsStaffPanelOpen(false)}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Título do Evento</label>
                  <input 
                    required
                    type="text" 
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ex: Invasão de Natal"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Horário</label>
                    <input 
                      required
                      type="time" 
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Categoria</label>
                    <select 
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as ROEvent['category'])}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors appearance-none"
                    >
                      <option value="MvP">MvP</option>
                      <option value="PvP">PvP</option>
                      <option value="Minigame">Minigame</option>
                      <option value="Special">Special</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Premiação (separada por vírgula)</label>
                  <input 
                    type="text" 
                    value={formPrize}
                    onChange={(e) => setFormPrize(e.target.value)}
                    placeholder="Ex: 1x Galho Sangrento, 5x Moedas"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Descrição</label>
                  <textarea 
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="O que os jogadores devem fazer?"
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black rounded-xl shadow-lg shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  CRIAR EVENTO
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-zinc-800/50 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-zinc-500">
          <div>
            <h4 className="text-zinc-300 font-bold mb-3 uppercase tracking-wider text-xs">Sobre o App</h4>
            <p>Sincronizado com o horário do servidor. Alertas automáticos 2 minutos antes de cada evento para você não perder nenhum drop.</p>
          </div>
          <div>
            <h4 className="text-zinc-300 font-bold mb-3 uppercase tracking-wider text-xs">Legenda</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><Sword size={14} className="text-red-400" /> MvP - Chefes de Mundo</li>
              <li className="flex items-center gap-2"><Trophy size={14} className="text-amber-400" /> PvP - Batalhas entre jogadores</li>
              <li className="flex items-center gap-2"><Gamepad2 size={14} className="text-blue-400" /> Minigames - Diversão e sorte</li>
            </ul>
          </div>
          <div>
            <h4 className="text-zinc-300 font-bold mb-3 uppercase tracking-wider text-xs">Configurações</h4>
            <p>Ative as notificações do navegador para receber alertas mesmo com a aba em segundo plano.</p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-zinc-800/30 text-center text-xs text-zinc-600">
          &copy; 2026 Ragnarok Event Tracker. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
