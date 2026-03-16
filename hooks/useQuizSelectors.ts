import { useMemo } from 'react';
import type { AppMode } from './useQuizState';
import type { Question } from '@/data/questions';

type UserAnswers = Record<string, Record<string, number>>;

export function useQuizSelectors(params: {
  mode: AppMode;
  currentModuleId: string;
  currentQuestion: Question | undefined;
  userAnswers: UserAnswers;
  examSubmitted: boolean;
}) {
  const { mode, currentModuleId, currentQuestion, userAnswers, examSubmitted } = params;

  return useMemo(() => {
    const answerKey = mode === 'exam' ? 'exam' : mode === 'infinite' ? 'infinite' : currentModuleId;

    const currentUserAnswer =
      userAnswers[answerKey]?.[currentQuestion?.id ?? ''] ?? null;

    const showResult =
      (mode === 'exam' && examSubmitted) ||
      ((mode === 'practice' || mode === 'infinite') && currentUserAnswer !== null);

    const progressUserAnswers = userAnswers[answerKey] || {};

    return {
      answerKey,
      currentUserAnswer,
      showResult,
      progressUserAnswers
    };
  }, [mode, currentModuleId, currentQuestion?.id, userAnswers, examSubmitted]);
}

