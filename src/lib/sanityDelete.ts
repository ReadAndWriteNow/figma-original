import { getSanityClient, cleanSanityConfig, getSanityConfig, getPermanentToken } from './sanity';

// 특정 수업 소식(리뷰) 삭제
export async function deleteReviewDirectly(reviewId: number): Promise<{ success: boolean; message: string }> {
  const cfg = getSanityConfig();
  const token = getPermanentToken() || cfg?.token;
  if (!cfg?.projectId || !token) {
    return { success: false, message: 'Sanity 설정 또는 Token 부재' };
  }
  const client = getSanityClient(cleanSanityConfig({ ...cfg, token }));
  if (!client) {
    return { success: false, message: 'Sanity 클라이언트 생성 실패' };
  }

  try {
    const tx = client.transaction();
    // 1. reviewItem_{id} 삭제
    tx.delete(`reviewItem_${reviewId}`);

    // 2. reviewId 필드가 일치하는 모든 문서 삭제 (혹시 이전 버전의 난수 ID 문서가 남아있는 경우)
    const matchingDocs = await client.fetch<string[]>(
      '*[_type == "reviewItem" && (reviewId == $rId || id == $rId)]._id',
      { rId: reviewId, _cb: Date.now() }
    );
    if (Array.isArray(matchingDocs)) {
      for (const docId of matchingDocs) {
        tx.delete(docId);
      }
    }
    await tx.commit();
    return { success: true, message: 'Sanity DB에서 삭제되었습니다.' };
  } catch (e: any) {
    console.error('deleteReviewDirectly error:', e);
    return { success: false, message: e?.message || '삭제 중 오류 발생' };
  }
}

// 특정 Q&A 삭제
export async function deleteQnaDirectly(orderIndex: number, questionText: string): Promise<{ success: boolean; message: string }> {
  const cfg = getSanityConfig();
  const token = getPermanentToken() || cfg?.token;
  if (!cfg?.projectId || !token) {
    return { success: false, message: 'Sanity 설정 또는 Token 부재' };
  }
  const client = getSanityClient(cleanSanityConfig({ ...cfg, token }));
  if (!client) {
    return { success: false, message: 'Sanity 클라이언트 생성 실패' };
  }

  try {
    const tx = client.transaction();
    tx.delete(`qnaItem_${orderIndex}`);
    if (questionText) {
      const matching = await client.fetch<string[]>(
        '*[_type == "qnaItem" && question == $q]._id',
        { q: questionText, _cb: Date.now() }
      );
      if (Array.isArray(matching)) {
        for (const docId of matching) {
          tx.delete(docId);
        }
      }
    }
    await tx.commit();
    return { success: true, message: 'Sanity DB에서 삭제되었습니다.' };
  } catch (e: any) {
    console.error('deleteQnaDirectly error:', e);
    return { success: false, message: e?.message || '삭제 중 오류 발생' };
  }
}
