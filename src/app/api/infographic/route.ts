import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { uploadInfographic } from '@/lib/storage';
import { getPaperCache, saveInfographicUrl } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, summary, keyPoints, methodology, arxivId } = body;

    if (!title || !summary || !keyPoints) {
      return NextResponse.json(
        { error: '제목, 요약, 핵심 포인트가 필요합니다' },
        { status: 400 }
      );
    }

    // 캐시된 인포그래픽이 있는지 확인
    if (arxivId) {
      const cache = await getPaperCache(arxivId);
      if (cache?.infographic_url) {
        return NextResponse.json({
          success: true,
          imageUrl: cache.infographic_url,
          cached: true,
        });
      }
    }

    // 임시 출력 디렉토리 확인 및 생성
    const outputDir = path.join(process.cwd(), 'tmp', 'infographics');
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
      // 파일 읽기
      const imageBuffer = fs.readFileSync(outputPath);

      // Supabase Storage에 업로드
      let imageUrl: string | null = null;

      if (arxivId) {
        imageUrl = await uploadInfographic(arxivId, imageBuffer);

        if (imageUrl) {
          // DB에 URL 저장
          await saveInfographicUrl(arxivId, imageUrl);
        }
      }

      // 로컬 임시 파일 삭제
      try {
        fs.unlinkSync(outputPath);
      } catch {
        // 삭제 실패해도 계속 진행
      }

      // Storage 업로드 실패 시 로컬 폴백
      if (!imageUrl) {
        const publicDir = path.join(process.cwd(), 'public', 'infographics');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        const publicPath = path.join(publicDir, filename);
        fs.writeFileSync(publicPath, imageBuffer);
        imageUrl = `/infographics/${filename}`;
      }

      return NextResponse.json({
        success: true,
        imageUrl,
        text: result.text,
        cached: false,
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
