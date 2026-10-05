import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Sparkles,
  Send,
  Square,
  Bot,
  User,
  RotateCcw,
  Copy,
  Check,
  Plus,
  Trash2,
  Clock,
  Pin,
  PinOff,
  Search,
  Briefcase,
  FileText,
  Zap,
  Mic,
  UserCheck,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  Menu,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Building2,
  MapPin,
  ShieldCheck,
  Paperclip,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Info,
  Lightbulb,
  TrendingUp,
  Sliders,
  MoreVertical,
  ArrowLeft,
  Globe,
  Brain,
  Telescope,
  Image as ImageIcon,
  BookOpen,
  Pencil,
  Eraser,
  Undo2,
} from 'lucide-react';

interface JobItem {
  _id: string;
  title: string;
  companyName: string;
  companyLogo?: 'tcs' | 'microsoft' | 'infosys' | 'google' | 'amazon' | 'flipkart' | string;
  location: string;
  remoteType?: string;
  salaryText?: string;
  salaryMin?: number;
  salaryMax?: number;
  matchScore: number;
  skills: string[];
  slug?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  timeFormatted?: string;
  matchedJobs?: JobItem[];
  actionType?: 'jobs' | 'resume' | 'interview' | 'profile' | 'skill_gap';
  isLiked?: boolean;
  isDisliked?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  suggestions?: string[];
  isPinned?: boolean;
}

const DEFAULT_SUGGESTIONS = [
  'Find MERN stack jobs in Bangalore',
  'Improve my resume for senior roles',
  'Prepare for React interview',
  'What skills should I learn next?',
];

const ALTERNATE_SUGGESTIONS = [
  'Show remote Full Stack Engineer jobs above ₹15L',
  'How do I pass system design interviews in top product companies?',
  'Review my GitHub projects for recruiter visibility',
  'What backend certifications are most valued in 2026?',
];

const AI_CAREER_TOOLS = [
  {
    id: 'resume_review',
    label: 'Resume Review',
    icon: FileText,
    iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
    prompt: 'Review my resume and profile. Give me concrete bullet point improvements, quantifiable metrics, and ATS keywords to add.',
    subtitle: 'ATS & content tips',
  },
  {
    id: 'skill_gap',
    label: 'Skill Gap Analysis',
    icon: TrendingUp,
    iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400',
    prompt: 'Analyze my current skills and tell me what high-leverage skills are missing for senior tech roles in 2026.',
    subtitle: 'Learn & grow',
  },
  {
    id: 'interview_prep',
    label: 'Interview Preparation',
    shortLabel: 'Interview Prep',
    icon: Mic,
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    prompt: 'Run a mock technical and behavioral interview session with me based on my skills. Ask one question at a time.',
    subtitle: 'Practice & feedback',
  },
  {
    id: 'job_matching',
    label: 'Job Matching',
    shortLabel: 'Find Jobs',
    icon: Search,
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
    prompt: 'Find verified open tech jobs on JobConnect that best match my verified skills and experience level.',
    subtitle: 'Personalized matches',
  },
  {
    id: 'profile_boost',
    label: 'Profile Improvement',
    icon: UserCheck,
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    prompt: 'How can I improve my JobConnect profile completeness and increase inbound recruiter outreach?',
    subtitle: 'Boost your visibility',
  },
];

// Sample Seed Sessions matching the reference UI mockup
const INITIAL_DEMO_SESSIONS: ChatSession[] = [
  {
    id: 'sess_remote_react',
    title: 'Find remote jobs in React',
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2,
    isPinned: false,
    suggestions: DEFAULT_SUGGESTIONS,
    messages: [
      {
        id: 'msg_usr_1',
        sender: 'user',
        text: 'Find remote jobs in React',
        timestamp: Date.now() - 3600000 * 2,
        timeFormatted: '2:45 PM',
      },
      {
        id: 'msg_ai_1',
        sender: 'assistant',
        text: 'I found 6 remote jobs that match your profile and React skills. Here are the best matches for you:',
        timestamp: Date.now() - 3600000 * 2 + 3000,
        timeFormatted: '2:45 PM',
        matchedJobs: [
          {
            _id: 'job_tcs_react_01',
            title: 'Frontend React Developer',
            companyName: 'Tata Consultancy Services',
            companyLogo: 'tcs',
            location: 'Remote',
            remoteType: 'Remote',
            salaryText: '₹12L – ₹18L',
            matchScore: 92,
            skills: ['React', 'Node.js', 'TypeScript', 'Git'],
          },
          {
            _id: 'job_msft_react_02',
            title: 'Software Engineer (React)',
            companyName: 'Microsoft',
            companyLogo: 'microsoft',
            location: 'Remote',
            remoteType: 'Remote',
            salaryText: '₹15L – ₹22L',
            matchScore: 88,
            skills: ['React', 'Redux', 'JavaScript', 'Azure'],
          },
          {
            _id: 'job_infy_react_03',
            title: 'React Developer (Remote)',
            companyName: 'Infosys',
            companyLogo: 'infosys',
            location: 'Remote',
            remoteType: 'Remote',
            salaryText: '₹10L – ₹16L',
            matchScore: 84,
            skills: ['React', 'HTML', 'CSS', 'JavaScript'],
          },
          {
            _id: 'job_amzn_react_04',
            title: 'Senior Full Stack Engineer',
            companyName: 'Amazon Web Services',
            companyLogo: 'amazon',
            location: 'Remote',
            remoteType: 'Remote',
            salaryText: '₹22L – ₹32L',
            matchScore: 82,
            skills: ['React', 'Node.js', 'AWS', 'DynamoDB'],
          },
          {
            _id: 'job_goog_react_05',
            title: 'Staff UI Engineer',
            companyName: 'Google',
            companyLogo: 'google',
            location: 'Hybrid',
            remoteType: 'Hybrid',
            salaryText: '₹30L – ₹42L',
            matchScore: 79,
            skills: ['React', 'TypeScript', 'Web Perf', 'Architecture'],
          },
          {
            _id: 'job_flip_react_06',
            title: 'Lead Frontend Developer',
            companyName: 'Flipkart',
            companyLogo: 'flipkart',
            location: 'Remote',
            remoteType: 'Remote',
            salaryText: '₹18L – ₹26L',
            matchScore: 78,
            skills: ['React', 'Next.js', 'Redux Toolkit', 'Tailwind'],
          },
        ],
      },
    ],
  },
  {
    id: 'sess_mern_resume',
    title: 'Improve my MERN resume',
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 24,
    isPinned: true,
    suggestions: DEFAULT_SUGGESTIONS,
    messages: [
      {
        id: 'msg_usr_m1',
        sender: 'user',
        text: 'Improve my MERN resume for senior roles',
        timestamp: Date.now() - 3600000 * 24,
        timeFormatted: '11:15 AM',
      },
      {
        id: 'msg_ai_m1',
        sender: 'assistant',
        text: '### Resume Optimization Recommendations for Senior MERN Roles:\n\n1. **Quantify Architectural Impact**: Instead of *"Built REST APIs with Express"*, write *"Architected 25+ microservices with Node.js & Express handling 50k+ daily requests with 99.9% uptime."*\n2. **Highlight Database Scaling**: Emphasize MongoDB indexing strategies, sharding, and aggregation pipelines.\n3. **Add Modern Tooling**: Include Docker, CI/CD pipelines, Jest unit tests, and Redis caching layers.\n4. **ATS Keywords**: Add `Microservices`, `State Management (Redux/Zustand)`, `RESTful APIs`, `GraphQL`, and `Clean Architecture`.',
        timestamp: Date.now() - 3600000 * 24 + 2000,
        timeFormatted: '11:15 AM',
      },
    ],
  },
  {
    id: 'sess_react_prep',
    title: 'React interview preparation',
    createdAt: Date.now() - 3600000 * 48,
    updatedAt: Date.now() - 3600000 * 48,
    isPinned: true,
    suggestions: DEFAULT_SUGGESTIONS,
    messages: [
      {
        id: 'msg_usr_r1',
        sender: 'user',
        text: 'Prepare me for React interview questions on performance optimization',
        timestamp: Date.now() - 3600000 * 48,
        timeFormatted: '3:30 PM',
      },
      {
        id: 'msg_ai_r1',
        sender: 'assistant',
        text: '### Key React Performance Topics to Master:\n\n1. **Component Re-rendering**: How `React.memo`, `useMemo`, and `useCallback` prevent unwanted renders.\n2. **Virtual DOM Diffing**: The reconciliation algorithm, Fiber architecture, and keys importance.\n3. **Code Splitting & Lazy Loading**: Using `React.lazy()` with `Suspense` for route-based chunking.\n4. **Windowing / Virtualization**: Rendering large lists with `react-window` or virtualized scrolling.\n\n*Would you like to start a simulated mock Q&A now?*',
        timestamp: Date.now() - 3600000 * 48 + 3000,
        timeFormatted: '3:30 PM',
      },
    ],
  },
  {
    id: 'sess_app_status',
    title: 'My application status',
    createdAt: Date.now() - 3600000 * 72,
    updatedAt: Date.now() - 3600000 * 72,
    isPinned: false,
    suggestions: DEFAULT_SUGGESTIONS,
    messages: [
      {
        id: 'msg_usr_a1',
        sender: 'user',
        text: 'What is the status of my recent applications?',
        timestamp: Date.now() - 3600000 * 72,
        timeFormatted: '10:00 AM',
      },
      {
        id: 'msg_ai_a1',
        sender: 'assistant',
        text: 'You have **2 active applications** submitted on JobConnect:\n- **AI/ML Developer** at Rahul Kumar Singh\'s Organization (Under Review)\n- **Frontend Engineer** at TechCorp (Shortlisted for interview)\n\nMake sure to review your portfolio links before the interview stage!',
        timestamp: Date.now() - 3600000 * 72 + 2000,
        timeFormatted: '10:00 AM',
      },
    ],
  },
  {
    id: 'sess_profile_imp',
    title: 'How to improve profile',
    createdAt: Date.now() - 3600000 * 96,
    updatedAt: Date.now() - 3600000 * 96,
    isPinned: false,
    suggestions: DEFAULT_SUGGESTIONS,
    messages: [
      {
        id: 'msg_usr_p1',
        sender: 'user',
        text: 'How to improve profile visibility to recruiters?',
        timestamp: Date.now() - 3600000 * 96,
        timeFormatted: '4:20 PM',
      },
      {
        id: 'msg_ai_p1',
        sender: 'assistant',
        text: 'Here are the top 3 ways to boost recruiter outreach on JobConnect:\n1. Keep at least 8 verified technical skills tagged in your profile.\n2. Write a crisp 2-sentence summary highlighting your core tech stack and years of experience.\n3. Keep your resume file updated in PDF format.',
        timestamp: Date.now() - 3600000 * 96 + 2000,
        timeFormatted: '4:20 PM',
      },
    ],
  },
  {
    id: 'sess_skill_gap',
    title: 'Skill gap analysis',
    createdAt: Date.now() - 3600000 * 120,
    updatedAt: Date.now() - 3600000 * 120,
    isPinned: false,
    suggestions: DEFAULT_SUGGESTIONS,
    messages: [
      {
        id: 'msg_usr_s1',
        sender: 'user',
        text: 'Skill gap analysis for Full Stack Architect',
        timestamp: Date.now() - 3600000 * 120,
        timeFormatted: '1:10 PM',
      },
      {
        id: 'msg_ai_s1',
        sender: 'assistant',
        text: 'For a Full Stack Architect path, your strong skills are **React, Node.js, and MongoDB**.\n\nRecommended next high-demand skills:\n- Cloud architecture (AWS Solutions Architect / GCP)\n- Distributed messaging (Kafka or RabbitMQ)\n- Kubernetes & container orchestration',
        timestamp: Date.now() - 3600000 * 120 + 2000,
        timeFormatted: '1:10 PM',
      },
    ],
  },
];

