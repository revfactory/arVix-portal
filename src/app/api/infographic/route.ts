import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, summary, keyPoints, methodology } = body;

    if (!title || !summary || !keyPoints) {
      return NextResponse.json(
        { error: '제목, 요약, 핵심 포인트가 필요합니다' },
        { status: 400 }
      );
    }

    // 출력 디렉토리 확인 및 생성
    const outputDir = path.join(process.cwd(), 'public', 'infographics');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 고유 파일명 생성
    const filename = `infographic-${uuidv4()}.png`;
    const outputPath = path.join(outputDir, filename);

    // Python 스크립트 실행
    const scriptPath = path.join(process.cwd(), 'scripts', 'generate_infographic.py');

    const result = await new Promise<{ success: boolean; image_path?: string; text?: string; error?: string }>((resolve, reject) => {
      const pythonProcess = spawn('python3', [
        scriptPath,
        '--title', title,
        '--summary', summary,
        '--key-points', JSON.stringify(keyPoints),
        '--methodology', methodology || '정보 없음',
        '--output', outputPath,
      ], {
        env: { ...process.env },
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch {
            reject(new Error(`JSON 파싱 오류: ${stdout}`));
          }
        } else {
          reject(new Error(stderr || `프로세스 종료 코드: ${code}`));
        }
      });

      pythonProcess.on('error', (err) => {
        reject(err);
      });
    });

    if (result.success && result.image_path) {
      // 공개 URL 반환
      const imageUrl = `/infographics/${filename}`;
      return NextResponse.json({
        success: true,
        imageUrl,
        text: result.text,
      });
    } else {
      return NextResponse.json(
        { error: result.error || '인포그래픽 생성 실패' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('인포그래픽 생성 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      { error: `인포그래픽 생성 중 오류: ${errorMessage}` },
      { status: 500 }
    );
  }
}
