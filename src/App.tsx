// App principal do Roster da Guilda - v1.0.1
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
  Activity,
  Footprints,
  FileText,
  Search,
  Download,
  Filter,
  Edit
} from 'lucide-react';
import { RAGNAROK_EVENTS, ROEvent } from './constants';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import ErrorBoundary from './components/ErrorBoundary';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

export interface BuildEquipment {
  name: string;
  cards: string[];
  cardDescriptions?: string[];
  slots?: number;
  image?: string;
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
  description?: string;
  attributes: BuildAttributes;
  equipment: {
    elmo: BuildEquipment;
    meio: BuildEquipment;
    baixo: BuildEquipment;
    arma: BuildEquipment;
    capa: BuildEquipment;
    armadura: BuildEquipment;
    escudo: BuildEquipment;
    bota: BuildEquipment;
    acessorio1: BuildEquipment;
    acessorio2: BuildEquipment;
  };
}

export interface RosterMember {
  id: string;
  name: string;
  className: string;
  version?: string;
  confirmed: boolean | null;
}

export interface WoESchedule {
  days: string[];
  startTime: string;
  endTime: string;
}

interface User {
  id: string;
  username: string;
  role: 'admin' | 'player';
  approved: boolean;
}

export interface UtilityPost {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  createdAt: string;
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
  const [customEvents, setCustomEvents] = useState<ROEvent[]>([]);
  
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
  const [woeSchedule, setWoeSchedule] = useState<WoESchedule>({ days: ['Terça', 'Quinta', 'Sábado'], startTime: '20:00', endTime: '21:00' });
  const [classTypes, setClassTypes] = useState<string[]>(['Paladin', 'Professor', 'Clown', 'High Wizard', 'Creator', 'Sniper', 'Stalker', 'Champion']);

  // Users State
  const [users, setUsers] = useState<User[]>([]);

  // Utilities State
  const [utilities, setUtilities] = useState<UtilityPost[]>([]);

  const [utilityCategories, setUtilityCategories] = useState<string[]>(['Geral', 'Guias', 'Dicas', 'Anúncios', 'Outros']);
  const [playerAllowedCategory, setPlayerAllowedCategory] = useState<string>('');

  // Firebase Auth State
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            // Create profile if it doesn't exist
            const newProfile = {
              username: user.displayName || user.email?.split('@')[0] || 'User',
              role: user.email === 'noleirodrigues@gmail.com' ? 'admin' : 'player',
              approved: user.email === 'noleirodrigues@gmail.com'
            };
            await setDoc(doc(db, 'users', user.uid), newProfile);
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUserProfile(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Listeners
  useEffect(() => {
    if (!isAuthReady || !currentUser) return;

    const unsubRoster = onSnapshot(collection(db, 'roster'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RosterMember));
      setRoster(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'roster'));

    const unsubWoe = onSnapshot(doc(db, 'settings', 'woe'), (snapshot) => {
      if (snapshot.exists()) {
        setWoeSchedule(snapshot.data() as WoESchedule);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/woe'));

    const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ROEvent));
      setCustomEvents(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'events'));

    const unsubUtilities = onSnapshot(collection(db, 'utilities'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UtilityPost));
      setUtilities(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'utilities'));

    const unsubBuilds = onSnapshot(collection(db, 'builds'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassBuild));
      setBuilds(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'builds'));