// 3D Cute Robot Illustration Component (with floating icons)
const CuteRobotHeroIllustration: React.FC = () => {
  return (
    <div className="relative w-36 h-36 sm:w-44 sm:h-44 shrink-0 flex items-center justify-center select-none">
      {/* Background Soft Glow */}
      <div className="absolute inset-2 bg-gradient-to-tr from-purple-300/40 via-indigo-200/30 to-pink-200/40 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full blur-xl" />

      {/* Floating Icon 1: Green Bar Chart (Top Left) */}
      <div className="absolute top-1 left-2 sm:left-4 z-20 w-8 h-8 rounded-xl bg-white dark:bg-slate-800 shadow-md border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center animate-bounce [animation-duration:3s]">
        <TrendingUp className="w-4 h-4 text-emerald-500" />
      </div>

      {/* Floating Icon 2: Purple Briefcase (Top Right) */}
      <div className="absolute top-2 right-2 sm:right-3 z-20 w-8 h-8 rounded-xl bg-white dark:bg-slate-800 shadow-md border border-purple-100 dark:border-purple-900/50 flex items-center justify-center animate-bounce [animation-duration:3.6s] [animation-delay:0.5s]">
        <Briefcase className="w-4 h-4 text-purple-600" />
      </div>

      {/* Floating Icon 3: Pink Resume Document (Bottom Left) */}
      <div className="absolute bottom-2 left-1 sm:left-2 z-20 w-8 h-8 rounded-xl bg-white dark:bg-slate-800 shadow-md border border-pink-100 dark:border-pink-900/50 flex items-center justify-center animate-bounce [animation-duration:4s] [animation-delay:0.2s]">
        <FileText className="w-4 h-4 text-pink-500" />
      </div>

      {/* Floating Icon 4: Gold Analytics/Star (Bottom Right) */}
      <div className="absolute bottom-3 right-2 sm:right-4 z-20 w-8 h-8 rounded-xl bg-white dark:bg-slate-800 shadow-md border border-amber-100 dark:border-amber-900/50 flex items-center justify-center animate-bounce [animation-duration:3.2s] [animation-delay:0.8s]">
        <Sparkles className="w-4 h-4 text-amber-500" />
      </div>

      {/* 3D Cute Robot SVG */}
      <svg
        className="w-32 h-32 sm:w-36 sm:h-36 drop-shadow-xl z-10"
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bodyGrad" x1="40" y1="60" x2="120" y2="150" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.6" stopColor="#EEF2F6" />
            <stop offset="1" stopColor="#D5DCE5" />
          </linearGradient>
          <linearGradient id="visorGrad" x1="48" y1="48" x2="112" y2="92" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1E1B4B" />
            <stop offset="0.5" stopColor="#2E1065" />
            <stop offset="1" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="antennaGrad" x1="80" y1="12" x2="80" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="#818CF8" />
            <stop offset="1" stopColor="#4F46E5" />
          </linearGradient>
          <radialGradient id="eyeGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(68 68) scale(14)">
            <stop stopColor="#38BDF8" />
            <stop offset="1" stopColor="#0284C7" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Antenna */}
        <line x1="80" y1="36" x2="80" y2="20" stroke="url(#antennaGrad)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="80" cy="18" r="6" fill="#6366F1" />
        <circle cx="80" cy="18" r="3" fill="#A5B4FC" />

        {/* Ears / Side audio modules */}
        <rect x="30" y="54" width="8" height="20" rx="4" fill="#C7D2FE" />
        <rect x="122" y="54" width="8" height="20" rx="4" fill="#C7D2FE" />

        {/* Head Shell */}
        <rect x="36" y="32" width="88" height="66" rx="26" fill="url(#bodyGrad)" stroke="#E2E8F0" strokeWidth="1.5" />

        {/* Visor Face */}
        <rect x="46" y="44" width="68" height="42" rx="16" fill="url(#visorGrad)" stroke="#4338CA" strokeWidth="1" />

        {/* Eyes (Glowing Happy Arcs) */}
        <path d="M58 64 Q66 54 74 64" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M86 64 Q94 54 102 64" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <circle cx="66" cy="62" r="1.5" fill="#FFFFFF" />
        <circle cx="94" cy="62" r="1.5" fill="#FFFFFF" />

        {/* Cheerful Blush Dots */}
        <circle cx="56" cy="74" r="3" fill="#F472B6" fillOpacity="0.7" />
        <circle cx="104" cy="74" r="3" fill="#F472B6" fillOpacity="0.7" />

        {/* Neck */}
        <rect x="70" y="98" width="20" height="8" rx="3" fill="#94A3B8" />

        {/* Torso */}
        <path d="M46 106 C46 106 58 102 80 102 C102 102 114 106 114 106 C124 109 130 119 128 130 L126 142 C125 147 120 150 114 150 L46 150 C40 150 35 147 34 142 L32 130 C30 119 36 109 46 106 Z" fill="url(#bodyGrad)" stroke="#E2E8F0" strokeWidth="1.5" />

        {/* Chest Display Screen */}
        <rect x="62" y="114" width="36" height="22" rx="7" fill="#F1F5F9" stroke="#CBD5E1" />
        <circle cx="72" cy="125" r="3" fill="#6366F1" />
        <circle cx="80" cy="125" r="3" fill="#EC4899" />
        <circle cx="88" cy="125" r="3" fill="#10B981" />

        {/* Cute Rounded Arms */}
        <path d="M34 116 C26 122 24 134 32 140" stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" />
        <path d="M126 116 C134 122 136 134 128 140" stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" />
      </svg>
    </div>
  );
};

