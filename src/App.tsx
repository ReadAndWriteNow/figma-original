import { useState, useEffect, useRef } from "react";
import {
  getSanityConfig,
  saveLocalSanityConfig,
  cleanSanityConfig,
  testSanityConnection,
  fetchSanityData,
  pushDataToSanity,
  saveTokenToSanity,
  getPermanentToken,
  setPermanentToken,
  loadLocalData,
  saveLocalData,
  LOCAL_STORAGE_SITE_DATA_KEY,
  LOCAL_STORAGE_QNA_KEY,
  LOCAL_STORAGE_REVIEWS_KEY,
  type SanityConfig,
  type SanityTestResult,
} from "./lib/sanity";
import {
  deleteReviewDirectly,
  deleteQnaDirectly,
  getDeletedReviewIds,
  getDeletedQnaQuestions,
} from "./lib/sanityDelete";

const DEFAULT_VALUES: Record<string, string> = {
  "header.title": "한우리 독서토론논술",
  "header.subtitle": "파주운정 산내푸르지오 독서교실",
  "intro.badge": "파주운정 산내푸르지오 · 10년 원장 직강 소수정예",
  "intro.headline": "스마트폰에 빼앗긴 문해력,\n스스로 생각하고 표현하는 아이로",
  "intro.quote": "아이의 생각이 깊어지고, 읽는 기쁨이 자라나는 따뜻한 공간",
  "intro.sub": "스스로 생각의 씨앗을 틔울 수 있도록 돕습니다.",
  "intro.point1_title": "10년 원장 직강",
  "intro.point1_desc": "보조강사 없이 직접 지도",
  "intro.point2_title": "1반 최대 6명",
  "intro.point2_desc": "발표 & 토론 기회 보장",
  "intro.point3_title": "매월 새 필독서",
  "intro.point3_desc": "교과연계 한우리 30년",
  "intro.point4_title": "1:1 맞춤 첨삭",
  "intro.point4_desc": "정기 포트폴리오 관리",
  "about.slogan": "생각하는 힘이 아이의 미래를 바꿉니다",
  "about.name": "원장 이해옥",
  "about.career": "독서토론논술 교습소 운영 (10년 경력)\n해법·한우리 독서토론교습소 운영\n독서지도사 자격 보유",
  "about.desc": "단순히 책을 읽고 글을 쓰는 것을 넘어, 아이들이 스스로 생각하고 질문하는 힘을 길러주는 것을 교육 철학으로 삼고 있습니다.",
  "about.letter": "제 아이를 책으로 키우며 느꼈던 배움의 감동을 우리 지역 아이들에게 전하고자 시작한 지 10년이 되었습니다. 성급하게 재촉하지 않고, 아이마다 다른 생각의 보폭을 따뜻하게 지켜보겠습니다.",
  "curriculum.elem_title": "저학년 / 고학년",
  "curriculum.elem_body": "그림책과 문학 작품을 통한 흥미 위주의 독서. 주 1회 주제별 글쓰기 및 자유 토론 진행.",
  "curriculum.mid_title": "내신 및 심화 논술",
  "curriculum.mid_body": "비문학 읽기 및 신문 칼럼 분석. 서술형 평가 대비 및 중등 내신 연계형 심화 논술 작성.",
  "curriculum.elem_low_head": "그림책에서 줄글책으로, 재미있게 말하고 쓰기",
  "curriculum.elem_low_desc": "독서에 대한 긍정적인 흥미를 키우고 어휘력을 폭넓게 확장합니다. 책을 읽은 뒤 떠오르는 느낌을 자유롭게 말하고, 짧은 문장부터 한 단락의 글을 스스로 써내는 성취감을 배웁니다.",
  "curriculum.elem_high_head": "교과 연계 배경지식과 논리적인 서술형 글쓰기",
  "curriculum.elem_high_desc": "문학 작품뿐 아니라 역사, 사회, 과학 등 교과 연계 비문학 도서를 깊이 있게 다룹니다. 서로 다른 생각을 경청하는 토론을 거쳐 논리적 근거를 갖춘 서술형 논술문을 완성합니다.",
  "curriculum.mid_head": "중등 내신 만점과 수능 국어 1등급의 탄탄한 토대",
  "curriculum.mid_desc": "신문 칼럼, 시사 논증, 비판적 독해를 통해 수능 국어 비문학 지문에 대비합니다. 중학교 서술형 내신 평가와 자유학기제 글쓰기 수행평가를 원장이 1:1로 밀착 지도합니다.",
  "faq.q1": "한 반 인원과 수업 시간은 어떻게 되나요?",
  "faq.a1": "한 반에 최대 6명 이하 소수 정예로 운영되며, 모든 아이가 충분히 발표하고 경청할 수 있도록 원장이 직접 지도합니다. 수업은 주 1회 80분~100분 과정으로 진행됩니다.",
  "faq.q2": "책을 잘 안 읽는 아이도 적응할 수 있을까요?",
  "faq.a2": "처음부터 두꺼운 책을 강요하지 않고, 질문과 대화로 흥미를 여는 '몰입독서' 방식으로 시작합니다. 아이의 눈높이에 맞춰 성취감을 느끼도록 이끕니다.",
  "info.hours": "평일 14:00 ~ 20:00 (주말 및 공휴일 휴무)",
  "info.address": "경기 파주시 심학산로 385 운정신도시센트럴푸르지오 상가 2동 204호",
  "info.parking": "건물 뒷편 주차장 이용 가능",
  "contact.desc": "우리 아이에게 딱 맞는 독서 논술 교육, 지금 바로 상담받아보세요!",
  "contact.kakao": "http://pf.kakao.com/_xxxxxx",
};

const NAV_ITEMS = [
  { href: "about", label: "교습소 소개" },
  { href: "curriculum", label: "커리큘럼" },
  { href: "facility", label: "시설 안내" },
  { href: "info", label: "운영 안내" },
  { href: "contact", label: "상담 문의" },
];

