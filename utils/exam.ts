import { questionData } from '@/data/questions';
import type { ModuleData, Question } from '@/data/types';

type ExamConfigLike = {
  questionCount: number;
  timeLimit: number;
};

type ExamSeedParts = {
  seed: number;
  count: number;
  time: number;
};

type ResolvedExamConfig = {
  seed: number;
  questionCount: number;
  timeLimit: number;
};

export const encodeExamSeed = (seed: number, count: number, time: number): string => {
  return `${seed.toString(36)}-${count.toString(36)}-${time.toString(36)}`.toUpperCase();
};

const decodeExamSeed = (encoded: string): ExamSeedParts | null => {
  try {
    let raw = '';
    if (encoded.includes('-') && !/^[0-9A-Z-]+$/.test(encoded)) {
      try { raw = atob(encoded); } catch { raw = encoded; }
    } else if (!encoded.includes('-')) {
      try { raw = atob(encoded); } catch { return null; }
    } else {
      const parts = encoded.toLowerCase().split('-');
      if (parts.length === 3) {
        return {
          seed: parseInt(parts[0], 36),
          count: parseInt(parts[1], 36),
          time: parseInt(parts[2], 36)
        };
      }
      return null;
    }

    const parts = raw.split('-');
    if (parts.length === 3) {
      return {
        seed: parseInt(parts[0]),
        count: parseInt(parts[1]),
        time: parseInt(parts[2])
      };
    }
    return null;
  } catch {
    return null;
  }
};

const isValidExamSeed = (config: ExamSeedParts) => {
  return Number.isSafeInteger(config.seed) &&
    config.seed >= 0 &&
    Number.isSafeInteger(config.count) &&
    config.count >= 1 &&
    Number.isSafeInteger(config.time) &&
    config.time >= 1;
};

export const normalizeExamConfig = (config: ExamConfigLike): ExamConfigLike => ({
  questionCount: Math.max(1, Math.floor(Number.isFinite(config.questionCount) ? config.questionCount : 1)),
  timeLimit: Math.max(1, Math.floor(Number.isFinite(config.timeLimit) ? config.timeLimit : 1))
});

export const resolveExamConfig = (
  customSeedString: string | undefined,
  examConfig: ExamConfigLike
): ResolvedExamConfig | null => {
  const normalized = normalizeExamConfig(examConfig);
  let seed = Math.floor(Math.random() * 1000000000);
  const questionCount = normalized.questionCount;
  const timeLimit = normalized.timeLimit;

  if (!customSeedString) {
    return { seed, questionCount, timeLimit };
  }

  const decoded = decodeExamSeed(customSeedString);
  if (decoded) {
    if (!isValidExamSeed(decoded)) return null;
    return {
      seed: decoded.seed,
      questionCount: decoded.count,
      timeLimit: decoded.time
    };
  }

  if (!/^\d+$/.test(customSeedString)) return null;

  seed = parseInt(customSeedString);
  if (!Number.isSafeInteger(seed)) return null;

  return { seed, questionCount, timeLimit };
};

export const getAllQuestions = () => {
  const allQuestions: Question[] = [];
  Object.entries(questionData).forEach(([moduleId, moduleData]) => {
    moduleData.questions.forEach(question => {
      allQuestions.push({
        ...question,
        sourceModule: moduleId,
        sourceModuleName: moduleData.title.split('、')[1] || moduleData.title
      });
    });
  });
  return allQuestions;
};

const seededRandom = (seed: number) => {
  let localSeed = seed;
  return () => {
    localSeed = (localSeed * 9301 + 49297) % 233280;
    return localSeed / 233280;
  };
};

export const createExamQuestions = (questions: Question[], seed: number, questionCount: number) => {
  const rng = seededRandom(seed);
  const count = Math.min(questionCount, questions.length);
  return [...questions]
    .sort(() => rng() - 0.5)
    .slice(0, count)
    .map((question, index) => ({
      ...question,
      examQuestionId: index + 1
    }));
};

export const shuffleQuestions = (questions: Question[]) => {
  return [...questions].sort(() => Math.random() - 0.5);
};

export const getModeModuleData = (params: {
  mode: 'welcome' | 'practice' | 'exam' | 'infinite';
  currentModuleId: string;
  examQuestions: Question[];
  infiniteQuestions: Question[];
}): ModuleData => {
  if (params.mode === 'exam') {
    return {
      title: '随机综合考试',
      questions: params.examQuestions,
      moduleTag: '综合考试'
    };
  }

  if (params.mode === 'infinite') {
    return {
      title: '随机无尽模式',
      questions: params.infiniteQuestions,
      moduleTag: '无尽模式'
    };
  }

  return questionData[params.currentModuleId] || { title: '未找到模块', questions: [] };
};

export const calculateExamResult = (
  examQuestions: Question[],
  answers: Record<string, number> | undefined
) => {
  if (!examQuestions.length) return { score: 0, correct: 0 };

  const correct = examQuestions.reduce((total, question) => {
    return answers?.[question.id] === question.correctAnswer ? total + 1 : total;
  }, 0);

  return {
    score: Math.round((correct / examQuestions.length) * 100),
    correct
  };
};
