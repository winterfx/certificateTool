import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: '未提供文件' },
        { status: 400 }
      );
    }

    // 转发请求到后端服务器
    const backendResponse = await fetch('http://localhost:8080/api/cert/parse', {
      method: 'POST',
      body: formData,
    });

    if (!backendResponse.ok) {
      const error = await backendResponse.json();
      return NextResponse.json(
        { error: error.error || '证书解析失败' },
        { status: backendResponse.status }
      );
    }

    const responseData = await backendResponse.json();
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('证书解析失败:', error);
    return NextResponse.json(
      { error: '证书解析请求处理失败' },
      { status: 500 }
    );
  }
}