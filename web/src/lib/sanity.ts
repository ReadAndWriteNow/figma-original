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

// Sanity Project ID 기본값 (Vercel 환경 변수가 없을 때 모든 방문자에게 자동 적용할 기본값)
export const FALLBACK_PROJECT_ID = '8vs8axo9';

// Sanity 설정 정제 (공백 제거, URL에서 Project ID 추출, Token 정제 등)
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
  let token = (raw.token || '').trim();

  // 사용자가 "Bearer sk..." 형태로 복사했거나 따옴표가 들어간 경우 정제
  if (token.toLowerCase().startsWith('bearer ')) {
    token = token.slice(7).trim();
  }
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
    token = token.slice(1, -1).trim();
  }

  return {
    projectId: pid,
    dataset: ds,
    apiVersion: raw.apiVersion || '2024-03-01',
    token: token || undefined,
    useCdn: false,
  };
}

// 환경 변수, URL 파라미터, 또는 localStorage에서 Sanity 설정 로드
export function getSanityConfig(): SanityConfig | null {
  const envProjectId = (import.meta.env.VITE_SANITY_PROJECT_ID || FALLBACK_PROJECT_ID || '').trim();
  const envDataset = import.meta.env.VITE_SANITY_DATASET || 'production';
  const envApiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2024-03-01';
  const envToken = import.meta.env.VITE_SANITY_TOKEN || '';

  // 1. URL 쿼리 파라미터 확인 (?sanity=프로젝트ID 또는 ?sanityProject=프로젝트ID)
  // 카카오톡이나 모바일 기기로 공유할 때 자동으로 해당 기기에 Sanity 설정을 심어줌
  if (typeof window !== 'undefined') {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlPid = urlParams.get('sanity') || urlParams.get('sanityProject') || urlParams.get('sanity_project');
      if (urlPid) {
        const cleaned = cleanSanityConfig({
          projectId: urlPid,
          dataset: urlParams.get('dataset') || envDataset,
          apiVersion: envApiVersion,
          token: envToken,
          useCdn: false,
        });
        localStorage.setItem(LOCAL_STORAGE_SANITY_CONFIG_KEY, JSON.stringify(cleaned));
        return cleaned;
      }
    } catch (e) {
      console.warn('URL 파라미터 확인 실패:', e);
    }
  }

  // 2. localStorage 확인
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

  // 3. 환경 변수 또는 코드 내 기본값 확인
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
  adminPassword?: string;
} | null> {
  const client = getSanityClient();
  if (!client) return null;

  try {
    const [siteSettings, qnaItems, reviewItems] = await Promise.all([
      client.fetch('*[_type == "siteSettings"][0]'),
      client.fetch('*[_type == "qnaItem"] | order(order asc, _createdAt asc)'),
      client.fetch('*[_type == "reviewItem"] | order(date desc, _createdAt desc)'),
    ]);

    const result: { values?: Record<string, string>; qnaList?: any[]; reviews?: any[]; adminPassword?: string } = {};

    // 1. values 복원 (valuesJson 우선, 없으면 values 객체 복원)
    if (siteSettings?.valuesJson) {
      try {
        result.values = JSON.parse(siteSettings.valuesJson);
      } catch (e) {
        console.warn('valuesJson 파싱 실패:', e);
      }
    }
    if (!result.values && siteSettings?.values && typeof siteSettings.values === 'object') {
      const restored: Record<string, string> = {};
      for (const [k, v] of Object.entries(siteSettings.values)) {
        // __dot__ 또는 _를 .으로 복원
        const origKey = k.replace(/__dot__/g, '.');
        restored[origKey] = String(v ?? '');
      }
      result.values = restored;
    }

    // 관리자 비밀번호 동기화
    if (siteSettings?.adminPassword && typeof siteSettings.adminPassword === 'string') {
      result.adminPassword = siteSettings.adminPassword;
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
  reviews: any[],
  customConfig?: SanityConfig | null,
  adminPassword?: string
): Promise<{ success: boolean; message: string; errorType?: string }> {
  const rawConfig = customConfig || getSanityConfig();
  if (!rawConfig) {
    return { success: false, message: 'Sanity 설정(Project ID)이 입력되지 않았습니다.', errorType: 'invalidId' };
  }
  const config = cleanSanityConfig(rawConfig);
  if (!config.token) {
    return {
      success: false,
      message: 'Sanity로 데이터를 업로드하려면 Write 권한이 있는 API Token이 필요합니다 (Sanity 대시보드 API > Tokens에서 생성).',
      errorType: 'unauthorized',
    };
  }

  const client = getSanityClient(config);
  if (!client) {
    return { success: false, message: 'Sanity 클라이언트를 생성할 수 없습니다.' };
  }

  try {
    // 1. siteSettings 저장
    // 중요: Sanity는 필드 키에 마침표(.)를 허용하지 않으므로 valuesJson(JSON 직렬화) 및 __dot__ 치환 객체를 함께 보관합니다.
    const safeValues: Record<string, string> = {};
    for (const [k, v] of Object.entries(values || {})) {
      const safeKey = k.replace(/\./g, '__dot__');
      safeValues[safeKey] = String(v ?? '');
    }

    const doc: any = {
      _id: 'siteSettings',
      _type: 'siteSettings',
      title: '웹사이트 설정',
      valuesJson: JSON.stringify(values || {}),
      values: safeValues,
      updatedAt: new Date().toISOString(),
    };
    if (adminPassword) {
      doc.adminPassword = adminPassword;
    }

    await client.createOrReplace(doc);

    // 2. qna 저장
    const existingQna = await client.fetch('*[_type == "qnaItem"]._id');
    const qnaTx = client.transaction();
    if (Array.isArray(existingQna)) {
      for (const id of existingQna) {
        if (typeof id === 'string') {
          qnaTx.delete(id);
        }
      }
    }
    (qnaList || []).forEach((item, index) => {
      qnaTx.create({
        _type: 'qnaItem',
        order: index,
        question: item.q || '',
        answer: item.a || '',
      });
    });
    await qnaTx.commit();

    // 3. reviews 저장
    const existingReviews = await client.fetch('*[_type == "reviewItem"]._id');
    const reviewTx = client.transaction();
    if (Array.isArray(existingReviews)) {
      for (const id of existingReviews) {
        if (typeof id === 'string') {
          reviewTx.delete(id);
        }
      }
    }
    (reviews || []).forEach((item, index) => {
      reviewTx.create({
        _type: 'reviewItem',
        reviewId: Number(item.id) || index + 1,
        title: item.title || '',
        date: item.date || new Date().toISOString().slice(0, 10),
        body: item.body || '',
      });
    });
    await reviewTx.commit();

    return { success: true, message: '✓ Sanity DB에 웹사이트 모든 문구와 Q&A, 후기 데이터가 안전하게 저장되었습니다!' };
  } catch (error: any) {
    console.error('Sanity 저장 오류:', error);
    const statusCode = error?.statusCode || error?.response?.statusCode;
    const bodyError = error?.response?.body?.error || error?.response?.body?.message || '';
    const errStr = String(error?.message || error || '');

    if (statusCode === 401) {
      return {
        success: false,
        errorType: 'unauthorized',
        message: 'API Token 인증 실패(401 Unauthorized): 입력하신 Token이 올바르지 않거나 만료되었습니다. Sanity 대시보드(API > Tokens)에서 새 토큰을 발급받아 입력해 주세요.',
      };
    }
    if (
      statusCode === 403 ||
      errStr.toLowerCase().includes('insufficient') ||
      String(bodyError).toLowerCase().includes('insufficient')
    ) {
      return {
        success: false,
        errorType: 'insufficient_permissions',
        message: "토큰 권한 부족(403 Forbidden): 발급받으신 토큰의 권한이 'Viewer(읽기 전용)'로 되어 있습니다. Sanity 대시보드(API > Tokens)에서 권한을 꼭 '[Editor]'로 선택하여 새 토큰을 만들어 입력해 주세요!",
      };
    }
    if (
      errStr.includes('Failed to fetch') ||
      errStr.includes('NetworkError') ||
      errStr.includes('Load failed') ||
      errStr.includes('Network request failed')
    ) {
      return {
        success: false,
        errorType: 'cors',
        message: '브라우저 CORS 차단: Sanity 대시보드(API > CORS Origins)에 현재 주소를 등록하고 "Allow credentials" 체크박스를 꼭 활성화해야 데이터를 업로드할 수 있습니다.',
      };
    }

    return {
      success: false,
      errorType: 'unknown',
      message: `Sanity 저장 실패 (${statusCode ? `HTTP ${statusCode}` : ''}): ${bodyError || errStr}`,
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
