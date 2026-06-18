import { useState } from 'react';
import Image from 'next/image';
import { Check, Copy, Info } from 'lucide-react';
import type { Question } from '@/data/types';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';

interface QuestionExplanationProps {
  question: Question;
}

export default function QuestionExplanation({ question }: QuestionExplanationProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyExplanation = async () => {
    const rawText = `✅ 正确答案：${question.options[question.correctAnswer]}\n\n${question.explanation || ''}`;

    const text = rawText
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`{3}[\s\S]*?`{3}/g, match => match.replace(/`/g, ''))
      .replace(/`/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/^#+\s+/gm, '')
      .replace(/^\s*[-+*]\s+/gm, '')
      .replace(/^\s*>\s+/gm, '')
      .trim();

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <div className="mt-8 pt-8 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Info className="text-blue-500" size={20} />
            <h4 className="font-bold text-blue-900">题目解析</h4>
          </div>
          <button
            onClick={handleCopyExplanation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-white rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors"
            title="复制纯文本解析"
          >
            {isCopied ? (
              <>
                <Check size={14} className="text-green-500" />
                <span className="text-green-600">已复制</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>复制</span>
              </>
            )}
          </button>
        </div>
        <MarkdownRenderer
          className="prose prose-sm md:prose-base max-w-none text-blue-800/80"
          content={`**正确答案：** ${question.options[question.correctAnswer]}\n\n${question.explanation || ''}`}
        />
        {question.explanationImage && (
          <div className="mt-4 rounded-xl overflow-hidden border border-blue-200/50">
            <Image
              src={question.explanationImage}
              alt="解析插图"
              width={400}
              height={300}
              className="w-full h-auto object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}
