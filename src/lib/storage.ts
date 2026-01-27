import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'infographics';

/**
 * 인포그래픽 이미지를 Supabase Storage에 업로드
 */
export async function uploadInfographic(
  arxivId: string,
  imageBuffer: Buffer
): Promise<string | null> {
  try {
    const fileName = `${arxivId.replace(/[^a-zA-Z0-9.-]/g, '_')}_${Date.now()}.png`;
    const filePath = `papers/${fileName}`;

    const { data, error } = await supabase.storage
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
    const { data: urlData } = supabase.storage
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
  try {
    // URL에서 파일 경로 추출
    const urlParts = fileUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) return false;

    const filePath = urlParts[1];

    const { error } = await supabase.storage
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
