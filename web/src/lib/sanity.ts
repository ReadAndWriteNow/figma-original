import { createClient, type ClientConfig } from '@sanity/client';

export interface SanityConfig {
  projectId: string;
  dataset: string;
  apiVersion: string;
  token?: string;
  useCdn?: boolean;
}

const LOCAL_STORAGE_SANITY_CONFIG_KEY = 'hanwoori_sanity_config';
const LOCAL_STORAGE_SITE_DATA_KEY = 'hanwoori_site_content_v1';
const LOCAL_STORAGE_QNA_KEY = 'hanwoori_qna_list_v1';
const LOCAL_STORAGE_REVIEWS_KEY = 'hanwoori_reviews_list_v1';

// 환경 변수 또는 localStorage에서 Sanity 설정 로드
export function getSanityConfig(): SanityConfig | null {
  const envProjectId = import.meta.env.VITE_SANITY_PROJECT_ID;
  const envDataset = import.meta.env.VITE_SANITY_DATASET || 'production';
  const envApiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2024-03-01';
  const envToken = import.meta.env.VITE_SANITY_TOKEN || '';

  try {
    const local = localStorage.getItem(LOCAL_STORAGE_SANITY_CONFIG_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.projectId) {
        return {
          projectId: parsed.projectId,
          dataset: parsed.dataset || envDataset,
          apiVersion: parsed.apiVersion || envApiVersion,
          token: parsed.token || envToken,
          useCdn: false,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse local Sanity config', e);
  }

  if (envProjectId) {
    return {
      projectId: envProjectId,
      dataset: envDataset,
      apiVersion: envApiVersion,
      token: envToken,
      useCdn: false,
    };
  }

  return null;
}

export function saveLocalSanityConfig(config: SanityConfig) {
  localStorage.setItem(LOCAL_STORAGE_SANITY_CONFIG_KEY, JSON.stringify(config));
}

export function getSanityClient(customConfig?: SanityConfig | null) {
  const config = customConfig || getSanityConfig();
  if (!config || !config.projectId) return null;

  const clientConfig: ClientConfig = {
    projectId: config.projectId,
    dataset: config.dataset || 'production',
    apiVersion: config.apiVersion || '2024-03-01',
    useCdn: !config.token, // 토큰이 있으면 실시간 write/read를 위해 CDN 끄기
  };

  if (config.token) {
    clientConfig.token = config.token;
  }

  return createClient(clientConfig);
}

// Sanity 연결 테스트 함수
export async function testSanityConnection(config: SanityConfig): Promise<{ success: boolean; message: string }> {
  try {
    const client = getSanityClient(config);
    if (!client) return { success: false, message: 'Project ID가 입력되지 않았습니다.' };
    
    // 단순 쿼리로 연결 확인
    await client.fetch('*[_type == "siteSettings"][0...1]');
    return { success: true, message: 'Sanity DB 연결 성공!' };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Sanity 연결 실패: Project ID 또는 Dataset을 확인하세요.',
    };
  }
}

// Sanity에서 전체 데이터 가져오기
export async function fetchSanityData(): Promise<{
  values?: Record<string, string>;
  qnaList?: any[];
  reviews?: any[];
} | null> {
  const client = getSanityClient();
  if (!client) return null;

  try {
    const [siteSettings, qnaItems, reviewItems] = await Promise.all([
      client.fetch('*[_type == "siteSettings"][0]'),
      client.fetch('*[_type == "qnaItem"] | order(order asc, _createdAt asc)'),
      client.fetch('*[_type == "reviewItem"] | order(date desc, _createdAt desc)'),
    ]);

    const result: { values?: Record<string, string>; qnaList?: any[]; reviews?: any[] } = {};

    if (siteSettings?.values) {
      result.values = siteSettings.values;
    }

    if (Array.isArray(qnaItems) && qnaItems.length > 0) {
      result.qnaList = qnaItems.map((item: any) => ({
        q: item.question || item.q || '',
        a: item.answer || item.a || '',
      }));
    }

    if (Array.isArray(reviewItems) && reviewItems.length > 0) {
      result.reviews = reviewItems.map((item: any) => ({
        id: item.reviewId || item.id || Date.now(),
        title: item.title || '',
        date: item.date || new Date().toISOString().slice(0, 10),
        body: item.body || '',
      }));
    }

    return result;
  } catch (e) {
    console.error('Sanity 데이터 fetch 실패:', e);
    return null;
  }
}

// Sanity에 전체 데이터 저장하기
export async function pushDataToSanity(
  values: Record<string, string>,
  qnaList: any[],
  reviews: any[]
): Promise<{ success: boolean; message: string }> {
  const config = getSanityConfig();
  if (!config) {
    return { success: false, message: 'Sanity 설정이 없습니다.' };
  }
  if (!config.token) {
    return {
      success: false,
      message: 'Sanity에 데이터를 저장하려면 Write 권한이 있는 API Token이 필요합니다 (Sanity 대시보드 > API > Tokens에서 생성).',
    };
  }

  const client = getSanityClient(config);
  if (!client) {
    return { success: false, message: 'Sanity 클라이언트를 생성할 수 없습니다.' };
  }

  try {
    // 1. siteSettings 저장
    await client.createOrReplace({
      _id: 'siteSettings',
      _type: 'siteSettings',
      title: '웹사이트 설정',
      values: values,
      updatedAt: new Date().toISOString(),
    });

    // 2. qna 저장 (기존 qna 삭제 후 재생성 또는 batch)
    const existingQna = await client.fetch('*[_type == "qnaItem"]._id');
    const transaction = client.transaction();
    for (const id of existingQna) {
      transaction.delete(id);
    }
    qnaList.forEach((item, index) => {
      transaction.create({
        _type: 'qnaItem',
        order: index,
        question: item.q,
        answer: item.a,
      });
    });

    // 3. reviews 저장
    const existingReviews = await client.fetch('*[_type == "reviewItem"]._id');
    for (const id of existingReviews) {
      transaction.delete(id);
    }
    reviews.forEach((item) => {
      transaction.create({
        _type: 'reviewItem',
        reviewId: item.id,
        title: item.title,
        date: item.date,
        body: item.body,
      });
    });

    await transaction.commit();
    return { success: true, message: 'Sanity DB에 성공적으로 저장 및 동기화되었습니다!' };
  } catch (error: any) {
    console.error('Sanity 저장 오류:', error);
    return {
      success: false,
      message: error?.message || 'Sanity 저장에 실패했습니다. API Token의 권한(Editor 이상)을 확인하세요.',
    };
  }
}

// 로컬 스토리지 헬퍼
export function loadLocalData<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`Failed to read ${key} from localStorage`, e);
  }
  return defaultValue;
}

export function saveLocalData<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage`, e);
  }
}

export {
  LOCAL_STORAGE_SANITY_CONFIG_KEY,
  LOCAL_STORAGE_SITE_DATA_KEY,
  LOCAL_STORAGE_QNA_KEY,
  LOCAL_STORAGE_REVIEWS_KEY,
};