/* ─── 수업 소식 타입 & 초기 데이터 ─── */
type Review = {
  id: number;
  title: string;
  date: string;
  body: string;
  isPrivate?: boolean;
  password?: string;
};
function newReview(existing?: Review[]): Review {
  const maxId = existing && existing.length > 0
    ? Math.max(...existing.map(r => Number(r.id) || 0))
    : 100;
  return {
    id: maxId + 1,
    title: "",
    date: new Date().toISOString().slice(0, 10),
    body: "",
    isPrivate: false,
    password: "",
  };
}
const REVIEW_SAMPLES: Review[] = [
  { id: 1, title: "11월 초등부 수업 — 『마당을 나온 암탉』 토론", date: "2024-11-08",
    body: "<p>이번 주 초등부는 황선미 작가의 『마당을 나온 암탉』을 함께 읽고 이야기 나눴습니다.</p><p>\"잎싹이 마당을 나온 건 용감한 걸까요, 무모한 걸까요?\"라는 질문에 아이들마다 다양한 의견이 나와 토론이 풍성하게 이어졌어요. 자유와 안전 중 무엇이 더 중요한지 스스로 생각해보는 시간이 되었습니다.</p><p>다음 주는 이 책을 바탕으로 짧은 주장 글쓰기를 진행할 예정입니다. 기대해주세요! 😊</p>" },
  { id: 2, title: "10월 중등부 — 신문 칼럼으로 논술 연습", date: "2024-10-18",
    body: "<p>중등부 수업에서는 최근 환경 문제를 다룬 신문 칼럼을 함께 읽고 분석했습니다.</p><p>글의 주장과 근거를 찾아 정리하고, 자신의 의견을 덧붙여 짧은 논술문으로 완성하는 과정을 밟았어요. 처음엔 어려워하던 친구들도 마무리쯤엔 꽤 탄탄한 문단을 완성해서 뿌듯했습니다.</p>" },
  { id: 3, title: "9월 수업 — 독서 토론 규칙 익히기", date: "2024-09-06",
    body: "<p>9월 첫 수업에서는 토론의 기본 규칙을 배우는 시간을 가졌습니다. 상대방 의견을 끝까지 듣기, 근거를 들어 반박하기, 감정이 아닌 사실로 이야기하기.</p><p>간단한 주제로 모의 토론을 진행했는데 아이들이 생각보다 훨씬 적극적으로 참여해서 놀랐어요. 앞으로의 수업이 더 기대됩니다!</p>" },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function KakaoMap({ address }: { address?: string }) {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const containerId = "daumRoughmapContainer1788803690193";

  useEffect(() => {
    let isCancelled = false;

    async function initializeRoughMap() {
      try {
        const c = window.location.protocol === "https:" ? "https:" : "http:";
        const a = "2851f17d_1787547759105";
        const p = "prod";

        (window as any).daum = (window as any).daum || {};
        (window as any).daum.roughmap = (window as any).daum.roughmap || {
          phase: p,
          cdn: a,
          URL_KEY_DATA_LOAD_PRE: `${c}//t1.kakaocdn.net/roughmap/`,
          url_protocal: c,
          url_cdn_domain: "//t1.kakaocdn.net",
        };

        // roughmapLoader.js는 document.write를 호출하여 비동기 스크립트 실행 환경(Chrome/Vercel 등)에서 차단됨
        // 따라서 roughmapLander.js를 DOM에 직접 주입하여 차단을 완벽하게 우회
        if (!(window as any).daum?.roughmap?.Lander) {
          await new Promise<void>((resolve, reject) => {
            const landerSrc = `${c}//t1.kakaocdn.net/kakaomapweb/roughmap/place/${p}/${a}/roughmapLander.js`;
            let script = document.querySelector(`script[src*="roughmapLander.js"]`) as HTMLScriptElement | null;
            if (!script) {
              script = document.createElement("script");
              script.charset = "UTF-8";
              script.src = landerSrc;
              script.async = true;
              script.onload = () => resolve();
              script.onerror = (e) => reject(e);
              document.head.appendChild(script);
            } else {
              const checkTimer = setInterval(() => {
                if ((window as any).daum?.roughmap?.Lander) {
                  clearInterval(checkTimer);
                  resolve();
                }
              }, 100);
              setTimeout(() => {
                clearInterval(checkTimer);
                if ((window as any).daum?.roughmap?.Lander) resolve();
                else reject(new Error("Timeout loading Kakao Map Lander"));
              }, 5000);
            }
          });
        }

        if (isCancelled) return;

        const container = document.getElementById(containerId);
        if (!container) return;

        // 이미 지도가 렌더링되어 있다면 중복 실행 방지
        if (container.querySelector(".roughmap_maker_label") || container.querySelector(".roughmap_inner")) {
          setLoading(false);
          return;
        }

        // 이전 잔여 내용 정리
        container.innerHTML = "";

        // 카카오 공식 약도 Lander 실행
        new (window as any).daum.roughmap.Lander({
          timestamp: "1788803690193",
          key: "2ihvyw7i9ytd",
          mapWidth: "100%",
          mapHeight: "350",
        }).render();

        // 렌더링 완료 감지
        let pollCount = 0;
        const pollTimer = setInterval(() => {
          pollCount++;
          const el = document.getElementById(containerId);
          if (el && (el.querySelector(".roughmap_inner") || el.children.length > 0)) {
            clearInterval(pollTimer);
            if (!isCancelled) setLoading(false);
          } else if (pollCount > 35) {
            clearInterval(pollTimer);
            if (!isCancelled) setLoading(false);
          }
        }, 150);

      } catch (err) {
        console.error("Kakao roughmap initialization failed:", err);
        if (!isCancelled) {
          setLoading(false);
          setHasError(true);
        }
      }
    }

    const t = setTimeout(() => {
      initializeRoughMap();
    }, 50);

    return () => {
      isCancelled = true;
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-[#F8FAFC]">
      {/* 카카오 지도 본체 컨테이너 */}
      <div
        id={containerId}
        className="root_daum_roughmap root_daum_roughmap_landing w-full min-h-[350px]"
        style={{ minHeight: "350px", width: "100%" }}
      />

      {/* 로딩 상태 표시기 */}
      {loading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/90 backdrop-blur-[1px] z-10 pointer-events-none">
          <div className="w-8 h-8 border-3 border-[#FF7F50] border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-[#6B7280] font-semibold">카카오맵 지도를 불러오는 중입니다...</p>
        </div>
      )}

      {/* 로드 실패 시 대체 안내 */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-amber-50/80 z-10">
          <span className="text-3xl mb-2">📍</span>
          <p className="text-sm font-bold text-[#1E2B3A]">한우리독서토론논술 산내푸르지오 교습소</p>
          <p className="text-xs text-[#6B7280] mt-1 mb-4">
            {address || "경기 파주시 심학산로 385 운정신도시센트럴푸르지오 상가 2동 204호"}
          </p>
          <a
            href={`https://map.kakao.com/link/search/${encodeURIComponent(address || "경기 파주시 심학산로 385 운정신도시센트럴푸르지오")}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-[#FF7F50] text-white text-xs font-bold rounded-xl shadow hover:bg-[#E8623A] transition"
          >
            카카오맵에서 위치 확인하기 →
          </a>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   MOBILE LAYOUT (프리미엄 에디토리얼 마케팅 디자인)
═══════════════════════════════════════ */
function MobileLayout({
  onQna,
  onReview,
  values,
  onOpenAdmin,
}: {
  onQna: () => void;
  onReview: () => void;
  values: Record<string, string>;
  onOpenAdmin?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currTab, setCurrTab] = useState<"elem_low" | "elem_high" | "mid">("elem_low");
  const [quickFaqOpen, setQuickFaqOpen] = useState<number | null>(null);

  const careerItems = (values["about.career"] || "독서토론논술 교습소 운영 (10년 경력)\n해법·한우리 독서토론교습소 운영\n독서지도사 자격 보유")
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean);

  const kakaoUrl = values["contact.kakao"] || "http://pf.kakao.com/_xxxxxx";

  return (
    <div style={{ wordBreak: "keep-all" }} className="min-h-screen bg-[#FAFAF9] text-[#0F172A] pb-22">

      {/* 1. 상단 고정 모바일 헤더 (컴팩트 & 넉넉한 타이틀 여백) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 py-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex flex-col justify-center mr-3">
            <h1 className="font-serif-kr text-[15px] font-black text-[#0F172A] leading-tight tracking-tight">
              {values["header.title"] || "한우리 독서토론논술"}
            </h1>
            <p className="text-[10px] font-semibold text-stone-500 mt-0.5 tracking-tight">
              파주운정 산내푸르지오 독서교실
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={kakaoUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-[11px] font-bold shadow-xs active:scale-95 transition flex items-center gap-1"
            >
              <span>💬</span>
              <span>1:1 상담예약</span>
            </a>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg bg-stone-100 text-stone-700 active:bg-stone-200 border border-stone-200/60"
              aria-label="메뉴 열기"
            >
              {menuOpen ? (
                <span className="block text-xs font-bold leading-none w-3.5 text-center">✕</span>
              ) : (
                <div className="space-y-0.5 w-3.5">
                  <span className="block w-3.5 h-0.5 bg-stone-800" />
                  <span className="block w-3.5 h-0.5 bg-stone-800" />
                  <span className="block w-3.5 h-0.5 bg-stone-800" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* 모바일 햄버거 메뉴 패널 */}
        {menuOpen && (
          <nav className="mt-2.5 pt-2.5 border-t border-stone-100 grid grid-cols-2 gap-2 animate-in fade-in duration-150">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.href}
                onClick={() => { scrollTo(item.href); setMenuOpen(false); }}
                className="py-2 px-3 rounded-lg text-xs font-bold bg-stone-50 active:bg-stone-100 text-stone-800 text-left border border-stone-200/60"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => { onQna(); setMenuOpen(false); }}
              className="py-2 px-3 rounded-lg text-xs font-bold bg-orange-50 text-orange-800 active:bg-orange-100 text-left border border-orange-200/80"
            >
              📋 자주 묻는 질문
            </button>
            <button
              onClick={() => { onReview(); setMenuOpen(false); }}
              className="py-2 px-3 rounded-lg text-xs font-bold bg-orange-50 text-orange-800 active:bg-orange-100 text-left border border-orange-200/80"
            >
              📖 수업 소식
            </button>
          </nav>
        )}
      </header>

      {/* 2. 모바일 마케팅 히어로 (학부모의 시선을 사로잡는 강력한 훅 & 4대 신뢰 지표) */}
      <section className="relative overflow-hidden bg-white px-5 pt-7 pb-8 border-b border-stone-200/60">
        <div className="max-w-md mx-auto">
          {/* 상단 타깃팅 뱃지 */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-[#EA580C] text-[11px] font-bold border border-orange-200/80 mb-3">
            <span>📍</span>
            <span>파주운정 산내푸르지오 · 10년 원장 직강 소수정예</span>
          </div>

          {/* 메인 헤드라인 */}
          <h2 className="font-serif-kr text-[23px] font-black text-[#0F172A] leading-snug tracking-tight mb-2.5">
            스마트폰에 빼앗긴 문해력,<br />
            스스로 생각하고 <span className="text-[#EA580C] underline decoration-orange-200 decoration-wavy underline-offset-6">표현하는 아이로</span>
          </h2>

          <p className="text-xs font-medium text-stone-600 leading-relaxed mb-4">
            "{values["intro.quote"] || "아이의 생각이 깊어지고, 읽는 기쁨이 자라나는 따뜻한 공간"}"
          </p>

          {/* 모바일 퀵 액션 (1순위 전환 유도) */}
          <div className="flex flex-col gap-2 mb-5">
            <a
              href={kakaoUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#EA580C] active:bg-[#C2410C] text-white font-extrabold text-xs py-3.5 px-5 rounded-xl shadow-md shadow-orange-500/20 transition"
            >
              <span>💬 카카오톡 1:1 상담 예약 (잔여석 문의)</span>
              <span>→</span>
            </a>
          </div>

          {/* 4대 안심 포인트 칩 (모바일 컴팩트 2x2) */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-stone-100">
            <div className="bg-[#FAFAF9] p-2.5 rounded-xl border border-stone-200/70 flex items-center gap-2">
              <span className="text-base shrink-0">🎓</span>
              <div>
                <p className="text-xs font-bold text-[#0F172A]">10년 원장 직강</p>
                <p className="text-[10px] text-stone-500">보조강사 없이 직접 지도</p>
              </div>
            </div>
            <div className="bg-[#FAFAF9] p-2.5 rounded-xl border border-stone-200/70 flex items-center gap-2">
              <span className="text-base shrink-0">👥</span>
              <div>
                <p className="text-xs font-bold text-[#0F172A]">1반 최대 6명</p>
                <p className="text-[10px] text-stone-500">발표 & 토론 기회 보장</p>
              </div>
            </div>
            <div className="bg-[#FAFAF9] p-2.5 rounded-xl border border-stone-200/70 flex items-center gap-2">
              <span className="text-base shrink-0">📚</span>
              <div>
                <p className="text-xs font-bold text-[#0F172A]">매월 새 필독서</p>
                <p className="text-[10px] text-stone-500">교과연계 한우리 30년</p>
              </div>
            </div>
            <div className="bg-[#FAFAF9] p-2.5 rounded-xl border border-stone-200/70 flex items-center gap-2">
              <span className="text-base shrink-0">✍️</span>
              <div>
                <p className="text-xs font-bold text-[#0F172A]">1:1 맞춤 첨삭</p>
                <p className="text-[10px] text-stone-500">정기 포트폴리오 관리</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 학부모 공감 솔루션 (Parent's Worry & Solution) */}
      <section className="px-5 py-8 bg-[#F7F6F3] border-b border-stone-200/70">
        <div className="max-w-md mx-auto">
          <p className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider mb-1">Parent's Worry & Solution</p>
          <h3 className="font-serif-kr text-lg font-black text-[#0F172A] leading-snug mb-3.5">
            학부모님, 요즘 우리 아이 독서에<br />
            이런 고민이 있으신가요?
          </h3>

          <div className="space-y-2.5">
            <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-xs">
              <p className="text-xs font-bold text-stone-900 flex items-start gap-1.5 mb-1.5">
                <span className="text-[#EA580C] font-black shrink-0">고민 01</span>
                <span>"책은 많이 읽는데, 줄거리나 생각을 물어보면 머뭇거려요."</span>
              </p>
              <div className="bg-orange-50/60 p-2.5 rounded-lg border border-orange-200/60 text-xs text-stone-600 leading-relaxed">
                <span className="font-bold text-[#EA580C]">✦ 한우리의 솔루션: </span>
                수동적 읽기를 넘어 질문을 던지고 토론하는 <strong>'생각 열기 수업'</strong>으로 능동적 사고와 말하기를 이끕니다.
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-xs">
              <p className="text-xs font-bold text-stone-900 flex items-start gap-1.5 mb-1.5">
                <span className="text-[#EA580C] font-black shrink-0">고민 02</span>
                <span>"초등 고학년, 중학교 서술형 평가와 긴 지문 독해가 걱정돼요."</span>
              </p>
              <div className="bg-orange-50/60 p-2.5 rounded-lg border border-orange-200/60 text-xs text-stone-600 leading-relaxed">
                <span className="font-bold text-[#EA580C]">✦ 한우리의 솔루션: </span>
                문학·비문학·시사 칼럼을 고루 다루어 <strong>수능 국어와 내신 서술형의 탄탄한 토대</strong>를 미리 다집니다.
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-xs">
              <p className="text-xs font-bold text-stone-900 flex items-start gap-1.5 mb-1.5">
                <span className="text-[#EA580C] font-black shrink-0">고민 03</span>
                <span>"스마트폰과 숏폼에 익숙해져 한 권을 끝까지 읽지 못해요."</span>
              </p>
              <div className="bg-orange-50/60 p-2.5 rounded-lg border border-orange-200/60 text-xs text-stone-600 leading-relaxed">
                <span className="font-bold text-[#EA580C]">✦ 한우리의 솔루션: </span>
                원장이 전 과정을 밀착 지도하는 <strong>'몰입독서'</strong>로 스스로 한 권을 완독하는 성취감과 집중력을 기릅니다.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 마케팅 특화 인터랙티브 커리큘럼 탭 (모바일 최적화 UX) */}
      <section id="curriculum" className="px-5 py-9 bg-white border-b border-stone-200/60">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <p className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider mb-1">Customized Curriculum</p>
            <h3 className="font-serif-kr text-xl font-black text-[#0F172A]">
              학년별 맞춤 커리큘럼
            </h3>
            <p className="text-xs text-stone-500 mt-1">우리 아이 학년을 탭하여 세부 내용을 확인해보세요.</p>
          </div>

          {/* 탭 버튼 세트 (손쉬운 모바일 핑거 탭) */}
          <div className="flex gap-1.5 p-1 bg-stone-100 rounded-xl mb-4 border border-stone-200/60">
            <button
              onClick={() => setCurrTab("elem_low")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                currTab === "elem_low"
                  ? "bg-white text-[#EA580C] shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              초등 저학년
            </button>
            <button
              onClick={() => setCurrTab("elem_high")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                currTab === "elem_high"
                  ? "bg-white text-[#EA580C] shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              초등 고학년
            </button>
            <button
              onClick={() => setCurrTab("mid")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                currTab === "mid"
                  ? "bg-white text-[#EA580C] shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              중등 심화반
            </button>
          </div>

          {/* 탭 내용 카드 */}
          {currTab === "elem_low" && (
            <div className="bg-[#FFFDFB] rounded-2xl p-4.5 border border-orange-200/80 shadow-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#EA580C] bg-orange-100 px-2.5 py-0.5 rounded-full">
                  1~3학년 (읽기 독립 & 생각 틔우기)
                </span>
                <span className="text-[11px] text-stone-400 font-semibold">1반 6명 정원</span>
              </div>
              <h4 className="text-base font-extrabold text-stone-900 mb-2">
                그림책에서 줄글책으로, 재미있게 말하고 쓰기
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed mb-3.5">
                독서에 대한 긍정적인 흥미를 키우고 어휘력을 폭넓게 확장합니다. 책을 읽은 뒤 떠오르는 느낌을 자유롭게 말하고, 짧은 문장부터 한 단락의 글을 스스로 써내는 성취감을 배웁니다.
              </p>
              <div className="space-y-1.5 text-xs text-stone-700 bg-white p-3 rounded-xl border border-stone-200/70">
                <p className="flex items-center gap-2"><span className="text-[#EA580C] font-bold">✓</span> 책 읽는 습관 형성 및 스스로 읽기 독립</p>
                <p className="flex items-center gap-2"><span className="text-[#EA580C] font-bold">✓</span> 감정 표현 어휘 및 기초 독해력 훈련</p>
                <p className="flex items-center gap-2"><span className="text-[#EA580C] font-bold">✓</span> 주 1회 주제별 그림일기 및 생각 글쓰기</p>
              </div>
            </div>
          )}

          {currTab === "elem_high" && (
            <div className="bg-[#FFFDFB] rounded-2xl p-4.5 border border-orange-200/80 shadow-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#EA580C] bg-orange-100 px-2.5 py-0.5 rounded-full">
                  4~6학년 (교과 비문학 & 서술형 논술)
                </span>
                <span className="text-[11px] text-stone-400 font-semibold">1반 6명 정원</span>
              </div>
              <h4 className="text-base font-extrabold text-stone-900 mb-2">
                교과 연계 배경지식과 논리적인 서술형 글쓰기
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed mb-3.5">
                문학 작품뿐 아니라 역사, 사회, 과학 등 교과 연계 비문학 도서를 깊이 있게 다룹니다. 서로 다른 생각을 경청하는 토론을 거쳐 논리적 근거를 갖춘 서술형 논술문을 완성합니다.
              </p>
              <div className="space-y-1.5 text-xs text-stone-700 bg-white p-3 rounded-xl border border-stone-200/70">
                <p className="flex items-center gap-2"><span className="text-[#EA580C] font-bold">✓</span> 사회·과학 교과 연계 비문학 지문 독해</p>
                <p className="flex items-center gap-2"><span className="text-[#EA580C] font-bold">✓</span> 찬반 토론을 통한 다각적 사고력 훈련</p>
                <p className="flex items-center gap-2"><span className="text-[#EA580C] font-bold">✓</span> 초등 서술형 평가 및 수행평가 완벽 대비</p>
              </div>
            </div>
          )}

          {currTab === "mid" && (
            <div className="bg-[#FFFDFB] rounded-2xl p-4.5 border border-orange-200/80 shadow-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#EA580C] bg-orange-100 px-2.5 py-0.5 rounded-full">
                  중학생 (내신 서술형 & 시사 심화논술)
                </span>
                <span className="text-[11px] text-stone-400 font-semibold">소수 정예 심화반</span>
              </div>
              <h4 className="text-base font-extrabold text-stone-900 mb-2">
                중등 내신 만점과 수능 국어 1등급의 탄탄한 토대
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed mb-3.5">
                신문 칼럼, 시사 논증, 비판적 독해를 통해 수능 국어 비문학 지문에 대비합니다. 중학교 서술형 내신 평가와 자유학기제 글쓰기 수행평가를 원장이 1:1로 밀착 지도합니다.
              </p>
              <div className="space-y-1.5 text-xs text-stone-700 bg-white p-3 rounded-xl border border-stone-200/70">
                <p className="flex items-center gap-2"><span className="text-[#EA580C] font-bold">✓</span> 중등 국어·사회 교과서 연계 심화 독해</p>
                <p className="flex items-center gap-2"><span className="text-[#EA580C] font-bold">✓</span> 신문 사설 및 시사 칼럼 요약·논증</p>
                <p className="flex items-center gap-2"><span className="text-[#EA580C] font-bold">✓</span> 1:1 글쓰기 개별 첨삭 & 포트폴리오 관리</p>
              </div>
            </div>
          )}

          {/* 실제 수업 모습 사진 미니 갤러리 */}
          <div className="mt-5 pt-4 border-t border-stone-100">
            <p className="text-xs font-bold text-stone-700 mb-2.5 flex items-center justify-between">
              <span>📸 실제 아이들의 몰입 수업 현장</span>
              <span className="text-[10px] text-stone-400 font-normal">산내푸르지오 교실</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl overflow-hidden aspect-[4/3] bg-stone-100 border border-stone-200/70">
                <img src="/src/imports/curriculum2.jpg" alt="수업 모습 1" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-xl overflow-hidden aspect-[4/3] bg-stone-100 border border-stone-200/70">
                <img src="/src/imports/curriculum1.jpg" alt="수업 모습 2" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 원장 교육 철학 및 신뢰의 서신 (얼굴 사진 없는 고급 에디토리얼 레터) */}
      <section id="about" className="px-5 py-9 bg-[#FAF9F6] border-b border-stone-200/60">
        <div className="max-w-md mx-auto">
          <div className="mb-3.5">
            <p className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider mb-1">Director's Philosophy</p>
            <h3 className="font-serif-kr text-xl font-black text-[#0F172A] leading-tight">
              아이의 속도를 존중하는 10년의 지도
            </h3>
          </div>

          <div className="bg-white rounded-2xl p-4.5 border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200/70">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-orange-100 text-[#EA580C] flex items-center justify-center font-serif-kr text-xs font-bold">
                  書
                </span>
                <div>
                  <p className="text-[10px] text-stone-500 font-medium">산내푸르지오 독서교실</p>
                  <p className="text-xs font-black text-[#0F172A]">{values["about.name"] || "원장 이해옥"}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-[#EA580C] border border-orange-200/60">
                10년 경력 · 원장 직강
              </span>
            </div>

            <p className="font-serif-kr text-sm font-bold text-[#0F172A] leading-relaxed mb-2.5">
              "{values["about.slogan"] || "생각하는 힘이 아이의 미래를 바꿉니다"}"
            </p>

            <div className="text-xs text-stone-600 leading-relaxed space-y-2 mb-3.5">
              <p className="whitespace-pre-line">
                {values["about.desc"] || "단순히 책을 읽고 글을 쓰는 것을 넘어, 아이들이 스스로 생각하고 질문하는 힘을 길러주는 것을 교육 철학으로 삼고 있습니다."}
              </p>
              <div className="bg-[#FAF9F6] p-3 rounded-xl border border-stone-200/70 text-stone-700 italic text-[11px] whitespace-pre-line">
                "{values["about.letter"] || "제 아이를 책으로 키우며 느꼈던 배움의 감동을 우리 지역 아이들에게 전하고자 시작한 지 10년이 되었습니다. 성급하게 재촉하지 않고, 아이마다 다른 생각의 보폭을 따뜻하게 지켜보겠습니다."}"
              </div>
            </div>

            {/* 공인 전문 자격 */}
            <div className="pt-3 border-t border-stone-200/60">
              <p className="text-[11px] font-bold text-stone-800 mb-2">공인 전문 자격 및 지도 경력</p>
              <ul className="space-y-1.5">
                {careerItems.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-xs text-stone-600">
                    <span className="shrink-0 text-[#EA580C] font-bold">✓</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. 생각과 글이 자라나는 4단계 수업 방식 */}
      <section className="px-5 py-9 bg-white border-b border-stone-200/60">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-5">
            <p className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider mb-1">Learning Process</p>
            <h3 className="font-serif-kr text-xl font-black text-[#0F172A]">
              체계적인 4단계 수업 엔진
            </h3>
            <p className="text-xs text-stone-500 mt-1">읽기에서 끝나지 않고 토론과 논술로 완성됩니다.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#FAF9F6] p-3 rounded-xl border border-stone-200/80">
              <span className="text-xs font-black text-[#EA580C] bg-orange-100/70 px-2 py-0.5 rounded">01</span>
              <h4 className="text-xs font-bold text-stone-900 mt-2 mb-0.5">몰입 독서</h4>
              <p className="text-[11px] text-stone-500 leading-tight">선정된 필독서를 깊이 있게 완독하는 힘</p>
            </div>
            <div className="bg-[#FAF9F6] p-3 rounded-xl border border-stone-200/80">
              <span className="text-xs font-black text-[#EA580C] bg-orange-100/70 px-2 py-0.5 rounded">02</span>
              <h4 className="text-xs font-bold text-stone-900 mt-2 mb-0.5">생각열기 토론</h4>
              <p className="text-[11px] text-stone-500 leading-tight">다양한 의견을 경청하고 생각을 논리화</p>
            </div>
            <div className="bg-[#FAF9F6] p-3 rounded-xl border border-stone-200/80">
              <span className="text-xs font-black text-[#EA580C] bg-orange-100/70 px-2 py-0.5 rounded">03</span>
              <h4 className="text-xs font-bold text-stone-900 mt-2 mb-0.5">논리 글쓰기</h4>
              <p className="text-[11px] text-stone-500 leading-tight">주제에 맞는 글을 스스로 작성하는 훈련</p>
            </div>
            <div className="bg-[#FAF9F6] p-3 rounded-xl border border-stone-200/80">
              <span className="text-xs font-black text-[#EA580C] bg-orange-100/70 px-2 py-0.5 rounded">04</span>
              <h4 className="text-xs font-bold text-stone-900 mt-2 mb-0.5">1:1 맞춤 첨삭</h4>
              <p className="text-[11px] text-stone-500 leading-tight">원장 직접 피드백 & 누적 포트폴리오</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. 교실 시설 안내 */}
      <section id="facility" className="px-5 py-9 bg-[#FAFAF9] border-b border-stone-200/60">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <p className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider mb-1">Classroom</p>
            <h3 className="font-serif-kr text-xl font-black text-[#0F172A]">
              책에 몰입하는 따뜻한 원목 교실
            </h3>
            <p className="text-xs text-stone-500 mt-1">자연 채광과 깔끔한 가구로 아이들의 집중을 돕습니다.</p>
          </div>

          <div className="space-y-2.5">
            <div className="rounded-2xl overflow-hidden border border-stone-200/80 aspect-[16/10] bg-stone-100">
              <img src="/src/imports/classroom3.jpg" alt="교실 내부" className="w-full h-full object-cover" />
            </div>
            <div className="rounded-2xl overflow-hidden border border-stone-200/80 aspect-[16/10] bg-stone-100">
              <img src="/src/imports/classroom2.jpg" alt="학원 내부 모습" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* 8. 학부모 가장 많이 묻는 질문 퀵 프리뷰 (Quick FAQ) */}
      <section className="px-5 py-9 bg-white border-b border-stone-200/60">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <p className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider mb-1">Quick FAQ</p>
            <h3 className="font-serif-kr text-xl font-black text-[#0F172A]">
              학부모님들이 자주 묻는 질문
            </h3>
          </div>

          <div className="space-y-2 mb-4">
            <div className="bg-[#FAF9F6] border border-stone-200/80 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuickFaqOpen(quickFaqOpen === 1 ? null : 1)}
                className="w-full px-3.5 py-3 text-left flex items-center justify-between text-xs font-bold text-[#0F172A]"
              >
                <span>Q. 한 반 인원과 수업 시간은 어떻게 되나요?</span>
                <span className="text-[#EA580C]">{quickFaqOpen === 1 ? "▲" : "▼"}</span>
              </button>
              {quickFaqOpen === 1 && (
                <div className="px-3.5 pb-3 pt-1 border-t border-stone-100 text-xs text-stone-600 leading-relaxed bg-white">
                  한 반에 최대 6명 이하 소수 정예로 운영되며, 모든 아이가 충분히 발표하고 경청할 수 있도록 원장이 직접 지도합니다. 수업은 주 1회 80분~100분 과정으로 진행됩니다.
                </div>
              )}
            </div>

            <div className="bg-[#FAF9F6] border border-stone-200/80 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuickFaqOpen(quickFaqOpen === 2 ? null : 2)}
                className="w-full px-3.5 py-3 text-left flex items-center justify-between text-xs font-bold text-[#0F172A]"
              >
                <span>Q. 책을 잘 안 읽는 아이도 적응할 수 있을까요?</span>
                <span className="text-[#EA580C]">{quickFaqOpen === 2 ? "▲" : "▼"}</span>
              </button>
              {quickFaqOpen === 2 && (
                <div className="px-3.5 pb-3 pt-1 border-t border-stone-100 text-xs text-stone-600 leading-relaxed bg-white">
                  처음부터 두꺼운 책을 강요하지 않고, 질문과 대화로 흥미를 여는 '몰입독서' 방식으로 시작합니다. 아이의 눈높이에 맞춰 성취감을 느끼도록 이끕니다.
                </div>
              )}
            </div>
          </div>

          {/* 더보기 버튼 2개 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onQna}
              className="py-2.5 px-3 rounded-xl border border-stone-200 bg-[#FAFAF9] text-stone-800 font-bold text-xs flex items-center justify-center gap-1 active:bg-stone-100"
            >
              <span>📋 질문 전체보기</span>
            </button>
            <button
              onClick={onReview}
              className="py-2.5 px-3 rounded-xl border border-orange-200 bg-orange-50 text-orange-900 font-bold text-xs flex items-center justify-center gap-1 active:bg-orange-100"
            >
              <span>📖 수업 소식 보기</span>
            </button>
          </div>
        </div>
      </section>

      {/* 9. 운영 안내 및 오시는 길 (모바일 원클릭 내비) */}
      <section id="info" className="px-5 py-9 bg-[#FAFAF9] border-b border-stone-200/60">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <p className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider mb-1">Location & Info</p>
            <h3 className="font-serif-kr text-xl font-black text-[#0F172A]">
              운영 안내 및 오시는 길
            </h3>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/80 p-3.5 mb-3.5 shadow-xs text-xs space-y-2.5">
            <div className="flex items-start gap-2">
              <span className="text-sm shrink-0">🕐</span>
              <div>
                <p className="font-bold text-stone-500 text-[10px]">운영 시간</p>
                <p className="font-semibold text-stone-800">{values["info.hours"] || "평일 14:00 ~ 20:00 (주말·공휴일 휴무)"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm shrink-0">📍</span>
              <div>
                <p className="font-bold text-stone-500 text-[10px]">교습소 위치</p>
                <p className="font-semibold text-stone-800">{values["info.address"] || "경기 파주시 심학산로 385 운정신도시센트럴푸르지오 상가 2동 204호"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm shrink-0">🚗</span>
              <div>
                <p className="font-bold text-stone-500 text-[10px]">주차 안내</p>
                <p className="font-semibold text-stone-800">{values["info.parking"] || "건물 뒷편 주차장 이용 가능"}</p>
              </div>
            </div>
          </div>

          {/* 카카오맵 */}
          <div className="rounded-xl overflow-hidden border border-stone-200 mb-2.5">
            <KakaoMap address={values["info.address"]} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={`https://map.kakao.com/link/search/${encodeURIComponent(values["info.address"] || "경기 파주시 심학산로 385 운정신도시센트럴푸르지오")}`}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 bg-white text-stone-800 border border-stone-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:bg-stone-50 transition"
            >
              <span>🗺️ 카카오맵 크게보기</span>
            </a>
            <a
              href={`https://map.kakao.com/link/to/한우리독서토론논술 산내푸르지오,37.72895,126.73285`}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 bg-[#0F172A] active:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <span>🚗 길찾기 바로가기</span>
            </a>
          </div>
        </div>
      </section>

      {/* 10. 하단 전환 유도 배너 */}
      <section id="contact" className="px-5 py-10 bg-white text-center">
        <div className="max-w-md mx-auto">
          <span className="inline-block text-xl mb-1.5">🌱</span>
          <h3 className="font-serif-kr text-xl font-black text-[#0F172A] leading-snug mb-2">
            우리 아이의 평생 문해력 자산,<br />
            지금 원장님과 상의해보세요
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed mb-5 whitespace-pre-line">
            {values["contact.desc"] || "우리 아이에게 딱 맞는 독서 논술 교육,\n지금 바로 부담 없이 상담받아보세요."}
          </p>

          <a
            href={kakaoUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#EA580C] active:bg-[#C2410C] text-white font-extrabold text-xs py-3.5 px-5 rounded-xl shadow-lg shadow-orange-500/20 transition"
          >
            <span>💬 카카오톡 1:1 상담 예약하기</span>
            <span>→</span>
          </a>
          <p className="text-[10px] text-stone-400 mt-2.5">수업 중일 경우 확인 후 순차적으로 연락드립니다.</p>
        </div>
      </section>

      {/* 11. 푸터 */}
      <footer className="bg-[#0F172A] text-stone-400 text-xs text-center py-7 px-5 leading-relaxed">
        <p className="font-bold text-stone-200">
          © 2026 {values["header.title"] || "한우리 독서토론논술"} {values["header.subtitle"] || "파주운정 산내푸르지오독서교실"}
        </p>
        <p className="mt-1 text-stone-400 text-[11px]">
          {values["info.address"] || "경기 파주시 심학산로 385 운정신도시센트럴푸르지오 상가 2동 204호"}
        </p>
        <p className="text-[10px] text-stone-400 mt-0.5">원장: {values["about.name"] || "이해옥"} · 전문 독서지도사</p>

        <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-center">
          <button
            onClick={onOpenAdmin}
            className="text-[11px] text-stone-400 hover:text-stone-300 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 transition"
          >
            <span>⚙️</span>
            <span>관리자 모드</span>
          </button>
        </div>
      </footer>

      {/* 12. 모바일 하단 플로팅 듀얼 CTA 바 (엄지손가락 반응형 - 스크롤 중 언제든 전환) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-3.5 py-2 shadow-lg flex items-center gap-2">
        <a
          href={`https://map.kakao.com/link/to/한우리독서토론논술 산내푸르지오,37.72895,126.73285`}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 px-3 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs flex items-center gap-1 active:bg-stone-200"
        >
          <span>🚗</span>
          <span>오시는 길</span>
        </a>
        <a
          href={kakaoUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-2.5 px-3.5 rounded-xl bg-[#EA580C] active:bg-[#C2410C] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
        >
          <span>💬 카카오톡 1:1 상담 예약</span>
          <span>→</span>
        </a>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   PC LAYOUT (프리미엄 에디토리얼 마케팅 디자인)
═══════════════════════════════════════ */
function PCLayout({
  onQna,
  onReview,
  values,
  onOpenAdmin,
}: {
  onQna: () => void;
  onReview: () => void;
  values: Record<string, string>;
  onOpenAdmin?: () => void;
}) {
  const careerItems = (values["about.career"] || "독서토론논술 교습소 운영 (10년 경력)\n해법·한우리 독서토론교습소 운영\n독서지도사 자격 보유")
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean);

  const kakaoUrl = values["contact.kakao"] || "http://pf.kakao.com/_xxxxxx";

  return (
    <div style={{ wordBreak: "keep-all" }} className="min-h-screen bg-[#FAFAF9] text-[#0F172A]">

      {/* 1. 상단 고정 네비게이션 바 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-8 py-3 flex items-center justify-between">
          <div className="flex flex-col justify-center mr-8 lg:mr-12">
            <h1 className="font-serif-kr text-xl font-black text-[#0F172A] leading-tight tracking-tight">
              {values["header.title"] || "한우리 독서토론논술"}
            </h1>
            <p className="text-xs font-semibold text-stone-500 mt-0.5 tracking-tight">
              파주운정 산내푸르지오 독서교실
            </p>
          </div>

          <nav className="flex items-center gap-6 lg:gap-8">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollTo(item.href)}
                className="text-sm font-semibold text-stone-700 hover:text-[#EA580C] transition"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={onQna}
              className="text-sm font-semibold text-stone-700 hover:text-[#EA580C] transition"
            >
              자주 묻는 질문
            </button>
            <button
              onClick={onReview}
              className="text-sm font-semibold text-stone-700 hover:text-[#EA580C] transition"
            >
              수업 소식
            </button>
            <a
              href={kakaoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs shadow-xs transition-all hover:shadow-sm active:scale-95"
            >
              <span>💬</span>
              <span>1:1 상담 예약</span>
            </a>
          </nav>
        </div>
      </header>

      {/* 2. 히어로 섹션 (감성적 에디토리얼 + 높은 학부모 신뢰도) */}
      <section className="relative bg-white border-b border-stone-200/70 pt-16 pb-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 text-[#EA580C] text-xs font-bold border border-orange-200/80 mb-5">
              <span>✨</span>
              <span>10년 경력 유아교육 전공 원장 직강 · 1반 6인 이하 소수 정예 몰입수업</span>
            </div>

            <h2 className="font-serif-kr text-5xl font-black text-[#0F172A] leading-[1.25] tracking-tight mb-5">
              책을 읽는 아이에서,<br />
              스스로 생각하고 <span className="text-[#EA580C] underline decoration-orange-200 decoration-wavy decoration-2 underline-offset-8">표현하는 아이로</span>
            </h2>

            <p className="text-xl font-medium text-stone-700 leading-relaxed mb-3">
              "{values["intro.quote"] || "아이의 생각이 깊어지고, 읽는 기쁨이 자라나는 따뜻한 공간"}"
            </p>

            <p className="text-sm text-stone-500 leading-relaxed max-w-2xl mb-8">
              {values["intro.sub"] || "한우리 30년 연구 커리큘럼과 10년 유아교육 전문 원장의 1:1 밀착 지도로 우리 아이 평생의 문해력과 사고력 자산을 선물합니다."}
            </p>

            <div className="flex items-center gap-4">
              <a
                href={kakaoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-white font-extrabold text-base px-8 py-4 rounded-xl shadow-md shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span>💬 카카오톡 1:1 수업 상담 예약</span>
                <span>→</span>
              </a>
              <button
                onClick={onReview}
                className="inline-flex items-center gap-2 bg-stone-50 hover:bg-stone-100 text-stone-800 font-bold text-base px-7 py-4 rounded-xl border border-stone-200 transition"
              >
                <span>📖 원장 직강 수업 이야기 둘러보기</span>
              </button>
            </div>
          </div>

          {/* 4대 안심 포인트 Bento Grid */}
          <div className="grid grid-cols-4 gap-4 mt-16 pt-10 border-t border-stone-100">
            <div className="bg-[#FAFAF9] p-5 rounded-2xl border border-stone-200/80 hover:border-orange-200 transition">
              <span className="text-2xl">🎓</span>
              <h4 className="text-sm font-extrabold text-[#0F172A] mt-2 mb-1">10년 경력 원장 직강</h4>
              <p className="text-xs text-stone-500 leading-relaxed">유아교육 전공 및 공인 독서지도사 자격의 전문성</p>
            </div>
            <div className="bg-[#FAFAF9] p-5 rounded-2xl border border-stone-200/80 hover:border-orange-200 transition">
              <span className="text-2xl">👥</span>
              <h4 className="text-sm font-extrabold text-[#0F172A] mt-2 mb-1">1반 최대 6인 소수정예</h4>
              <p className="text-xs text-stone-500 leading-relaxed">모든 아이가 자유롭게 발표하고 경청하는 토론 환경</p>
            </div>
            <div className="bg-[#FAFAF9] p-5 rounded-2xl border border-stone-200/80 hover:border-orange-200 transition">
              <span className="text-2xl">📚</span>
              <h4 className="text-sm font-extrabold text-[#0F172A] mt-2 mb-1">매달 새로운 필독서</h4>
              <p className="text-xs text-stone-500 leading-relaxed">한우리 30년 연구진 엄선 교재와 밀착 몰입독서</p>
            </div>
            <div className="bg-[#FAFAF9] p-5 rounded-2xl border border-stone-200/80 hover:border-orange-200 transition">
              <span className="text-2xl">✍️</span>
              <h4 className="text-sm font-extrabold text-[#0F172A] mt-2 mb-1">1:1 맞춤 글쓰기 첨삭</h4>
              <p className="text-xs text-stone-500 leading-relaxed">개별 피드백과 누적 포트폴리오로 성장 기록 관리</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 학부모 공감 섹션 (Parent Empathy & Solution - 주황색 통일) */}
      <section className="py-20 bg-[#F7F6F3] border-b border-stone-200/70">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-bold text-[#EA580C] uppercase tracking-wider mb-2">Parent's Worry & Solution</p>
            <h3 className="font-serif-kr text-3xl font-black text-[#0F172A] leading-snug">
              학부모님, 요즘 우리 아이 독서에<br />
              이런 고민이 있으신가요?
            </h3>
            <p className="text-sm text-stone-500 mt-2">단순한 읽기를 넘어 생각과 글이 자라나는 체계적인 해답을 드립니다.</p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-7 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="inline-block text-xs font-bold px-2.5 py-1 rounded bg-orange-50 text-[#EA580C] border border-orange-200/80 mb-3">고민 01</span>
                <h4 className="font-bold text-base text-stone-900 mb-2 leading-snug">
                  "책은 많이 읽는데, 줄거리나 생각을 물어보면 머뭇거려요."
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  활자만 스치는 수동적 독서에 익숙해져 내 생각으로 소화하는 과정을 경험하지 못했기 때문입니다.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-stone-100 bg-orange-50/50 p-3.5 rounded-xl border border-orange-100/70">
                <p className="text-xs font-bold text-[#EA580C]">✦ 한우리의 솔루션</p>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  질문을 던지고 토론하는 <strong>'생각 열기 수업'</strong>으로 수동적 읽기를 능동적 사고와 말하기로 이끕니다.
                </p>
              </div>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="inline-block text-xs font-bold px-2.5 py-1 rounded bg-orange-50 text-[#EA580C] border border-orange-200/80 mb-3">고민 02</span>
                <h4 className="font-bold text-base text-stone-900 mb-2 leading-snug">
                  "고학년, 중학교 서술형 평가와 긴 지문 독해를 버거워할까 봐요."
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  문학 위주의 읽기만으로는 교과 과정의 다양한 비문학 지문과 논리적 작문 요구를 감당하기 어렵습니다.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-stone-100 bg-orange-50/50 p-3.5 rounded-xl border border-orange-100/70">
                <p className="text-xs font-bold text-[#EA580C]">✦ 한우리의 솔루션</p>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  문학·비문학·시사 칼럼을 고루 다루며 <strong>수능 국어와 내신 서술형의 튼튼한 토대</strong>를 미리 다집니다.
                </p>
              </div>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="inline-block text-xs font-bold px-2.5 py-1 rounded bg-orange-50 text-[#EA580C] border border-orange-200/80 mb-3">고민 03</span>
                <h4 className="font-bold text-base text-stone-900 mb-2 leading-snug">
                  "스마트폰과 숏폼에 익숙해져 한 권을 끝까지 읽지 못해요."
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  자극적인 짧은 콘텐츠로 인해 긴 호흡의 글을 참고 완독하는 뇌의 집중 근력이 약해져 있습니다.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-stone-100 bg-orange-50/50 p-3.5 rounded-xl border border-orange-100/70">
                <p className="text-xs font-bold text-[#EA580C]">✦ 한우리의 솔루션</p>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  선생님이 전 과정을 밀착 지도하는 <strong>'몰입독서'</strong>로 한 권을 스스로 완독하는 성취감을 길러줍니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 원장 소개 및 교육 철학 (얼굴 사진 없이 깊은 신뢰를 전하는 에디토리얼 레터) */}
      <section id="about" className="py-24 bg-white border-b border-stone-200/70">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-12 gap-10 items-start">
            {/* 왼쪽: 에디토리얼 서신 (Letter from Director) */}
            <div className="col-span-7 bg-[#FAF9F6] p-9 rounded-3xl border border-stone-200/90 shadow-xs">
              <div className="flex items-center justify-between pb-5 mb-6 border-b border-stone-200/80">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-orange-100 text-[#EA580C] flex items-center justify-center font-serif-kr text-base font-bold shadow-xs">
                    書
                  </span>
                  <div>
                    <p className="text-xs text-stone-500 font-medium">산내푸르지오 독서교실</p>
                    <p className="text-base font-black text-[#0F172A]">{values["about.name"] || "원장 이해옥"}</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-[#EA580C] text-xs font-bold border border-orange-200/80">
                  <span>🎓</span>
                  <span>10년 경력 · 유아교육 전공 원장 직강</span>
                </div>
              </div>

              <p className="text-xs font-bold text-[#EA580C] uppercase tracking-wider mb-2">Director's Philosophy</p>
              <h3 className="font-serif-kr text-2xl font-black text-[#0F172A] leading-snug mb-5 whitespace-pre-line">
                "{values["about.slogan"] || "생각하는 힘이 아이의 미래를 바꿉니다"}"
              </h3>

              <div className="space-y-4 text-stone-600 text-sm leading-relaxed mb-6 whitespace-pre-line">
                <p>
                  {values["about.desc"] || "단순히 책을 읽고 글을 쓰는 것을 넘어, 아이들이 스스로 생각하고 질문하는 힘을 길러주는 것을 교육 철학으로 삼고 있습니다."}
                </p>
                <div className="bg-white/90 p-5 rounded-2xl border border-stone-200/80 font-medium text-stone-700 leading-relaxed italic shadow-2xs whitespace-pre-line">
                  "{values["about.letter"] || `제 아이를 책으로 키우며 느꼈던 배움의 감동을 우리 지역 아이들에게 전하고자 시작한 지 어느덧 10년이 되었습니다.
                  성급하게 재촉하지 않고, 아이마다 다른 생각의 보폭을 따뜻한 시선으로 지켜보며 평생의 문해력과 표현력을 선물하겠습니다.`}"
                </div>
              </div>

              <div className="flex items-center justify-between pt-5 border-t border-stone-200/80 text-xs text-stone-500">
                <span>한우리 독서토론논술 파주운정 교습소</span>
                <span className="font-serif-kr font-bold text-stone-800 text-sm">이해옥 원장 올림</span>
              </div>
            </div>

            {/* 오른쪽: 공인 전문 약력 및 교육 가치 카드 */}
            <div className="col-span-5 flex flex-col gap-4">
              <div className="bg-white p-7 rounded-3xl border border-stone-200/90 shadow-xs">
                <p className="text-xs font-extrabold text-stone-800 mb-4 flex items-center justify-between">
                  <span>공인 전문 자격 및 지도 이력</span>
                  <span className="text-[11px] font-bold text-[#EA580C]">검증된 전문성</span>
                </p>
                <div className="space-y-2.5">
                  {careerItems.map((t) => (
                    <div key={t} className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[#FAFAF9] border border-stone-200/70 text-xs font-semibold text-stone-700">
                      <span className="w-5 h-5 rounded-full bg-orange-100 text-[#EA580C] flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-orange-50/60 p-6 rounded-3xl border border-orange-200/80">
                <p className="text-xs font-bold text-[#EA580C] uppercase tracking-wider mb-1">Our Core Commitment</p>
                <h4 className="font-serif-kr text-base font-bold text-[#0F172A] mb-2">학부모님과의 3가지 약속</h4>
                <ul className="text-xs text-stone-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-[#EA580C] font-bold">1.</span>
                    <span>보조강사 없이 <strong>전 학년 모든 수업 원장 직접 책임 지도</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#EA580C] font-bold">2.</span>
                    <span>1반 최대 6인 소수 정예로 <strong>모든 아이의 발표 기회 보장</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#EA580C] font-bold">3.</span>
                    <span>정기적인 1:1 글쓰기 피드백 및 <strong>독서 포트폴리오 누적 관리</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 수업 방식 4단계 (4-Step Learning Engine) */}
      <section className="py-20 bg-[#FAFAF9] border-b border-stone-200/70">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-bold text-[#EA580C] uppercase tracking-wider mb-2">The 4-Step Learning Engine</p>
            <h3 className="font-serif-kr text-3xl font-black text-[#0F172A]">
              생각과 글이 단단해지는 4단계 수업
            </h3>
            <p className="text-sm text-stone-500 mt-2">책 한 권을 온전히 내 것으로 만드는 체계적인 독서토론논술 프로세스</p>
          </div>

          <div className="grid grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs hover:-translate-y-1 transition-all duration-300">
              <span className="text-xs font-black text-[#EA580C] bg-orange-50 px-3 py-1 rounded-full">STEP 01</span>
              <h4 className="text-base font-extrabold text-stone-900 mt-4 mb-2">필독서 몰입독서</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                한우리 30년 연구진이 엄선한 필독서를 바탕으로 한 권을 제대로 읽어내는 완독의 힘을 기릅니다.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs hover:-translate-y-1 transition-all duration-300">
              <span className="text-xs font-black text-[#EA580C] bg-orange-50 px-3 py-1 rounded-full">STEP 02</span>
              <h4 className="text-base font-extrabold text-stone-900 mt-4 mb-2">생각열기 자유토론</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                열린 질문을 통해 친구들과 다양한 관점을 경청하고 자신의 논리를 다듬는 능동적 토론입니다.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs hover:-translate-y-1 transition-all duration-300">
              <span className="text-xs font-black text-[#EA580C] bg-orange-50 px-3 py-1 rounded-full">STEP 03</span>
              <h4 className="text-base font-extrabold text-stone-900 mt-4 mb-2">논리적 글쓰기</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                토론한 내용을 구조화하여 갈래별 글(감상문, 논설문, 설명문, 칼럼)로 명확하게 표현합니다.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs hover:-translate-y-1 transition-all duration-300">
              <span className="text-xs font-black text-[#EA580C] bg-orange-50 px-3 py-1 rounded-full">STEP 04</span>
              <h4 className="text-base font-extrabold text-stone-900 mt-4 mb-2">1:1 맞춤 첨삭</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                원장 선생님이 직접 아이의 생각과 문장을 피드백하고 개인별 포트폴리오로 누적 관리합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. 커리큘럼 및 수업 모습 (초등/중등 주황색 패밀리 룩 통일) */}
      <section id="curriculum" className="py-24 bg-white border-b border-stone-200/70">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs font-bold text-[#EA580C] uppercase tracking-wider mb-2">Curriculum & Methodology</p>
              <h3 className="font-serif-kr text-3xl font-black text-[#0F172A]">
                초등부터 중등까지 이어지는 탄탄한 커리큘럼
              </h3>
            </div>
            <p className="text-xs text-stone-500">한 반 4~6명 이내의 소수 정예 집중 지도</p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* 초등부 */}
            <div className="bg-[#FFFDFB] rounded-3xl p-8 border border-orange-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold text-[#EA580C] bg-orange-100/80 px-3 py-1 rounded-full">
                  초등부 프로그램
                </span>
                <span className="text-xs text-stone-400 font-semibold">1반 최대 6명 정원</span>
              </div>
              <h4 className="text-xl font-extrabold text-stone-900 mb-3">
                {values["curriculum.elem_title"] || "저학년 / 고학년 독서토론논술"}
              </h4>
              <p className="text-sm text-stone-600 leading-relaxed mb-6">
                {values["curriculum.elem_body"] || "그림책과 문학 작품을 통한 흥미 위주의 독서. 주 1회 주제별 글쓰기 및 자유 토론 진행."}
              </p>
              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 space-y-2 text-xs text-stone-700">
                <p className="flex items-center gap-2"><span className="text-[#EA580C] font-bold">✦</span> <strong>저학년:</strong> 읽기 독립, 어휘력 및 말하기 자신감, 책 읽는 습관 정착</p>
                <p className="flex items-center gap-2"><span className="text-[#EA580C] font-bold">✦</span> <strong>고학년:</strong> 교과 연계 비문학 독해, 주제별 토론, 서술형 논술 기초</p>
              </div>
            </div>

            {/* 중등부 (주황색 테마로 완벽 통일) */}
            <div className="bg-[#FFFDFB] rounded-3xl p-8 border border-orange-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold text-[#EA580C] bg-orange-100/80 px-3 py-1 rounded-full">
                  중등부 프로그램
                </span>
                <span className="text-xs text-stone-400 font-semibold">소수 정예 심화반</span>
              </div>
              <h4 className="text-xl font-extrabold text-stone-900 mb-3">
                {values["curriculum.mid_title"] || "내신 및 심화 논술"}
              </h4>
              <p className="text-sm text-stone-600 leading-relaxed mb-6">
                {values["curriculum.mid_body"] || "비문학 읽기 및 신문 칼럼 분석. 서술형 평가 대비 및 중등 내신 연계형 심화 논술 작성."}
              </p>
              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 space-y-2 text-xs text-stone-700">
                <p className="flex items-center gap-2"><span className="text-[#EA580C] font-bold">✦</span> <strong>교과 내신:</strong> 국어·사회 교과 연계 서술형 평가 및 수행평가 완벽 대비</p>
                <p className="flex items-center gap-2"><span className="text-[#EA580C] font-bold">✦</span> <strong>심화 논술:</strong> 신문 칼럼, 시사 논증, 비판적 사고력과 수능 국어 기본기</p>
              </div>
            </div>
          </div>

          {/* 실제 수업 현장 갤러리 */}
          <div className="mt-12 pt-10 border-t border-stone-100">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-base font-extrabold text-stone-800 flex items-center gap-2">
                <span>📸 실제 학생들의 몰입 수업 현장</span>
              </h4>
              <span className="text-xs text-stone-400">파주운정 산내푸르지오 교습소</span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-2xl overflow-hidden aspect-[16/10] bg-stone-100 border border-stone-200 group">
                <img src="/src/imports/curriculum2.jpg" alt="수업 모습 1" className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" />
              </div>
              <div className="rounded-2xl overflow-hidden aspect-[16/10] bg-stone-100 border border-stone-200 group">
                <img src="/src/imports/curriculum1.jpg" alt="수업 모습 2" className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. 시설 안내 */}
      <section id="facility" className="py-24 bg-[#FAFAF9] border-b border-stone-200/70">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-bold text-[#EA580C] uppercase tracking-wider mb-2">Classroom Environment</p>
            <h3 className="font-serif-kr text-3xl font-black text-[#0F172A]">
              오롯이 책과 대화에 몰입하는 공간
            </h3>
            <p className="text-sm text-stone-500 mt-2">아이들의 시력과 바른 자세를 고려한 따뜻하고 정돈된 원목 교실입니다.</p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="rounded-3xl overflow-hidden border border-stone-200 aspect-[16/11] bg-stone-100 group">
              <img src="/src/imports/classroom3.jpg" alt="교실 내부 모습" className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" />
            </div>
            <div className="rounded-3xl overflow-hidden border border-stone-200 aspect-[16/11] bg-stone-100 group">
              <img src="/src/imports/classroom2.jpg" alt="학원 내부 모습" className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" />
            </div>
          </div>
          <p className="text-center text-xs text-stone-500 mt-6">
            쾌적하고 안전한 환경에서 한 반 6명 이하 소수 정예로 수업합니다.
          </p>
        </div>
      </section>

      {/* 8. 자주 묻는 질문 & 수업 소식 프리뷰 */}
      <section className="py-20 bg-white border-b border-stone-200/70 text-center">
        <div className="max-w-4xl mx-auto px-8">
          <p className="text-xs font-bold text-[#EA580C] uppercase tracking-wider mb-2">Quick Access</p>
          <h3 className="font-serif-kr text-3xl font-black text-[#0F172A] mb-3">
            더 자세한 내용이 궁금하신가요?
          </h3>
          <p className="text-sm text-stone-500 mb-8">
            자주 묻는 질문과 원장 선생님이 직접 전하는 생생한 수업 이야기를 바로 확인해보세요.
          </p>

          <div className="flex justify-center gap-5">
            <button
              onClick={onQna}
              className="inline-flex items-center gap-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 font-bold text-base px-8 py-4 rounded-2xl transition-all hover:-translate-y-0.5"
            >
              <span>📋 자주 묻는 질문 보기</span>
              <span>→</span>
            </button>
            <button
              onClick={onReview}
              className="inline-flex items-center gap-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-900 font-bold text-base px-8 py-4 rounded-2xl transition-all hover:-translate-y-0.5"
            >
              <span>📖 원장 직강 수업 소식 보기</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* 9. 운영 안내 및 오시는 길 */}
      <section id="info" className="py-24 bg-[#FAFAF9] border-b border-stone-200/70">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-bold text-[#EA580C] uppercase tracking-wider mb-2">Location & Schedule</p>
            <h3 className="font-serif-kr text-3xl font-black text-[#0F172A]">
              운영 안내 및 오시는 길
            </h3>
          </div>

          <div className="grid grid-cols-12 gap-8 items-start">
            {/* 정보 카드 */}
            <div className="col-span-5 bg-white p-8 rounded-3xl border border-stone-200/80 shadow-xs space-y-6">
              <div className="flex items-start gap-4">
                <span className="text-2xl shrink-0">🕐</span>
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wide">운영 시간</p>
                  <p className="text-sm font-extrabold text-stone-900 mt-1">{values["info.hours"] || "평일 14:00 ~ 20:00 (주말 및 공휴일 휴무)"}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl shrink-0">📍</span>
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wide">교습소 주소</p>
                  <p className="text-sm font-extrabold text-stone-900 mt-1 leading-snug">{values["info.address"] || "경기 파주시 심학산로 385 운정신도시센트럴푸르지오 상가 2동 204호"}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl shrink-0">🚗</span>
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wide">주차 정보</p>
                  <p className="text-sm font-extrabold text-stone-900 mt-1">{values["info.parking"] || "건물 뒷편 주차장 이용 가능"}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex gap-2.5">
                <a
                  href={`https://map.kakao.com/link/search/${encodeURIComponent(values["info.address"] || "경기 파주시 심학산로 385 운정신도시센트럴푸르지오")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold text-center transition"
                >
                  🗺️ 카카오맵 크게보기
                </a>
                <a
                  href={`https://map.kakao.com/link/to/한우리독서토론논술 산내푸르지오,37.72895,126.73285`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 px-4 bg-[#0F172A] hover:bg-black text-white rounded-xl text-xs font-bold text-center transition"
                >
                  🚗 길찾기 바로가기
                </a>
              </div>
            </div>

            {/* 지도 박스 */}
            <div className="col-span-7 rounded-3xl overflow-hidden border border-stone-200 shadow-xs">
              <KakaoMap address={values["info.address"]} />
            </div>
          </div>
        </div>
      </section>

      {/* 10. 하단 상담 예약 배너 (최종 CTA) */}
      <section id="contact" className="py-24 bg-white text-center">
        <div className="max-w-3xl mx-auto px-8">
          <span className="inline-block text-3xl mb-3">🌱</span>
          <h3 className="font-serif-kr text-3xl font-black text-[#0F172A] leading-snug mb-3">
            우리 아이 평생의 문해력과 사고력,<br />
            지금 원장님과 상의해보세요
          </h3>
          <p className="text-sm text-stone-500 leading-relaxed mb-8 max-w-xl mx-auto whitespace-pre-line">
            {values["contact.desc"] || "우리 아이에게 딱 맞는 독서 논술 교육, 지금 바로 상담받아보세요!"}
          </p>

          <a
            href={kakaoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 bg-[#EA580C] hover:bg-[#C2410C] text-white font-extrabold text-lg px-12 py-5 rounded-2xl shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <span>💬 카카오톡 1:1 상담 예약하기</span>
            <span>→</span>
          </a>
          <p className="text-xs text-stone-400 mt-4">평일 14:00 ~ 20:00 · 수업 중일 경우 확인 후 순차 연락드립니다.</p>
        </div>
      </section>

      {/* 11. 푸터 */}
      <footer className="bg-[#0F172A] text-stone-400 text-xs text-center py-12 px-8">
        <div className="max-w-4xl mx-auto">
          <p className="font-bold text-stone-200 text-sm">
            © 2026 {values["header.title"] || "한우리 독서토론논술"} {values["header.subtitle"] || "파주운정 산내푸르지오독서교실"}. All rights reserved.
          </p>
          <p className="mt-2 text-stone-400">
            {values["info.address"] || "경기 파주시 심학산로 385 운정신도시센트럴푸르지오 상가 2동 204호"}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            대표 원장: {values["about.name"] || "이해옥"} · 전문 독서지도사 · 유아교육 전공
          </p>

          <div className="mt-6 pt-6 border-t border-stone-800 flex items-center justify-center">
            <button
              onClick={onOpenAdmin}
              className="text-xs text-stone-400 hover:text-stone-300 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 transition"
            >
              <span>⚙️</span>
              <span>관리자 모드</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════
   QnA 페이지
═══════════════════════════════════════ */
const QNA_LIST = [
  {
    q: "어떤 마음가짐으로 운영하시나요?",
    a: `제 아이가 초등학교에 입학하면서 학교 독서 지원단과 책 읽어주기 어머니 봉사활동을 시작하게 되었습니다. 아이들에게 책을 읽어주며 제 이야기에 귀 기울이고 몰입하는 모습을 볼 때마다 큰 행복과 보람을 느꼈고, 자연스럽게 독서 교육에 관심을 갖게 되었습니다.\n\n처음에는 제 아이를 잘 키우고 싶은 마음에서 출발했지만, 아이들과 책을 함께 읽는 시간이 쌓이면서 <strong>우리 지역의 더 많은 아이에게 올바른 독서 방법과 토론의 즐거움을 전하고 싶다</strong>는 생각이 커졌습니다. 그 마음을 바탕으로 지금의 한우리독서토론논술 교습소를 설립하게 되었습니다.<br><br><img src="/src/imports/classroom.jpg" alt="교실 모습" style="width:100%; border-radius:12px; display:block;" />`,
  },
  {
    q: "수업은 어떤 프로그램으로 진행되나요?",
    a: `저희 교습소는 <strong>'한우리독서토론논술'</strong>의 체계적인 프로그램을 바탕으로 유아부터 초등, 중등까지 아이의 발달 단계와 눈높이에 맞는 독서토론논술 수업을 진행하고 있습니다.\n\n한우리독서토론논술 연구원들은 매달 교과 과정에 맞춰 필독서를 선정하고, 책에 맞는 교재를 새롭게 구성합니다. 저희는 선정된 필독서를 깊이 있게 읽고, 교재를 바탕으로 <strong>자신의 생각을 논리적으로 나누는 토론과 글로 표현하는 논술 수업</strong>을 진행하며 아이의 배경지식과 사고력을 자연스럽게 넓혀가고 있습니다.\n\n최근에는 <strong>'몰입독서'</strong> 프로그램도 새롭게 도입했습니다. 한 권의 책을 끝까지 읽어낼 수 있도록 선생님이 전 과정을 밀착해 지도하며, <strong>여러 권을 읽는 것보다 한 권을 제대로 읽는 힘</strong>을 기르는 데 초점을 맞췄습니다.<br><br><img src="/src/imports/curriculum3.png" alt="상세 커리큘럼" style="width:100%; border-radius:12px; margin-top:8px; display:block;" />`,
  },
  { q: "수강 대상 연령은 어떻게 되나요?", a: "내용을 입력해 주세요." },
  { q: "수업료 및 교재비는 어떻게 되나요?", a: "내용을 입력해 주세요." },
  {
    q: "산내푸르지오 독서교실만의 장점이 있나요?",
    a: `<strong>첫째, 아이의 생각을 존중하는 원장 직강</strong>\n\n유아교육을 전공하고 10년 이상 공부방을 운영하며 아이들과 가까이 소통해온 원장이 직접 수업합니다. 아이마다 다른 성향과 속도를 존중하며, 주입식 교육보다 자신의 생각을 편안하게 표현하고 책 읽는 즐거움을 스스로 알아갈 수 있도록 돕습니다.\n\n<strong>둘째, 30년 노하우를 담은 교재와 몰입독서</strong>\n\n독서토론논술연구소의 30년 이상 축적된 연구와 노하우를 바탕으로 매달 새로운 필독서를 선정하고 교재를 개발합니다.\n\n<strong>셋째, 집중할 수 있는 소수 정예 수업 환경</strong>\n\n깔끔하고 정돈된 공간에서 한 반 6명 이하의 소수 정예로 수업을 진행합니다.\n\n<strong>넷째, 학년별로 이어지는 체계적인 커리큘럼</strong>\n\n아이의 학년에 맞춰 반을 편성하고 초등부터 중등까지 단계적으로 이어가며 실력을 쌓아갑니다.\n\n<strong>다섯째, 수업 결과를 함께 살피는 학부모 소통</strong>\n\n수업 내용과 결과물을 개인별로 피드백하고, 아이가 작성한 글은 포트폴리오로 차곡차곡 관리합니다.`,
  },
];

/* ─── 수업 소식 페이지 ─── */
function ReviewPage({ onBack, reviews }: { onBack: () => void; reviews: Review[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"date" | "title">("date");
  const [detailId, setDetailId] = useState<number | null>(null);
  const [unlockedIds, setUnlockedIds] = useState<Set<number>>(() => new Set());
  const [unlockTarget, setUnlockTarget] = useState<Review | null>(null);
  const [unlockPw, setUnlockPw] = useState("");
  const [unlockError, setUnlockError] = useState("");

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const detail = reviews.find(r => r.id === detailId);

  const filtered = reviews
    .filter(r => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return r.title.toLowerCase().includes(q) ||
        r.body.replace(/<[^>]+>/g, "").toLowerCase().includes(q);
    })
    .sort((a, b) => sort === "date"
      ? b.date.localeCompare(a.date)
      : a.title.localeCompare(b.title));

  function handleItemClick(r: Review) {
    if (r.isPrivate && r.password && r.password.trim() !== "") {
      if (!unlockedIds.has(r.id)) {
        setUnlockTarget(r);
        setUnlockPw("");
        setUnlockError("");
        return;
      }
    }
    setDetailId(r.id);
  }

  function handleUnlockSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!unlockTarget) return;
    const expected = (unlockTarget.password || "").trim();
    if (unlockPw.trim() === expected) {
      setUnlockedIds(prev => new Set(prev).add(unlockTarget.id));
      setDetailId(unlockTarget.id);
      setUnlockTarget(null);
      setUnlockPw("");
      setUnlockError("");
    } else {
      setUnlockError("비밀번호가 일치하지 않습니다. 다시 확인해 주세요.");
    }
  }

  const pageHeader = (onBackBtn: () => void, sub: string) => (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      <div className="max-w-4xl mx-auto px-5 md:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex flex-col justify-center">
          <h1 className="font-serif-kr text-base md:text-lg font-black text-[#0F172A] leading-tight">수업 소식</h1>
          <p className="text-[11px] text-stone-500 mt-0.5">{sub}</p>
        </div>
        <button
          onClick={onBackBtn}
          className="shrink-0 flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-stone-200/80 transition active:scale-95"
        >
          ← {detailId ? "목록으로" : "홈으로"}
        </button>
      </div>
    </header>
  );

  if (detail) return (
    <div style={{ wordBreak: "keep-all" }} className="min-h-screen bg-[#FAFAF9] text-[#0F172A]">
      {pageHeader(() => setDetailId(null), "원장 직강 수업 이야기 & 성장 기록")}
      <main className="max-w-3xl mx-auto px-5 md:px-8 py-10">
        <div className="bg-white rounded-3xl shadow-xs border border-stone-200/90 p-6 md:p-10">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-[#EA580C] border border-orange-200/70">
              📅 {detail.date}
            </span>
            {detail.isPrivate && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 flex items-center gap-1 border border-stone-200">
                🔒 비공개 글 (열람 인증 완료)
              </span>
            )}
          </div>
          <h2 className="font-serif-kr text-2xl md:text-3xl font-black text-[#0F172A] mb-6 leading-snug">
            {detail.title}
          </h2>
          <div className="w-full h-px bg-stone-200/80 mb-6" />
          <div
            className="text-sm md:text-base text-stone-700 leading-loose review-body"
            dangerouslySetInnerHTML={{ __html: detail.body }}
          />
        </div>
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setDetailId(null)}
            className="inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs md:text-sm font-bold px-6 py-3 rounded-xl border border-stone-200 transition active:scale-95"
          >
            ← 수업 소식 목록으로 돌아가기
          </button>
        </div>
      </main>
      <style>{`.review-body p { margin-bottom: 1.25em; } .review-body p:last-child { margin-bottom: 0; }`}</style>
    </div>
  );

  return (
    <div style={{ wordBreak: "keep-all" }} className="min-h-screen bg-[#FAFAF9] text-[#0F172A]">
      {pageHeader(onBack, "원장 선생님이 직접 전하는 수업 이야기")}

      <main className="max-w-3xl mx-auto px-5 md:px-8 py-8 md:py-12">
        {/* 검색 + 정렬 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">🔍</span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="제목, 본문 내용 검색..."
              className="w-full pl-10 pr-4 py-3 text-sm border border-stone-200 rounded-xl outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition bg-white shadow-2xs"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            {(["date", "title"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-4 py-3 rounded-xl text-xs font-bold border transition shadow-2xs ${
                  sort === s
                    ? "bg-[#EA580C] border-[#EA580C] text-white"
                    : "bg-white border-stone-200 text-stone-600 hover:border-orange-300 hover:text-[#EA580C]"
                }`}
              >
                {s === "date" ? "📅 최신순" : "🔤 제목순"}
              </button>
            ))}
          </div>
        </div>

        {/* 리뷰 목록 */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200/80 text-stone-400 text-sm">
            검색 결과와 일치하는 소식이 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {filtered.map(r => {
              const isLocked = r.isPrivate && r.password && r.password.trim() !== "" && !unlockedIds.has(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => handleItemClick(r)}
                  className="w-full text-left bg-white rounded-2xl border border-stone-200/80 p-5 md:p-6 hover:-translate-y-0.5 hover:shadow-md hover:border-orange-200 transition-all duration-200 group shadow-xs"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        {r.isPrivate && (
                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-[#EA580C] border border-orange-200/80 flex items-center gap-1">
                            🔒 비공개
                          </span>
                        )}
                        <span className="text-xs font-semibold text-stone-400">📅 {r.date}</span>
                      </div>
                      <p className="font-serif-kr font-bold text-[#0F172A] text-base md:text-lg group-hover:text-[#EA580C] transition truncate leading-snug">
                        {r.title}
                      </p>
                      {isLocked ? (
                        <p className="text-xs text-orange-950 bg-orange-50/70 rounded-lg px-3 py-2 mt-2.5 inline-flex items-center gap-1.5 font-medium border border-orange-200/60">
                          <span>🔒</span>
                          <span>비밀번호로 보호된 글입니다. 클릭하여 비밀번호를 입력해주세요.</span>
                        </p>
                      ) : (
                        <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">
                          {r.body.replace(/<[^>]+>/g, "").slice(0, 110)}…
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 w-8 h-8 rounded-full bg-stone-50 text-[#EA580C] flex items-center justify-center font-bold text-sm group-hover:bg-orange-500 group-hover:text-white transition">
                      {isLocked ? "🔒" : "→"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-stone-400 mt-10">총 {filtered.length}개의 소식 등록됨</p>
      </main>

      {/* 🔒 비공개 글 비밀번호 입력 모달 */}
      {unlockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-200 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#EA580C] flex items-center justify-center text-lg shrink-0">
                🔒
              </div>
              <div>
                <h3 className="font-bold text-[#0F172A] text-base">비공개 수업 소식</h3>
                <p className="text-xs text-stone-500">열람 비밀번호를 입력해 주세요.</p>
              </div>
            </div>

            <div className="bg-[#FAFAF9] rounded-xl p-3 border border-stone-200/70">
              <p className="text-xs font-bold text-[#0F172A] truncate">{unlockTarget.title}</p>
              <p className="text-[11px] text-stone-400 mt-0.5">📅 {unlockTarget.date}</p>
            </div>

            <form onSubmit={handleUnlockSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">비밀번호</label>
                <input
                  type="password"
                  autoFocus
                  value={unlockPw}
                  onChange={e => { setUnlockPw(e.target.value); setUnlockError(""); }}
                  placeholder="비밀번호 입력"
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition bg-white"
                />
                {unlockError && (
                  <p className="text-xs text-red-600 mt-1.5 font-semibold">{unlockError}</p>
                )}
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => { setUnlockTarget(null); setUnlockPw(""); setUnlockError(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-xs font-bold text-white transition shadow-sm"
                >
                  확인 (글 보기)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function QnaPage({ onBack, items }: { onBack: () => void; items?: QnaItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const list = items ?? QNA_LIST;

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ wordBreak: "keep-all" }} className="min-h-screen bg-[#FAFAF9] text-[#0F172A]">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex flex-col justify-center">
            <h1 className="font-serif-kr text-base md:text-lg font-black text-[#0F172A] leading-tight">자주 묻는 질문</h1>
            <p className="text-[11px] text-stone-500 mt-0.5">파주운정 산내푸르지오 교실 학부모 안내</p>
          </div>
          <button
            onClick={onBack}
            className="shrink-0 flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-stone-200/80 transition active:scale-95"
          >
            ← 홈으로
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 md:px-8 py-8 md:py-12">
        {/* 안내 배너 */}
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 md:p-8 mb-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-bold text-[#EA580C] uppercase tracking-wider mb-1">
              Frequently Asked Questions
            </span>
            <h2 className="font-serif-kr text-xl font-black text-[#0F172A]">
              학부모님께서 가장 많이 주신 질문
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              수업 커리큘럼, 소수 정예 원장 직강, 입회 절차에 대한 모든 것
            </p>
          </div>
          <a
            href="http://pf.kakao.com/_xxxxxx"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition active:scale-95 shadow-xs"
          >
            <span>💬</span>
            <span>1:1 빠른 상담</span>
          </a>
        </div>

        {/* 아코디언 */}
        <div className="space-y-3">
          {list.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs hover:border-orange-200 transition-all duration-200"
            >
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full text-left px-5 md:px-6 py-5 flex items-start gap-3.5 cursor-pointer"
              >
                <span className="shrink-0 w-7 h-7 rounded-lg bg-orange-100 text-[#EA580C] text-xs font-black flex items-center justify-center mt-0.5">
                  Q
                </span>
                <span className="flex-1 font-bold text-[#0F172A] text-sm md:text-base leading-snug">
                  {item.q}
                </span>
                <span
                  className={`shrink-0 w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 text-xs transition-transform duration-200 ${
                    openIdx === idx ? "rotate-180 bg-orange-100 text-[#EA580C]" : ""
                  }`}
                >
                  ▼
                </span>
              </button>
              {openIdx === idx && (
                <div className="px-5 md:px-6 pb-6 pt-3 border-t border-stone-100 bg-[#FAF9F6]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-lg bg-[#EA580C] text-white text-xs font-black flex items-center justify-center shrink-0">
                      A
                    </span>
                    <span className="text-xs font-bold text-[#EA580C]">원장 직강 교육 가이드</span>
                  </div>
                  <div
                    className="text-xs md:text-sm text-stone-600 leading-relaxed [&_img]:w-full [&_img]:rounded-xl [&_img]:mt-3 [&_strong]:text-[#0F172A] [&_strong]:font-bold"
                    dangerouslySetInnerHTML={{ __html: item.a.replace(/\n\n/g, "<br><br>") }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 bg-white border border-orange-200/80 rounded-3xl p-8 text-center shadow-xs">
          <p className="text-xs font-bold text-[#EA580C] uppercase tracking-wider mb-1">Direct Consultation</p>
          <h3 className="font-serif-kr text-lg font-black text-[#0F172A] mb-2">
            더 궁금하신 점이나 무료 독서 진단이 필요하신가요?
          </h3>
          <p className="text-xs text-stone-500 mb-6">
            수업 중일 때는 전화 통화가 어려울 수 있으니, 카카오톡으로 아이 학년과 함께 문의 남겨주시면 정성껏 답변드리겠습니다.
          </p>
          <a
            href="http://pf.kakao.com/_xxxxxx"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-sm px-8 py-3.5 rounded-2xl shadow-sm transition-all hover:-translate-y-0.5 active:scale-95"
          >
            💬 카카오톡 1:1 상담 예약하기
          </a>
        </div>
      </main>

      <footer className="bg-[#0F172A] text-stone-400 text-xs text-center py-8 px-5 leading-relaxed border-t border-stone-800">
        <p className="font-semibold text-stone-300">한우리 독서토론논술 파주운정 산내푸르지오 독서교실</p>
        <p className="text-[11px] text-stone-500 mt-1">교육상담 및 문의 · 원장 직접 지도 · 교습소 번호 등록 완료</p>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════
   관리자 모달
═══════════════════════════════════════ */
const DEFAULT_ADMIN_PW = "hanwoori2024";
const LOCAL_STORAGE_ADMIN_PW_KEY = "hanwoori_admin_pw";

function getStoredAdminPassword(): string {
  try {
    return localStorage.getItem(LOCAL_STORAGE_ADMIN_PW_KEY) || DEFAULT_ADMIN_PW;
  } catch {
    return DEFAULT_ADMIN_PW;
  }
}

function saveStoredAdminPassword(newPw: string): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_ADMIN_PW_KEY, newPw);
  } catch (e) {
    console.error("Failed to save admin password", e);
  }
}

const SECTIONS = [
  {
    id: "header", label: "헤더",
    fields: [
      { key: "title",    label: "메인 제목",  type: "text",     defaultValue: "한우리 독서토론논술" },
      { key: "subtitle", label: "부제목",     type: "text",     defaultValue: "파주운정 산내푸르지오 독서교실" },
    ],
  },
  {
    id: "intro", label: "히어로 & 4대 안심 포인트",
    fields: [
      { key: "badge",    label: "상단 타깃 뱃지", type: "text",     defaultValue: "파주운정 산내푸르지오 · 10년 원장 직강 소수정예" },
      { key: "headline", label: "메인 헤드라인 (줄바꿈 가능)", type: "textarea", defaultValue: "스마트폰에 빼앗긴 문해력,\n스스로 생각하고 표현하는 아이로" },
      { key: "quote",    label: "인용 문구",     type: "text",     defaultValue: "아이의 생각이 깊어지고, 읽는 기쁨이 자라나는 따뜻한 공간" },
      { key: "sub",      label: "보조 문구",     type: "text",     defaultValue: "스스로 생각의 씨앗을 틔울 수 있도록 돕습니다." },
      { key: "point1_title", label: "1번째 안심 포인트 제목", type: "text", defaultValue: "10년 원장 직강" },
      { key: "point1_desc",  label: "1번째 안심 포인트 설명", type: "text", defaultValue: "보조강사 없이 직접 지도" },
      { key: "point2_title", label: "2번째 안심 포인트 제목", type: "text", defaultValue: "1반 최대 6명" },
      { key: "point2_desc",  label: "2번째 안심 포인트 설명", type: "text", defaultValue: "발표 & 토론 기회 보장" },
      { key: "point3_title", label: "3번째 안심 포인트 제목", type: "text", defaultValue: "매월 새 필독서" },
      { key: "point3_desc",  label: "3번째 안심 포인트 설명", type: "text", defaultValue: "교과연계 한우리 30년" },
      { key: "point4_title", label: "4번째 안심 포인트 제목", type: "text", defaultValue: "1:1 맞춤 첨삭" },
      { key: "point4_desc",  label: "4번째 안심 포인트 설명", type: "text", defaultValue: "정기 포트폴리오 관리" },
    ],
  },
  {
    id: "about", label: "원장 소개 & 교육 철학",
    fields: [
      { key: "slogan", label: "슬로건",    type: "text",     defaultValue: "생각하는 힘이 아이의 미래를 바꿉니다" },
      { key: "name",   label: "원장 이름", type: "text",     defaultValue: "원장 이해옥" },
      { key: "career", label: "경력 (줄바꿈으로 구분)", type: "textarea", defaultValue: "독서토론논술 교습소 운영 (10년 경력)\n해법·한우리 독서토론교습소 운영\n독서지도사 자격 보유" },
      { key: "desc",   label: "교육 철학 요약", type: "textarea", defaultValue: "단순히 책을 읽고 글을 쓰는 것을 넘어, 아이들이 스스로 생각하고 질문하는 힘을 길러주는 것을 교육 철학으로 삼고 있습니다." },
      { key: "letter", label: "원장 진심의 편지 (에디토리얼 서신)", type: "textarea", defaultValue: "제 아이를 책으로 키우며 느꼈던 배움의 감동을 우리 지역 아이들에게 전하고자 시작한 지 10년이 되었습니다. 성급하게 재촉하지 않고, 아이마다 다른 생각의 보폭을 따뜻하게 지켜보겠습니다." },
    ],
  },
  {
    id: "curriculum", label: "커리큘럼 (학년별 세부)",
    fields: [
      { key: "elem_low_head",  label: "초등 저학년 핵심 요약", type: "text",     defaultValue: "그림책에서 줄글책으로, 재미있게 말하고 쓰기" },
      { key: "elem_low_desc",  label: "초등 저학년 상세 설명", type: "textarea", defaultValue: "독서에 대한 긍정적인 흥미를 키우고 어휘력을 폭넓게 확장합니다. 책을 읽은 뒤 떠오르는 느낌을 자유롭게 말하고, 짧은 문장부터 한 단락의 글을 스스로 써내는 성취감을 배웁니다." },
      { key: "elem_high_head", label: "초등 고학년 핵심 요약", type: "text",     defaultValue: "교과 연계 배경지식과 논리적인 서술형 글쓰기" },
      { key: "elem_high_desc", label: "초등 고학년 상세 설명", type: "textarea", defaultValue: "문학 작품뿐 아니라 역사, 사회, 과학 등 교과 연계 비문학 도서를 깊이 있게 다룹니다. 서로 다른 생각을 경청하는 토론을 거쳐 논리적 근거를 갖춘 서술형 논술문을 완성합니다." },
      { key: "mid_head",       label: "중등 심화반 핵심 요약", type: "text",     defaultValue: "중등 내신 만점과 수능 국어 1등급의 탄탄한 토대" },
      { key: "mid_desc",       label: "중등 심화반 상세 설명", type: "textarea", defaultValue: "신문 칼럼, 시사 논증, 비판적 독해를 통해 수능 국어 비문학 지문에 대비합니다. 중학교 서술형 내신 평가와 자유학기제 글쓰기 수행평가를 원장이 1:1로 밀착 지도합니다." },
      { key: "elem_title",     label: "기존 초등부 제목 (참고용)", type: "text",     defaultValue: "저학년 / 고학년" },
      { key: "elem_body",      label: "기존 초등부 설명 (참고용)", type: "textarea", defaultValue: "그림책과 문학 작품을 통한 흥미 위주의 독서. 주 1회 주제별 글쓰기 및 자유 토론 진행." },
      { key: "mid_title",      label: "기존 중등부 제목 (참고용)", type: "text",     defaultValue: "내신 및 심화 논술" },
      { key: "mid_body",       label: "기존 중등부 설명 (참고용)", type: "textarea", defaultValue: "비문학 읽기 및 신문 칼럼 분석. 서술형 평가 대비 및 중등 내신 연계형 심화 논술 작성." },
    ],
  },
  {
    id: "faq", label: "홈화면 빠른 질문 (Quick FAQ)",
    fields: [
      { key: "q1", label: "질문 1 제목", type: "text",     defaultValue: "한 반 인원과 수업 시간은 어떻게 되나요?" },
      { key: "a1", label: "질문 1 답변", type: "textarea", defaultValue: "한 반에 최대 6명 이하 소수 정예로 운영되며, 모든 아이가 충분히 발표하고 경청할 수 있도록 원장이 직접 지도합니다. 수업은 주 1회 80분~100분 과정으로 진행됩니다." },
      { key: "q2", label: "질문 2 제목", type: "text",     defaultValue: "책을 잘 안 읽는 아이도 적응할 수 있을까요?" },
      { key: "a2", label: "질문 2 답변", type: "textarea", defaultValue: "처음부터 두꺼운 책을 강요하지 않고, 질문과 대화로 흥미를 여는 '몰입독서' 방식으로 시작합니다. 아이의 눈높이에 맞춰 성취감을 느끼도록 이끕니다." },
    ],
  },
  {
    id: "info", label: "운영 안내 & 지도",
    fields: [
      { key: "hours",   label: "운영 시간", type: "text", defaultValue: "평일 14:00 ~ 20:00 (주말 및 공휴일 휴무)" },
      { key: "address", label: "주소",     type: "text", defaultValue: "경기 파주시 심학산로 385 운정신도시센트럴푸르지오 상가 2동 204호" },
      { key: "parking", label: "주차 안내", type: "text", defaultValue: "건물 뒷편 주차장 이용 가능" },
    ],
  },
  {
    id: "contact", label: "상담 문의 & 카카오톡",
    fields: [
      { key: "desc",    label: "안내 문구",      type: "textarea", defaultValue: "우리 아이에게 딱 맞는 독서 논술 교육,\n지금 바로 부담 없이 상담받아보세요!" },
      { key: "kakao",   label: "카카오톡 링크",  type: "text", defaultValue: "http://pf.kakao.com/_xxxxxx" },
    ],
  },
];

type QnaItem = { q: string; a: string };

/* ─── 이미지 자르기 모달 ─── */
function CropModal({ src, onConfirm, onCancel }: {
  src: string;
  onConfirm: (croppedSrc: string) => void;
  onCancel: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cropRef = useRef({ x: 10, y: 10, w: 80, h: 80 });
  const [crop, setCropState] = useState({ x: 10, y: 10, w: 80, h: 80 });

  function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

  function startDrag(handle: string, e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    e.stopPropagation();
    const startX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const startY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const sc = { ...cropRef.current };

    function move(cx: number, cy: number) {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const dx = ((cx - startX) / r.width) * 100;
      const dy = ((cy - startY) / r.height) * 100;
      let { x, y, w, h } = sc;

      if (handle === "move") {
        x = clamp(sc.x + dx, 0, 100 - w);
        y = clamp(sc.y + dy, 0, 100 - h);
      } else {
        if (handle === "e"  || handle === "ne" || handle === "se") w = clamp(sc.w + dx, 5, 100 - x);
        if (handle === "s"  || handle === "se" || handle === "sw") h = clamp(sc.h + dy, 5, 100 - y);
        if (handle === "w"  || handle === "nw" || handle === "sw") {
          const nx = clamp(sc.x + dx, 0, sc.x + sc.w - 5);
          w = sc.w + sc.x - nx; x = nx;
        }
        if (handle === "n"  || handle === "nw" || handle === "ne") {
          const ny = clamp(sc.y + dy, 0, sc.y + sc.h - 5);
          h = sc.h + sc.y - ny; y = ny;
        }
      }

      const next = { x, y, w, h };
      cropRef.current = next;
      setCropState({ ...next });
    }

    function onMM(me: MouseEvent) { move(me.clientX, me.clientY); }
    function onMU() { cleanup(); }
    function onTM(te: TouchEvent) { te.preventDefault(); move(te.touches[0].clientX, te.touches[0].clientY); }
    function onTE() { cleanup(); }
    function cleanup() {
      document.removeEventListener("mousemove", onMM);
      document.removeEventListener("mouseup", onMU);
      document.removeEventListener("touchmove", onTM);
      document.removeEventListener("touchend", onTE);
    }
    document.addEventListener("mousemove", onMM);
    document.addEventListener("mouseup", onMU);
    document.addEventListener("touchmove", onTM, { passive: false });
    document.addEventListener("touchend", onTE);
  }

  function handleConfirm() {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = cropRef.current;
      const cw = img.naturalWidth * (c.w / 100);
      const ch = img.naturalHeight * (c.h / 100);
      const canvas = document.createElement("canvas");
      canvas.width = cw; canvas.height = ch;
      canvas.getContext("2d")!.drawImage(img,
        img.naturalWidth * (c.x / 100), img.naturalHeight * (c.y / 100), cw, ch, 0, 0, cw, ch);
      onConfirm(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => onConfirm(src);
    img.src = src;
  }

  // 핸들 공통 스타일 — 터치 영역 넓게 (24px), 시각적으로는 12px
  const H = (handle: string, style: React.CSSProperties, cursor: string) => (
    <div
      key={handle}
      onMouseDown={e => startDrag(handle, e)}
      onTouchStart={e => startDrag(handle, e)}
      style={{
        position: "absolute", width: 24, height: 24,
        cursor, touchAction: "none", zIndex: 2,
        display: "flex", alignItems: "center", justifyContent: "center",
        ...style,
      }}>
      <div style={{ width: 12, height: 12, background: "white", border: "2.5px solid #FF7F50", borderRadius: 3 }} />
    </div>
  );

  const { x, y, w, h } = crop;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.75)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        <div className="bg-[#FF7F50] px-5 py-3 flex items-center justify-between">
          <span className="text-white font-extrabold text-sm">✂️ 사진 자르기</span>
          <button onClick={onCancel} className="text-white/80 hover:text-white text-sm">✕</button>
        </div>
        <p className="px-5 pt-3 pb-1 text-xs text-[#6B7280]">모서리·변 핸들을 드래그해서 영역을 조절하세요.</p>

        {/* 이미지 컨테이너 */}
        <div ref={containerRef} className="relative m-4 select-none rounded-xl overflow-hidden"
          style={{ touchAction: "none", userSelect: "none" }}>
          <img src={src} className="w-full block" draggable={false} />

          {/* 어두운 마스크 (선택 영역 밖) */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "rgba(0,0,0,.5)",
            clipPath: `polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% 0%,${x}% ${y}%,${x}% ${y+h}%,${x+w}% ${y+h}%,${x+w}% ${y}%,${x}% ${y}%)`,
          }} />

          {/* 선택 박스 (이동 전용, 핸들 제외 영역만) */}
          <div
            onMouseDown={e => startDrag("move", e)}
            onTouchStart={e => startDrag("move", e)}
            style={{
              position: "absolute",
              left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`,
              border: "2px solid #FF7F50", cursor: "move", touchAction: "none", boxSizing: "border-box",
            }}>
            {/* 3등분 격자선 */}
            <div style={{ position:"absolute", left:"33.3%", top:0, bottom:0, borderLeft:"1px solid rgba(255,127,80,.4)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", left:"66.6%", top:0, bottom:0, borderLeft:"1px solid rgba(255,127,80,.4)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", top:"33.3%", left:0, right:0, borderTop:"1px solid rgba(255,127,80,.4)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", top:"66.6%", left:0, right:0, borderTop:"1px solid rgba(255,127,80,.4)", pointerEvents:"none" }} />
          </div>

          {/* 핸들 — 박스 바깥에 독립 렌더 (stopPropagation 확실히) */}
          {H("nw", { left:`${x}%`, top:`${y}%`,   transform:"translate(-50%,-50%)" }, "nw-resize")}
          {H("ne", { left:`${x+w}%`, top:`${y}%`, transform:"translate(-50%,-50%)" }, "ne-resize")}
          {H("sw", { left:`${x}%`, top:`${y+h}%`, transform:"translate(-50%,-50%)" }, "sw-resize")}
          {H("se", { left:`${x+w}%`, top:`${y+h}%`, transform:"translate(-50%,-50%)" }, "se-resize")}
          {H("n",  { left:`${x+w/2}%`, top:`${y}%`,   transform:"translate(-50%,-50%)" }, "n-resize")}
          {H("s",  { left:`${x+w/2}%`, top:`${y+h}%`, transform:"translate(-50%,-50%)" }, "s-resize")}
          {H("w",  { left:`${x}%`, top:`${y+h/2}%`,   transform:"translate(-50%,-50%)" }, "w-resize")}
          {H("e",  { left:`${x+w}%`, top:`${y+h/2}%`, transform:"translate(-50%,-50%)" }, "e-resize")}
        </div>

        <div className="flex gap-2 px-4 pb-4">
          <button onClick={handleConfirm}
            className="flex-1 bg-[#FF7F50] hover:bg-[#E8623A] text-white font-bold py-2.5 rounded-xl transition text-sm">
            이 부분으로 자르기
          </button>
          <button onClick={onCancel}
            className="px-5 border border-gray-200 text-[#6B7280] font-semibold py-2.5 rounded-xl text-sm">
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── 이미지 크기 조정 + 자르기 오버레이 ─── */
function ImageControls({ img, onDone, onFlush }: {
  img: HTMLImageElement;
  onDone: () => void;
  onFlush: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [showCrop, setShowCrop] = useState(false);

  // 오버레이 위치를 img 기준으로 직접 DOM 업데이트 (리렌더 없이)
  function reposition() {
    const r = img.getBoundingClientRect();
    if (borderRef.current) {
      Object.assign(borderRef.current.style, {
        left: `${r.left - 2}px`, top: `${r.top - 2}px`,
        width: `${r.width + 4}px`, height: `${r.height + 4}px`,
      });
    }
    if (toolbarRef.current) {
      Object.assign(toolbarRef.current.style, {
        left: `${r.left}px`, top: `${Math.max(4, r.top - 42)}px`,
      });
    }
    // 핸들 위치 업데이트
    const handles = overlayRef.current?.querySelectorAll<HTMLDivElement>("[data-handle]");
    handles?.forEach(h => {
      const pos = h.dataset.handle!;
      if (pos === "nw") { h.style.left = `${r.left - 7}px`; h.style.top = `${r.top - 7}px`; }
      if (pos === "ne") { h.style.left = `${r.right - 7}px`; h.style.top = `${r.top - 7}px`; }
      if (pos === "sw") { h.style.left = `${r.left - 7}px`; h.style.top = `${r.bottom - 7}px`; }
      if (pos === "se") { h.style.left = `${r.right - 7}px`; h.style.top = `${r.bottom - 7}px`; }
      if (pos === "n")  { h.style.left = `${r.left + r.width / 2 - 7}px`; h.style.top = `${r.top - 7}px`; }
      if (pos === "s")  { h.style.left = `${r.left + r.width / 2 - 7}px`; h.style.top = `${r.bottom - 7}px`; }
    });
  }

  useEffect(() => {
    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => { window.removeEventListener("scroll", reposition, true); window.removeEventListener("resize", reposition); };
  });

  function startResize(dir: "e" | "w") {
    function begin(startX: number) {
      const startW = img.offsetWidth;
      let raf = 0;
      function onMove(cx: number) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const dx = cx - startX;
          const nw = Math.max(60, dir === "e" ? startW + dx : startW - dx);
          img.style.width = nw + "px";
          img.style.height = "auto";
          reposition();
        });
      }
      function cleanup() {
        cancelAnimationFrame(raf);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        onFlush();
      }
      // 마우스
      const onMouseMove = (me: MouseEvent) => onMove(me.clientX);
      const onMouseUp = () => { cleanup(); document.removeEventListener("mousemove", onMouseMove); document.removeEventListener("mouseup", onMouseUp); };
      // 터치
      const onTouchMove = (te: TouchEvent) => { te.preventDefault(); onMove(te.touches[0].clientX); };
      const onTouchEnd = () => { cleanup(); document.removeEventListener("touchmove", onTouchMove); document.removeEventListener("touchend", onTouchEnd); };

      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd);
    }
    return {
      onMouseDown: (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); begin(e.clientX); },
      onTouchStart: (e: React.TouchEvent) => { e.stopPropagation(); begin(e.touches[0].clientX); },
    };
  }

  if (showCrop) return (
    <CropModal
      src={img.src}
      onConfirm={croppedSrc => {
        img.src = croppedSrc;
        img.style.width = "100%";
        img.style.height = "auto";
        onFlush();
        setShowCrop(false);
      }}
      onCancel={() => setShowCrop(false)}
    />
  );

  const r = img.getBoundingClientRect();
  const hBase: React.CSSProperties = { position: "fixed", width: 14, height: 14, background: "#FF7F50", border: "2px solid white", borderRadius: 3, zIndex: 55 };

  return (
    <div ref={overlayRef}>
      {/* 선택 테두리 */}
      <div ref={borderRef} style={{ position: "fixed", border: "2px solid #FF7F50", borderRadius: 10, zIndex: 54, pointerEvents: "none",
        left: r.left - 2, top: r.top - 2, width: r.width + 4, height: r.height + 4 }} />
      {/* 핸들 — 좌우만 크기조정, 나머지는 자리 표시 */}
      <div data-handle="nw" style={{ ...hBase, left: r.left - 7, top: r.top - 7, cursor: "nw-resize" }} {...startResize("w")} />
      <div data-handle="ne" style={{ ...hBase, left: r.right - 7, top: r.top - 7, cursor: "ne-resize" }} {...startResize("e")} />
      <div data-handle="sw" style={{ ...hBase, left: r.left - 7, top: r.bottom - 7, cursor: "sw-resize" }} {...startResize("w")} />
      <div data-handle="se" style={{ ...hBase, left: r.right - 7, top: r.bottom - 7, cursor: "se-resize" }} {...startResize("e")} />
      <div data-handle="n"  style={{ ...hBase, left: r.left + r.width / 2 - 7, top: r.top - 7, cursor: "ew-resize" }} {...startResize("e")} />
      <div data-handle="s"  style={{ ...hBase, left: r.left + r.width / 2 - 7, top: r.bottom - 7, cursor: "ew-resize" }} {...startResize("e")} />
      {/* 툴바 */}
      <div ref={toolbarRef} style={{ position: "fixed", left: r.left, top: Math.max(4, r.top - 42), display: "flex", gap: 6, zIndex: 56 }}>
        <button onMouseDown={e => e.stopPropagation()} onClick={() => setShowCrop(true)}
          style={{ background: "#1E2B3A", color: "white", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
          ✂️ 자르기
        </button>
        <button onMouseDown={e => e.stopPropagation()} onClick={onDone}
          style={{ background: "#6B7280", color: "white", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          ✓ 완료
        </button>
      </div>
    </div>
  );
}

/* ─── 답변 에디터 ─── */
function RichEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgUrl, setImgUrl] = useState("");
  const [showImg, setShowImg] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const savedRange = useRef<Range | null>(null);

  // 열릴 때 한 번만 초기값 주입 (value가 새 QnA로 바뀔 때만 재주입)
  const lastValue = useRef<string | null>(null);
  useEffect(() => {
    const el = editorRef.current;
    if (!el || lastValue.current === value) return;
    // \n\n → 문단 여백, \n → <br> 로 변환해서 넣기
    const normalised = value
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");
    el.innerHTML = `<p>${normalised}</p>`;
    lastValue.current = value;
  }, [value]);

  function saveRange() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
  }
  function restoreRange() {
    const sel = window.getSelection();
    if (sel && savedRange.current) { sel.removeAllRanges(); sel.addRange(savedRange.current); }
  }
  function exec(cmd: string, val?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    flush();
  }
  function flush() {
    if (editorRef.current) {
      lastValue.current = editorRef.current.innerHTML;
      onChange(editorRef.current.innerHTML);
    }
  }
  function insertImg() {
    if (!imgUrl.trim()) return;
    restoreRange();
    editorRef.current?.focus();
    document.execCommand("insertHTML", false,
      `<img src="${imgUrl.trim()}" alt="이미지" style="width:100%;border-radius:10px;margin-top:8px;display:block;" />`);
    setImgUrl(""); setShowImg(false); flush();
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      restoreRange();
      editorRef.current?.focus();
      document.execCommand("insertHTML", false,
        `<img src="${src}" alt="첨부 이미지" style="width:100%;border-radius:10px;margin-top:8px;display:block;" />`);
      flush();
      setUploading(false);
      // 같은 파일 재선택 가능하도록 초기화
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  }

  const tb = "px-3 py-1.5 rounded-lg text-xs font-bold border transition select-none border-gray-200 bg-white text-[#444] hover:border-[#FF7F50] hover:text-[#FF7F50]";

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#FF7F50] transition">
      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-gray-50 border-b border-gray-100">
        <button type="button" onMouseDown={e => { e.preventDefault(); exec("undo"); }} className={tb} title="되돌리기 (Ctrl+Z)">
          ↩ 되돌리기
        </button>
        <button type="button" onMouseDown={e => { e.preventDefault(); exec("redo"); }} className={tb} title="다시 실행 (Ctrl+Y)">
          ↪ 다시실행
        </button>
        <div className="w-px h-4 bg-gray-200" />
        <button type="button" onMouseDown={e => { e.preventDefault(); exec("bold"); }} className={tb} title="굵게">
          <strong>B 굵게</strong>
        </button>
        <button type="button" onMouseDown={e => { e.preventDefault(); exec("italic"); }} className={tb} title="기울임">
          <em>I 기울임</em>
        </button>
        <button type="button" onMouseDown={e => { e.preventDefault(); exec("underline"); }} className={tb} title="밑줄">
          <span style={{ textDecoration: "underline" }}>U 밑줄</span>
        </button>
        <button type="button" onMouseDown={e => {
          e.preventDefault();
          editorRef.current?.focus();
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
            const range = sel.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const el = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as HTMLElement;
            const bg = el ? window.getComputedStyle(el).backgroundColor : "";
            const isHighlighted = bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
            document.execCommand("hiliteColor", false, isHighlighted ? "transparent" : "rgba(255,235,59,0.55)");
          } else {
            document.execCommand("hiliteColor", false, "rgba(255,235,59,0.55)");
          }
          flush();
        }} className={tb} title="형광펜 (다시 누르면 제거)">
          <span style={{ background: "rgba(255,235,59,0.6)", padding: "0 3px", borderRadius: "2px" }}>형광펜</span>
        </button>
        <div className="w-px h-4 bg-gray-200" />
        <button type="button"
          onMouseDown={e => { e.preventDefault(); saveRange(); setShowImg(v => !v); }}
          className={`${tb} ${showImg ? "bg-[#FFF0EA] border-[#FF7F50] text-[#E8623A]" : ""}`}
          title="URL로 사진 첨부">
          🔗 사진(URL)
        </button>
        <button type="button"
          onMouseDown={e => { e.preventDefault(); saveRange(); setTimeout(() => fileInputRef.current?.click(), 0); }}
          className={`${tb} ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          title="내 사진 파일 업로드">
          {uploading ? "⏳ 업로드중..." : "📁 내 사진"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button type="button" onMouseDown={e => { e.preventDefault(); exec("removeFormat"); }} className={tb} title="서식 모두 제거">
          서식 초기화
        </button>
      </div>

      {/* 사진 URL 입력 */}
      {showImg && (
        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border-b border-orange-100">
          <input type="text" value={imgUrl} onChange={e => setImgUrl(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); insertImg(); } }}
            placeholder="이미지 주소(URL) 입력 후 삽입 클릭"
            className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#FF7F50]" />
          <button type="button" onClick={insertImg}
            className="text-xs bg-[#FF7F50] text-white font-bold px-3 py-1.5 rounded-lg">삽입</button>
          <button type="button" onClick={() => setShowImg(false)} className="text-[#aaa] text-xs px-1">✕</button>
        </div>
      )}

      {/* 편집 영역 — Enter=문단, Shift+Enter=줄바꿈 */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={flush}
        onClick={e => {
          const target = e.target as HTMLElement;
          if (target.tagName === "IMG") {
            e.preventDefault();
            setSelectedImg(target as HTMLImageElement);
          } else {
            setSelectedImg(null);
          }
        }}
        className="rich-edit min-h-[160px] px-4 py-3 text-sm text-[#1E2B3A] leading-relaxed outline-none"
        style={{ wordBreak: "keep-all" }}
      />
      {selectedImg && (
        <ImageControls
          img={selectedImg}
          onDone={() => setSelectedImg(null)}
          onFlush={flush}
        />
      )}

      <p className="px-4 py-2 text-[10px] text-[#bbb] bg-gray-50 border-t border-gray-100">
        Enter = 문단 나누기 (한 줄 여백)&nbsp;&nbsp;·&nbsp;&nbsp;Shift + Enter = 줄바꿈 (여백 없이)&nbsp;&nbsp;·&nbsp;&nbsp;텍스트 선택 후 굵게/밑줄
      </p>

      {/* 편집 영역 내부 문단 간격 CSS */}
      <style>{`
        .rich-edit p { margin: 0 0 0.9em 0; }
        .rich-edit p:last-child { margin-bottom: 0; }
        .rich-edit div { margin: 0 0 0.9em 0; }
        .rich-edit div:last-child { margin-bottom: 0; }
        .rich-edit br { display: block; }
      `}</style>
    </div>
  );
}

function QnaSectionEditor({ qnaList, onChange }: {
  qnaList: QnaItem[];
  onChange: (list: QnaItem[]) => void;
}) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<QnaItem>({ q: "", a: "" });
  const [adding, setAdding] = useState(false);

  function startEdit(idx: number) {
    setAdding(false);
    setEditIdx(idx);
    setDraft({ ...qnaList[idx] });
  }

  function startAdd() {
    setEditIdx(null);
    setAdding(true);
    setDraft({ q: "", a: "" });
  }

  function cancelEdit() { setEditIdx(null); setAdding(false); }

  function saveEdit() {
    if (!draft.q.trim()) return;
    if (adding) {
      onChange([...qnaList, draft]);
    } else if (editIdx !== null) {
      const next = [...qnaList];
      next[editIdx] = draft;
      onChange(next);
    }
    setEditIdx(null);
    setAdding(false);
  }

  function deleteItem(idx: number) {
    if (!confirm("이 Q&A를 삭제할까요?")) return;
    const target = qnaList[idx];
    const next = qnaList.filter((_, i) => i !== idx);
    onChange(next);
    saveLocalData(LOCAL_STORAGE_QNA_KEY, next);
    if (editIdx === idx) { setEditIdx(null); setAdding(false); }
    if (target) {
      deleteQnaDirectly(idx, target.q).catch(err => console.warn("Sanity Q&A delete async:", err));
    }
  }

  function moveItem(idx: number, dir: -1 | 1) {
    const next = [...qnaList];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
    if (editIdx === idx) setEditIdx(swap);
    else if (editIdx === swap) setEditIdx(idx);
  }

  const editing = editIdx !== null || adding;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-[#1E2B3A]">자주 묻는 질문 관리</h3>
        <button onClick={startAdd}
          className="flex items-center gap-1 bg-[#FF7F50] hover:bg-[#E8623A] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
          + 질문 추가
        </button>
      </div>

      {/* 목록 */}
      <div className="flex flex-col gap-2">
        {qnaList.map((item, idx) => (
          <div key={idx}
            className={`rounded-xl border transition ${editIdx === idx ? "border-[#FF7F50] bg-[#FFF0EA]" : "border-gray-100 bg-gray-50"}`}>
            <div className="flex items-start gap-2 p-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-[#FF7F50] text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                {idx + 1}
              </span>
              <p className="flex-1 text-xs font-semibold text-[#1E2B3A] leading-relaxed line-clamp-2">{item.q}</p>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => moveItem(idx, -1)} disabled={idx === 0}
                  className="w-6 h-6 rounded flex items-center justify-center text-[#aaa] hover:text-[#FF7F50] disabled:opacity-30 text-xs transition">▲</button>
                <button onClick={() => moveItem(idx, 1)} disabled={idx === qnaList.length - 1}
                  className="w-6 h-6 rounded flex items-center justify-center text-[#aaa] hover:text-[#FF7F50] disabled:opacity-30 text-xs transition">▼</button>
                <button onClick={() => startEdit(idx)}
                  className="w-6 h-6 rounded flex items-center justify-center text-[#aaa] hover:text-[#FF7F50] text-xs transition">✏️</button>
                <button onClick={() => deleteItem(idx)}
                  className="w-6 h-6 rounded flex items-center justify-center text-[#aaa] hover:text-red-500 text-xs transition">🗑</button>
              </div>
            </div>
          </div>
        ))}
        {qnaList.length === 0 && (
          <p className="text-xs text-[#aaa] text-center py-6">등록된 질문이 없습니다.</p>
        )}
      </div>

      {/* 편집/추가 폼 */}
      {editing && (
        <div className="border-2 border-[#FF7F50] rounded-2xl p-4 flex flex-col gap-3 bg-white">
          <p className="text-xs font-extrabold text-[#E8623A]">{adding ? "새 질문 추가" : `${editIdx! + 1}번 질문 수정`}</p>
          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-1">질문</label>
            <input type="text" value={draft.q}
              onChange={e => setDraft(d => ({ ...d, q: e.target.value }))}
              placeholder="질문을 입력하세요"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF7F50] transition" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-1">답변</label>
            <RichEditor value={draft.a} onChange={a => setDraft(d => ({ ...d, a }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={saveEdit}
              className="flex-1 bg-[#FF7F50] hover:bg-[#E8623A] text-white font-bold text-sm py-2.5 rounded-xl transition">
              저장
            </button>
            <button onClick={cancelEdit}
              className="px-5 border border-gray-200 text-[#6B7280] hover:bg-gray-50 font-semibold text-sm py-2.5 rounded-xl transition">
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const NAV_SIDEBAR = [
  ...SECTIONS.map(s => ({ id: s.id, label: s.label })),
  { id: "qna", label: "자주 묻는 질문" },
  { id: "reviews", label: "수업 소식" },
  { id: "sanity", label: "Sanity DB 연동" },
  { id: "password", label: "관리자 비밀번호" },
];

/* ─── 수업 소식 편집기 ─── */
function ReviewSectionEditor({ reviews, onChange }: { reviews: Review[]; onChange: (list: Review[]) => void }) {
  const [editId, setEditId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Review>(() => newReview(reviews));

  function startEdit(r: Review) { setAdding(false); setEditId(r.id); setDraft({ ...r }); }
  function startAdd() { setEditId(null); setAdding(true); setDraft(newReview(reviews)); }
  function cancel() { setEditId(null); setAdding(false); }

  function save() {
    if (!draft.title.trim()) return;
    const finalDraft: Review = {
      ...draft,
      isPrivate: Boolean(draft.isPrivate),
      password: draft.isPrivate ? (draft.password || "").trim() : "",
    };
    if (adding) onChange([...reviews, finalDraft]);
    else onChange(reviews.map(r => r.id === editId ? finalDraft : r));
    cancel();
  }

  function del(id: number) {
    if (!confirm("이 소식을 삭제할까요?")) return;
    const next = reviews.filter(r => r.id !== id);
    onChange(next);
    saveLocalData(LOCAL_STORAGE_REVIEWS_KEY, next);
    if (editId === id) cancel();
    deleteReviewDirectly(id).catch(err => console.warn("Sanity Review delete async:", err));
  }

  const editing = editId !== null || adding;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-[#1E2B3A]">수업 소식 관리</h3>
          <p className="text-[11px] text-[#6B7280]">글마다 공개/비공개 및 열람 비밀번호를 설정할 수 있습니다.</p>
        </div>
        <button onClick={startAdd}
          className="flex items-center gap-1 bg-[#FF7F50] hover:bg-[#E8623A] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
          + 새 글 쓰기
        </button>
      </div>

      {/* 목록 */}
      <div className="flex flex-col gap-2">
        {reviews.length === 0 && <p className="text-xs text-[#aaa] text-center py-4">등록된 수업 소식이 없습니다.</p>}
        {[...reviews].sort((a,b) => b.date.localeCompare(a.date)).map(r => (
          <div key={r.id} className={`rounded-xl border p-3 transition ${editId === r.id ? "border-[#FF7F50] bg-[#FFF0EA]" : "border-gray-100 bg-gray-50"}`}>
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {r.isPrivate ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-0.5">
                      🔒 비공개 {r.password ? `(PW: ${r.password})` : "(비번 미설정)"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 flex items-center gap-0.5">
                      🌐 공개
                    </span>
                  )}
                  <p className="text-xs font-bold text-[#1E2B3A] truncate">{r.title}</p>
                </div>
                <p className="text-[10px] text-[#aaa] mt-1">📅 {r.date}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(r)} title="수정" className="w-6 h-6 rounded flex items-center justify-center text-[#aaa] hover:text-[#FF7F50] transition text-xs">✏️</button>
                <button onClick={() => del(r.id)} title="삭제" className="w-6 h-6 rounded flex items-center justify-center text-[#aaa] hover:text-red-500 transition text-xs">🗑</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 편집/추가 폼 */}
      {editing && (
        <div className="border-2 border-[#FF7F50] rounded-2xl p-4 flex flex-col gap-3 bg-white">
          <p className="text-xs font-extrabold text-[#E8623A]">{adding ? "새 수업 소식 작성" : "수업 소식 수정"}</p>
          
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-[#6B7280] mb-1">제목</label>
              <input type="text" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                placeholder="예: 11월 초등부 — 토론 수업" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FF7F50] transition" />
            </div>
            <div className="shrink-0">
              <label className="block text-xs font-semibold text-[#6B7280] mb-1">날짜</label>
              <input type="date" value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FF7F50] transition" />
            </div>
          </div>

          {/* 공개 / 비공개 설정 */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex flex-col gap-2.5">
            <label className="block text-xs font-bold text-[#1E2B3A]">공개 상태 설정</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDraft(d => ({ ...d, isPrivate: false }))}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  !draft.isPrivate
                    ? "border-green-500 bg-green-50 text-green-700 shadow-xs"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-100"
                }`}
              >
                <span>🌐</span>
                <span>전체 공개 (누구나 열람)</span>
              </button>
              <button
                type="button"
                onClick={() => setDraft(d => ({ ...d, isPrivate: true }))}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  draft.isPrivate
                    ? "border-amber-500 bg-amber-50 text-amber-900 shadow-xs"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-100"
                }`}
              >
                <span>🔒</span>
                <span>비공개 (비밀번호 설정)</span>
              </button>
            </div>

            {draft.isPrivate && (
              <div className="mt-1 pt-2 border-t border-amber-200/70 flex flex-col gap-1.5">
                <label className="block text-xs font-bold text-amber-900">
                  🔒 열람 비밀번호
                </label>
                <input
                  type="text"
                  value={draft.password || ""}
                  onChange={e => setDraft(d => ({ ...d, password: e.target.value }))}
                  placeholder="예: 1234 (학부모/학생 전달용)"
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500 bg-white transition"
                />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  * 외부 사용자가 이 비밀번호를 입력하면 <strong>글의 내용만 열람</strong>할 수 있으며, 다른 조작이나 관리 기능은 일체 할 수 없습니다.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-1">본문</label>
            <RichEditor value={draft.body} onChange={body => setDraft(d => ({ ...d, body }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 bg-[#FF7F50] hover:bg-[#E8623A] text-white font-bold text-sm py-2.5 rounded-xl transition shadow-xs">저장</button>
            <button onClick={cancel} className="px-5 border border-gray-200 text-[#6B7280] font-semibold text-sm py-2.5 rounded-xl transition hover:bg-gray-50">취소</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminModal({
  onClose,
  qnaList,
  onQnaChange,
  reviews,
  onReviewsChange,
  values,
  onValuesChange,
}: {
  onClose: () => void;
  qnaList: QnaItem[];
  onQnaChange: (list: QnaItem[]) => void;
  reviews: Review[];
  onReviewsChange: (list: Review[]) => void;
  values: Record<string, string>;
  onValuesChange: (vals: Record<string, string>) => void;
}) {
  const [step, setStep] = useState<"pw" | "edit">("pw");
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [activeSection, setActiveSection] = useState(NAV_SIDEBAR[0].id);
  const [localValues, setLocalValues] = useState<Record<string, string>>(values);
  const [saved, setSaved] = useState(false);
  const [saveStatusMsg, setSaveStatusMsg] = useState("");

  // 관리자 비밀번호 변경 상태
  const [currentStoredPw, setCurrentStoredPw] = useState(getStoredAdminPassword());
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirmPw: "" });
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sanity 연동 관련 상태
  const [sanityConfig, setSanityConfig] = useState<SanityConfig>(() => {
    const cfg = getSanityConfig();
    return (
      cfg || {
        projectId: "8vs8axo9",
        dataset: "production",
        apiVersion: "2024-03-01",
        token: "",
      }
    );
  });
  const [savedToken, setSavedToken] = useState<string>(() => getPermanentToken() || getSanityConfig()?.token || "");
  const [tokenInput, setTokenInput] = useState<string>("");
  const [isEditingToken, setIsEditingToken] = useState<boolean>(false);

  useEffect(() => {
    const t = getPermanentToken() || getSanityConfig()?.token || "";
    if (t && !savedToken) {
      setSavedToken(t);
    }
  }, [step]);
  const [sanityLoading, setSanityLoading] = useState(false);
  const [sanityMsg, setSanityMsg] = useState<{
    type: "success" | "error" | "info";
    text: string;
    errorType?: "cors" | "notFound" | "unauthorized" | "insufficient_permissions" | "invalidId" | "unknown";
    origin?: string;
    manageUrl?: string;
    cleanProjectId?: string;
  } | null>(null);
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [showToken, setShowToken] = useState(false);

  function copyCurrentOrigin() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    if (origin && navigator.clipboard) {
      navigator.clipboard.writeText(origin);
      setCopiedOrigin(true);
      setTimeout(() => setCopiedOrigin(false), 2000);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pw === currentStoredPw) {
      setStep("edit");
      setPwError(false);
    } else {
      setPwError(true);
    }
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);

    if (pwForm.current !== currentStoredPw) {
      setPwMsg({ type: "error", text: "현재 비밀번호가 일치하지 않습니다." });
      return;
    }
    if (!pwForm.newPw || pwForm.newPw.length < 4) {
      setPwMsg({ type: "error", text: "새 비밀번호는 4자리 이상이어야 합니다." });
      return;
    }
    if (pwForm.newPw !== pwForm.confirmPw) {
      setPwMsg({ type: "error", text: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다." });
      return;
    }

    saveStoredAdminPassword(pwForm.newPw);
    setCurrentStoredPw(pwForm.newPw);
    setPwForm({ current: "", newPw: "", confirmPw: "" });
    setPwMsg({ type: "success", text: "✓ 관리자 비밀번호가 성공적으로 변경되었습니다! 다음 로그인부터 적용됩니다." });

    // Sanity DB에도 새 비밀번호 실시간 동기화
    const cfg = getSanityConfig();
    const effectiveToken = savedToken || cfg?.token || getPermanentToken();
    if (cfg?.projectId && effectiveToken) {
      pushDataToSanity(localValues, qnaList, reviews, cleanSanityConfig({ ...cfg, token: effectiveToken }), pwForm.newPw).catch(err => {
        console.warn("비밀번호 Sanity 동기화 대기:", err);
      });
    }
  }

  function handleResetPassword() {
    if (window.confirm("비밀번호를 기본값(hanwoori2024)으로 초기화하시겠습니까?")) {
      saveStoredAdminPassword(DEFAULT_ADMIN_PW);
      setCurrentStoredPw(DEFAULT_ADMIN_PW);
      setPwForm({ current: "", newPw: "", confirmPw: "" });
      setPwMsg({ type: "success", text: "✓ 비밀번호가 기본값(hanwoori2024)으로 초기화되었습니다." });
    }
  }

  async function handleSave() {
    // 1. 화면 즉시 반영
    onValuesChange(localValues);
    // 2. 브라우저 localStorage 영구 저장
    saveLocalData(LOCAL_STORAGE_SITE_DATA_KEY, localValues);
    saveLocalData(LOCAL_STORAGE_QNA_KEY, qnaList);
    saveLocalData(LOCAL_STORAGE_REVIEWS_KEY, reviews);

    // 3. Sanity 토큰이 연결되어 있다면 Sanity DB에도 자동 동기화
    const cfg = getSanityConfig();
    const effectiveToken = savedToken || cfg?.token || getPermanentToken();
    const pid = cfg?.projectId || "8vs8axo9";
    if (pid && effectiveToken) {
      setSaveStatusMsg("웹사이트 및 Sanity DB에 자동 동기화 중...");
      try {
        const fullConfig = cleanSanityConfig({ ...cfg, projectId: pid, token: effectiveToken });
        const res = await pushDataToSanity(localValues, qnaList, reviews, fullConfig, currentStoredPw);
        if (res.success) {
          setSaveStatusMsg("✓ 웹사이트 & Sanity DB에 실시간 저장 완료!");
        } else {
          setSaveStatusMsg(`✓ 웹사이트 저장 완료 (Sanity 동기화: ${res.message})`);
        }
      } catch (err: any) {
        setSaveStatusMsg("✓ 웹사이트 저장 완료");
      }
    } else {
      setSaveStatusMsg("✓ 웹사이트에 즉시 저장 및 반영되었습니다!");
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setSaveStatusMsg("");
    }, 3500);
  }

  async function handleTestSanity() {
    const activeToken = tokenInput.trim() || savedToken || getPermanentToken();
    const cleaned = cleanSanityConfig({
      ...sanityConfig,
      projectId: sanityConfig.projectId || "8vs8axo9",
      token: activeToken,
    });

    if (activeToken) {
      setPermanentToken(activeToken);
      setSavedToken(activeToken);
    }
    setSanityConfig(cleaned);
    setSanityLoading(true);
    setSanityMsg({ type: "info", text: "Sanity DB 연결 상태와 CORS 설정을 진단 중입니다..." });
    saveLocalSanityConfig(cleaned);

    const res = await testSanityConnection(cleaned);
    setSanityLoading(false);
    if (res.success) {
      setSanityMsg({
        type: "success",
        text: res.message,
        cleanProjectId: res.cleanProjectId,
      });
      setIsEditingToken(false);
    } else {
      setSanityMsg({
        type: "error",
        text: res.message,
        errorType: res.errorType,
        origin: res.currentOrigin,
        manageUrl: res.manageUrl,
        cleanProjectId: res.cleanProjectId || cleaned.projectId,
      });
    }
  }

  async function handlePushToSanity() {
    const activeToken = tokenInput.trim() || savedToken || getPermanentToken();
    const cleaned = cleanSanityConfig({
      ...sanityConfig,
      projectId: sanityConfig.projectId || "8vs8axo9",
      token: activeToken,
    });
    if (!cleaned.projectId) {
      setSanityMsg({ type: "error", text: "먼저 Project ID를 입력해 주세요.", errorType: "invalidId" });
      return;
    }
    if (!activeToken?.trim()) {
      setSanityMsg({
        type: "error",
        text: "Sanity로 데이터를 전송하려면 Write 권한이 있는 API Token이 필요합니다 (Sanity 대시보드 API -> Tokens 발급).",
        errorType: "unauthorized",
        manageUrl: `https://www.sanity.io/manage/project/${cleaned.projectId}/api`,
      });
      return;
    }

    setPermanentToken(activeToken);
    setSavedToken(activeToken);
    setIsEditingToken(false);

    setSanityLoading(true);
    setSanityMsg({ type: "info", text: "Sanity DB로 웹사이트 전체 데이터를 업로드 중입니다..." });
    saveLocalSanityConfig(cleaned);

    const res = await pushDataToSanity(localValues, qnaList, reviews, cleaned, currentStoredPw);
    setSanityLoading(false);
    if (res.success) {
      setSanityMsg({ type: "success", text: res.message });
    } else {
      const isCors = res.errorType === "cors" || res.message?.includes("Failed to fetch") || res.message?.includes("NetworkError");
      setSanityMsg({
        type: "error",
        text: res.message,
        errorType: (res.errorType as any) || (isCors ? "cors" : "unknown"),
        origin: typeof window !== "undefined" ? window.location.origin : "",
        manageUrl: `https://www.sanity.io/manage/project/${cleaned.projectId}/api`,
        cleanProjectId: cleaned.projectId,
      });
    }
  }

  async function handlePullFromSanity() {
    setSanityLoading(true);
    setSanityMsg({ type: "info", text: "Sanity DB에서 최신 데이터를 가져오는 중입니다..." });
    const data = await fetchSanityData();
    setSanityLoading(false);
    if (data) {
      if (data.adminPassword) {
        saveStoredAdminPassword(data.adminPassword);
        setCurrentStoredPw(data.adminPassword);
      }
      if (data.values) {
        setLocalValues(prev => ({ ...prev, ...data.values }));
        onValuesChange({ ...localValues, ...data.values });
        saveLocalData(LOCAL_STORAGE_SITE_DATA_KEY, { ...localValues, ...data.values });
      }
      if (data.qnaList && data.qnaList.length > 0) {
        onQnaChange(data.qnaList);
        saveLocalData(LOCAL_STORAGE_QNA_KEY, data.qnaList);
      }
      if (data.reviews && data.reviews.length > 0) {
        onReviewsChange(data.reviews);
        saveLocalData(LOCAL_STORAGE_REVIEWS_KEY, data.reviews);
      }
      setSanityMsg({ type: "success", text: "✓ Sanity DB에서 최신 데이터를 성공적으로 불러와 웹사이트에 반영했습니다!" });
    } else {
      setSanityMsg({ type: "error", text: "Sanity에서 데이터를 가져오지 못했습니다. Project ID 및 데이터셋을 확인하세요." });
    }
  }

  const currentSection = SECTIONS.find(s => s.id === activeSection);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl h-[92vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden">

        {/* 헤더 */}
        <div className="bg-[#FF7F50] px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[11px] font-semibold text-orange-100 uppercase tracking-widest">Admin Panel</p>
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              {step === "pw" ? "관리자 로그인" : "웹사이트 실시간 편집 & DB 관리"}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-sm transition cursor-pointer">
            ✕
          </button>
        </div>

        {/* 비밀번호 */}
        {step === "pw" && (
          <form onSubmit={handleLogin} className="p-6 sm:p-8 flex flex-col gap-4">
            <p className="text-sm text-[#6B7280]">
              관리자 비밀번호를 입력해 주세요. {currentStoredPw === DEFAULT_ADMIN_PW ? (
                <span>(초기 기본값: <span className="font-mono text-[#FF7F50] font-semibold">hanwoori2024</span>)</span>
              ) : (
                <span className="text-xs text-orange-600 block mt-1">* 사용자가 설정한 비밀번호가 적용 중입니다.</span>
              )}
            </p>
            <input
              type="password"
              value={pw}
              onChange={e => { setPw(e.target.value); setPwError(false); }}
              placeholder="비밀번호"
              autoFocus
              className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition
                ${pwError ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#FF7F50]"}`}
            />
            {pwError && <p className="text-xs text-red-500">비밀번호가 올바르지 않습니다.</p>}
            <button type="submit"
              className="bg-[#FF7F50] hover:bg-[#E8623A] text-white font-bold py-3 rounded-xl transition cursor-pointer">
              로그인
            </button>
          </form>
        )}

        {/* 편집 */}
        {step === "edit" && (
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
            {/* 모바일 상단 탭 (가로 스크롤) */}
            <div className="md:hidden flex overflow-x-auto border-b border-gray-200 bg-[#f9fafb] p-2 gap-1.5 shrink-0 scrollbar-none">
              {NAV_SIDEBAR.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`whitespace-nowrap px-3.5 py-2 text-xs font-bold rounded-xl transition shrink-0 cursor-pointer ${
                    activeSection === s.id
                      ? "bg-[#FF7F50] text-white shadow-xs"
                      : "bg-white text-[#6B7280] border border-gray-200 active:bg-gray-100"
                  }`}
                >
                  {s.id === "sanity" ? "⚡ " + s.label : s.label}
                </button>
              ))}
            </div>

            {/* 데스크톱 세로 사이드바 */}
            <div className="hidden md:block w-36 shrink-0 border-r border-gray-100 bg-[#f9fafb] py-4 overflow-y-auto">
              {NAV_SIDEBAR.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition cursor-pointer
                    ${activeSection === s.id
                      ? "bg-[#FFF0EA] text-[#E8623A] border-r-2 border-[#FF7F50]"
                      : "text-[#6B7280] hover:bg-gray-100"}`}>
                  {s.id === "sanity" ? "⚡ " + s.label : s.label}
                </button>
              ))}
            </div>

            {/* 폼 영역 */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5">
              {activeSection === "qna" ? (
                <QnaSectionEditor qnaList={qnaList} onChange={onQnaChange} />
              ) : activeSection === "reviews" ? (
                <ReviewSectionEditor reviews={reviews} onChange={onReviewsChange} />
              ) : activeSection === "sanity" ? (
                /* ─── Sanity DB 연동 설정 탭 ─── */
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1E2B3A] flex items-center gap-2">
                      <span>⚡ Sanity CMS 데이터베이스 연동</span>
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                      수정한 내용이 Sanity 클라우드 DB에 영구 보존되어 모바일, PC, 모든 방문자에게 실시간 노출됩니다.
                    </p>
                  </div>

                  {/* 1단계 필수 설정: CORS 도메인 등록 가이드 */}
                  <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-2.5">
                    <div className="flex items-center justify-between font-bold text-amber-800">
                      <span className="flex items-center gap-1.5">
                        <span className="text-base">⚠️</span>
                        <span>[필수 1단계] Sanity에 현재 도메인(CORS) 등록</span>
                      </span>
                      {cleanSanityConfig(sanityConfig).projectId && (
                        <a
                          href={`https://www.sanity.io/manage/project/${cleanSanityConfig(sanityConfig).projectId}/api`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] underline text-[#FF7F50] hover:text-[#E8623A] font-bold"
                        >
                          Sanity CORS 설정 열기 ↗
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-amber-800/90 leading-relaxed">
                      Sanity 대시보드에 <strong>현재 사이트 주소</strong>가 등록되어 있지 않으면 브라우저 보안으로 인해 연결이 차단됩니다.
                    </p>
                    <div className="bg-white/90 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="text-[10px] text-[#888] block font-medium">현재 접속 주소:</span>
                        <code className="text-xs font-mono font-bold text-[#1E2B3A] select-all">
                          {typeof window !== "undefined" ? window.location.origin : ""}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={copyCurrentOrigin}
                        className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
                      >
                        {copiedOrigin ? "✓ 복사됨!" : "주소 복사"}
                      </button>
                    </div>
                    <div className="text-[11px] text-amber-900/90 space-y-0.5 pt-0.5">
                      <p className="font-bold">👉 30초 설정 방법:</p>
                      <p>1. Sanity 대시보드 &gt; <strong>API &gt; CORS Origins</strong>에서 <strong>[+ Add CORS origin]</strong> 클릭</p>
                      <p>2. 위 복사한 주소(또는 Vercel 배포 주소 <code>https://*.vercel.app</code>) 입력</p>
                      <p>3. <strong className="text-amber-950 underline">"Allow credentials"</strong> 체크박스에 꼭 체크한 후 <strong>Save</strong> 클릭!</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-[#6B7280]">
                          Sanity Project ID
                        </label>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          ✓ 기본 내장 연결됨 (8vs8axo9)
                        </span>
                      </div>
                      <input
                        type="text"
                        value={sanityConfig.projectId || "8vs8axo9"}
                        onChange={e => {
                          let val = e.target.value;
                          if (val.includes('/project/')) {
                            val = val.split('/project/')[1]?.split('/')[0]?.split('?')[0] || val;
                          } else if (val.includes('/projects/')) {
                            val = val.split('/projects/')[1]?.split('/')[0]?.split('?')[0] || val;
                          } else if (val.includes('.api.sanity.io')) {
                            val = val.replace(/^https?:\/\//, '').split('.api.sanity.io')[0] || val;
                          }
                          setSanityConfig(c => ({ ...c, projectId: val.trim() }));
                        }}
                        placeholder="8vs8axo9"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF7F50] transition font-mono bg-gray-50/70 text-[#1E2B3A] font-bold"
                      />
                    </div>

                    {/* 토큰 영구 저장 카드 */}
                    {savedToken && !isEditingToken ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2.5 text-emerald-950">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                            <span className="font-extrabold text-xs text-emerald-900">클라우드 토큰(Token) 고정 완료</span>
                          </div>
                          <span className="text-[10px] bg-emerald-200/80 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            PC · 모바일 · 전 주소 통일 고정
                          </span>
                        </div>
                        <p className="text-[11.5px] text-emerald-800 leading-relaxed">
                          토큰이 클라우드에 안전하게 고정되었습니다. 이제 <strong>스마트폰이든, 다른 PC든, 어떤 도메인 주소에서 접속하든 토큰을 고칠 필요가 전혀 없으며</strong>, 관리자 비밀번호만 치면 어디서나 자유롭게 수정 및 저장할 수 있습니다.
                        </p>
                        <div className="pt-1.5 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setTokenInput(savedToken);
                              setIsEditingToken(true);
                            }}
                            className="bg-white border border-emerald-300 hover:bg-emerald-100/50 text-emerald-800 font-medium text-xs px-3 py-2 rounded-xl transition cursor-pointer"
                          >
                            토큰 변경
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("저장된 토큰을 완전히 삭제하시겠습니까?")) {
                                setPermanentToken("");
                                setSavedToken("");
                                setSanityConfig(c => ({ ...c, token: "" }));
                                setIsEditingToken(true);
                              }
                            }}
                            className="text-[11px] text-gray-500 hover:text-red-500 underline ml-1"
                          >
                            토큰 삭제
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-4 space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-[#1E2B3A]">
                              API Token (Sanity Editor 권한 토큰) <span className="text-[#FF7F50]">*</span>
                            </label>
                            <a
                              href={`https://www.sanity.io/manage/project/${cleanSanityConfig(sanityConfig).projectId || "8vs8axo9"}/api#tokens`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] underline text-[#FF7F50] hover:text-[#E8623A] font-bold"
                            >
                              Sanity Token 발급 페이지 ↗
                            </a>
                          </div>
                          <p className="text-[11px] text-[#6B7280] leading-relaxed mb-2">
                            PC에서 딱 <strong>한 번만</strong> 입력하시면 <strong>모바일, 스마트폰, 모든 주소에 자동 통일 고정</strong>되어 다시 입력할 필요가 없습니다.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type={showToken ? "text" : "password"}
                              value={tokenInput}
                              onChange={e => setTokenInput(e.target.value.trim())}
                              placeholder="sk... 로 시작하는 토큰을 붙여넣으세요"
                              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 pr-14 text-xs outline-none focus:border-[#FF7F50] transition font-mono bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => setShowToken(!showToken)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-500 hover:text-[#1E2B3A] px-1.5 py-0.5 bg-gray-100 rounded cursor-pointer"
                            >
                              {showToken ? "숨김" : "보기"}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!tokenInput.trim()) {
                                alert("토큰을 입력해 주세요.");
                                return;
                              }
                              const cleanToken = tokenInput.trim();
                              setPermanentToken(cleanToken);
                              setSavedToken(cleanToken);
                              setSanityConfig(c => ({ ...c, token: cleanToken }));
                              saveLocalSanityConfig({ ...sanityConfig, token: cleanToken });
                              setIsEditingToken(false);
                              setSanityLoading(true);
                              const syncRes = await saveTokenToSanity(cleanToken);
                              setSanityLoading(false);
                              if (syncRes.success) {
                                alert("✓ 토큰이 클라우드 DB에 영구 등록되었습니다!\n\n이제 PC뿐만 아니라 모바일, 스마트폰, 새 도메인 주소 등 모든 기기에서 토큰을 입력할 필요가 없으며, 비밀번호만 입력하면 즉시 수정 및 저장됩니다.");
                              } else {
                                alert("✓ 토큰이 저장되었습니다. (CORS 허용 후 모든 기기에 자동 연동됩니다)");
                              }
                            }}
                            className="bg-[#FF7F50] hover:bg-[#E8623A] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0"
                          >
                            토큰 등록 (전 기기 자동 고정)
                          </button>
                        </div>
                        <div className="bg-white/80 border border-orange-200/60 rounded-xl p-2.5 text-[11px] text-[#8A5030] space-y-0.5">
                          <p className="font-bold text-[#E8623A]">💡 API Token 발급 방법 (1분 완료):</p>
                          <p>1. Sanity 대시보드 &gt; <strong>API &gt; Tokens</strong>에서 <strong>[+ Add API token]</strong> 클릭</p>
                          <p>2. Permissions에서 반드시 <strong className="text-red-700 underline font-extrabold">[Editor]</strong> 선택 후 Save!</p>
                          <p>3. 생성된 <code>sk...</code> 토큰을 여기에 붙여넣고 [토큰 등록]을 누르면 PC와 모바일 모두 끝!</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {sanityMsg && (
                    <div className={`p-3.5 rounded-2xl text-xs font-medium space-y-2 ${
                      sanityMsg.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : sanityMsg.type === "error"
                          ? "bg-red-50 text-red-800 border border-red-200"
                          : "bg-blue-50 text-blue-800 border border-blue-200"
                    }`}>
                      <div className="font-bold flex items-start gap-1.5">
                        <span className="text-sm shrink-0">{sanityMsg.type === "success" ? "✓" : sanityMsg.type === "error" ? "✕" : "ℹ"}</span>
                        <span className="leading-snug">{sanityMsg.text}</span>
                      </div>

                      {(sanityMsg.errorType === "unauthorized" || sanityMsg.errorType === "insufficient_permissions") && (
                        <div className="bg-white/95 border border-red-200 rounded-xl p-3 space-y-2 text-red-900 mt-2">
                          <p className="font-bold text-xs text-red-700">🚨 해결 방법 (Token 권한 설정):</p>
                          <p className="text-[11px] leading-relaxed">
                            {sanityMsg.errorType === "insufficient_permissions"
                              ? "현재 입력된 토큰이 'Viewer (읽기 전용)' 권한이라 업로드가 거부되었습니다. 'Editor' 권한의 토큰이 필요합니다."
                              : "API Token이 입력되지 않았거나 만료되었습니다. Sanity 대시보드에서 Editor 권한의 Token을 발급받아 붙여넣어 주세요."}
                          </p>
                          {cleanSanityConfig(sanityConfig).projectId && (
                            <div className="pt-1">
                              <a
                                href={`https://www.sanity.io/manage/project/${cleanSanityConfig(sanityConfig).projectId}/api#tokens`}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                              >
                                Sanity API Tokens 페이지 바로가기 ↗
                              </a>
                            </div>
                          )}
                          <div className="text-[11px] text-red-800 space-y-0.5 pt-1">
                            <p>1. 위 링크로 이동 후 <strong>[+ Add API token]</strong> 클릭</p>
                            <p>2. Permissions에서 <strong className="underline font-bold">"Editor"</strong> 선택 후 Save</p>
                            <p>3. 생성된 <code>sk...</code> 토큰을 복사하여 위 입력칸에 붙여넣고 다시 업로드 클릭!</p>
                          </div>
                        </div>
                      )}

                      {sanityMsg.errorType === "cors" && (
                        <div className="bg-white/95 border border-red-200 rounded-xl p-3 space-y-2 text-red-900 mt-2">
                          <p className="font-bold text-xs text-red-700">🚨 해결 방법 (CORS 등록 필요):</p>
                          <p className="text-[11px] leading-relaxed">
                            현재 사이트 주소(<strong>{sanityMsg.origin || (typeof window !== "undefined" ? window.location.origin : "")}</strong>)가 Sanity에 등록되어 있지 않아 브라우저에서 차단되었습니다.
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={copyCurrentOrigin}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                            >
                              {copiedOrigin ? "✓ 주소 복사 완료!" : "현재 사이트 주소 복사"}
                            </button>
                            {sanityMsg.manageUrl && (
                              <a
                                href={sanityMsg.manageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-[#1E2B3A] hover:bg-[#2C3E50] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1"
                              >
                                Sanity API 설정 바로가기 ↗
                              </a>
                            )}
                          </div>
                          <p className="text-[10.5px] text-red-700 pt-1">
                            * Sanity 콘솔에서 [+ Add CORS origin] 클릭 후 주소를 붙여넣고 <strong className="underline">"Allow credentials"</strong>에 반드시 체크한 뒤 저장하세요!
                          </p>
                        </div>
                      )}

                      {sanityMsg.errorType === "notFound" && (
                        <div className="bg-white/95 border border-red-200 rounded-xl p-3 space-y-1.5 text-red-900 mt-2">
                          <p className="font-bold text-xs text-red-700">💡 Project ID 확인 가이드:</p>
                          <p className="text-[11px]">
                            Sanity 대시보드(sanity.io/manage) 첫 화면에서 프로젝트를 선택했을 때 상단에 표시되는 8~10자리 영숫자 ID(예: x9q8w2y1)를 입력해야 합니다.
                          </p>
                          <a
                            href="https://www.sanity.io/manage"
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#FF7F50] hover:underline font-bold inline-block"
                          >
                            Sanity 프로젝트 관리 페이지 열기 ↗
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={handleTestSanity}
                      disabled={sanityLoading}
                      className="bg-[#1E2B3A] hover:bg-[#2C3E50] text-white font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {sanityLoading && (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      <span>{sanityLoading ? "연결 상태 정밀 진단 중..." : "✓ 설정 저장 및 연결 테스트"}</span>
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handlePushToSanity}
                        disabled={sanityLoading}
                        className="bg-[#FF7F50] hover:bg-[#E8623A] text-white font-bold text-xs py-2.5 px-3 rounded-xl transition cursor-pointer disabled:opacity-50 text-center"
                      >
                        🚀 현재 데이터를 Sanity로 업로드
                      </button>
                      <button
                        onClick={handlePullFromSanity}
                        disabled={sanityLoading}
                        className="border border-gray-200 hover:bg-gray-50 text-[#1E2B3A] font-bold text-xs py-2.5 px-3 rounded-xl transition cursor-pointer disabled:opacity-50 text-center"
                      >
                        📥 Sanity에서 최신 데이터 가져오기
                      </button>
                    </div>

                    {/* 카카오톡 및 모바일 기기 즉시 동기화 링크 복사 */}
                    {cleanSanityConfig(sanityConfig).projectId && (
                      <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-2xl p-3.5 space-y-2 text-[#166534] mt-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs flex items-center gap-1.5">
                            <span>📱</span> 카카오톡 / 스마트폰에서 수정 데이터 바로 뜨게 하기
                          </span>
                          <span className="text-[10px] bg-[#DCFCE7] text-[#15803D] font-bold px-2 py-0.5 rounded-full">
                            즉시 해결
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-[#14532D]">
                          스마트폰은 새 기기이므로 Sanity 연결 정보가 아직 없습니다. 아래 <strong>[동기화 링크 복사]</strong>를 눌러 카톡으로 보내서 열면, 스마트폰에서도 Sanity가 자동 연결되어 방금 수정한 글과 비밀번호가 바로 반영됩니다!
                        </p>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const pid = cleanSanityConfig(sanityConfig).projectId;
                              const shareUrl = `${window.location.origin}${window.location.pathname}?sanity=${pid}`;
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(shareUrl);
                                alert("✓ 카카오톡 공유용 동기화 링크가 복사되었습니다!\n스마트폰 카톡으로 보내서 열면 최신 데이터가 바로 반영됩니다:\n\n" + shareUrl);
                              }
                            }}
                            className="bg-[#15803D] hover:bg-[#166534] text-white font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                          >
                            <span>📋</span> 스마트폰/카카오톡 공유 링크 복사 (?sanity={cleanSanityConfig(sanityConfig).projectId})
                          </button>
                        </div>
                        <p className="text-[10.5px] text-[#15803D]/80">
                          * 모든 방문자에게 영구 적용하려면 Vercel 대시보드 &gt; Environment Variables에 <code>VITE_SANITY_PROJECT_ID = {cleanSanityConfig(sanityConfig).projectId}</code>를 등록하세요.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeSection === "password" ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1E2B3A] tracking-tight">관리자 비밀번호 설정</h3>
                    <p className="text-xs text-[#6B7280] mt-1">
                      관리자 모드 접속 시 사용할 새로운 비밀번호를 설정할 수 있습니다.
                    </p>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-3 bg-gray-50 border border-gray-200 rounded-2xl p-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#4A5A6A] mb-1">
                        현재 비밀번호
                      </label>
                      <input
                        type="password"
                        placeholder="현재 사용 중인 비밀번호를 입력하세요"
                        value={pwForm.current}
                        onChange={e => setPwForm(prev => ({ ...prev, current: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white outline-none focus:border-[#FF7F50] transition"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#4A5A6A] mb-1">
                        새 비밀번호 (4자리 이상)
                      </label>
                      <input
                        type="password"
                        placeholder="새 비밀번호 입력"
                        value={pwForm.newPw}
                        onChange={e => setPwForm(prev => ({ ...prev, newPw: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white outline-none focus:border-[#FF7F50] transition"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#4A5A6A] mb-1">
                        새 비밀번호 확인
                      </label>
                      <input
                        type="password"
                        placeholder="새 비밀번호 다시 입력"
                        value={pwForm.confirmPw}
                        onChange={e => setPwForm(prev => ({ ...prev, confirmPw: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white outline-none focus:border-[#FF7F50] transition"
                        required
                      />
                    </div>

                    {pwMsg && (
                      <div className={`p-3 rounded-xl text-xs font-semibold ${
                        pwMsg.type === "success"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}>
                        {pwMsg.text}
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between gap-3 border-t border-gray-200">
                      <button
                        type="submit"
                        className="bg-[#FF7F50] hover:bg-[#E8623A] text-white font-bold text-xs py-2.5 px-5 rounded-xl transition cursor-pointer shadow-sm"
                      >
                        비밀번호 변경하기
                      </button>
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        className="text-[11px] text-gray-500 hover:text-red-500 underline transition cursor-pointer"
                      >
                        기본값(hanwoori2024)으로 초기화
                      </button>
                    </div>
                  </form>
                  <p className="text-[11px] text-[#8A9AB0] leading-relaxed">
                    * 변경된 비밀번호는 브라우저 보안 저장소에 안전하게 보관됩니다.
                  </p>
                </div>
              ) : currentSection ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[#1E2B3A] tracking-tight">{currentSection.label}</h3>
                    <span className="text-[11px] text-gray-400">수정 후 아래 '저장하기'를 클릭하세요</span>
                  </div>
                  {currentSection.fields.map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">{f.label}</label>
                      {f.type === "textarea" ? (
                        <textarea
                          rows={4}
                          value={localValues[`${currentSection.id}.${f.key}`] ?? ""}
                          onChange={e => setLocalValues(v => ({ ...v, [`${currentSection.id}.${f.key}`]: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF7F50] transition resize-none leading-relaxed"
                        />
                      ) : (
                        <input
                          type="text"
                          value={localValues[`${currentSection.id}.${f.key}`] ?? ""}
                          onChange={e => setLocalValues(v => ({ ...v, [`${currentSection.id}.${f.key}`]: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF7F50] transition"
                        />
                      )}
                    </div>
                  ))}
                </>
              ) : null}

              {/* 저장 버튼 (QnA, 수업소식, Sanity 설정, 비밀번호 제외 탭) */}
              {activeSection !== "qna" && activeSection !== "reviews" && activeSection !== "sanity" && activeSection !== "password" && (
                <div className="mt-2 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <button onClick={handleSave}
                      className="bg-[#FF7F50] hover:bg-[#E8623A] text-white font-bold text-sm px-7 py-3 rounded-xl transition cursor-pointer shadow-md shadow-orange-100">
                      저장하기
                    </button>
                    {saved && (
                      <span className="text-xs text-emerald-600 font-bold animate-pulse">
                        {saveStatusMsg || "✓ 웹사이트에 즉시 반영되었습니다!"}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#888]">
                    * 저장을 누르면 즉시 웹사이트 화면에 반영되고 브라우저 및 연결된 Sanity DB에 저장됩니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   ROOT — 화면 너비에 따라 분기
═══════════════════════════════════════ */
export default function App() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [page, setPage] = useState<"home" | "qna" | "reviews">("home");
  const [adminOpen, setAdminOpen] = useState(false);

  // 로컬 영구 저장소 또는 기본값으로 상태 복원
  const [siteValues, setSiteValues] = useState<Record<string, string>>(() =>
    loadLocalData(LOCAL_STORAGE_SITE_DATA_KEY, DEFAULT_VALUES)
  );
  const [liveQna, setLiveQna] = useState<QnaItem[]>(() =>
    loadLocalData(LOCAL_STORAGE_QNA_KEY, QNA_LIST)
  );
  const [liveReviews, setLiveReviews] = useState<Review[]>(() =>
    loadLocalData(LOCAL_STORAGE_REVIEWS_KEY, REVIEW_SAMPLES)
  );

  const footerClickCount = useRef(0);
  const footerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 화면 리사이즈 감지
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // 앱 마운트 및 화면 복귀 시: Sanity DB에 저장된 최신 데이터 자동 동기화
  useEffect(() => {
    function refreshSync() {
      fetchSanityData().then(remote => {
        if (remote) {
          if (remote.adminPassword) {
            saveStoredAdminPassword(remote.adminPassword);
          }
          if (remote.values && Object.keys(remote.values).length > 0) {
            setSiteValues(prev => {
              const merged = { ...prev, ...remote.values };
              saveLocalData(LOCAL_STORAGE_SITE_DATA_KEY, merged);
              return merged;
            });
          }
          if (remote.qnaList !== undefined) {
            const deletedQnas = getDeletedQnaQuestions();
            const filtered = (remote.qnaList || []).filter((q: any) => !deletedQnas.has((q.q || '').trim()));
            setLiveQna(filtered);
            saveLocalData(LOCAL_STORAGE_QNA_KEY, filtered);
          }
          if (remote.reviews !== undefined) {
            const deletedRevIds = getDeletedReviewIds();
            const filtered = (remote.reviews || []).filter((r: any) => !deletedRevIds.has(Number(r.id)));
            setLiveReviews(filtered);
            saveLocalData(LOCAL_STORAGE_REVIEWS_KEY, filtered);
          }
        }
      }).catch(e => {
        console.log("Sanity 자동 동기화 대기 중", e);
      });
    }

    refreshSync();

    // 모바일 등에서 탭 전환 후 다시 앱으로 돌아왔을 때 최신 DB 즉시 반영
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshSync();
      }
    };
    window.addEventListener("focus", refreshSync);
    document.addEventListener("visibilitychange", handleVisibility);

    // URL에 admin 또는 adminToken이 있으면 관리자 모달 자동 열기
    if (typeof window !== "undefined") {
      const search = window.location.search;
      const hash = window.location.hash;
      if (search.includes("admin=1") || hash.includes("admin") || hash.includes("adminToken")) {
        setAdminOpen(true);
      }
    }

    return () => {
      window.removeEventListener("focus", refreshSync);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  function handleQnaChange(list: QnaItem[]) {
    setLiveQna(list);
    saveLocalData(LOCAL_STORAGE_QNA_KEY, list);
  }

  function handleReviewsChange(list: Review[]) {
    setLiveReviews(list);
    saveLocalData(LOCAL_STORAGE_REVIEWS_KEY, list);
  }

  function handleValuesChange(vals: Record<string, string>) {
    setSiteValues(vals);
    saveLocalData(LOCAL_STORAGE_SITE_DATA_KEY, vals);
  }

  function handleFooterClick() {
    footerClickCount.current += 1;
    if (footerTimer.current) clearTimeout(footerTimer.current);
    footerTimer.current = setTimeout(() => { footerClickCount.current = 0; }, 1500);
    if (footerClickCount.current >= 3) {
      footerClickCount.current = 0;
      setAdminOpen(true);
    }
  }

  return (
    <>
      {adminOpen && (
        <AdminModal
          onClose={() => setAdminOpen(false)}
          qnaList={liveQna}
          onQnaChange={handleQnaChange}
          reviews={liveReviews}
          onReviewsChange={handleReviewsChange}
          values={siteValues}
          onValuesChange={handleValuesChange}
        />
      )}
      <div onClick={e => {
        const footer = (e.target as HTMLElement).closest("footer");
        if (footer) handleFooterClick();
      }}>
        {page === "qna"
          ? <QnaPage onBack={() => { setPage("home"); window.scrollTo(0, 0); }} items={liveQna} />
          : page === "reviews"
            ? <ReviewPage onBack={() => { setPage("home"); window.scrollTo(0, 0); }} reviews={liveReviews} />
            : isMobile
              ? <MobileLayout
                  onQna={() => setPage("qna")}
                  onReview={() => setPage("reviews")}
                  values={siteValues}
                  onOpenAdmin={() => setAdminOpen(true)}
                />
              : <PCLayout
                  onQna={() => setPage("qna")}
                  onReview={() => setPage("reviews")}
                  values={siteValues}
                  onOpenAdmin={() => setAdminOpen(true)}
                />
        }
      </div>
    </>
  );
}
