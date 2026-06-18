import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Question } from '@/data/types';

export type OptionStatus = 'default' | 'selected' | 'correct' | 'incorrect';

export function useQuestionOptions(params: {
  question: Question;
  userAnswer: number | null;
  onSelectAnswer: (answer: number) => void;
  showResult: boolean;
  mode: 'practice' | 'exam' | 'infinite';
  sessionId?: number;
}) {
  const { question, userAnswer, onSelectAnswer, showResult, mode, sessionId = 0 } = params;

  const shuffledIndices = useMemo(() => {
    const indices = question.options.map((_, i) => i);

    let idHash = 0;
    const idStr = String(question.id);
    for (let i = 0; i < idStr.length; i++) {
      idHash = ((idHash << 5) - idHash) + idStr.charCodeAt(i);
      idHash |= 0;
    }

    let seed = Math.abs(idHash) + (sessionId || 0);
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [question.id, question.options, sessionId]);

  const [clientShuffledIndices, setClientShuffledIndices] = useState<number[] | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(userAnswer);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSelectedOption(userAnswer);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [userAnswer, question.id]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const indices = question.options.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setClientShuffledIndices(indices);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [question.id, question.options, sessionId]);

  const finalIndices = clientShuffledIndices || shuffledIndices;

  const handleSelect = useCallback((shuffledIndex: number) => {
    if (mode === 'exam' && showResult) return;
    if (mode !== 'exam' && showResult && userAnswer === question.correctAnswer) return;

    const originalIndex = finalIndices[shuffledIndex];
    setSelectedOption(originalIndex);
  }, [finalIndices, mode, question.correctAnswer, showResult, userAnswer]);

  const handleConfirm = useCallback(() => {
    if (selectedOption !== null && selectedOption !== userAnswer) {
      onSelectAnswer(selectedOption);
    }
  }, [onSelectAnswer, selectedOption, userAnswer]);

  const getOptionStatus = useCallback((shuffledIndex: number): OptionStatus => {
    const originalIndex = finalIndices[shuffledIndex];
    const isSelected = selectedOption === originalIndex;

    if (!showResult) {
      return isSelected ? 'selected' : 'default';
    }

    if (mode === 'exam') {
      if (originalIndex === question.correctAnswer) return 'correct';
      if (userAnswer === originalIndex && originalIndex !== question.correctAnswer) return 'incorrect';
      return 'default';
    }

    if (userAnswer === question.correctAnswer) {
      if (originalIndex === question.correctAnswer) return 'correct';
    } else {
      if (isSelected && selectedOption !== userAnswer) return 'selected';
      if (userAnswer === originalIndex) return 'incorrect';
    }

    return 'default';
  }, [finalIndices, mode, question.correctAnswer, selectedOption, showResult, userAnswer]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
        return;
      }

      const keyMap: Record<string, number> = {
        '1': 0, '2': 1, '3': 2, '4': 3,
        'NumPad1': 0, 'NumPad2': 1, 'NumPad3': 2, 'NumPad4': 3
      };

      if (keyMap[e.key] !== undefined && keyMap[e.key] < question.options.length) {
        handleSelect(keyMap[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleConfirm, handleSelect, question.options.length]);

  return {
    finalIndices,
    selectedOption,
    handleSelect,
    handleConfirm,
    getOptionStatus
  };
}