    let unsubUsers = () => {};
    if (userProfile?.role === 'admin') {
      unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(data);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));
    }

    return () => {
      unsubRoster();
      unsubWoe();
      unsubEvents();
      unsubUtilities();
      unsubBuilds();
      unsubUsers();
    };
  }, [isAuthReady, currentUser, userProfile]);

  // Derived Login State
  const isLoggedIn = !!currentUser;
  const isAdmin = userProfile?.role === 'admin';
  const [loginUserInput, setLoginUserInput] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'player' as 'admin' | 'player' });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUserInput || !loginPass) return;
    
    setIsLoggingIn(true);
    try {
      // For seamless transition, we use username@guild.com as email
      const email = loginUserInput.includes('@') ? loginUserInput : `${loginUserInput}@guild.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, loginPass);
      const user = userCredential.user;
      
      const newProfile = {
        username: loginUserInput,
        role: 'player',
        approved: false
      };
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setUserProfile(newProfile);
    } catch (error: any) {
      console.error("Register error:", error);
      setLoginError(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(false);

    try {
      const email = loginUserInput.includes('@') ? loginUserInput : `${loginUserInput}@guild.com`;
      await signInWithEmailAndPassword(auth, email, loginPass);
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Admin Form for Roster
  const [isRosterAdminOpen, setIsRosterAdminOpen] = useState(false);
  const [rosterFormName, setRosterFormName] = useState('');
  const [rosterFormClass, setRosterFormClass] = useState('');
  const [rosterFormVersion, setRosterFormVersion] = useState('');

  // Builds State
  const [isBuildsOpen, setIsBuildsOpen] = useState(false);
  const [builds, setBuilds] = useState<ClassBuild[]>([]);
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null);
  const [isBuildAdminOpen, setIsBuildAdminOpen] = useState(false);

  // Build Form State
  const [buildForm, setBuildForm] = useState<Partial<ClassBuild>>({
    className: 'Paladin',
    version: '',
    image: '',
    description: '',
    attributes: { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 },
    equipment: {
      elmo: { name: '', cards: [], cardDescriptions: [], slots: 0, image: '' },
      meio: { name: '', cards: [], cardDescriptions: [], slots: 0, image: '' },
      baixo: { name: '', cards: [], cardDescriptions: [], slots: 0, image: '' },
      arma: { name: '', cards: [], cardDescriptions: [], slots: 0, image: '' },
      capa: { name: '', cards: [], cardDescriptions: [], slots: 0, image: '' },
      armadura: { name: '', cards: [], cardDescriptions: [], slots: 0, image: '' },
      escudo: { name: '', cards: [], cardDescriptions: [], slots: 0, image: '' },
      bota: { name: '', cards: [], cardDescriptions: [], slots: 0, image: '' },
      acessorio1: { name: '', cards: [], cardDescriptions: [], slots: 0, image: '' },
      acessorio2: { name: '', cards: [], cardDescriptions: [], slots: 0, image: '' },
    }
  });

  const handleAddBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newBuild: Partial<ClassBuild> = {
        ...buildForm,
        image: buildForm.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${buildForm.className}${buildForm.version}`
      };
      await addDoc(collection(db, 'builds'), newBuild);
      setIsBuildAdminOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'builds');
    }
  };

  const handleDeleteBuild = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'builds', id));
      if (selectedBuildId === id) {
        setSelectedBuildId(builds.find(b => b.id !== id)?.id || null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `builds/${id}`);
    }
  };

  const selectedBuild = useMemo(() => builds.find(b => b.id === selectedBuildId), [builds, selectedBuildId]);

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingClass, setEditingClass] = useState('');
  const [editingVersion, setEditingVersion] = useState('');
  const [adminTab, setAdminTab] = useState<'roster' | 'users'>('roster');

  const [isUtilitiesOpen, setIsUtilitiesOpen] = useState(false);
  const [utilitySearch, setUtilitySearch] = useState('');
  const [utilityCategory, setUtilityCategory] = useState('Todos');
  const [isUtilityAdminOpen, setIsUtilityAdminOpen] = useState(false);
  const [isCategoryAdminOpen, setIsCategoryAdminOpen] = useState(false);
  const [editingUtilityId, setEditingUtilityId] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [utilityForm, setUtilityForm] = useState({ title: '', content: '', category: '' });
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (!utilityForm.category && utilityCategories.length > 0) {
      setUtilityForm(prev => ({ ...prev, category: isAdmin ? utilityCategories[0] : playerAllowedCategory }));
    }
  }, [utilityCategories, isAdmin, playerAllowedCategory]);

  const allCategories = useMemo(() => ['Todos', ...utilityCategories], [utilityCategories]);

  const addCategory = () => {
    if (newCategoryName && !utilityCategories.includes(newCategoryName)) {
      setUtilityCategories([...utilityCategories, newCategoryName]);
      setNewCategoryName('');
    }
  };

  const deleteCategory = (cat: string) => {
    setUtilityCategories(utilityCategories.filter(c => c !== cat));
    if (playerAllowedCategory === cat) setPlayerAllowedCategory('');
  };

  const exportUtilitiesToExcel = () => {
    const headers = ['ID', 'Título', 'Categoria', 'Autor', 'Data', 'Conteúdo'];
    const rows = utilities.map(p => [
      p.id,
      p.title,
      p.category,
      p.author,
      new Date(p.createdAt).toLocaleString(),
      p.content.replace(/,/g, ';').replace(/\n/g, ' ') // Simple CSV escape
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'utilities_leprechaun.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUtilities = useMemo(() => {
    return utilities
      .filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(utilitySearch.toLowerCase()) || 
                             p.content.toLowerCase().includes(utilitySearch.toLowerCase());
        const matchesCategory = utilityCategory === 'Todos' || p.category === utilityCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [utilities, utilitySearch, utilityCategory]);

  const addUtilityPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utilityForm.title || !utilityForm.content) return;
    
    try {
      if (editingUtilityId) {
        await updateDoc(doc(db, 'utilities', editingUtilityId), {
          title: utilityForm.title,
          content: utilityForm.content,
          category: utilityForm.category
        });
        setEditingUtilityId(null);
      } else {
        const newPost = {
          title: utilityForm.title,
          content: utilityForm.content,
          category: utilityForm.category,
          author: userProfile?.username || 'Admin',
          createdAt: new Date().toISOString()
        };
        await addDoc(collection(db, 'utilities'), newPost);
      }
      
      setUtilityForm({ title: '', content: '', category: isAdmin ? utilityCategories[0] : playerAllowedCategory });
      setIsUtilityAdminOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'utilities');
    }
  };

  const deleteUtilityPost = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'utilities', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `utilities/${id}`);
    }
  };

  // Roster CRUD
  const addRosterMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rosterFormClass) return;
    try {
      const newMember = {
        name: rosterFormName.trim() || '',
        className: rosterFormClass,
        version: rosterFormVersion.trim() || 'Default',
        confirmed: null
      };
      await addDoc(collection(db, 'roster'), newMember);
      setRosterFormName('');
      setRosterFormClass('');
      setRosterFormVersion('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'roster');
    }
  };

  const deleteRosterMember = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'roster', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `roster/${id}`);
    }
  };

  const updateRosterMemberName = async (id: string, newName: string) => {
    try {
      await updateDoc(doc(db, 'roster', id), { name: newName });
      setEditingMemberId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `roster/${id}`);
    }
  };

  const updateRosterMemberClass = async (id: string, newClass: string, newVersion: string) => {
    try {
      await updateDoc(doc(db, 'roster', id), { className: newClass, version: newVersion });
      setEditingMemberId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `roster/${id}`);
    }
  };

  const updateConfirmation = async (id: string, status: boolean | null) => {
    try {
      const member = roster.find(m => m.id === id);
      if (member) {
        await updateDoc(doc(db, 'roster', id), { 
          confirmed: member.confirmed === status ? null : status 
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `roster/${id}`);
    }
  };

  // Next War Logic
  const nextWarInfo = useMemo(() => {
    if (!woeSchedule.days.length) return null;
    
    const dayMap: Record<string, number> = {
      'dom': 0, 'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sáb': 6, 'sab': 6,
      'domingo': 0, 'segunda': 1, 'terça': 2, 'quarta': 3, 'quinta': 4, 'sexta': 5, 'sábado': 6
    };

    const now = new Date();
    const currentDay = now.getDay();
    
    const scheduledDayIndices = woeSchedule.days
      .map(d => dayMap[d.toLowerCase().substring(0, 3)] ?? dayMap[d.toLowerCase()])
      .filter(d => d !== undefined)
      .sort((a, b) => a - b);

    if (!scheduledDayIndices.length) return null;

    // Find the next day index
    let nextDayIndex = scheduledDayIndices.find(d => d >= currentDay);
    let daysUntil = 0;

    if (nextDayIndex === undefined) {
      nextDayIndex = scheduledDayIndices[0];
      daysUntil = (7 - currentDay) + nextDayIndex;
    } else {
      daysUntil = nextDayIndex - currentDay;
    }

    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + daysUntil);
    
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return {
      date: nextDate.toLocaleDateString('pt-BR'),
      dayName: dayNames[nextDayIndex]
    };
  }, [woeSchedule.days]);

  // Available classes from builds
  const availableClasses = useMemo(() => {
    const classes = new Set([...classTypes, ...builds.map(b => b.className)]);
    return Array.from(classes).sort();
  }, [builds, classTypes]);

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

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTime || !formTitle) return;

    try {
      const newEvent = {
        name: formTitle,
        description: formDesc || 'Evento criado pela Staff.',
        prizes: formPrize ? formPrize.split(',').map(p => p.trim()) : ['Premiação a definir'],
        times: [formTime],
        category: formCategory
      };

      await addDoc(collection(db, 'events'), newEvent);
      
      // Reset form
      setFormTime('');
      setFormTitle('');
      setFormPrize('');
      setFormDesc('');
      setIsStaffPanelOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'events');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `events/${id}`);
    }
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

              <form onSubmit={showRegister ? handleRegister : handleLogin} className="space-y-4">
                <div className="text-left">
                  <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 ml-1">Usuário</label>
                  <input 
                    type="text" 
                    value={loginUserInput}
                    onChange={(e) => setLoginUserInput(e.target.value)}
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

                {loginError && !showRegister && (
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
                  disabled={isLoggingIn}
                  className={`w-full py-4 bg-gradient-to-r from-emerald-500 to-yellow-500 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 ${isLoggingIn ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {isLoggingIn ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Zap size={20} />
                  )}
                  {isLoggingIn ? 'PROCESSANDO...' : (showRegister ? 'CRIAR CONTA' : 'ENTRAR NA VILA')}
                </button>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegister(!showRegister);
                      setLoginError(false);
                    }}
                    className="text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:text-yellow-400 transition-colors"
                  >
                    {showRegister ? 'Já tenho uma conta' : 'Não tenho conta? Criar agora'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approval Pending Overlay */}
      <AnimatePresence>
        {isLoggedIn && userProfile && !userProfile.approved && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-emerald-950/90 backdrop-blur-2xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full max-w-md bg-zinc-900/80 backdrop-blur-2xl border border-yellow-500/30 rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-yellow-500/20 rounded-full border border-yellow-500/30 animate-pulse">
                  <Clock size={40} className="text-yellow-500" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Acesso Restrito</h2>
              <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                Olá, <span className="text-emerald-400 font-bold">{userProfile.username}</span>!<br/>
                Seu cadastro foi realizado com sucesso, mas sua conta ainda está <span className="text-yellow-500 font-bold">aguardando confirmação</span> de um dos administradores.
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Status do Cadastro</p>
                  <p className="text-xs text-white font-bold mt-1 italic">Pendente de Aprovação</p>
                </div>
                <button
                  onClick={() => signOut(auth)}
                  className="w-full py-4 bg-zinc-800 text-zinc-400 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-700 hover:text-white transition-all"
                >
                  Sair da Conta
                </button>
              </div>
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
                  <h2 className="text-2xl font-black text-white tracking-tight">Build & Gameplay</h2>
                  <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em]">Encontre sua Build+Gameplay</p>
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
                {classTypes.map(cls => {
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
                        <div className="space-y-6">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Classe</label>
                              <select 
                                value={buildForm.className}
                                onChange={e => setBuildForm({...buildForm, className: e.target.value})}
                                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                              >
                                {classTypes.map(c => <option key={c} value={c}>{c}</option>)}
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
                          </div>

                          {/* Class Type Management */}
                          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-3">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Gerenciar Tipos de Classe</p>
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                id="new-class-type"
                                placeholder="Nova Classe"
                                className="flex-1 bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = (e.currentTarget as HTMLInputElement).value.trim();
                                    if (val && !classTypes.includes(val)) {
                                      setClassTypes([...classTypes, val]);
                                      (e.currentTarget as HTMLInputElement).value = '';
                                    }
                                  }
                                }}
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById('new-class-type') as HTMLInputElement;
                                  const val = input.value.trim();
                                  if (val && !classTypes.includes(val)) {
                                    setClassTypes([...classTypes, val]);
                                    input.value = '';
                                  }
                                }}
                                className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition-colors"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {classTypes.map(c => (
                                <div key={c} className="flex items-center gap-1 bg-zinc-950 border border-white/5 px-2 py-1 rounded-md text-[10px] text-zinc-400">
                                  {c}
                                  <button 
                                    type="button"
                                    onClick={() => setClassTypes(classTypes.filter(t => t !== c))}
                                    className="text-red-500 hover:text-red-400"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">URL da Imagem da Classe (Opcional)</label>
                              <input 
                                type="text"
                                value={buildForm.image}
                                onChange={e => setBuildForm({...buildForm, image: e.target.value})}
                                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                placeholder="https://exemplo.com/imagem.png"
                              />
                            </div>
                          <div>
                            <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Descrição / Guia de Gameplay</label>
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <button type="button" onClick={() => setBuildForm({...buildForm, description: (buildForm.description || '') + '<b></b>'})} className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-bold">B</button>
                                <button type="button" onClick={() => setBuildForm({...buildForm, description: (buildForm.description || '') + '<i></i>'})} className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-bold">I</button>
                                <button type="button" onClick={() => setBuildForm({...buildForm, description: (buildForm.description || '') + '<br>'})} className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-bold">LB</button>
                                <button type="button" onClick={() => setBuildForm({...buildForm, description: (buildForm.description || '') + '<span style="color:#10b981"></span>'})} className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-bold text-emerald-500">Color</button>
                              </div>
                              <textarea 
                                value={buildForm.description}
                                onChange={e => setBuildForm({...buildForm, description: e.target.value})}
                                className="w-full h-32 bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-xs font-mono"
                                placeholder="Dicas de como jogar, combos, etc. Suporta HTML básico."
                              />
                            </div>
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
                      </div>

                      <div className="space-y-4">
                          <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Equipamentos & Cartas</label>
                          <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {['elmo', 'meio', 'baixo', 'arma', 'capa', 'armadura', 'escudo', 'bota', 'acessorio1', 'acessorio2'].map(slot => {
                              const slotData = buildForm.equipment?.[slot as keyof ClassBuild['equipment']];
                              const numSlots = slotData?.slots || 0;
                              return (
                                <div key={slot} className="p-3 bg-zinc-950/50 border border-white/5 rounded-xl space-y-3">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{slot}</p>
                                    <div className="flex items-center gap-2">
                                      <label className="text-[8px] font-black text-zinc-600 uppercase">Slots:</label>
                                      <input 
                                        type="number"
                                        min="0"
                                        max="4"
                                        value={numSlots}
                                        onChange={e => {
                                          const val = parseInt(e.target.value) || 0;
                                          setBuildForm({
                                            ...buildForm,
                                            equipment: {
                                              ...buildForm.equipment!,
                                              [slot]: { 
                                                ...slotData!, 
                                                slots: val,
                                                cards: Array(val).fill('').map((_, idx) => slotData?.cards[idx] || ''),
                                                cardDescriptions: Array(val).fill('').map((_, idx) => slotData?.cardDescriptions?.[idx] || '')
                                              }
                                            }
                                          });
                                        }}
                                        className="w-12 bg-zinc-900 border border-white/5 rounded px-1 py-0.5 text-[10px] text-white"
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <input 
                                      type="text"
                                      placeholder="Nome do Equipamento"
                                      value={slotData?.name}
                                      onChange={e => setBuildForm({
                                        ...buildForm,
                                        equipment: {
                                          ...buildForm.equipment!,
                                          [slot]: { ...slotData!, name: e.target.value }
                                        }
                                      })}
                                      className="w-full bg-zinc-900 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white"
                                    />
                                    <input 
                                      type="text"
                                      placeholder="URL da Imagem do Equipamento (Opcional)"
                                      value={slotData?.image || ''}
                                      onChange={e => setBuildForm({
                                        ...buildForm,
                                        equipment: {
                                          ...buildForm.equipment!,
                                          [slot]: { ...slotData!, image: e.target.value }
                                        }
                                      })}
                                      className="w-full bg-zinc-900 border border-white/5 rounded-lg px-3 py-1.5 text-[10px] text-zinc-400"
                                    />
                                    
                                    {numSlots > 0 && (
                                      <div className="space-y-2 pl-2 border-l border-emerald-500/20">
                                        {[...Array(numSlots)].map((_, i) => (
                                          <div key={i} className="space-y-1">
                                            <input 
                                              type="text"
                                              placeholder="Nome da carta"
                                              value={slotData?.cards[i] || ''}
                                              onChange={e => {
                                                const newCards = [...(slotData?.cards || [])];
                                                newCards[i] = e.target.value;
                                                setBuildForm({
                                                  ...buildForm,
                                                  equipment: {
                                                    ...buildForm.equipment!,
                                                    [slot]: { ...slotData!, cards: newCards }
                                                  }
                                                });
                                              }}
                                              className="w-full bg-zinc-900/50 border border-emerald-500/10 rounded px-2 py-1 text-[10px] text-emerald-400"
                                            />
                                            <input 
                                              type="text"
                                              placeholder="Descrição da carta"
                                              value={slotData?.cardDescriptions?.[i] || ''}
                                              onChange={e => {
                                                const newDescs = [...(slotData?.cardDescriptions || [])];
                                                newDescs[i] = e.target.value;
                                                setBuildForm({
                                                  ...buildForm,
                                                  equipment: {
                                                    ...buildForm.equipment!,
                                                    [slot]: { ...slotData!, cardDescriptions: newDescs }
                                                  }
                                                });
                                              }}
                                              className="w-full bg-zinc-900/50 border border-emerald-500/10 rounded px-2 py-1 text-[9px] text-emerald-600"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
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
                        <div className="relative group flex flex-col items-center">
                          {/* Decorative Frame Container */}
                          <div className="relative w-full aspect-[16/10] flex items-center justify-center overflow-hidden">
                            {/* Background Image (Pillars/Sun - Atrás) */}
                            <div className="absolute inset-0 z-0 flex items-center justify-center p-6">
                              <img 
                                src="https://i.imgur.com/UMdIO75.png" 
                                alt="Background Pillars" 
                                className="w-full h-full object-contain pointer-events-none scale-100"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            
                            {/* The Character Image (No meio) */}
                            <div className="relative z-10 w-[35%] h-[45%] flex items-center justify-center mb-6">
                              <img 
                                src={selectedBuild.image} 
                                alt={selectedBuild.className}
                                className="max-w-full max-h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            {/* Decorative Frame (Moldura - Na frente) */}
                            <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                              <img 
                                src="https://i.postimg.cc/vTb5cQtY/Sem-titulo-(3).png" 
                                alt="Frame" 
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            {/* Name and Version Overlay (Ajustado à moldura) */}
                            <div className="absolute bottom-[10%] left-0 right-0 z-40 flex flex-col items-center">
                              <motion.div
                                initial={{ y: 5, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="flex flex-col items-center"
                              >
                                <h3 className="text-[26px] font-black text-white tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,1)] leading-none mb-1">
                                  {selectedBuild.className}
                                </h3>
                                <div className="bg-black/90 py-0.5 px-3 rounded-full border border-zinc-800/50 shadow-lg">
                                  <p className="text-yellow-500 font-black uppercase tracking-[0.3em] text-[5px]">
                                    {selectedBuild.version || 'REDEN'}
                                  </p>
                                </div>
                              </motion.div>
                            </div>
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
                          {Object.entries(selectedBuild.equipment).map(([slot, data]) => {
                            const eq = data as BuildEquipment;
                            return (
                              <motion.div 
                                key={slot}
                                whileHover={{ scale: 1.02 }}
                                className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4 group hover:border-emerald-500/30 transition-all"
                              >
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-zinc-600 group-hover:text-emerald-500 transition-colors border border-white/5 overflow-hidden ${eq.image ? 'bg-white' : 'bg-zinc-950'}`}>
                                  {eq.image ? (
                                    <img src={eq.image} alt={eq.name} className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                                  ) : (
                                    slot.includes('acessorio') ? <Zap size={24} /> : 
                                    slot === 'arma' ? <SwordIcon size={24} /> :
                                    slot === 'escudo' ? <ShieldCheck size={24} /> :
                                    slot === 'bota' ? <Footprints size={24} /> :
                                    <Plus size={24} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{slot}</p>
                                    {eq.slots !== undefined && eq.slots > 0 && (
                                      <div className="flex gap-0.5">
                                        {[...Array(eq.slots)].map((_, i) => (
                                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 border border-emerald-500/60" />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs font-bold text-white truncate">{eq.name || 'Vazio'}</p>
                                  {eq.cards && eq.cards.length > 0 && (() => {
                                    // Group identical cards
                                    const cardCounts = eq.cards.reduce((acc, card) => {
                                      if (card) acc[card] = (acc[card] || 0) + 1;
                                      return acc;
                                    }, {} as Record<string, number>);

                                    return Object.entries(cardCounts).map(([card, count], idx) => (
                                      <div key={idx} className="mt-1">
                                        <div className="flex items-center gap-1.5">
                                          <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[9px] font-black text-emerald-400">
                                            <Sparkles size={8} />
                                            <span className="truncate">{card}</span>
                                            {count > 1 && <span className="text-yellow-500 ml-1">x{count}</span>}
                                          </div>
                                        </div>
                                        {/* Find description for this card (using first occurrence) */}
                                        {(() => {
                                          const cardIdx = eq.cards.indexOf(card);
                                          const desc = eq.cardDescriptions?.[cardIdx];
                                          return desc ? (
                                            <p className="text-[8px] text-emerald-600/60 italic pl-3 truncate mt-0.5">{desc}</p>
                                          ) : null;
                                        })()}
                                      </div>
                                    ));
                                  })()}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Class Intro / Gameplay Guide */}
                        <div className="mt-8 p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                            <BookOpen size={64} className="text-emerald-500" />
                          </div>
                          <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Gamepad2 size={14} /> Guia de Gameplay & Estratégia
                          </h4>
                          <div 
                            className="text-emerald-400/80 text-sm leading-relaxed prose prose-invert prose-emerald max-w-none"
                            dangerouslySetInnerHTML={{ __html: selectedBuild.description || 'Nenhum guia de gameplay cadastrado para esta build.' }}
                          />
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
        {isUtilitiesOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUtilitiesOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-zinc-950/95 backdrop-blur-2xl border-l border-emerald-500/30 z-[300] shadow-2xl flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="p-6 border-b border-emerald-500/20 flex items-center justify-between bg-emerald-900/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/40">
                    <FileText className="text-emerald-500" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Utilities & Blog</h2>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Guias e Informações Úteis</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button 
                      onClick={exportUtilitiesToExcel}
                      className="p-2 text-emerald-500 hover:text-white hover:bg-emerald-800/40 rounded-full transition-all"
                      title="Exportar para Excel (CSV)"
                    >
                      <Download size={20} />
                    </button>
                  )}
                  <button 
                    onClick={() => setIsUtilitiesOpen(false)}
                    className="p-2 text-emerald-500 hover:text-white hover:bg-emerald-800/40 rounded-full transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Search and Filter */}
                <div className="flex gap-3 items-center bg-zinc-900/50 p-2 rounded-2xl border border-white/5">
                  <div className="relative flex-1">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isSearchFocused ? 'text-emerald-500' : 'text-zinc-500'}`} size={16} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar..."
                      value={utilitySearch}
                      onChange={(e) => setUtilitySearch(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      className={`w-full bg-zinc-950 border rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none transition-all ${isSearchFocused ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-white/10'}`}
                    />
                  </div>
                  <div className="relative min-w-[120px]">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Filter size={14} className="text-emerald-500" />
                    </div>
                    <select
                      value={utilityCategory}
                      onChange={(e) => setUtilityCategory(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                    >
                      {allCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Admin Category Management */}
                {isAdmin && (
                  <div className="space-y-3">
                    <button 
                      onClick={() => setIsCategoryAdminOpen(!isCategoryAdminOpen)}
                      className="w-full py-2 bg-zinc-900 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-emerald-400 transition-all flex items-center justify-center gap-2"
                    >
                      <Settings size={14} /> {isCategoryAdminOpen ? 'Fechar Categorias' : 'Gerenciar Categorias'}
                    </button>
                    
                    <AnimatePresence>
                      {isCategoryAdminOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-4 bg-zinc-900/30 p-4 rounded-2xl border border-white/5"
                        >
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Nova Categoria</p>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Nome da categoria..."
                                className="flex-1 bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                              />
                              <button 
                                onClick={addCategory}
                                className="px-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition-colors"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Permissão de Jogador</p>
                            <div className="space-y-2">
                              <p className="text-[9px] text-zinc-500">Selecione a categoria onde jogadores podem postar:</p>
                              <select 
                                value={playerAllowedCategory}
                                onChange={(e) => setPlayerAllowedCategory(e.target.value)}
                                className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                              >
                                <option value="">Nenhuma (Apenas Admin)</option>
                                {utilityCategories.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Categorias Atuais</p>
                            <div className="grid grid-cols-2 gap-2">
                              {utilityCategories.map(cat => (
                                <div key={cat} className="flex items-center justify-between p-2 bg-zinc-950/50 rounded-lg border border-white/5">
                                  <span className="text-[10px] text-zinc-300 truncate">{cat}</span>
                                  <button 
                                    onClick={() => deleteCategory(cat)}
                                    className="text-red-500/50 hover:text-red-500"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Create Post Button (Admin or Player with permission) */}
                {(isAdmin || (isLoggedIn && playerAllowedCategory)) && (
                  <button 
                    onClick={() => {
                      if (isUtilityAdminOpen && editingUtilityId) {
                        // If closing while editing, reset
                        setEditingUtilityId(null);
                        setUtilityForm({ title: '', content: '', category: isAdmin ? utilityCategories[0] : playerAllowedCategory });
                      } else {
                        setIsUtilityAdminOpen(!isUtilityAdminOpen);
                        if (!isAdmin && playerAllowedCategory) {
                          setUtilityForm(prev => ({ ...prev, category: playerAllowedCategory }));
                        }
                      }
                    }}
                    className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-500 font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> {isUtilityAdminOpen ? (editingUtilityId ? 'Cancelar Edição' : 'Fechar Editor') : 'Nova Postagem'}
                  </button>
                )}

                {/* Create Post Form */}
                <AnimatePresence>
                  {(isAdmin || (isLoggedIn && playerAllowedCategory)) && isUtilityAdminOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <form onSubmit={addUtilityPost} className="bg-zinc-900/50 border border-emerald-500/30 rounded-3xl p-6 space-y-4 mb-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Título da Postagem</label>
                            <input 
                              type="text" 
                              value={utilityForm.title}
                              onChange={(e) => setUtilityForm({...utilityForm, title: e.target.value})}
                              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                              placeholder="Ex: Guia de Farm de Zenys"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Categoria</label>
                              {isAdmin ? (
                                <select 
                                  value={utilityForm.category}
                                  onChange={(e) => setUtilityForm({...utilityForm, category: e.target.value})}
                                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                >
                                  {utilityCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              ) : (
                                <div className="w-full bg-zinc-950/50 border border-white/5 rounded-xl px-4 py-3 text-emerald-500 font-black text-xs uppercase tracking-widest">
                                  {playerAllowedCategory}
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Autor</label>
                              <input 
                                type="text" 
                                value={userProfile?.username || ''}
                                disabled
                                className="w-full bg-zinc-950/50 border border-white/5 rounded-xl px-4 py-3 text-zinc-500 cursor-not-allowed"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Conteúdo (Suporta HTML)</label>
                            <textarea 
                              value={utilityForm.content}
                              onChange={(e) => setUtilityForm({...utilityForm, content: e.target.value})}
                              className="w-full h-48 bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
                              placeholder="Escreva o conteúdo aqui..."
                            />
                          </div>
                        </div>
                        <button 
                          type="submit"
                          className="w-full py-3 bg-emerald-500 text-white font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                        >
                          {editingUtilityId ? 'Salvar Alterações' : 'Publicar Postagem'}
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Posts List */}
                <div className="space-y-6">
                  {filteredUtilities.map((post) => (
                    <motion.div 
                      key={post.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden group hover:border-emerald-500/30 transition-all"
                    >
                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                            {post.category}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-zinc-500 font-bold flex items-center gap-1">
                              <Clock size={12} /> {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-1">
                              {(isAdmin || post.author === (userProfile?.username || '')) && (
                                <>
                                  <button 
                                    onClick={() => {
                                      setEditingUtilityId(post.id);
                                      setUtilityForm({
                                        title: post.title,
                                        content: post.content,
                                        category: post.category
                                      });
                                      setIsUtilityAdminOpen(true);
                                      // Scroll to top of sidebar
                                      const sidebar = document.querySelector('.custom-scrollbar');
                                      if (sidebar) sidebar.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="p-1.5 text-emerald-500/40 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                                    title="Editar Postagem"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button 
                                    onClick={() => deleteUtilityPost(post.id)}
                                    className="p-1.5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                    title="Excluir Postagem"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors mb-2">{post.title}</h3>
                          <div 
                            className="text-sm text-zinc-400 leading-relaxed prose prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br>') }}
                          />
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-black text-emerald-500">
                              {post.author[0].toUpperCase()}
                            </div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Postado por {post.author}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {filteredUtilities.length === 0 && (
                    <div className="p-12 text-center space-y-4 bg-zinc-900/20 border border-white/5 rounded-3xl">
                      <div className="inline-flex p-4 bg-zinc-900 rounded-full text-zinc-700">
                        <FileText size={32} />
                      </div>
                      <p className="text-zinc-500 font-bold italic">Nenhuma postagem encontrada.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
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
                      {nextWarInfo ? (
                        <>
                          <p className="text-sm font-bold text-white">{nextWarInfo.dayName}, {nextWarInfo.date}</p>
                          <p className="text-[10px] text-emerald-400 font-bold">{woeSchedule.startTime} às {woeSchedule.endTime}</p>
                        </>
                      ) : (
                        <p className="text-sm font-bold text-white/50 italic">Nenhuma guerra agendada</p>
                      )}
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
                        <div className="flex items-center gap-2 mb-4 p-1 bg-emerald-900/40 rounded-xl border border-emerald-500/10">
                          <button 
                            onClick={() => setAdminTab('roster')}
                            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${adminTab === 'roster' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-emerald-500/60 hover:text-emerald-400'}`}
                          >
                            Plantel
                          </button>
                          <button 
                            onClick={() => setAdminTab('users')}
                            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${adminTab === 'users' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-emerald-500/60 hover:text-emerald-400'}`}
                          >
                            Usuários
                          </button>
                        </div>

                        <div className="space-y-4 mb-4">
                          {adminTab === 'roster' ? (
                            <>
                              {/* Member Form */}
                              <div className="bg-emerald-900/40 border border-yellow-500/30 rounded-2xl p-4 space-y-3">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Adicionar Integrante</p>
                                <form onSubmit={addRosterMember} className="space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-3">
                                      <div className="relative">
                                        <input 
                                          type="text" 
                                          placeholder="Classe"
                                          list="roster-classes"
                                          value={rosterFormClass}
                                          onChange={(e) => setRosterFormClass(e.target.value)}
                                          className="w-full bg-emerald-950/50 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                                        />
                                        <datalist id="roster-classes">
                                          {availableClasses.map(c => <option key={c} value={c} />)}
                                        </datalist>
                                      </div>
                                      <input 
                                        type="text" 
                                        placeholder="Versão (ex: Default)"
                                        value={rosterFormVersion}
                                        onChange={(e) => setRosterFormVersion(e.target.value)}
                                        className="w-full bg-emerald-950/50 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                                        list="roster-versions"
                                      />
                                      <datalist id="roster-versions">
                                        {builds.filter(b => b.className.toLowerCase() === rosterFormClass.toLowerCase()).map(b => (
                                          <option key={b.id} value={b.version} />
                                        ))}
                                        <option value="Default" />
                                      </datalist>
                                    </div>
                                    <input 
                                      type="text" 
                                      placeholder="Nome (Opcional)"
                                      value={rosterFormName}
                                      onChange={(e) => setRosterFormName(e.target.value)}
                                      className="bg-emerald-950/50 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500 h-full"
                                    />
                                  </div>
                                  <button 
                                    type="submit"
                                    className="w-full py-2 bg-emerald-500 text-white text-xs font-black rounded-lg hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <Plus size={14} /> ADICIONAR AO PLANTEL
                                  </button>
                                </form>
                              </div>

                              {/* Schedule Form */}
                              <div className="bg-emerald-900/40 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Configurar Guerra</p>
                                <div className="space-y-3">
                                  <input 
                                    type="text" 
                                    placeholder="Dias (ex: Ter, Qui, Sáb)"
                                    value={woeSchedule.days.join(', ')}
                                    onChange={async (e) => {
                                      const newDays = e.target.value.split(',').map(d => d.trim());
                                      try {
                                        await setDoc(doc(db, 'settings', 'woe'), { ...woeSchedule, days: newDays });
                                      } catch (err) {
                                        handleFirestoreError(err, OperationType.WRITE, 'settings/woe');
                                      }
                                    }}
                                    className="w-full bg-emerald-950/50 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                                  />
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[8px] font-black text-emerald-600 uppercase mb-1">Início</label>
                                      <input 
                                        type="time" 
                                        value={woeSchedule.startTime}
                                        onChange={async (e) => {
                                          try {
                                            await setDoc(doc(db, 'settings', 'woe'), { ...woeSchedule, startTime: e.target.value });
                                          } catch (err) {
                                            handleFirestoreError(err, OperationType.WRITE, 'settings/woe');
                                          }
                                        }}
                                        className="w-full bg-emerald-950/50 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black text-emerald-600 uppercase mb-1">Término</label>
                                      <input 
                                        type="time" 
                                        value={woeSchedule.endTime}
                                        onChange={async (e) => {
                                          try {
                                            await setDoc(doc(db, 'settings', 'woe'), { ...woeSchedule, endTime: e.target.value });
                                          } catch (err) {
                                            handleFirestoreError(err, OperationType.WRITE, 'settings/woe');
                                          }
                                        }}
                                        className="w-full bg-emerald-950/50 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-4">
                              {/* Users List */}
                              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                                {users.map(u => (
                                  <div key={u.id} className="flex items-center justify-between p-3 bg-emerald-900/20 border border-emerald-500/10 rounded-xl">
                                    <div>
                                      <p className="text-xs font-black text-white">{u.username}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <select 
                                          value={u.role}
                                          onChange={async (e) => {
                                            try {
                                              await updateDoc(doc(db, 'users', u.id), { role: e.target.value });
                                            } catch (err) {
                                              handleFirestoreError(err, OperationType.UPDATE, `users/${u.id}`);
                                            }
                                          }}
                                          className="bg-emerald-950/50 border border-emerald-500/20 rounded px-2 py-0.5 text-[8px] font-black text-emerald-500 uppercase tracking-widest focus:outline-none focus:border-yellow-500"
                                        >
                                          <option value="player">Jogador</option>
                                          <option value="admin">Admin</option>
                                        </select>
                                        <button
                                          onClick={async () => {
                                            try {
                                              await updateDoc(doc(db, 'users', u.id), { approved: !u.approved });
                                            } catch (err) {
                                              handleFirestoreError(err, OperationType.UPDATE, `users/${u.id}`);
                                            }
                                          }}
                                          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest transition-colors ${u.approved ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'}`}
                                        >
                                          {u.approved ? 'Aprovado' : 'Pendente'}
                                        </button>
                                      </div>
                                    </div>
                                    {u.username !== 'admin' && u.id !== currentUser?.uid && (
                                      <button 
                                        onClick={async () => {
                                          if (confirm(`Deseja realmente excluir o perfil de ${u.username}?`)) {
                                            try {
                                              await deleteDoc(doc(db, 'users', u.id));
                                            } catch (err) {
                                              handleFirestoreError(err, OperationType.DELETE, `users/${u.id}`);
                                            }
                                          }
                                        }}
                                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-3">
                    {roster.map((member, index) => (
                      <motion.div 
                        key={member.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-2xl border transition-all ${editingMemberId === member.id ? 'bg-emerald-900/40 border-yellow-500/40 shadow-lg' : 'bg-emerald-900/20 border-emerald-500/10 hover:border-emerald-500/30'}`}
                      >
                        {editingMemberId === member.id ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2 mb-2">
                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Editando Integrante #{index + 1}</span>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => deleteRosterMember(member.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={16} />
                                </button>
                                <button 
                                  onClick={() => setEditingMemberId(null)}
                                  className="p-1.5 text-zinc-500 hover:bg-white/5 rounded-lg transition-colors"
                                  title="Cancelar"
                                >
                                  <X size={16} />
                                </button>
                                <button 
                                  onClick={() => {
                                    updateRosterMemberName(member.id, editingName);
                                    updateRosterMemberClass(member.id, editingClass, editingVersion);
                                  }}
                                  className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors"
                                  title="Salvar"
                                >
                                  <Check size={16} />
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3">
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-emerald-600 uppercase ml-1">Classe</label>
                                <input 
                                  autoFocus
                                  type="text"
                                  value={editingClass}
                                  onChange={(e) => setEditingClass(e.target.value)}
                                  className="w-full bg-emerald-950 border border-emerald-500/20 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-yellow-500"
                                  list="roster-classes"
                                  placeholder="Classe"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-emerald-600 uppercase ml-1">Versão</label>
                                <input 
                                  type="text"
                                  value={editingVersion}
                                  onChange={(e) => setEditingVersion(e.target.value)}
                                  className="w-full bg-emerald-950 border border-emerald-500/20 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-yellow-500"
                                  list="roster-versions-edit"
                                  placeholder="Versão"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-emerald-600 uppercase ml-1">Nome do Jogador</label>
                                <input 
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="w-full bg-emerald-950 border border-emerald-500/20 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-yellow-500"
                                  placeholder="Nome"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-emerald-900/40 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-black text-emerald-500">{index + 1}</span>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                  <span className="text-sm font-black text-white truncate">{member.name || 'Sem Nome'}</span>
                                  {isAdmin && isRosterAdminOpen && (
                                    <button 
                                      onClick={() => {
                                        setEditingMemberId(member.id);
                                        setEditingName(member.name);
                                        setEditingClass(member.className);
                                        setEditingVersion(member.version || 'Default');
                                      }}
                                      className="p-1 text-yellow-500 hover:bg-yellow-500/10 rounded transition-colors"
                                    >
                                      <Settings size={12} />
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold italic text-emerald-400/60">
                                  <span>{member.className}</span>
                                  {member.version && member.version !== 'Default' && (
                                    <span className="bg-emerald-500/10 px-1 rounded border border-emerald-500/20">
                                      {member.version}
                                    </span>
                                  )}
                                  {/* Link to Build if exists */}
                                  {(() => {
                                    const classBuild = builds.find(b => 
                                      b.className.toLowerCase() === member.className.toLowerCase() && 
                                      (b.version?.toLowerCase() === member.version?.toLowerCase() || (!b.version && member.version === 'Default'))
                                    );
                                    if (classBuild) {
                                      return (
                                        <button 
                                          onClick={() => {
                                            setSelectedBuildId(classBuild.id);
                                            setIsBuildsOpen(true);
                                            setIsRosterOpen(false);
                                          }}
                                          className="text-emerald-500 hover:text-white transition-colors flex items-center gap-1"
                                          title="Ver Build"
                                        >
                                          <BookOpen size={10} />
                                          <span className="text-[8px] uppercase tracking-tighter">Build</span>
                                        </button>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button 
                                onClick={() => updateConfirmation(member.id, true)}
                                className={`p-2 rounded-xl transition-all ${member.confirmed === true ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-emerald-900/40 text-emerald-700 hover:text-emerald-400'}`}
                                title="Confirmar Presença"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              <button 
                                onClick={() => updateConfirmation(member.id, false)}
                                className={`p-2 rounded-xl transition-all ${member.confirmed === false ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-emerald-900/40 text-emerald-700 hover:text-red-400'}`}
                                title="Recusar Presença"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {roster.length === 0 && (
                      <div className="p-8 text-center bg-emerald-900/20 border border-emerald-500/10 rounded-2xl text-emerald-700 font-bold italic">
                        Nenhum integrante cadastrado.
                      </div>
                    )}
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
              onClick={() => setIsUtilitiesOpen(true)}
              className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/30 shadow-lg shadow-emerald-500/10 flex items-center gap-2"
              title="Utilities & Blog"
            >
              <FileText size={20} />
              <span className="hidden lg:inline text-xs font-black uppercase tracking-tighter">Utilities</span>
            </button>

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

            {isAdmin && (
              <button 
                onClick={() => setIsStaffPanelOpen(true)}
                className="p-2 rounded-lg bg-emerald-900/40 text-emerald-400 hover:text-white hover:bg-emerald-800/40 transition-colors"
                title="Adicionar Evento Staff"
              >
                <Plus size={20} />
              </button>
            )}
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
              {isAdmin && (
                <button 
                  onClick={() => setIsStaffPanelOpen(true)}
                  className="p-4 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white shadow-2xl transition-all"
                  title="Adicionar Evento Staff"
                >
                  <Plus size={24} />
                </button>
              )}

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
