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

// Sanity 설정 정제 (공백 제거, URL에서 Project ID 추출 등)
export function cleanSanityConfig(raw: SanityConfig): SanityConfig {
  let pid = (raw.projectId || '').trim();
  // 사용자가 URL을 통째로 붙여넣은 경우 (예: https://www.sanity.io/manage/project/x9q8w2y1)
  if (pid.includes('/project/')) {
    pid = pid.split('/project/')[1]?.split('/')[0]?.split('?')[0] || pid;
  } else if (pid.includes('/projects/')) {
    pid = pid.split('/projects/')[1]?.split('/')[0]?.split('?')[0] || pid;
  } else if (pid.includes('.api.sanity.io')) {
    pid = pid.replace(/^https?:\/\//, '').split('.api.sanity.io')[0] || pid;
  }
  // 영문 소문자/대문자, 숫자, 하이픈, 언더스코어만 남김
  pid = pid.replace(/[^a-zA-Z0-9_-]/g, '');

  const ds = (raw.dataset || '').trim() || 'production';
  const token = (raw.token || '').trim();

  return {
    projectId: pid,
    dataset: ds,
    apiVersion: raw.apiVersion || '2024-03-01',
    token: token || undefined,
    useCdn: false,
  };
}

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
        return cleanSanityConfig({
          projectId: parsed.projectId,
          dataset: parsed.dataset || envDataset,
          apiVersion: parsed.apiVersion || envApiVersion,
          token: parsed.token || envToken,
          useCdn: false,
        });
      }
    }
  } catch (e) {
    console.warn('Failed to parse local Sanity config', e);
  }

  if (envProjectId) {
    return cleanSanityConfig({
      projectId: envProjectId,
      dataset: envDataset,
      apiVersion: envApiVersion,
      token: envToken,
      useCdn: false,
    });
  }

  return null;
}

export function saveLocalSanityConfig(config: SanityConfig) {
  const cleaned = cleanSanityConfig(config);
  localStorage.setItem(LOCAL_STORAGE_SANITY_CONFIG_KEY, JSON.stringify(cleaned));
}

export function getSanityClient(customConfig?: SanityConfig | null) {
  const rawConfig = customConfig || getSanityConfig();
  if (!rawConfig) return null;
  const config = cleanSanityConfig(rawConfig);
  if (!config.projectId) return null;

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

export interface SanityTestResult {
  success: boolean;
  message: string;
  errorType?: 'cors' | 'notFound' | 'unauthorized' | 'invalidId' | 'unknown';
  currentOrigin?: string;
  manageUrl?: string;
  cleanProjectId?: string;
}

// Sanity 연결 테스트 함수 (CORS 및 각종 에러 정밀 진단)
export async function testSanityConnection(rawConfig: SanityConfig): Promise<SanityTestResult> {
  const config = cleanSanityConfig(rawConfig);
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const manageUrl = config.projectId 
    ? `https://www.sanity.io/manage/project/${config.projectId}/api`
    : 'https://www.sanity.io/manage';

  if (!config.projectId) {
    return {
      success: false,
      errorType: 'invalidId',
      message: 'Sanity Project ID가 입력되지 않았습니다.',
      currentOrigin,
      manageUrl,
    };
  }

  const queryUrl = `https://${config.projectId}.api.sanity.io/v${config.apiVersion}/data/query/${config.dataset}?query=${encodeURIComponent('*[_type == "siteSettings"][0...1]')}`;

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (config.token) {
      headers['Authorization'] = `Bearer ${config.token}`;
    }

    const res = await fetch(queryUrl, {
      method: 'GET',
      headers,
    });

    if (res.ok) {
      return {
        success: true,
        message: '✓ Sanity DB에 성공적으로 연결되었습니다!',
        cleanProjectId: config.projectId,
        currentOrigin,
        manageUrl,
      };
    }

    const resText = await res.text();
    let parsed: any = null;
    try {
      parsed = JSON.parse(resText);
    } catch (_) {}

    const errorMsg = parsed?.message || resText || '';

    if (res.status === 404) {
      if (errorMsg.toLowerCase().includes('project') || errorMsg.includes('not found')) {
        return {
          success: false,
          errorType: 'notFound',
          message: `입력하신 Project ID('${config.projectId}')를 Sanity에서 찾을 수 없습니다. Sanity 관리자 콘솔에서 올바른 Project ID를 확인해 주세요.`,
          cleanProjectId: config.projectId,
          currentOrigin,
          manageUrl: 'https://www.sanity.io/manage',
        };
      }
      return {
        success: false,
        errorType: 'notFound',
        message: `Dataset('${config.dataset}')을 찾을 수 없습니다. Sanity 대시보드에 등록된 dataset 이름(기본값: production)인지 확인해 주세요.`,
        cleanProjectId: config.projectId,
        currentOrigin,
        manageUrl,
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        errorType: 'unauthorized',
        message: `API Token 인증 오류 (${parsed?.error || 'Unauthorized'}): Token이 올바른지, 만료되지 않았는지, Editor 권한인지 확인해 주세요.`,
        cleanProjectId: config.projectId,
        currentOrigin,
        manageUrl,
      };
    }

    return {
      success: false,
      errorType: 'unknown',
      message: `Sanity 서버 오류 (HTTP ${res.status}): ${errorMsg}`,
      cleanProjectId: config.projectId,
      currentOrigin,
      manageUrl,
    };
  } catch (err: any) {
    const errStr = String(err?.message || err);
    // 브라우저에서 fetch() 거부되는 경우는 거의 100% CORS 미등록입니다!
    if (
      errStr.includes('Failed to fetch') ||
      errStr.includes('NetworkError') ||
      errStr.includes('Load failed') ||
      errStr.includes('Network request failed')
    ) {
      return {
        success: false,
        errorType: 'cors',
        message: `CORS 보안 정책에 의해 연결이 차단되었습니다. Sanity 대시보드 > API > CORS Origins에 현재 접속 도메인(${currentOrigin})을 추가하고 'Allow credentials'를 체크해야 합니다.`,
        cleanProjectId: config.projectId,
        currentOrigin,
        manageUrl,
      };
    }

    return {
      success: false,
      errorType: 'unknown',
      message: `네트워크 연결 실패: ${errStr}`,
      cleanProjectId: config.projectId,
      currentOrigin,
      manageUrl,
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
