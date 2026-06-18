'use client';

import Image from 'next/image';
import { Maximize2 } from 'lucide-react';
import type { Question } from '@/data/types';
import { useQuestionOptions } from '@/hooks/useQuestionOptions';
import QuestionExplanation from './QuestionExplanation';
import QuestionOptions from './QuestionOptions';

interface QuestionCardProps {
  question: Question;
  userAnswer: number | null;
  onSelectAnswer: (answer: number) => void;
  showResult: boolean;
  mode: 'practice' | 'exam' | 'infinite';
  sessionId?: number;
  questionNumber?: number;
}

export default function QuestionCard({
  question,
  userAnswer,
  onSelectAnswer,
  showResult,
  mode,
  sessionId = 0,
  questionNumber
}: QuestionCardProps) {
  const {
    finalIndices,
    selectedOption,
    handleSelect,
    handleConfirm,
    getOptionStatus
  } = useQuestionOptions({
    question,
    userAnswer,
    onSelectAnswer,
    showResult,
    mode,
    sessionId
  });

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-3 md:p-10 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-3 md:mb-8">
        <div className="flex items-center space-x-2 md:space-x-3">
          <span className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base md:text-lg shadow-sm">
            {mode === 'infinite' ? '∞' : (question.examQuestionId || questionNumber || 'Q')}
          </span>
          {question.sourceModuleName && (
            <span className="px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-gray-50 text-[10px] md:text-xs font-medium text-gray-500 border border-gray-100">
              {question.sourceModuleName}
            </span>
          )}
        </div>
      </div>

      <div className="prose prose-sm md:prose-lg max-w-none mb-3 md:mb-8">
        <h3 className="text-sm md:text-2xl font-semibold text-gray-900 leading-relaxed tracking-tight break-words">
          {question.text}
        </h3>

        {question.image && (
          <div className="mt-4 md:mt-6 relative rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 group">
            <Image
              src={question.image}
              alt="题目插图"
              width={600}
              height={400}
              className="w-full h-auto object-contain max-h-[400px]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
              <Maximize2 className="text-white drop-shadow-lg" size={32} />
            </div>
          </div>
        )}
      </div>

      <QuestionOptions
        question={question}
        mode={mode}
        showResult={showResult}
        userAnswer={userAnswer}
        selectedOption={selectedOption}
        finalIndices={finalIndices}
        onSelect={handleSelect}
        onConfirm={handleConfirm}
        getOptionStatus={getOptionStatus}
      />

      {showResult && <QuestionExplanation question={question} />}
    </div>
  );
}
