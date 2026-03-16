import { useState, useEffect } from 'react';
import { questionData, type Question } from '@/data/questions';

export type AppMode = 'welcome' | 'practice' | 'exam' | 'infinite';
export type ExamState = 'intro' | 'active' | 'result';

export const PROGRESS_STORAGE_KEY = 'quiz_progress_v1';
export const SETTINGS_STORAGE_KEY = 'quiz_settings_v1';

export type NotificationState = {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
};

export interface ExamConfig {
  questionCount: number;
  timeLimit: number;
}

export function useQuizState() {
  // 动态获取第一个模块 ID 作为默认值
  const defaultModuleId = Object.keys(questionData)[0] || 'module1';
  
  const [initial] = useState(() => {
    const progress: { answers: Record<string, Record<string, number>>; lastModuleId?: string; lastIndex?: number } = {
      answers: {}
    };

    const settings: ExamConfig = {
      questionCount: 30,
      timeLimit: 30
    };

    if (typeof window !== 'undefined') {
      const savedProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (savedProgress) {
        try {
          const parsed = JSON.parse(savedProgress);
          if (parsed && typeof parsed === 'object') {
            progress.answers = parsed.answers || {};
            progress.lastModuleId = parsed.lastModuleId;
            progress.lastIndex = parsed.lastIndex;
          }
        } catch {
          console.error('解析保存的进度失败');
        }
      }

      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed && typeof parsed === 'object') {
            settings.questionCount = parsed.questionCount ?? settings.questionCount;
            settings.timeLimit = parsed.timeLimit ?? settings.timeLimit;
          }
        } catch {
          console.error('解析保存的设置失败');
        }
      }
    }

    return { progress, settings };
  });

  const [currentModuleId, setCurrentModuleId] = useState<string>(initial.progress.lastModuleId || defaultModuleId);
  const [mode, setMode] = useState<AppMode>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initial.progress.lastIndex ?? 0);
  const [userAnswers, setUserAnswers] = useState<Record<string, Record<string, number>>>(initial.progress.answers || {});
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [infiniteQuestions, setInfiniteQuestions] = useState<Question[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [showResultCard, setShowResultCard] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [examState, setExamState] = useState<ExamState>('intro');
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [examSessionId, setExamSessionId] = useState<number>(0);
  const [examSeedString, setExamSeedString] = useState<string>('');
  
  const [examConfig, setExamConfig] = useState<ExamConfig>(initial.settings);

  const [timeLeft, setTimeLeft] = useState(0);
  const [infinitePool, setInfinitePool] = useState<Question[]>([]);

  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Save state effects
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (Object.keys(userAnswers).length === 0) {
      localStorage.removeItem(PROGRESS_STORAGE_KEY);
      return;
    }
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({
      answers: userAnswers,
      lastModuleId: currentModuleId,
      lastIndex: currentQuestionIndex
    }));
  }, [userAnswers, currentModuleId, currentQuestionIndex]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(examConfig));
  }, [examConfig]);

  const clearProgress = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PROGRESS_STORAGE_KEY);
    }
    setUserAnswers({});
    setCurrentQuestionIndex(0);
  };

  return {
    state: {
      currentModuleId,
      mode,
      currentQuestionIndex,
      userAnswers,
      examQuestions,
      infiniteQuestions,
      sidebarOpen,
      sidebarCollapsed,
      examSubmitted,
      showResultCard,
      isProgressModalOpen,
      isSettingsModalOpen,
      examState,
      exitConfirmOpen,
      submitConfirmOpen,
      clearConfirmOpen,
      examSessionId,
      examSeedString,
      examConfig,
      timeLeft,
      infinitePool,
      notification,
      defaultModuleId
    },
    actions: {
      setCurrentModuleId,
      setMode,
      setCurrentQuestionIndex,
      setUserAnswers,
      setExamQuestions,
      setInfiniteQuestions,
      setSidebarOpen,
      setSidebarCollapsed,
      setExamSubmitted,
      setShowResultCard,
      setIsProgressModalOpen,
      setIsSettingsModalOpen,
      setExamState,
      setExitConfirmOpen,
      setSubmitConfirmOpen,
      setClearConfirmOpen,
      setExamSessionId,
      setExamSeedString,
      setExamConfig,
      setTimeLeft,
      setInfinitePool,
      setNotification,
      clearProgress
    }
  };
}
