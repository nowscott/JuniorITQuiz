import type { ModuleData } from './types';
import module1 from './question-bank/module1.json';
import module2 from './question-bank/module2.json';
import module3 from './question-bank/module3.json';
import module4 from './question-bank/module4.json';
import module5 from './question-bank/module5.json';
import module6 from './question-bank/module6.json';

export const questionData: Record<string, ModuleData> = {
  module1: module1 as ModuleData,
  module2: module2 as ModuleData,
  module3: module3 as ModuleData,
  module4: module4 as ModuleData,
  module5: module5 as ModuleData,
  module6: module6 as ModuleData
};
