import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { questionData as questionsDefault } from '@/data/questions';

const questionsDirPath = path.join(process.cwd(), 'data', 'question-bank');
const questionsIndexPath = path.join(process.cwd(), 'data', 'questions.ts');
const moduleFileNamePattern = /^[A-Za-z0-9_-]+$/;

export const runtime = 'nodejs';

const localHostnames = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

function getHostnameFromHostHeader(host: string) {
  if (host.startsWith('[')) {
    return host.slice(0, host.indexOf(']') + 1);
  }

  return host.split(':')[0];
}

function isLocalDevelopmentRequest(request: Request) {
  if (process.env.NODE_ENV !== 'development') return false;

  const host = request.headers.get('host');
  if (host) {
    return localHostnames.has(getHostnameFromHostHeader(host));
  }

  try {
    const url = new URL(request.url);
    return localHostnames.has(url.hostname);
  } catch {
    return false;
  }
}

function getModuleFilePath(moduleId: string) {
  if (!moduleFileNamePattern.test(moduleId)) {
    throw new Error('模块 ' + moduleId + ' 不能作为文件名');
  }

  return path.join(questionsDirPath, moduleId + '.json');
}

function readQuestionsDataFromFiles() {
  const entries = fs
    .readdirSync(questionsDirPath)
    .filter(fileName => fileName.endsWith('.json'))
    .sort();

  return entries.reduce<Record<string, unknown>>((data, fileName) => {
    const moduleId = path.basename(fileName, '.json');
    const modulePath = path.join(questionsDirPath, fileName);
    data[moduleId] = JSON.parse(fs.readFileSync(modulePath, 'utf-8'));
    return data;
  }, {});
}

function writeQuestionsDataToFiles(data: Record<string, unknown>) {
  fs.mkdirSync(questionsDirPath, { recursive: true });

  const activeFileNames = new Set<string>();
  const moduleIds = Object.keys(data);
  for (const [moduleId, moduleData] of Object.entries(data)) {
    const fileName = moduleId + '.json';
    activeFileNames.add(fileName);
    fs.writeFileSync(getModuleFilePath(moduleId), JSON.stringify(moduleData, null, 2) + '\n', 'utf-8');
  }

  for (const fileName of fs.readdirSync(questionsDirPath)) {
    if (fileName.endsWith('.json') && !activeFileNames.has(fileName)) {
      fs.unlinkSync(path.join(questionsDirPath, fileName));
    }
  }

  writeQuestionsIndex(moduleIds);
}

function writeQuestionsIndex(moduleIds: string[]) {
  const imports = moduleIds.map((moduleId, index) =>
    'import moduleData' + index + " from './question-bank/" + moduleId + ".json';"
  );
  const entries = moduleIds.map((moduleId, index) =>
    '  ' + JSON.stringify(moduleId) + ': moduleData' + index + ' as ModuleData'
  );

  const source = [
    "import type { ModuleData } from './types';",
    ...imports,
    '',
    'export const questionData: Record<string, ModuleData> = {',
    entries.join(',\n'),
    '};',
    ''
  ].join('\n');

  fs.writeFileSync(questionsIndexPath, source, 'utf-8');
}

function validateQuestionsData(data: unknown): string | null {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return '题库数据必须是模块对象';
  }

  for (const [moduleId, moduleData] of Object.entries(data)) {
    if (!moduleFileNamePattern.test(moduleId)) {
      return '模块 ' + moduleId + ' 不能作为文件名';
    }

    if (typeof moduleData !== 'object' || moduleData === null || Array.isArray(moduleData)) {
      return `模块 ${moduleId} 格式无效`;
    }

    const moduleRecord = moduleData as Record<string, unknown>;
    if (typeof moduleRecord.title !== 'string' || moduleRecord.title.trim().length === 0) {
      return `模块 ${moduleId} 缺少标题`;
    }

    if (!Array.isArray(moduleRecord.questions)) {
      return `模块 ${moduleId} 缺少题目列表`;
    }

    for (const [index, questionData] of moduleRecord.questions.entries()) {
      const questionLabel = `${moduleId} 第 ${index + 1} 题`;

      if (typeof questionData !== 'object' || questionData === null || Array.isArray(questionData)) {
        return `${questionLabel} 格式无效`;
      }

      const question = questionData as Record<string, unknown>;
      if (typeof question.id !== 'string' || question.id.trim().length === 0) {
        return `${questionLabel} 缺少 ID`;
      }

      if (typeof question.text !== 'string' || question.text.trim().length === 0) {
        return `${questionLabel} 缺少题干`;
      }

      const options = question.options;
      if (!Array.isArray(options) || options.length < 2 || !options.every(option => typeof option === 'string')) {
        return `${questionLabel} 选项格式无效`;
      }

      const correctAnswer = question.correctAnswer;
      if (typeof correctAnswer !== 'number' || !Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
        return `${questionLabel} 正确答案索引无效`;
      }

      if (typeof question.explanation !== 'string' || question.explanation.trim().length === 0) {
        return `${questionLabel} 缺少解析`;
      }

      if (question.image !== undefined && typeof question.image !== 'string') {
        return `${questionLabel} 题目图片路径无效`;
      }

      if (question.explanationImage !== undefined && typeof question.explanationImage !== 'string') {
        return `${questionLabel} 解析图片路径无效`;
      }
    }
  }

  return null;
}

export async function GET() {
  try {
    return NextResponse.json(readQuestionsDataFromFiles());
  } catch {
    // 在无状态/只读的部署环境（如 Vercel Serverless）中，直接回退到随包发布的数据
    return NextResponse.json(questionsDefault);
  }
}

export async function POST(request: Request) {
  // 限制仅在本地开发环境允许写入文件
  if (!isLocalDevelopmentRequest(request)) {
    return NextResponse.json(
      { error: '仅允许从本机开发环境修改数据。' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    
    const validationError = validateQuestionsData(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    writeQuestionsDataToFiles(body);
    
    return NextResponse.json({ success: true, message: '题目更新成功' });
  } catch (error) {
    console.error('保存题目失败:', error);
    return NextResponse.json({ error: '保存题目失败' }, { status: 500 });
  }
}