// Company Logo Component Helper
const CompanyLogoBadge: React.FC<{ company: string; logoType?: string }> = ({ company, logoType }) => {
  const norm = (logoType || company || '').toLowerCase();

  if (norm.includes('tcs') || norm.includes('tata')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 font-black text-[11px] flex items-center justify-center border border-red-200 uppercase tracking-tighter">
        tcs
      </div>
    );
  }

  if (norm.includes('microsoft') || norm.includes('msft')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 p-1.5 flex items-center justify-center border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-2 gap-0.5 w-full h-full">
          <div className="bg-[#F25022] rounded-[1px]" />
          <div className="bg-[#7FBA00] rounded-[1px]" />
          <div className="bg-[#00A4EF] rounded-[1px]" />
          <div className="bg-[#FFB900] rounded-[1px]" />
        </div>
      </div>
    );
  }

  if (norm.includes('infosys') || norm.includes('infy')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold text-[9px] flex items-center justify-center border border-blue-200">
        Infosys
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center border border-purple-200 dark:border-purple-800">
      {company.charAt(0).toUpperCase()}
    </div>
  );
};

// Interactive Sketch Canvas Modal Component
const SketchCanvasModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSaveSketch: (dataUrl: string) => void;
}> = ({ isOpen, onClose, onSaveSketch }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#6355EC');
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = isEraser ? '#FFFFFF' : color;
    ctx.lineWidth = isEraser ? 16 : 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveSketch(dataUrl);
    onClose();
  };

  const colors = ['#0F172A', '#6355EC', '#0284C7', '#059669', '#E11D48'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-5 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Pencil className="w-5 h-5 text-[#6355EC]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Sketch Architecture or Idea
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-500">Color:</span>
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  setIsEraser(false);
                }}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                  color === c && !isEraser ? 'scale-110 border-indigo-500 ring-2 ring-indigo-500/30' : 'border-white'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsEraser((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                isEraser
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'text-slate-600 border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Eraser</span>
            </button>

            <button
              type="button"
              onClick={clearCanvas}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white shadow-inner flex justify-center">
          <canvas
            ref={canvasRef}
            width={520}
            height={280}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="cursor-crosshair w-full max-h-[280px]"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#6355EC] hover:bg-[#5244DD] text-white text-xs font-semibold shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            Attach Sketch to Prompt
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Library Files Modal Component
const LibraryFilesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: { id: string; name: string; type: string; size?: string }) => void;
  userName: string;
}> = ({ isOpen, onClose, onSelectFile, userName }) => {
  if (!isOpen) return null;

  const libraryFiles = [
    {
      id: 'lib_resume_01',
      name: `${userName}_Resume_2026.pdf`,
      type: 'pdf',
      size: '240 KB',
      desc: 'Verified Candidate Profile Resume on JobConnect',
    },
    {
      id: 'lib_portfolio_02',
      name: 'FullStack_Architectural_Portfolio.pdf',
      type: 'pdf',
      size: '1.2 MB',
      desc: 'System Design Diagrams, API Contracts, and Schema',
    },
    {
      id: 'lib_certs_03',
      name: 'Technical_Certifications_AWS_React.pdf',
      type: 'pdf',
      size: '480 KB',
      desc: 'AWS Certified Solutions Architect & Advanced React',
    },
    {
      id: 'lib_cover_04',
      name: 'Senior_Developer_Cover_Letter.docx',
      type: 'docx',
      size: '85 KB',
      desc: 'Tailored cover letter template with impact metrics',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-5 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#6355EC]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Add Library Files
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select files from your JobConnect candidate library to attach directly to your AI Coach prompt:
        </p>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {libraryFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => {
                onSelectFile(file);
                onClose();
              }}
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#6355EC] dark:hover:border-[#6355EC] hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#6355EC] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {file.desc} • {file.size}
                  </p>
                </div>
              </div>
              <Plus className="w-4 h-4 text-slate-300 group-hover:text-[#6355EC] shrink-0" />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export const CandidateAIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const userName = user?.firstName || user?.name?.split(' ')[0] || 'Aditya';

  // Greeting based on time of day
  const timeOfDayGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Fetch Candidate Profile Context
  const { data: profileData } = useQuery({
    queryKey: ['candidateProfile'],
    queryFn: async () => {
      const res = await api.get('/candidate/profile');
      return res.data?.data || null;
    },
    enabled: Boolean(user?._id),
  });

  // Fetch Saved Jobs for bookmark status
  const { data: savedJobsData } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: async () => {
      const res = await api.get('/jobs/saved/all');
      return res.data?.data || [];
    },
    enabled: Boolean(user?._id),
  });

  const profile = profileData?.profile;
  const userSkills: string[] = profile?.skills || [];
  const hasResume = Boolean(profile?.resumeUrl);

  const savedJobIds = useMemo(() => {
    return new Set((savedJobsData || []).map((j: any) => j._id || j.jobId?._id || j.jobId));
  }, [savedJobsData]);

  // Session & Message State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [inputQuery, setInputQuery] = useState('');
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<'ready' | 'thinking' | 'generating' | 'error'>('ready');
  const [visibleJobsCount, setVisibleJobsCount] = useState<Record<string, number>>({});

  // Context Toggles under input bar
  const [useProfileContext, setUseProfileContext] = useState(true);
  const [useResumeContext, setUseResumeContext] = useState(true);
  const [useJobPrefsContext, setUseJobPrefsContext] = useState(true);
  const [useApplicationsContext, setUseApplicationsContext] = useState(true);

  // Confirmation Modals
  const [deleteSessionTarget, setDeleteSessionTarget] = useState<ChatSession | null>(null);
  const [isClearHistoryConfirmOpen, setIsClearHistoryConfirmOpen] = useState(false);

  // Plus Dropdown & Feature States (Matching media_1790848255979.png)
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(true); // "Thinking Selected" in screenshot
  const [isDeepResearchEnabled, setIsDeepResearchEnabled] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<
    { id: string; name: string; type: string; size?: string; url?: string }[]
  >([]);
  const [isSketchModalOpen, setIsSketchModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jobsScrollRef = useRef<HTMLDivElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  // Close plus menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };
    if (isPlusMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isPlusMenuOpen]);

  // Initialize from location state if prompt passed
  useEffect(() => {
    if (location.state && (location.state as any).initialPrompt) {
      setInputQuery((location.state as any).initialPrompt);
      composerInputRef.current?.focus();
    }
  }, [location.state]);

  // In-memory chat sessions management (Security: Never leak session IDs or transcripts to localStorage)
  // Start with a fresh new chat whenever candidate opens the page
  useEffect(() => {
    // Default to mock initial sessions in sidebar for reference, but start with fresh new chat
    setSessions(INITIAL_DEMO_SESSIONS);
    setActiveSessionId(null);
    setMessages([]);
    setCurrentSuggestions(DEFAULT_SUGGESTIONS);
  }, []);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiStatus]);

  // Save sessions to in-memory state (zero persistence in unencrypted browser storage)
  const persistSessions = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
  };

  // Toggle Save Job Mutation
  const saveJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const isSaved = savedJobIds.has(jobId);
      if (isSaved) {
        await api.delete(`/jobs/${jobId}/save`);
      } else {
        await api.post(`/jobs/${jobId}/save`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
    },
  });

  // AI Chat Mutation
  const chatMutation = useMutation({
    mutationFn: async (payload: {
      query: string;
      currentSessionId: string;
      historyContext: { sender: string; text: string }[];
    }) => {
      setAiStatus('thinking');
      const res = await api.post('/ai/chat', {
        query: payload.query,
        history: payload.historyContext,
      });
      return {
        response: res.data?.data?.response || '',
        suggestions: res.data?.data?.suggestions || [],
        matchedJobs: res.data?.data?.matchedJobs || [],
      };
    },
    onSuccess: (data, variables) => {
      setAiStatus('ready');
      const assistantText = data?.response || '';
      const nextSuggestions =
        data?.suggestions && data.suggestions.length > 0
          ? data.suggestions
          : DEFAULT_SUGGESTIONS;

      setCurrentSuggestions(nextSuggestions);

      // Map backend matchedJobs to rich JobItem cards
      const mappedJobs: JobItem[] = (data.matchedJobs || []).map((j: any) => ({
        _id: j._id,
        title: j.title,
        companyName: j.companyId?.name || 'Verified Company',
        companyLogo: j.companyId?.name?.toLowerCase().includes('microsoft')
          ? 'microsoft'
          : j.companyId?.name?.toLowerCase().includes('tcs')
          ? 'tcs'
          : j.companyId?.name?.toLowerCase().includes('infosys')
          ? 'infosys'
          : undefined,
        location: j.location || 'Remote',
        remoteType: j.remoteType || 'Remote',
        salaryText: j.salaryMin
          ? `₹${(j.salaryMin / 100000).toFixed(0)}L – ₹${(j.salaryMax / 100000).toFixed(0)}L`
          : undefined,
        matchScore: 92,
        skills: j.skills || ['React', 'Node.js', 'TypeScript'],
      }));

      const now = new Date();
      const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const assistantMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        sender: 'assistant',
        text: assistantText,
        timestamp: Date.now(),
        timeFormatted,
        matchedJobs: mappedJobs.length > 0 ? mappedJobs : undefined,
      };

      setMessages((prev) => {
        const nextMessages = [...prev, assistantMsg];

        setSessions((prevSessions) => {
          const updated = prevSessions.map((s) => {
            if (s.id === variables.currentSessionId) {
              return {
                ...s,
                updatedAt: Date.now(),
                messages: nextMessages,
                suggestions: nextSuggestions,
              };
            }
            return s;
          });
          persistSessions(updated);
          return updated;
        });

        return nextMessages;
      });
    },
    onError: (err: any, variables) => {
      setAiStatus('error');
      const serverMsg = err?.response?.data?.message || err?.message;
      const now = new Date();
      const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const errorMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        sender: 'assistant',
        text: `⚠️ **Unable to connect to AI Career Coach.** ${serverMsg || 'Please try again in a moment.'}`,
        timestamp: Date.now(),
        timeFormatted,
      };

      setMessages((prev) => {
        const next = [...prev, errorMsg];
        setSessions((prevSessions) => {
          const updated = prevSessions.map((s) => {
            if (s.id === variables.currentSessionId) {
              return {
                ...s,
                updatedAt: Date.now(),
                messages: next,
              };
            }
            return s;
          });
          persistSessions(updated);
          return updated;
        });
        return next;
      });
    },
  });

  // Handle Send Prompt
  const handleSendPrompt = (customText?: string) => {
    const rawQuery = (customText !== undefined ? customText : inputQuery).trim();
    if (!rawQuery && attachedFiles.length === 0) return;
    if (chatMutation.isPending) return;

    let sessionId = activeSessionId;
    let updatedSessions = [...sessions];

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Prepare user visible text
    let userVisibleText = rawQuery;
    if (attachedFiles.length > 0) {
      const filesTag = attachedFiles.map((f) => `📎 ${f.name}`).join(' | ');
      userVisibleText = userVisibleText ? `${userVisibleText}\n\n${filesTag}` : filesTag;
    }

    // Create session if none active
    if (!sessionId) {
      sessionId = 'session_' + Date.now();
      setActiveSessionId(sessionId);

      const titleSource = rawQuery || attachedFiles[0]?.name || 'New Conversation';
      const cleanTitle = titleSource.length > 35 ? titleSource.slice(0, 35) + '...' : titleSource;
      const newSession: ChatSession = {
        id: sessionId,
        title: cleanTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        suggestions: DEFAULT_SUGGESTIONS,
        isPinned: false,
      };

      updatedSessions = [newSession, ...updatedSessions];
    }

    const userMsg: ChatMessage = {
      id: 'msg_usr_' + Date.now(),
      sender: 'user',
      text: userVisibleText,
      timestamp: Date.now(),
      timeFormatted,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputQuery('');

    const currentAttached = [...attachedFiles];
    setAttachedFiles([]);

    // Update session title if first user message
    updatedSessions = updatedSessions.map((s) => {
      if (s.id === sessionId) {
        const titleSource = rawQuery || currentAttached[0]?.name || 'Conversation';
        return {
          ...s,
          updatedAt: Date.now(),
          title: s.messages.length === 0 ? (titleSource.length > 35 ? titleSource.slice(0, 35) + '...' : titleSource) : s.title,
          messages: nextMessages,
        };
      }
      return s;
    });

    persistSessions(updatedSessions);

    // Prepare enriched query for AI based on active modes
    let aiQuery = rawQuery;
    if (currentAttached.length > 0) {
      aiQuery += `\n\n[Candidate Attached Documents: ${currentAttached.map((f) => `${f.name} (${f.type})`).join(', ')}]`;
    }
    if (isWebSearchEnabled) {
      aiQuery = `[Real-Time Web Search Mode: Retrieve current 2026 tech trends, compensation, and market intelligence]\n` + aiQuery;
    }
    if (isDeepResearchEnabled) {
      aiQuery = `[Deep Research Mode: Conduct an exhaustive, multi-dimensional report with executive summary, methodology, and actionable plan]\n` + aiQuery;
    }
    if (isThinkingEnabled) {
      aiQuery = `[Thinking Mode: Provide detailed step-by-step reasoning, architectural considerations, and precise recommendations]\n` + aiQuery;
    }

    // Prepare history context for AI
    const historyContext = nextMessages.slice(-6).map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    chatMutation.mutate({
      query: aiQuery,
      currentSessionId: sessionId,
      historyContext,
    });
  };

  // Start Fresh New Chat
  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setCurrentSuggestions(DEFAULT_SUGGESTIONS);
    setInputQuery('');
    setAiStatus('ready');
    setIsMobileDrawerOpen(false);
    setTimeout(() => composerInputRef.current?.focus(), 100);
  };

  // Switch Conversation
  const handleSelectSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    setMessages(session.messages || []);
    setCurrentSuggestions(session.suggestions || DEFAULT_SUGGESTIONS);
    setAiStatus('ready');
    setIsMobileDrawerOpen(false);
  };

  // Toggle Pin Conversation
  const handleTogglePin = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.map((s) => {
      if (s.id === sessionId) {
        return { ...s, isPinned: !s.isPinned };
      }
      return s;
    });
    persistSessions(updated);
  };

  // Delete Conversation
  const handleConfirmDeleteSession = () => {
    if (!deleteSessionTarget) return;
    const targetId = deleteSessionTarget.id;
    const updated = sessions.filter((s) => s.id !== targetId);
    persistSessions(updated);

    if (activeSessionId === targetId) {
      if (updated.length > 0) {
        handleSelectSession(updated[0]);
      } else {
        handleNewChat();
      }
    }
    setDeleteSessionTarget(null);
  };

  // Clear All History
  const handleConfirmClearAll = () => {
    persistSessions([]);
    handleNewChat();
    setIsClearHistoryConfirmOpen(false);
  };

  // Copy Message Helper
  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Toggle Like / Dislike
  const handleToggleFeedback = (msgId: string, type: 'like' | 'dislike') => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          if (type === 'like') {
            return { ...m, isLiked: !m.isLiked, isDisliked: false };
          } else {
            return { ...m, isDisliked: !m.isDisliked, isLiked: false };
          }
        }
        return m;
      })
    );
  };

  // Stop Generation Helper
  const handleStopGeneration = () => {
    chatMutation.reset();
    setAiStatus('ready');
  };

  // Refresh Suggestions
  const handleRefreshSuggestions = () => {
    setCurrentSuggestions((prev) =>
      prev[0] === DEFAULT_SUGGESTIONS[0] ? ALTERNATE_SUGGESTIONS : DEFAULT_SUGGESTIONS
    );
  };

  // Filtered Sessions for Search
  const filteredSessions = useMemo(() => {
    const q = searchHistoryQuery.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => s.title.toLowerCase().includes(q));
  }, [sessions, searchHistoryQuery]);

  const pinnedSessions = useMemo(() => {
    return filteredSessions.filter((s) => s.isPinned);
  }, [filteredSessions]);

  const recentSessions = useMemo(() => {
    return filteredSessions.filter((s) => !s.isPinned).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [filteredSessions]);

  // Horizontal scroll handler for job cards
  const scrollJobCards = (direction: 'left' | 'right') => {
    if (jobsScrollRef.current) {
      const scrollAmount = direction === 'right' ? 320 : -320;
      jobsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="h-full max-h-full overflow-hidden bg-[#F4F6FC] dark:bg-[#090C16] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* File Upload Hidden Input (Photos & Files) */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const sizeStr =
              file.size > 1024 * 1024
                ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
                : (file.size / 1024).toFixed(0) + ' KB';
            setAttachedFiles((prev) => [
              ...prev,
              {
                id: 'file_' + Date.now(),
                name: file.name,
                type: file.type.startsWith('image') ? 'image' : 'document',
                size: sizeStr,
              },
            ]);
          }
        }}
      />

      {/* Main Workspace Dual-Pane Layout (Viewport Locked) */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto p-2 sm:p-4 md:p-5 flex gap-4 md:gap-6 h-full max-h-full min-h-0 overflow-hidden">
        {/* ========================================================================= */}
        {/* LEFT SIDEBAR: Permanently Fixed in Position */}
        {/* ========================================================================= */}
        <aside
          className={`
            fixed md:relative inset-y-0 left-0 z-40 md:z-auto
            w-[290px] sm:w-[310px] h-full max-h-full shrink-0
            bg-white dark:bg-[#101524] rounded-3xl border border-slate-200/80 dark:border-slate-800/80
            shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden transition-transform duration-300 ease-in-out
            ${isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          {/* Sidebar Header (Fixed at top) */}
          <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#6355EC] text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                    AI Career Coach
                  </h2>
                </div>
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Online</span>
                  <span>•</span>
                  <span className="truncate max-w-[120px]">Your personal assistant</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Button & Search Bar (Fixed at top) */}
          <div className="shrink-0 p-4 space-y-3">
            <button
              type="button"
              onClick={handleNewChat}
              className="w-full py-3 px-4 rounded-2xl bg-[#6355EC] hover:bg-[#5244DD] text-white text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 shadow-md shadow-indigo-500/25 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Chat</span>
            </button>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchHistoryQuery}
                onChange={(e) => setSearchHistoryQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#6355EC] focus:ring-1 focus:ring-[#6355EC]/20 transition-all"
              />
            </div>
          </div>

          {/* Scrollable Conversation Lists & Tools (Middle Scroll Area) */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-1 space-y-5 text-xs no-scrollbar">
            {/* Pinned Section */}
            {pinnedSessions.length > 0 && (
              <div>
                <div className="px-1 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Pin className="w-3.5 h-3.5 text-[#6355EC]" />
                  <span>Pinned</span>
                </div>
                <div className="space-y-1 mt-1.5">
                  {pinnedSessions.map((session) => {
                    const isActive = activeSessionId === session.id;
                    return (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session)}
                        className={`group relative p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                          isActive
                            ? 'bg-[#EEF0FF] dark:bg-[#1E2238] text-[#4F46E5] dark:text-[#818CF8] font-semibold border border-indigo-200/80 dark:border-indigo-800/80'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">{session.title}</p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                              Today • {session.messages.length} messages
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={(e) => handleTogglePin(session.id, e)}
                            title="Unpin"
                            className="p-1 text-[#6355EC] hover:opacity-80"
                          >
                            <Pin className="w-3.5 h-3.5 fill-[#6355EC]" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Section */}
            <div>
              <div className="px-1 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Recent</span>
              </div>

              {recentSessions.length === 0 ? (
                <p className="px-2 py-2 text-[11px] text-slate-400 dark:text-slate-500 italic">
                  {searchHistoryQuery ? 'No matching conversations' : 'No previous conversations'}
                </p>
              ) : (
                <div className="space-y-1 mt-1.5">
                  {recentSessions.map((session) => {
                    const isActive = activeSessionId === session.id;
                    return (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session)}
                        className={`group relative p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                          isActive
                            ? 'bg-[#EEF0FF] dark:bg-[#1E2238] text-[#4F46E5] dark:text-[#818CF8] font-semibold border border-indigo-200/80 dark:border-indigo-800/80'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">{session.title}</p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                              {new Date(session.updatedAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              • {session.messages.length} messages
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 opacity-70 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteSessionTarget(session);
                            }}
                            title="Options"
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tools Section */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="px-1 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 mb-1">
                <Sliders className="w-3.5 h-3.5 text-[#6355EC]" />
                <span>Tools</span>
              </div>
              <div className="space-y-1">
                {AI_CAREER_TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => {
                        setIsMobileDrawerOpen(false);
                        handleSendPrompt(tool.prompt);
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 flex items-center space-x-2.5 transition-all cursor-pointer"
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${tool.iconBg}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium text-xs text-slate-800 dark:text-slate-200 truncate">
                        {tool.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* More Section (Pinned at Bottom of Sidebar) */}
          <div className="shrink-0 p-3.5 border-t border-slate-100 dark:border-slate-800">
            <div className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              <span>More</span>
            </div>
            <button
              type="button"
              onClick={() => setIsClearHistoryConfirmOpen(true)}
              className="w-full text-left p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-xs">Clear Chat History</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {isMobileDrawerOpen && (
          <div
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-30 md:hidden"
          />
        )}

        {/* ========================================================================= */}
        {/* RIGHT MAIN WORKSPACE PANE */}
        {/* ========================================================================= */}
        <main className="flex-1 flex flex-col min-w-0 h-full max-h-full min-h-0 bg-transparent space-y-3 overflow-hidden">
          {/* Top Actions Bar */}
          <div className="shrink-0 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => navigate('/candidate/dashboard')}
                className="px-4 py-2 rounded-2xl bg-white dark:bg-[#101524] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Dashboard</span>
              </button>

              {/* Mobile Drawer Trigger */}
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="p-2 rounded-2xl bg-white dark:bg-[#101524] border border-slate-200 dark:border-slate-800 text-slate-600 md:hidden"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleNewChat}
              className="px-4 py-2 rounded-2xl bg-[#6355EC] hover:bg-[#5244DD] text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Chat</span>
            </button>
          </div>

          {/* Chat Container Card */}
          <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-[#101524] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
            {/* AI Status Header Bar inside chat */}
            <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#6355EC] text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    JobConnect AI Career Coach
                  </h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                    {aiStatus === 'thinking' ? 'Thinking...' : 'Ready'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Personalized • Uses your profile, resume & job data
                </p>
              </div>
            </div>

            {/* Scrollable Conversation Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* ===================================================================== */}
              {/* HERO BANNER: 3D Robot + Quick Action Tools (Always accessible at top) */}
              {/* ===================================================================== */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-50/70 via-pink-50/40 to-blue-50/60 dark:from-[#13192B] dark:via-[#161D32] dark:to-[#171A2E] border border-purple-100/80 dark:border-slate-800/80 shadow-xs relative overflow-hidden">
                <div className="flex flex-col lg:flex-row items-center gap-6">
                  {/* Left: 3D Cute Robot Illustration */}
                  <CuteRobotHeroIllustration />

                  {/* Right: Greeting + Description + 5 Quick Tools */}
                  <div className="flex-1 space-y-3.5 text-center lg:text-left">
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {timeOfDayGreeting}, {userName} 👋
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
                        I'm your JobConnect AI Career Coach. I can help you find the right jobs, improve your profile, prepare for interviews and more.
                      </p>
                    </div>

                    {/* 5 Quick Action Cards Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
                      {AI_CAREER_TOOLS.map((tool) => {
                        const Icon = tool.icon;
                        return (
                          <div
                            key={tool.id}
                            onClick={() => handleSendPrompt(tool.prompt)}
                            className="p-3 rounded-2xl bg-white dark:bg-[#161D32] border border-slate-200/80 dark:border-slate-700/80 hover:border-[#6355EC] dark:hover:border-[#6355EC] hover:shadow-md transition-all cursor-pointer group text-left flex flex-col justify-between"
                          >
                            <div className="flex items-center space-x-2 mb-1.5">
                              <div className={`p-1.5 rounded-xl ${tool.iconBg}`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                {tool.shortLabel || tool.label}
                              </h4>
                              <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 truncate">
                                {tool.subtitle}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* ===================================================================== */}
              {/* SUGGESTED FOR YOU SECTION */}
              {/* ===================================================================== */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#6355EC]" />
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Suggested for you
                    </span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      • Based on your profile, skills and career goals
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleRefreshSuggestions}
                    className="text-[11px] text-[#6355EC] hover:text-[#5244DD] font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh suggestions</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {currentSuggestions.map((promptText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendPrompt(promptText)}
                      className="p-2.5 rounded-2xl bg-white dark:bg-[#151B2E] border border-slate-200/90 dark:border-slate-800 hover:border-[#6355EC] dark:hover:border-[#6355EC] text-slate-700 dark:text-slate-300 hover:text-[#6355EC] dark:hover:text-[#818CF8] text-xs font-medium flex items-center space-x-2 shadow-2xs hover:shadow-xs transition-all text-left cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                        {idx === 0 ? <Search className="w-3 h-3" /> : idx === 1 ? <FileText className="w-3 h-3" /> : idx === 2 ? <Mic className="w-3 h-3" /> : <Lightbulb className="w-3 h-3" />}
                      </div>
                      <span className="truncate">{promptText}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ===================================================================== */}
              {/* CHAT MESSAGES STREAM */}
              {/* ===================================================================== */}
              <div className="space-y-6 pt-2">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const showJobCount = visibleJobsCount[msg.id] || 3;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5 animate-fadeIn`}
                    >
                      {/* Message Author & Avatar Info */}
                      {!isUser && (
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400 mb-1">
                          <div className="w-6 h-6 rounded-lg bg-[#6355EC] text-white flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">JobConnect AI</span>
                          <span>•</span>
                          <span>{msg.timeFormatted || '2:45 PM'}</span>
                        </div>
                      )}

                      {/* User Message Bubble */}
                      {isUser ? (
                        <div className="flex items-end space-x-2.5 max-w-[85%] sm:max-w-[70%]">
                          <div className="space-y-1">
                            <div className="p-3.5 sm:px-5 sm:py-3 rounded-2xl rounded-tr-xs bg-[#6355EC] text-white text-xs sm:text-sm font-medium shadow-sm">
                              {msg.text}
                            </div>
                            <div className="text-[10px] text-slate-400 text-right pr-1">
                              {msg.timeFormatted || '2:45 PM'}
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-[#6355EC] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                            <User className="w-4 h-4" />
                          </div>
                        </div>
                      ) : (
                        /* Assistant Message Bubble */
                        <div className="w-full max-w-full space-y-3">
                          <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                          </div>

                          {/* Matched Job Cards Horizontal Carousel / Grid */}
                          {msg.matchedJobs && msg.matchedJobs.length > 0 && (
                            <div className="space-y-3 pt-1">
                              <div className="relative">
                                {/* Scroll Left / Right Controls */}
                                <div
                                  ref={jobsScrollRef}
                                  className="flex items-stretch gap-4 overflow-x-auto pb-2 scroll-smooth no-scrollbar"
                                >
                                  {msg.matchedJobs.slice(0, showJobCount).map((job) => {
                                    const isSaved = savedJobIds.has(job._id);
                                    return (
                                      <div
                                        key={job._id}
                                        className="w-[280px] sm:w-[320px] shrink-0 p-4 rounded-2xl bg-white dark:bg-[#141B2E] border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 shadow-xs flex flex-col justify-between space-y-3 transition-all"
                                      >
                                        {/* Card Top: Logo, Company Name, Match Pill */}
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex items-center space-x-2.5 min-w-0">
                                            <CompanyLogoBadge company={job.companyName} logoType={job.companyLogo} />
                                            <div className="min-w-0">
                                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                                                {job.companyName}
                                              </p>
                                            </div>
                                          </div>
                                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                            {job.matchScore}% match
                                          </span>
                                        </div>

                                        {/* Card Title & Location/Salary */}
                                        <div>
                                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                            {job.title}
                                          </h3>
                                          <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1.5">
                                            <span>⬡</span>
                                            <span>{job.location}</span>
                                            <span>•</span>
                                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                                              {job.salaryText || '₹12L – ₹18L'}
                                            </span>
                                          </p>
                                        </div>

                                        {/* Skills Tags */}
                                        <div className="flex flex-wrap gap-1.5">
                                          {job.skills.map((skill, sIdx) => (
                                            <span
                                              key={sIdx}
                                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                            >
                                              {skill}
                                            </span>
                                          ))}
                                        </div>

                                        {/* Card Action Buttons */}
                                        <div className="flex items-center space-x-2 pt-1">
                                          <button
                                            type="button"
                                            onClick={() => navigate(job.slug ? `/jobs/${job.slug}` : `/jobs/${job._id}`)}
                                            className="flex-1 py-2 px-3 rounded-xl bg-[#6355EC] hover:bg-[#5244DD] text-white text-xs font-semibold flex items-center justify-center space-x-1 shadow-xs transition-all cursor-pointer"
                                          >
                                            <span>Apply Now</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => saveJobMutation.mutate(job._id)}
                                            className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                                              isSaved
                                                ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 text-[#6355EC]'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                          >
                                            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#6355EC]' : ''}`} />
                                            <span>{isSaved ? 'Saved' : 'Save'}</span>
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Right Arrow Carousel Button */}
                                {msg.matchedJobs.length > 3 && (
                                  <button
                                    type="button"
                                    onClick={() => scrollJobCards('right')}
                                    className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-slate-600 dark:text-slate-300 items-center justify-center hover:bg-slate-50 transition-all cursor-pointer z-10"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              {/* Show More Jobs Toggle */}
                              {msg.matchedJobs.length > 3 && (
                                <div className="text-center pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVisibleJobsCount((prev) => ({
                                        ...prev,
                                        [msg.id]: prev[msg.id] === msg.matchedJobs!.length ? 3 : msg.matchedJobs!.length,
                                      }));
                                    }}
                                    className="text-xs font-semibold text-slate-500 hover:text-[#6355EC] inline-flex items-center space-x-1 cursor-pointer"
                                  >
                                    <span>
                                      {showJobCount === msg.matchedJobs.length
                                        ? 'Show less jobs'
                                        : `Show ${msg.matchedJobs.length - 3} more jobs`}
                                    </span>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}

                              {/* Info Disclaimer Banner with Copy & Feedback Buttons */}
                              <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-slate-800/40 border border-blue-100/70 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                <div className="flex items-center space-x-2">
                                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  <span>
                                    These jobs are based on your profile, skills and preferences. You can refine your search or ask for more specific requirements.
                                  </span>
                                </div>

                                <div className="flex items-center space-x-1 shrink-0 ml-2">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyMessage(msg.id, msg.text)}
                                    title="Copy message"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                  >
                                    {copiedMsgId === msg.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleFeedback(msg.id, 'like')}
                                    title="Helpful"
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      msg.isLiked
                                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleFeedback(msg.id, 'dislike')}
                                    title="Not helpful"
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      msg.isDisliked
                                        ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    <ThumbsDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Thinking Indicator */}
                {aiStatus === 'thinking' && (
                  <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 animate-fadeIn">
                    <span className="w-2 h-2 rounded-full bg-[#6355EC] animate-ping" />
                    <span>AI Career Coach is analyzing your request and matching opportunities...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* ========================================================================= */}
            {/* BOTTOM STICKY COMPOSER (Input + Attach Resume + Context Toggles) */}
            {/* ========================================================================= */}
            <div className="shrink-0 p-3 sm:p-4 bg-white dark:bg-[#101524] border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-2 max-w-4xl mx-auto">
                {/* Active Modes & Attached Files Bar */}
                {(attachedFiles.length > 0 || isWebSearchEnabled || isDeepResearchEnabled || isThinkingEnabled) && (
                  <div className="flex flex-wrap items-center gap-1.5 px-1 pb-0.5">
                    {isThinkingEnabled && (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-[#6355EC] dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-semibold animate-fadeIn">
                        <Brain className="w-3 h-3 text-[#6355EC]" />
                        <span>Thinking</span>
                        <button
                          type="button"
                          onClick={() => setIsThinkingEnabled(false)}
                          className="hover:text-purple-950 dark:hover:text-white ml-0.5 cursor-pointer"
                          title="Disable thinking mode"
                        >
                          ✕
                        </button>
                      </span>
                    )}

                    {isWebSearchEnabled && (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[10px] font-semibold animate-fadeIn">
                        <Globe className="w-3 h-3 text-sky-500" />
                        <span>Web search</span>
                        <button
                          type="button"
                          onClick={() => setIsWebSearchEnabled(false)}
                          className="hover:text-sky-950 dark:hover:text-white ml-0.5 cursor-pointer"
                          title="Disable web search"
                        >
                          ✕
                        </button>
                      </span>
                    )}

                    {isDeepResearchEnabled && (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-semibold animate-fadeIn">
                        <Telescope className="w-3 h-3 text-indigo-500" />
                        <span>Deep research</span>
                        <button
                          type="button"
                          onClick={() => setIsDeepResearchEnabled(false)}
                          className="hover:text-indigo-950 dark:hover:text-white ml-0.5 cursor-pointer"
                          title="Disable deep research"
                        >
                          ✕
                        </button>
                      </span>
                    )}

                    {attachedFiles.map((file) => (
                      <span
                        key={file.id}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-medium animate-fadeIn"
                      >
                        {file.type === 'sketch' ? (
                          <Pencil className="w-3 h-3 text-[#6355EC]" />
                        ) : (
                          <Paperclip className="w-3 h-3 text-slate-400" />
                        )}
                        <span className="max-w-[130px] truncate">{file.name}</span>
                        {file.size && <span className="text-[9px] text-slate-400">({file.size})</span>}
                        <button
                          type="button"
                          onClick={() => setAttachedFiles((prev) => prev.filter((f) => f.id !== file.id))}
                          className="hover:text-rose-500 ml-0.5 font-bold cursor-pointer"
                          title="Remove attachment"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Main Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendPrompt();
                  }}
                  className="p-1.5 sm:p-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#141B2E] flex items-center gap-2 focus-within:border-[#6355EC] focus-within:ring-2 focus-within:ring-[#6355EC]/20 transition-all shadow-xs"
                >
                  {/* Left: Plus Menu & Attach Resume */}
                  <div className="relative flex items-center space-x-1.5 shrink-0 pl-1">
                    <button
                      type="button"
                      onClick={() => setIsPlusMenuOpen((prev) => !prev)}
                      className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                        isPlusMenuOpen
                          ? 'bg-[#6355EC] text-white border-[#6355EC] shadow-sm ring-2 ring-[#6355EC]/20'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                      title="Add tools, files & modes"
                    >
                      <Plus className={`w-4 h-4 transition-transform duration-200 ${isPlusMenuOpen ? 'rotate-45' : ''}`} />
                    </button>

                    {/* PLUS POPUP MENU MATCHING media_1790848255979.png */}
                    {isPlusMenuOpen && (
                      <div
                        ref={plusMenuRef}
                        className="absolute bottom-full left-0 mb-3 w-72 sm:w-80 bg-white dark:bg-[#151B2E] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-1.5 z-50 text-left animate-fadeIn backdrop-blur-md"
                      >
                        <div className="space-y-0.5">
                          {/* 1. Add photos & files */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsPlusMenuOpen(false);
                              fileInputRef.current?.click();
                            }}
                            className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center space-x-3 text-left transition-colors cursor-pointer group"
                          >
                            <Paperclip className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-[#6355EC] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                                Add photos & files
                              </span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                                Upload from computer
                              </span>
                            </div>
                          </button>

                          {/* 2. Add library files */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsPlusMenuOpen(false);
                              setIsLibraryModalOpen(true);
                            }}
                            className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center space-x-3 text-left transition-colors cursor-pointer group"
                          >
                            <BookOpen className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-[#6355EC] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                                Add library files
                              </span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                                Browse and search your files
                              </span>
                            </div>
                          </button>

                          {/* 3. Create image */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsPlusMenuOpen(false);
                              setInputQuery('Generate a system architecture diagram and flowchart for a scalable MERN job portal.');
                              composerInputRef.current?.focus();
                            }}
                            className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center space-x-3 text-left transition-colors cursor-pointer group"
                          >
                            <ImageIcon className="w-4 h-4 text-amber-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                                Create image
                              </span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                                Visualize anything
                              </span>
                            </div>
                          </button>

                          {/* 4. Sketch */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsPlusMenuOpen(false);
                              setIsSketchModalOpen(true);
                            }}
                            className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center space-x-3 text-left transition-colors cursor-pointer group"
                          >
                            <Pencil className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-[#6355EC] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                                Sketch
                              </span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                                Draw and attach an image
                              </span>
                            </div>
                          </button>

                          {/* 5. Web search */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsWebSearchEnabled((prev) => !prev);
                              setIsPlusMenuOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl flex items-center space-x-3 text-left transition-colors cursor-pointer group ${
                              isWebSearchEnabled
                                ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/80'
                            }`}
                          >
                            <Globe className="w-4 h-4 text-sky-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                                Web search
                              </span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                                Find real-time news and info
                              </span>
                            </div>
                            {isWebSearchEnabled && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
                                Active
                              </span>
                            )}
                          </button>

                          {/* 6. Thinking (Shown as "Thinking Selected" in screenshot) */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsThinkingEnabled((prev) => !prev);
                              setIsPlusMenuOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl flex items-center space-x-3 text-left transition-colors cursor-pointer group ${
                              isThinkingEnabled
                                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/80'
                            }`}
                          >
                            <Brain className="w-4 h-4 text-[#6355EC] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                                Thinking
                              </span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                                {isThinkingEnabled ? 'Selected' : 'Deep reasoning'}
                              </span>
                            </div>
                            {isThinkingEnabled && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-900/60 text-[#6355EC]">
                                Selected
                              </span>
                            )}
                          </button>

                          {/* 7. Deep research */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsDeepResearchEnabled((prev) => !prev);
                              setIsPlusMenuOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl flex items-center space-x-3 text-left transition-colors cursor-pointer group ${
                              isDeepResearchEnabled
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/80'
                            }`}
                          >
                            <Telescope className="w-4 h-4 text-indigo-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                                Deep research
                              </span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                                Get a detailed report
                              </span>
                            </div>
                            {isDeepResearchEnabled && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                                Active
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Middle: Text Input */}
                  <input
                    ref={composerInputRef}
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="Ask about jobs, resume, interviews, or anything related to your career..."
                    className="flex-1 bg-transparent px-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none min-w-0"
                  />

                  {/* Right: Mic & Send Buttons */}
                  <div className="flex items-center space-x-1.5 shrink-0 pr-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleSendPrompt('Run a mock interview question for React performance optimization.');
                      }}
                      className="p-2 text-slate-400 hover:text-[#6355EC] transition-colors rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                      title="Voice prompt"
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    {aiStatus === 'thinking' ? (
                      <button
                        type="button"
                        onClick={handleStopGeneration}
                        className="w-9 h-9 rounded-xl bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                        title="Stop generation"
                      >
                        <Square className="w-4 h-4 fill-white" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!inputQuery.trim()}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          inputQuery.trim()
                            ? 'bg-[#6355EC] hover:bg-[#5244DD] text-white shadow-md shadow-indigo-500/25 active:scale-95 cursor-pointer'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                        }`}
                        title="Send message"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </form>

                {/* Sub-bar: Using Context Chips & Stop Generating */}
                <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
                  <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
                    <span className="font-semibold text-slate-500">Using:</span>
                    <button
                      type="button"
                      onClick={() => setUseProfileContext((prev) => !prev)}
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-medium flex items-center space-x-1 transition-all ${
                        useProfileContext
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          : 'opacity-40 border-dashed'
                      }`}
                    >
                      <User className="w-2.5 h-2.5" />
                      <span>Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUseResumeContext((prev) => !prev)}
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-medium flex items-center space-x-1 transition-all ${
                        useResumeContext
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          : 'opacity-40 border-dashed'
                      }`}
                    >
                      <FileText className="w-2.5 h-2.5" />
                      <span>Resume</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUseJobPrefsContext((prev) => !prev)}
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-medium flex items-center space-x-1 transition-all ${
                        useJobPrefsContext
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          : 'opacity-40 border-dashed'
                      }`}
                    >
                      <Briefcase className="w-2.5 h-2.5" />
                      <span>Job Preferences</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUseApplicationsContext((prev) => !prev)}
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-medium flex items-center space-x-1 transition-all ${
                        useApplicationsContext
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          : 'opacity-40 border-dashed'
                      }`}
                    >
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Applications</span>
                    </button>
                  </div>

                  {aiStatus === 'thinking' && (
                    <button
                      type="button"
                      onClick={handleStopGeneration}
                      className="px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-semibold flex items-center space-x-1 hover:bg-rose-100 transition-colors"
                    >
                      <Square className="w-2.5 h-2.5 fill-rose-600" />
                      <span>Stop generating</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* FLOATING HELPER WIDGET (Bottom Right: "Need help? I'm here!") */}
      {/* ========================================================================= */}
      <div className="fixed bottom-5 right-6 z-30 flex items-center space-x-2 select-none pointer-events-auto">
        <div className="px-3 py-1.5 rounded-full bg-white dark:bg-[#161D32] border border-slate-200 dark:border-slate-700 shadow-md text-xs font-medium text-slate-700 dark:text-slate-200 animate-pulse">
          Need help? <strong className="text-[#6355EC]">I'm here!</strong>
        </div>
        <button
          type="button"
          onClick={() => {
            composerInputRef.current?.focus();
          }}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#6355EC] to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
          title="AI Assistant Ready"
        >
          <Bot className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: DELETE CONVERSATION CONFIRMATION */}
      {/* ========================================================================= */}
      {deleteSessionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Delete Conversation?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to delete <strong>"{deleteSessionTarget.title}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteSessionTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSession}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CLEAR ALL HISTORY CONFIRMATION */}
      {/* ========================================================================= */}
      {isClearHistoryConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Clear All Conversations?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This will delete your entire chat history with the AI Career Coach.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearHistoryConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL: INTERACTIVE SKETCH CANVAS */}
      {/* ========================================================================= */}
      <SketchCanvasModal
        isOpen={isSketchModalOpen}
        onClose={() => setIsSketchModalOpen(false)}
        onSaveSketch={(dataUrl) => {
          setAttachedFiles((prev) => [
            ...prev,
            {
              id: 'sketch_' + Date.now(),
              name: `Sketch_${Date.now().toString().slice(-4)}.png`,
              type: 'sketch',
              url: dataUrl,
            },
          ]);
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL: LIBRARY FILES SELECTOR */}
      {/* ========================================================================= */}
      <LibraryFilesModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        userName={userName}
        onSelectFile={(file) => {
          setAttachedFiles((prev) => [
            ...prev,
            {
              id: file.id,
              name: file.name,
              type: file.type,
              size: file.size,
            },
          ]);
        }}
      />
    </div>
  );
};
