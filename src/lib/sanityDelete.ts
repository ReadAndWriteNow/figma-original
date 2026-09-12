import { getSanityClient, cleanSanityConfig, getSanityConfig, getPermanentToken } from './sanity';

const LOCAL_STORAGE_DELETED_REVIEWS_KEY = 'hanwoori_deleted_review_ids_v1';
const LOCAL_STORAGE_DELETED_QNA_KEY = 'hanwoori_deleted_qna_v1';

// 삭제된 리뷰 ID 기록 및 확인
export function getDeletedReviewIds(): Set<number> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_REVIEWS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr.map(Number));
    }
  } catch (e) {}
  return new Set();
}

export function recordDeletedReviewId(reviewId: number) {
  try {
    const current = getDeletedReviewIds();
    current.add(Number(reviewId));
    localStorage.setItem(LOCAL_STORAGE_DELETED_REVIEWS_KEY, JSON.stringify(Array.from(current)));
  } catch (e) {}
}

// 삭제된 Q&A 질문 기록 및 확인
export function getDeletedQnaQuestions(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_QNA_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr.map(s => String(s).trim()));
    }
  } catch (e) {}
  return new Set();
}

export function recordDeletedQnaQuestion(qText: string) {
  try {
    if (!qText || !qText.trim()) return;
    const current = getDeletedQnaQuestions();
    current.add(qText.trim());
    localStorage.setItem(LOCAL_STORAGE_DELETED_QNA_KEY, JSON.stringify(Array.from(current)));
  } catch (e) {}
}

// 특정 수업 소식(리뷰) 즉시 및 영구 삭제
export async function deleteReviewDirectly(reviewId: number): Promise<{ success: boolean; message: string }> {
  recordDeletedReviewId(reviewId);

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
    // 1. 고유 결정적 ID 삭제
    tx.delete(`reviewItem_${reviewId}`);

    // 2. reviewId 필드가 일치하거나 혹시 남아있는 모든 관련 문서 검색 후 일괄 삭제
    const matchingDocs = await client.fetch<string[]>(
      '*[_type == "reviewItem" && (reviewId == $rId || id == $rId || _id == $docId)]._id',
      { rId: reviewId, docId: `reviewItem_${reviewId}`, _cb: Date.now() }
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

// 특정 Q&A 즉시 및 영구 삭제
export async function deleteQnaDirectly(orderIndex: number, questionText: string): Promise<{ success: boolean; message: string }> {
  if (questionText) {
    recordDeletedQnaQuestion(questionText);
  }

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
        '*[_type == "qnaItem" && (question == $q || _id == $docId)]._id',
        { q: questionText, docId: `qnaItem_${orderIndex}`, _cb: Date.now() }
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

