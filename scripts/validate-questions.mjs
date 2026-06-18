import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const questionBankDir = path.join(rootDir, 'data', 'question-bank');
const publicDir = path.join(rootDir, 'public');
const moduleFileNamePattern = /^[A-Za-z0-9_-]+\.json$/;

const errors = [];
const seenIds = new Map();

function addError(message) {
  errors.push(message);
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateImagePath(moduleId, questionLabel, field, value) {
  if (value === undefined) return;
  if (typeof value !== 'string') {
    addError(moduleId + ' ' + questionLabel + ' 的 ' + field + ' 必须是字符串');
    return;
  }

  if (value.startsWith('/')) {
    const filePath = path.join(publicDir, value.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
      addError(moduleId + ' ' + questionLabel + ' 引用的图片不存在：' + value);
    }
  }
}

function validateQuestion(moduleId, question, index) {
  const questionLabel = '第 ' + (index + 1) + ' 题';
  if (!isRecord(question)) {
    addError(moduleId + ' ' + questionLabel + ' 必须是对象');
    return;
  }

  if (typeof question.id !== 'string' || question.id.trim() === '') {
    addError(moduleId + ' ' + questionLabel + ' 缺少 id');
  } else if (seenIds.has(question.id)) {
    addError(moduleId + ' ' + questionLabel + ' id 重复：' + question.id + '，首次出现于 ' + seenIds.get(question.id));
  } else {
    seenIds.set(question.id, moduleId + ' ' + questionLabel);
  }

  if (typeof question.text !== 'string' || question.text.trim() === '') {
    addError(moduleId + ' ' + questionLabel + ' 缺少题干');
  }

  if (!Array.isArray(question.options) || question.options.length < 2 || !question.options.every(option => typeof option === 'string')) {
    addError(moduleId + ' ' + questionLabel + ' 选项格式无效');
  }

  if (
    typeof question.correctAnswer !== 'number' ||
    !Number.isInteger(question.correctAnswer) ||
    !Array.isArray(question.options) ||
    question.correctAnswer < 0 ||
    question.correctAnswer >= question.options.length
  ) {
    addError(moduleId + ' ' + questionLabel + ' 正确答案索引无效');
  }

  if (typeof question.explanation !== 'string' || question.explanation.trim() === '') {
    addError(moduleId + ' ' + questionLabel + ' 缺少解析');
  }

  validateImagePath(moduleId, questionLabel, 'image', question.image);
  validateImagePath(moduleId, questionLabel, 'explanationImage', question.explanationImage);
}

if (!fs.existsSync(questionBankDir)) {
  addError('题库目录不存在：data/question-bank');
} else {
  const files = fs.readdirSync(questionBankDir).filter(fileName => fileName.endsWith('.json')).sort();

  if (files.length === 0) {
    addError('题库目录中没有模块 JSON 文件');
  }

  for (const fileName of files) {
    if (!moduleFileNamePattern.test(fileName)) {
      addError('模块文件名不安全：' + fileName);
      continue;
    }

    const moduleId = path.basename(fileName, '.json');
    const filePath = path.join(questionBankDir, fileName);
    let moduleData;

    try {
      moduleData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      addError(fileName + ' 不是有效 JSON：' + error.message);
      continue;
    }

    if (!isRecord(moduleData)) {
      addError(moduleId + ' 模块内容必须是对象');
      continue;
    }

    if (typeof moduleData.title !== 'string' || moduleData.title.trim() === '') {
      addError(moduleId + ' 缺少模块标题');
    }

    if (!Array.isArray(moduleData.questions)) {
      addError(moduleId + ' 缺少 questions 数组');
      continue;
    }

    moduleData.questions.forEach((question, index) => validateQuestion(moduleId, question, index));
  }
}

if (errors.length > 0) {
  console.error('题库校验失败：');
  for (const error of errors) {
    console.error('- ' + error);
  }
  process.exit(1);
}

console.log('题库校验通过：' + seenIds.size + ' 道题');
