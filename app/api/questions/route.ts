import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const questionsFilePath = path.join(process.cwd(), 'data', 'questions.json');

export async function GET() {
  try {
    const data = fs.readFileSync(questionsFilePath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json({ error: '保存题目失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // 限制仅在本地开发环境允许写入文件
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: '仅允许在本地开发环境中修改数据。在 Vercel 环境下，文件系统是只读的。' }, 
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    
    // 简单的验证，确保数据是对象
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: '无效的数据格式' }, { status: 400 });
    }

    // 写入文件
    fs.writeFileSync(questionsFilePath, JSON.stringify(body, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true, message: '题目更新成功' });
  } catch (error) {
    console.error('保存题目失败:', error);
    return NextResponse.json({ error: '保存题目失败' }, { status: 500 });
  }
}
