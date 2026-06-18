import rawData from './questions.json';
import type { ModuleData } from './types';

// 类型断言，确保导入的数据符合 ModuleData 结构
export const questionData: Record<string, ModuleData> = rawData as unknown as Record<string, ModuleData>;
