import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

const BUCKET_NAME = 'infographics';

// Supabase 클라이언트 lazy 초기화
let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase 설정이 없습니다. 로컬 스토리지로 폴백합니다.');
    return null;
  }
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

/**
 * 인포그래픽 이미지를 Supabase Storage에 업로드
 */
export async function uploadInfographic(
  arxivId: string,
  imageBuffer: Buffer
): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null; // Supabase 미설정 시 null 반환 (로컬 폴백)
  }

  try {
    const fileName = `${arxivId.replace(/[^a-zA-Z0-9.-]/g, '_')}_${Date.now()}.png`;
    const filePath = `papers/${fileName}`;

    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) {
      console.error('Storage 업로드 오류:', error);
      return null;
    }

    // Public URL 가져오기
    const { data: urlData } = client.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('인포그래픽 업로드 오류:', error);
    return null;
  }
}

/**
 * 인포그래픽 이미지 삭제
 */
export async function deleteInfographic(fileUrl: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    return false;
  }

  try {
    // URL에서 파일 경로 추출
    const urlParts = fileUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) return false;

    const filePath = urlParts[1];

    const { error } = await client.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Storage 삭제 오류:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('인포그래픽 삭제 오류:', error);
    return false;
  }
}
