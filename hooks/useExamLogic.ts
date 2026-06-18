import { useMemo, useEffect, useCallback } from 'react';
import { useQuizState, PROGRESS_STORAGE_KEY } from './useQuizState';
import { useExamTimer } from './useExamTimer';
import {
  calculateExamResult,
  createExamQuestions,
  encodeExamSeed,
  getAllQuestions,
  getModeModuleData,
  resolveExamConfig,
  shuffleQuestions
} from '@/utils/exam';

export function useExamLogic(
  state: ReturnType<typeof useQuizState>['state'],
  actions: ReturnType<typeof useQuizState>['actions']
) {
  const {
    currentModuleId, mode, currentQuestionIndex, userAnswers,
    examQuestions, infiniteQuestions, examSubmitted, showResultCard,
    examState, examConfig, timeLeft, infinitePool
  } = state;

  const {
    setMode, setCurrentModuleId, setCurrentQuestionIndex, setUserAnswers,
    setExamQuestions, setInfiniteQuestions, setSidebarOpen, setExamSubmitted,
    setShowResultCard, setExamState, setExitConfirmOpen, setSubmitConfirmOpen,
    setClearConfirmOpen, setExamSessionId, setExamSeedString, setExamConfig,
    setTimeLeft, setInfinitePool, setNotification, setIsSettingsModalOpen
  } = actions;

  // Notification helpers
  const showNotification = useCallback((title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setNotification({ isOpen: true, title, message, type });
  }, [setNotification]);

  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  }, [setNotification]);

  const currentModuleData = useMemo(() => {
    return getModeModuleData({
      mode,
      currentModuleId,
      examQuestions,
      infiniteQuestions
    });
  }, [currentModuleId, mode, examQuestions, infiniteQuestions]);

  const currentQuestion = currentModuleData?.questions[currentQuestionIndex];
  const isExamActive = mode === 'exam' && examState === 'active' && !examSubmitted;
  const isReviewing = mode === 'exam' && examState === 'result' && !showResultCard;

  // Navigation Logic
  const checkNavigation = useCallback((action: () => void) => {
    if (isExamActive) {
      if (window.confirm('正在考试中，离开将丢失当前进度，确认离开？')) {
        action();
      }
    } else {
      action();
    }
  }, [isExamActive]);

  const handleModuleChange = (moduleId: string) => {
    checkNavigation(() => {
      setMode('practice');
      setCurrentModuleId(moduleId);
      setCurrentQuestionIndex(0);
      setSidebarOpen(false);
      setExamSubmitted(false);
      setShowResultCard(false);
    });
  };

  const handleGoHome = () => {
    checkNavigation(() => {
      setMode('welcome');
      setSidebarOpen(false);
    });
  };

  const prepareExam = () => {
    checkNavigation(() => {
      setMode('exam');
      setExamState('intro');
      setSidebarOpen(false);
      setShowResultCard(false);
      setExamSubmitted(false);
    });
  };

  const startExam = (customSeedString?: string) => {
    const allQuestions = getAllQuestions();
    if (allQuestions.length === 0) {
      showNotification('无法开始考试', '题库为空，请先添加题目后再开始考试。', 'error');
      return;
    }
    
    const resolvedConfig = resolveExamConfig(customSeedString, examConfig);
    if (!resolvedConfig) {
      console.error('种子解析失败');
      showNotification('无效的种子', '输入的种子格式不正确或已损坏。请检查后重试，或直接点击“开始答题”生成新试卷。', 'error');
      return;
    }

    const { seed, questionCount, timeLimit } = resolvedConfig;
    setExamConfig({ questionCount, timeLimit });
    setExamSessionId(seed);
    setExamSeedString(encodeExamSeed(seed, questionCount, timeLimit));
    
    setExamQuestions(createExamQuestions(allQuestions, seed, questionCount));
    setExamState('active');
    setCurrentQuestionIndex(0);
    setUserAnswers(prev => ({ ...prev, 'exam': {} }));
    setExamSubmitted(false);
    setShowResultCard(false);
    setTimeLeft(timeLimit * 60);
  };

  const performSubmit = useCallback(() => {
    setExamSubmitted(true);
    setExamState('result');
    setShowResultCard(true);
    setCurrentQuestionIndex(0);
    setSubmitConfirmOpen(false);
  }, [setExamSubmitted, setExamState, setShowResultCard, setCurrentQuestionIndex, setSubmitConfirmOpen]);

  const submitExam = useCallback((auto = false) => {
    if (!auto) {
      setSubmitConfirmOpen(true);
      return;
    }
    performSubmit();
  }, [setSubmitConfirmOpen, performSubmit]);

  const submitExpiredExam = useCallback(() => {
    submitExam(true);
  }, [submitExam]);

  useExamTimer({
    isActive: isExamActive,
    timeLeft,
    setTimeLeft,
    onExpire: submitExpiredExam
  });

  // Infinite mode logic
  const startInfinite = () => {
    checkNavigation(() => {
      setMode('infinite');
      setExamSessionId(Date.now());
      setInfiniteQuestions([]);
      setCurrentQuestionIndex(0);
      setUserAnswers(prev => ({ ...prev, 'infinite': {} }));
      setSidebarOpen(false);
      setShowResultCard(false);
      
      const allQuestions = getAllQuestions();
      if (allQuestions.length > 0) {
        const firstQ = allQuestions[Math.floor(Math.random() * allQuestions.length)];
        // id is already a UUID string
        setInfiniteQuestions([{ ...firstQ }]);
      }
    });
  };

  useEffect(() => {
    if (mode === 'infinite' && infinitePool.length === 0) {
      setInfinitePool(shuffleQuestions(getAllQuestions()));
    }
  }, [mode, infinitePool.length, setInfinitePool]);

  const handleNextQuestion = () => {
    if (mode === 'infinite') {
      if (infinitePool.length > 0) {
        const nextQ = infinitePool[0];
        setInfinitePool(prev => prev.slice(1));
        // Use existing UUID, do not overwrite with number
        setInfiniteQuestions(prev => [...prev, { ...nextQ }]);
        setCurrentQuestionIndex(prev => prev + 1);
        
        if (infinitePool.length <= 1) {
           setInfinitePool(shuffleQuestions(getAllQuestions()));
        }
      } else {
        setInfinitePool(shuffleQuestions(getAllQuestions()));
      }
    } else {
      setCurrentQuestionIndex(prev => Math.min((currentModuleData?.questions.length || 1) - 1, prev + 1));
    }
  };

  const handleAnswer = (answerIndex: number) => {
    const moduleId = mode === 'exam' ? 'exam' : (mode === 'infinite' ? 'infinite' : currentModuleId);
    const questionId = currentQuestion?.id;
    
    if (!questionId) return;

    setUserAnswers(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [questionId]: answerIndex
      }
    }));

    // 模式特定逻辑：自动跳转
    if (mode === 'infinite') {
      setTimeout(() => {
        handleNextQuestion();
      }, 1000);
    } else if (mode === 'exam') {
      // 在考试模式下，提交答案后自动切换到下一题（如果是最后一题则不跳转）
      const isLastQuestion = currentQuestionIndex === (currentModuleData?.questions.length || 1) - 1;
      if (!isLastQuestion) {
        setTimeout(() => {
          handleNextQuestion();
        }, 300); // 稍微延迟一下，给用户一个反馈时间
      }
    }
  };

  const handleClearProgress = () => {
    setClearConfirmOpen(true);
  };

  const confirmClearProgress = () => {
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setClearConfirmOpen(false);
    showNotification('清理完成', '已清空所有进度', 'success');
  };

  const examResult = calculateExamResult(examQuestions, userAnswers['exam']);

  return {
    handlers: {
      handleGoHome,
      handleModuleChange,
      prepareExam,
      startExam,
      startInfinite,
      submitExam,
      performSubmit,
      handleAnswer,
      handleNextQuestion,
      handlePrevQuestion: () => setCurrentQuestionIndex(prev => Math.max(0, prev - 1)),
      handleExitExam: () => setExitConfirmOpen(true),
      confirmExitExam: () => { performSubmit(); setExitConfirmOpen(false); },
      handleClearProgress,
      confirmClearProgress,
      checkNavigation,
      handleBackToResult: () => setShowResultCard(true),
      restartExam: () => prepareExam(),
      reviewWrong: () => {
        setShowResultCard(false);
        setExamState('result');
        const firstWrongIndex = examQuestions.findIndex((q) => userAnswers['exam']?.[q.id] !== q.correctAnswer);
        if (firstWrongIndex !== -1) setCurrentQuestionIndex(firstWrongIndex);
      },
      handleOpenSettings: () => { setIsSettingsModalOpen(true); setSidebarOpen(false); },
      showNotification,
      closeNotification
    },
    computed: {
      currentModuleData,
      currentQuestion,
      isExamActive,
      isReviewing,
      examResult
    }
  };
}
