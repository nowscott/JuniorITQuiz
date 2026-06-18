import { useEffect, useMemo, useRef, useState } from 'react';
import type { Question, QuestionData } from '@/data/types';

export type GenerateStatus = 'idle' | 'success' | 'error';
export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export function useAdminQuestions() {
  const [data, setData] = useState<QuestionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDev, setIsDev] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState<GenerateStatus>('idle');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [defaultAscNext, setDefaultAscNext] = useState(true);
  const [explainAscNext, setExplainAscNext] = useState(true);
  const [reasoningText, setReasoningText] = useState('');

  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialOrdersRef = useRef<Record<string, string[]>>({});

  useEffect(() => {
    setIsDev(process.env.NODE_ENV === 'development');
  }, []);

  useEffect(() => {
    fetch('/api/questions')
      .then(res => res.json())
      .then((loadedData: QuestionData) => {
        setData(loadedData);
        const moduleIds = Object.keys(loadedData);
        if (moduleIds.length > 0) {
          setSelectedModuleId(moduleIds[0]);
        }

        moduleIds.forEach(moduleId => {
          initialOrdersRef.current[moduleId] = loadedData[moduleId].questions.map(q => q.id);
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('加载数据失败:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const selectedModule = useMemo(() => {
    if (!data || !selectedModuleId) return null;
    return data[selectedModuleId] ?? null;
  }, [data, selectedModuleId]);

  const editDisplayIndex = useMemo(() => {
    if (!isEditModalOpen || !editingQuestion || !selectedModule) return null;
    return selectedModule.questions.findIndex(q => q.id === editingQuestion.id) + 1;
  }, [editingQuestion, isEditModalOpen, selectedModule]);

  const updateSelectedModuleQuestions = (updater: (questions: Question[]) => Question[]) => {
    if (!data || !selectedModuleId || !data[selectedModuleId]) return;

    setData({
      ...data,
      [selectedModuleId]: {
        ...data[selectedModuleId],
        questions: updater(data[selectedModuleId].questions)
      }
    });
  };

  const openEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setReasoningText('');
    setIsEditModalOpen(true);
    setGenerateStatus('idle');
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleGenerateExplanation = async () => {
    if (!editingQuestion) return;

    setGenerateStatus('idle');
    setIsGenerating(true);
    setReasoningText('');
    setEditingQuestion(prev => prev ? { ...prev, explanation: '' } : null);

    try {
      const response = await fetch('/api/generate-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: editingQuestion.text,
          options: editingQuestion.options,
          correctAnswer: editingQuestion.correctAnswer,
          image: editingQuestion.image || ''
        })
      });

      if (!response.ok) throw new Error('生成解析失败');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取流数据');

      const decoder = new TextDecoder();
      let explanation = '';
      let reasoning = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') continue;

          try {
            const data = JSON.parse(dataStr);
            if (data.type === 'reasoning') {
              reasoning += data.text;
              setReasoningText(reasoning);
            } else if (data.type === 'content') {
              explanation += data.text;
              setEditingQuestion(prev => prev ? { ...prev, explanation } : null);
            }
          } catch (e) {
            console.error('Parse error:', e, dataStr);
          }
        }
      }

      setGenerateStatus('success');
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        setGenerateStatus('idle');
      }, 2000);
    } catch (error) {
      console.error(error);
      setGenerateStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAll = async () => {
    if (!data) return;

    setSaveStatus('saving');
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error('保存失败');

      setSaveStatus('success');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 1500);
    } catch {
      setSaveStatus('error');
    }
  };

  const handleUpdateQuestion = (updatedQuestion: Question) => {
    updateSelectedModuleQuestions(questions =>
      questions.map(question => question.id === updatedQuestion.id ? updatedQuestion : question)
    );

    setIsEditModalOpen(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (id: string) => {
    if (!data || !selectedModuleId) return;
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (!selectedModuleId || deleteConfirmId === null) return;

    updateSelectedModuleQuestions(questions =>
      questions.filter(question => question.id !== deleteConfirmId)
    );

    if (initialOrdersRef.current[selectedModuleId]) {
      initialOrdersRef.current[selectedModuleId] = initialOrdersRef.current[selectedModuleId].filter(id => id !== deleteConfirmId);
    }
    setDeleteConfirmId(null);
  };

  const handleAddQuestion = () => {
    if (!data || !selectedModuleId || !data[selectedModuleId]) return;

    const newQuestion: Question = {
      id: crypto.randomUUID(),
      text: '新题目',
      options: ['选项A', '选项B', '选项C', '选项D'],
      correctAnswer: 0,
      explanation: '解析内容'
    };

    updateSelectedModuleQuestions(questions => [...questions, newQuestion]);

    if (!initialOrdersRef.current[selectedModuleId]) {
      initialOrdersRef.current[selectedModuleId] = [];
    }
    initialOrdersRef.current[selectedModuleId].push(newQuestion.id);

    openEditQuestion(newQuestion);
  };

  const handleCreateModule = () => {
    if (!data) return;

    const newId = crypto.randomUUID();
    const index = Object.keys(data).length + 1;
    const newModule: QuestionData[string] = {
      title: `新模块${index}`,
      questions: []
    };

    setData({
      ...data,
      [newId]: newModule
    });
    initialOrdersRef.current[newId] = [];
    setSelectedModuleId(newId);
    setEditingQuestion(null);
    setIsEditModalOpen(false);
    setGenerateStatus('idle');
  };

  const handleRenameModule = (id: string, newTitle: string) => {
    if (!data || !data[id]) return;

    setData({
      ...data,
      [id]: {
        ...data[id],
        title: newTitle
      }
    });
  };

  const sortSelectedQuestions = (sorter: (questions: Question[]) => Question[]) => {
    updateSelectedModuleQuestions(questions => sorter([...questions]));
  };

  const handleSortDefault = (descending = false) => {
    if (!data || !selectedModuleId) return;

    const snapshot = initialOrdersRef.current[selectedModuleId];
    if (!snapshot) return;

    const sourceOrder = descending ? [...snapshot].reverse() : snapshot;
    const byId = new Map(data[selectedModuleId].questions.map(question => [question.id, question]));
    const restored = sourceOrder.map(id => byId.get(id)).filter(Boolean) as Question[];
    const extra = data[selectedModuleId].questions.filter(question => !snapshot.includes(question.id));
    const normalizedExtra = descending ? extra.reverse() : extra;

    updateSelectedModuleQuestions(() => [...restored, ...normalizedExtra]);
  };

  const handleToggleDefaultSort = () => {
    handleSortDefault(!defaultAscNext);
    setDefaultAscNext(!defaultAscNext);
  };

  const handleToggleExplainSort = () => {
    sortSelectedQuestions(questions =>
      questions.sort((a, b) => {
        const diff = (a.explanation || '').length - (b.explanation || '').length;
        return explainAscNext ? diff : -diff;
      })
    );
    setExplainAscNext(!explainAscNext);
  };

  const handleShuffle = () => {
    sortSelectedQuestions(questions => {
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
      return questions;
    });
  };

  return {
    data,
    loading,
    selectedModuleId,
    selectedModule,
    editingQuestion,
    editDisplayIndex,
    isEditModalOpen,
    isDev,
    deleteConfirmId,
    isGenerating,
    generateStatus,
    saveStatus,
    defaultAscNext,
    explainAscNext,
    reasoningText,
    setSelectedModuleId,
    setEditingQuestion,
    closeEditModal,
    openEditQuestion,
    handleGenerateExplanation,
    handleSaveAll,
    handleUpdateQuestion,
    handleDeleteQuestion,
    confirmDelete,
    setDeleteConfirmId,
    handleAddQuestion,
    handleCreateModule,
    handleRenameModule,
    handleToggleDefaultSort,
    handleToggleExplainSort,
    handleShuffle
  };
}
