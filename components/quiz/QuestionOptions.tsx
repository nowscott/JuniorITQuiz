import { CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';
import type { Question } from '@/data/types';
import type { OptionStatus } from '@/hooks/useQuestionOptions';

interface QuestionOptionsProps {
  question: Question;
  mode: 'practice' | 'exam' | 'infinite';
  showResult: boolean;
  userAnswer: number | null;
  selectedOption: number | null;
  finalIndices: number[];
  onSelect: (shuffledIndex: number) => void;
  onConfirm: () => void;
  getOptionStatus: (shuffledIndex: number) => OptionStatus;
}

const optionLabel = (index: number) => {
  return ['A', 'B', 'C', 'D'][index] ?? String.fromCharCode(65 + index);
};

export default function QuestionOptions({
  question,
  mode,
  showResult,
  userAnswer,
  selectedOption,
  finalIndices,
  onSelect,
  onConfirm,
  getOptionStatus
}: QuestionOptionsProps) {
  return (
    <>
      <div className="space-y-2 md:space-y-4">
        {finalIndices.map((originalIndex, shuffledIndex) => {
          const option = question.options.map(o => o.replace(/^\s*[A-D][\.\、]\s*/, ''))[originalIndex];
          const status = getOptionStatus(shuffledIndex);

          return (
            <button
              key={originalIndex}
              onClick={() => onSelect(shuffledIndex)}
              className={clsx(
                "w-full relative group p-2.5 pl-10 md:p-4 md:pl-16 rounded-2xl text-left border-2 transition-all duration-200",
                status === 'default' && "border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 bg-white",
                status === 'selected' && "border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-200",
                status === 'correct' && "border-green-500 bg-green-50/50 shadow-sm ring-1 ring-green-200",
                status === 'incorrect' && "border-red-500 bg-red-50/50 shadow-sm ring-1 ring-red-200"
              )}
            >
              <div className={clsx(
                "absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-colors",
                status === 'default' && "bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600",
                status === 'selected' && "bg-blue-500 text-white shadow-lg shadow-blue-200",
                status === 'correct' && "bg-green-500 text-white shadow-lg shadow-green-200",
                status === 'incorrect' && "bg-red-500 text-white shadow-lg shadow-red-200"
              )}>
                {optionLabel(shuffledIndex)}
              </div>

              <span className={clsx(
                "block text-sm md:text-lg font-medium transition-colors break-words leading-tight",
                status === 'default' && "text-gray-700 group-hover:text-gray-900",
                status === 'selected' && "text-blue-900",
                status === 'correct' && "text-green-900",
                status === 'incorrect' && "text-red-900"
              )}>
                {option}
              </span>

              {status === 'correct' && (
                <CheckCircle className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-green-500" size={16} />
              )}
              {status === 'incorrect' && (
                <XCircle className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-red-500" size={16} />
              )}
            </button>
          );
        })}
      </div>

      {(!showResult || (mode !== 'exam' && userAnswer !== question.correctAnswer)) && (
        <div className="mt-4 md:mt-8 flex justify-end">
          <button
            onClick={onConfirm}
            disabled={selectedOption === null || selectedOption === userAnswer}
            className={clsx(
              "flex items-center gap-1.5 md:gap-2 px-5 py-2.5 md:px-7 md:py-3.5 rounded-xl md:rounded-2xl font-bold transition-all duration-200",
              (selectedOption === null || selectedOption === userAnswer)
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none"
                : "bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0"
            )}
          >
            <span className="text-sm md:text-base">确认提交</span>
            <span className={clsx(
              "text-[10px] md:text-xs font-normal ml-0.5 hidden sm:inline",
              (selectedOption === null || selectedOption === userAnswer) ? "text-gray-300" : "text-blue-100"
            )}>
              (Enter)
            </span>
          </button>
        </div>
      )}
    </>
  );
}
