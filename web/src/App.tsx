import { useState, useEffect, useRef } from "react";
import {
  getSanityConfig,
  saveLocalSanityConfig,
  testSanityConnection,
  fetchSanityData,
  pushDataToSanity,
  loadLocalData,
  saveLocalData,
  LOCAL_STORAGE_SITE_DATA_KEY,
  LOCAL_STORAGE_QNA_KEY,
  LOCAL_STORAGE_REVIEWS_KEY,
  type SanityConfig,
} from "./lib/sanity";

const DEFAULT_VALUES: Record<string, string> = {
  "header.title": "한우리 독서토론논술",
  "header.subtitle": "파주운정 산내푸르지오 독서교실",
  "intro.quote": "아이의 생각이 깊어지고, 읽는 기쁨이 자라나는 따뜻한 공간",
  "intro.sub": "스스로 생각의 씨앗을 틔울 수 있도록 돕습니다.",
  "about.slogan": "생각하는 힘이 아이의 미래를 바꿉니다",
  "about.name": "원장 이해옥",
  "about.career": "독서토론논술 교습소 운영 (10년 경력)\n해법·한우리 독서토론교습소 운영\n독서지도사 자격 보유",
  "about.desc": "단순히 책을 읽고 글을 쓰는 것을 넘어, 아이들이 스스로 생각하고 질문하는 힘을 길러주는 것을 교육 철학으로 삼고 있습니다.",
  "curriculum.elem_title": "저학년 / 고학년",
  "curriculum.elem_body": "그림책과 문학 작품을 통한 흥미 위주의 독서. 주 1회 주제별 글쓰기 및 자유 토론 진행.",
  "curriculum.mid_title": "내신 및 심화 논술",
  "curriculum.mid_body": "비문학 읽기 및 신문 칼럼 분석. 서술형 평가 대비 및 중등 내신 연계형 심화 논술 작성.",
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
type Review = { id: number; title: string; date: string; body: string };
let _reviewId = 100;
function newReview(): Review {
  return { id: ++_reviewId, title: "", date: new Date().toISOString().slice(0, 10), body: "" };
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

function MapLoader() {
  useEffect(() => {
    const containerId = "daumRoughmapContainer1788803690193";
    let isMounted = true;

    function renderMap() {
      if (!isMounted) return;
      const el = document.getElementById(containerId);
      if (!el) return;
      // 이미 지도가 렌더링되어 있다면 중복 렌더링 방지
      if (el.querySelector(".roughmap_maker_label") || el.children.length > 0) return;

      if ((window as any).daum?.roughmap?.Lander) {
        try {
          new (window as any).daum.roughmap.Lander({
            timestamp: "1788803690193",
            key: "2ihvyw7i9ytd",
            mapWidth: "100%",
            mapHeight: "350",
          }).render();
        } catch (err) {
          console.warn("Kakao map render error:", err);
        }
      }
    }

    if ((window as any).daum?.roughmap?.Lander) {
      renderMap();
      return;
    }

    const scriptId = "daum-roughmap-loader-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.charset = "UTF-8";
      script.src = "https://ssl.daumcdn.net/dmaps/map_js_init/roughmapLoader.js";
      script.onload = () => {
        if (isMounted) renderMap();
      };
      document.head.appendChild(script);
    } else {
      const timer = setInterval(() => {
        if ((window as any).daum?.roughmap?.Lander) {
          clearInterval(timer);
          if (isMounted) renderMap();
        }
      }, 150);
      return () => {
        isMounted = false;
        clearInterval(timer);
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}

/* ═══════════════════════════════════════
   MOBILE LAYOUT
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
  const careerItems = (values["about.career"] || "독서토론논술 교습소 운영 (10년 경력)\n해법·한우리 독서토론교습소 운영\n독서지도사 자격 보유")
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean);

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", wordBreak: "keep-all" }}
      className="min-h-screen bg-white text-[#1E2B3A]">

      {/* 헤더 */}
      <header className="bg-[#FF7F50] text-white px-5 pt-8 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-medium tracking-widest uppercase text-orange-100 mb-1">
              Hanwoori Reading & Discussion
            </p>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight">
              {values["header.title"] || "한우리 독서토론논술"}
            </h1>
            <p className="text-sm mt-1 text-orange-100">{values["header.subtitle"] || "파주운정 산내푸르지오 독서교실"}</p>
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="mt-1 shrink-0 p-2 rounded-lg bg-white/20 active:bg-white/40"
            aria-label="메뉴"
          >
            {menuOpen ? (
              <span className="block text-white text-lg leading-none">✕</span>
            ) : (
              <div className="space-y-1">
                <span className="block w-5 h-0.5 bg-white" />
                <span className="block w-5 h-0.5 bg-white" />
                <span className="block w-5 h-0.5 bg-white" />
              </div>
            )}
          </button>
        </div>

        {menuOpen && (
          <nav className="mt-4 grid grid-cols-2 gap-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.href}
                onClick={() => { scrollTo(item.href); setMenuOpen(false); }}
                className="py-2.5 px-3 rounded-xl text-sm font-semibold bg-white/20 active:bg-white/40 text-left"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => { onQna(); setMenuOpen(false); }}
              className="py-2.5 px-3 rounded-xl text-sm font-semibold bg-white/35 active:bg-white/50 text-left"
            >
              📋 자주 묻는 질문
            </button>
            <button
              onClick={() => { onReview(); setMenuOpen(false); }}
              className="py-2.5 px-3 rounded-xl text-sm font-semibold bg-white/35 active:bg-white/50 text-left"
            >
              📖 수업 소식
            </button>
          </nav>
        )}
      </header>

      {/* 인트로 띠 */}
      <div className="bg-[#FFF0EA] px-5 py-5 border-b border-orange-100">
        <p className="text-base font-semibold text-[#E8623A] leading-relaxed">
          "{values["intro.quote"] || "아이의 생각이 깊어지고, 읽는 기쁨이 자라나는 따뜻한 공간"}"
        </p>
        <p className="mt-1.5 text-xs text-[#6B7280] leading-relaxed">
          {values["intro.sub"] || "스스로 생각의 씨앗을 틔울 수 있도록 돕습니다."}
        </p>
      </div>

      {/* 교습소 소개 */}
      <section id="about" className="px-5 py-10">
        <MobileSectionTitle>교습소 및 원장 소개</MobileSectionTitle>

        <div className="mt-5 rounded-2xl overflow-hidden shadow-sm bg-[#FFF0EA] aspect-[3/2]">
          <img
            src="/src/imports/introduce.jpg"
            alt="원장 소개"
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 border-l-4 border-l-[#FF7F50] hover:-translate-y-1 transition-all duration-300 hover:shadow-md">
          <p className="text-[10px] font-bold tracking-widest text-[#FF7F50] uppercase mb-2">원장 소개</p>
          <p className="text-base font-bold text-[#1E2B3A] leading-snug mb-3 whitespace-pre-line">
            "{values["about.slogan"] || "생각하는 힘이 아이의 미래를 바꿉니다"}"
          </p>
          <p className="font-semibold text-sm text-[#1E2B3A] mb-3">{values["about.name"] || "원장 이해옥"}</p>
          <ul className="space-y-2">
            {careerItems.map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm text-[#6B7280]">
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#FF7F50] mt-1.5" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 bg-[#FDFBF7] border border-[#E6DED0] rounded-2xl p-5">
          <p className="text-sm text-[#6B7280] leading-relaxed mb-3 whitespace-pre-line">
            {values["about.desc"] || "단순히 책을 읽고 글을 쓰는 것을 넘어, 아이들이 스스로 생각하고 질문하는 힘을 길러주는 것을 교육 철학으로 삼고 있습니다."}
          </p>
          <p className="text-sm font-bold text-[#E8623A] leading-relaxed">
            평생 자산이 될{" "}
            <span className="underline decoration-2 decoration-[#FF7F50]/50">문해력</span>과{" "}
            <span className="underline decoration-2 decoration-[#FF7F50]/50">사고력</span>을<br />
            한우리 산내푸르지오 센터가 선물하겠습니다.
          </p>
        </div>
      </section>

      <MobileDivider />

      {/* 커리큘럼 */}
      <section id="curriculum" className="px-5 py-10">
        <MobileSectionTitle>커리큘럼 및 수업 방식</MobileSectionTitle>
        <div className="mt-5 space-y-4">
          <MobileCard
            badge="초등부"
            title={values["curriculum.elem_title"] || "저학년 / 고학년"}
            body={values["curriculum.elem_body"] || "그림책과 문학 작품을 통한 흥미 위주의 독서. 주 1회 주제별 글쓰기 및 자유 토론 진행."}
            detail="소수 정예 최대 6명 그룹 수업"
          />
          <MobileCard
            badge="중등부"
            title={values["curriculum.mid_title"] || "내신 및 심화 논술"}
            body={values["curriculum.mid_body"] || "비문학 읽기 및 신문 칼럼 분석. 서술형 평가 대비 및 중등 내신 연계형 심화 논술 작성."}
            detail="내신 성적 향상 집중 지도"
          />
        </div>
        <p className="mt-5 text-center text-xs text-[#6B7280]">
          상세한 설명은 <button onClick={onQna} className="text-[#E8623A] underline underline-offset-2 bg-transparent border-none cursor-pointer">자주 묻는 질문</button>을 참고 부탁드립니다.
        </p>
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl overflow-hidden shadow-sm bg-gray-100 aspect-[4/3]">
            <img src="/src/imports/curriculum2.jpg" alt="수업 모습 1" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-sm bg-gray-100 aspect-[4/3]">
            <img src="/src/imports/curriculum1.jpg" alt="수업 모습 2" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
        </div>
      </section>

      <MobileDivider />

      {/* 시설 안내 */}
      <section id="facility" className="px-5 py-10">
        <MobileSectionTitle>시설 안내</MobileSectionTitle>
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl overflow-hidden shadow-sm bg-gray-100 aspect-[4/3]">
            <img src="/src/imports/classroom3.jpg" alt="교실 내부 모습" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-sm bg-gray-100 aspect-[4/3]">
            <img src="/src/imports/classroom2.jpg" alt="학원 내부 모습" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
        </div>
        <p className="mt-3 text-xs text-center text-[#6B7280]">쾌적하고 집중하기 좋은 환경에서 소수 정예로 수업합니다.</p>
      </section>

      <MobileDivider />

      {/* 운영 안내 */}
      <section id="info" className="px-5 py-10">
        <MobileSectionTitle>운영 안내 및 오시는 길</MobileSectionTitle>
        <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-[#FF7F50] p-5">
          <ul className="space-y-4">
            <MobileInfoItem icon="🕐" label="운영 시간" value={values["info.hours"] || "평일 14:00 ~ 20:00 (주말·공휴일 휴무)"} />
            <MobileInfoItem icon="📍" label="주소" value={values["info.address"] || "경기 파주시 심학산로 385 운정신도시센트럴푸르지오 상가 2동 204호"} />
            <MobileInfoItem icon="🚗" label="주차" value={values["info.parking"] || "건물 뒷편 주차장 이용 가능"} />
          </ul>
        </div>
        <div className="mt-4 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div id="daumRoughmapContainer1788803690193" className="root_daum_roughmap root_daum_roughmap_landing w-full" />
          <MapLoader />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a
            href={`https://map.kakao.com/link/search/${encodeURIComponent(values["info.address"] || "경기 파주시 심학산로 385 운정신도시센트럴푸르지오")}`}
            target="_blank"
            rel="noreferrer"
            className="py-2.5 px-3 bg-amber-50 active:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
          >
            <span>🗺️ 카카오맵 크게보기</span>
          </a>
          <a
            href={`https://map.kakao.com/link/to/한우리독서토론논술 산내푸르지오,37.72895,126.73285`}
            target="_blank"
            rel="noreferrer"
            className="py-2.5 px-3 bg-[#1E2B3A] active:bg-[#2C3E50] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
          >
            <span>🚗 길찾기 바로가기</span>
          </a>
        </div>
      </section>

      <MobileDivider />

      {/* 자주 묻는 질문 + 수업 소식 */}
      <section className="px-5 py-10 text-center">
        <MobileSectionTitle>자주 묻는 질문</MobileSectionTitle>
        <p className="mt-3 text-sm text-[#6B7280]">교습소에 대해 궁금하신 점들을 모아두었습니다.</p>
        <button onClick={onQna}
          className="mt-5 w-full flex items-center justify-center gap-2 bg-white border-2 border-[#FF7F50] text-[#E8623A] font-bold text-base px-8 py-4 rounded-2xl">
          📋 자주 묻는 질문 보기 →
        </button>
        <button onClick={onReview}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-[#FF7F50] text-white font-bold text-base px-8 py-4 rounded-2xl">
          📖 수업 소식 보기 →
        </button>
      </section>

      <MobileDivider />

      {/* 상담 문의 */}
      <section id="contact" className="px-5 py-10 text-center">
        <MobileSectionTitle>상담 문의</MobileSectionTitle>
        <p className="mt-3 text-sm text-[#6B7280] leading-relaxed whitespace-pre-line">
          {values["contact.desc"] || "우리 아이에게 딱 맞는 독서 논술 교육,\n지금 바로 상담받아보세요!"}
        </p>
        <a
          href={values["contact.kakao"] || "http://pf.kakao.com/_xxxxxx"}
          target="_blank"
          rel="noreferrer"
          className="mt-6 flex items-center justify-center gap-2 bg-[#FF7F50] active:bg-[#E8623A] text-white font-bold text-base px-8 py-4 rounded-2xl shadow-lg shadow-orange-200"
        >
          💬 카카오톡 1:1 상담하기
        </a>
        <p className="mt-3 text-xs text-[#6B7280]">평일 14:00~20:00 운영 · 빠른 답변 드립니다</p>
      </section>

      <footer className="bg-[#1E2B3A] text-[#8A9AB0] text-xs text-center py-6 px-5 leading-relaxed">
        <p>© 2026 {values["header.title"] || "한우리 독서토론논술"} {values["header.subtitle"] || "파주운정 산내푸르지오독서교실"}</p>
        <p className="mt-1 text-[#4A5A6A]">{values["info.address"] || "경기 파주시 심학산로 385 운정신도시센트럴푸르지오 상가 2동 204호"}</p>
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center">
          <button
            onClick={onOpenAdmin}
            className="text-[11px] text-gray-400 hover:text-orange-300 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition"
          >
            <span>⚙️</span>
            <span>관리자 모드</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

function MobileSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-extrabold text-[#1E2B3A] tracking-tight">{children}</h2>
      <div className="mt-2 w-8 h-1 rounded-full bg-[#FF7F50]" />
    </div>
  );
}

function MobileDivider() {
  return <div className="mx-5 border-t border-gray-100" />;
}

function MobileCard({ badge, title, body, detail }: { badge: string; title: string; body: string; detail: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 border-l-4 border-l-[#FF7F50] hover:-translate-y-1 transition-all duration-300 hover:shadow-md">
      <span className="inline-block text-[10px] font-bold tracking-widest text-[#FF7F50] uppercase bg-[#FFF0EA] px-2.5 py-1 rounded-full mb-3">
        {badge}
      </span>
      <h3 className="text-base font-bold text-[#1E2B3A] mb-2">{title}</h3>
      <p className="text-sm text-[#6B7280] leading-relaxed mb-3">{body}</p>
      <p className="text-xs font-semibold text-[#E8623A]">✦ {detail}</p>
    </div>
  );
}

function MobileInfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="text-lg shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] font-bold text-[#FF7F50] uppercase tracking-wide">{label}</p>
        <p className="text-sm text-[#1E2B3A] mt-0.5 leading-relaxed">{value}</p>
      </div>
    </li>
  );
}

/* ═══════════════════════════════════════
   PC LAYOUT
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

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", wordBreak: "keep-all" }}
      className="min-h-screen bg-white text-[#1E2B3A]">

      {/* 헤더 */}
      <header className="bg-[#FF7F50] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, #fff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fff 0%, transparent 40%)",
        }} />
        <div className="relative max-w-5xl mx-auto px-10 py-10">
          <div className="flex items-end justify-between mb-7">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-orange-100 mb-1">
                Hanwoori Reading & Discussion
              </p>
              <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
                {values["header.title"] || "한우리 독서토론논술"}
              </h1>
              <p className="text-xl mt-1 text-orange-100">{values["header.subtitle"] || "파주운정 산내푸르지오 독서교실"}</p>
            </div>
          </div>
          <nav className="flex gap-2 flex-wrap">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollTo(item.href)}
                className="px-5 py-2 rounded-full text-sm font-semibold bg-white/15 hover:bg-white/30 transition"
              >
                {item.label}
              </button>
            ))}
            <button onClick={onQna} className="px-5 py-2 rounded-full text-sm font-semibold bg-white/35 hover:bg-white/50 transition">
              📋 자주 묻는 질문
            </button>
            <button onClick={onReview} className="px-5 py-2 rounded-full text-sm font-semibold bg-white/35 hover:bg-white/50 transition">
              📖 수업 소식
            </button>
          </nav>
        </div>
      </header>

      {/* 인트로 띠 */}
      <div className="bg-[#FFF0EA] border-b border-orange-100">
        <div className="max-w-5xl mx-auto px-10 py-8 text-center">
          <p className="text-2xl font-semibold text-[#E8623A] leading-relaxed">
            "{values["intro.quote"] || "아이의 생각이 깊어지고, 읽는 기쁨이 자라나는 따뜻한 공간"}"
          </p>
          <p className="mt-2 text-sm text-[#6B7280]">
            {values["intro.sub"] || "단순히 지식을 채우기보다 스스로 생각의 씨앗을 틔울 수 있도록 돕습니다."}
          </p>
        </div>
      </div>

      {/* 교습소 소개 */}
      <section id="about" className="max-w-5xl mx-auto px-10 py-20">
        <PCSectionTitle>교습소 및 원장 소개</PCSectionTitle>
        <div className="grid grid-cols-2 gap-8 mt-10 items-stretch">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 border-l-4 border-l-[#FF7F50] hover:-translate-y-1 transition-all duration-300 hover:shadow-md">
            <p className="text-xs font-bold tracking-widest text-[#FF7F50] uppercase mb-3">원장 소개</p>
            <h3 className="text-xl font-bold text-[#1E2B3A] mb-4 leading-snug whitespace-pre-line">
              "{values["about.slogan"] || "생각하는 힘이 아이의 미래를 바꿉니다"}"
            </h3>
            <p className="font-semibold text-[#1E2B3A] mb-3">{values["about.name"] || "원장 이해옥"}</p>
            <ul className="space-y-2">
              {careerItems.map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-[#6B7280]">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#FF7F50] mt-1.5" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-sm bg-[#FFF0EA] self-stretch">
            <img
              src="/src/imports/introduce.jpg"
              alt="원장 소개"
              className="w-full h-full object-cover object-center block hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
        <div className="mt-8 bg-[#FDFBF7] border border-[#E6DED0] rounded-2xl p-8 text-center">
          <p className="text-sm text-[#6B7280] leading-relaxed mb-4 whitespace-pre-line">
            {values["about.desc"] || "단순히 책을 읽고 글을 쓰는 것을 넘어, 아이들이 스스로 생각하고 질문하는 힘을 길러주는 것을 교육 철학으로 삼고 있습니다.\n책 속에서 길을 찾고, 친구들과 생각을 나누며, 자신의 마음을 글로 당당하게 표현하는 힘을 기릅니다."}
          </p>
          <p className="text-lg font-bold text-[#E8623A]">
            평생 자산이 될{" "}
            <span className="underline decoration-2 decoration-[#FF7F50]/50">문해력</span>과{" "}
            <span className="underline decoration-2 decoration-[#FF7F50]/50">사고력</span>을<br />
            한우리 산내푸르지오 센터가 선물하겠습니다.
          </p>
        </div>
      </section>

      <PCDivider />

      {/* 커리큘럼 */}
      <section id="curriculum" className="max-w-5xl mx-auto px-10 py-20">
        <PCSectionTitle>커리큘럼 및 수업 방식</PCSectionTitle>
        <div className="grid grid-cols-2 gap-6 mt-10">
          <PCCard
            badge="초등부"
            title={values["curriculum.elem_title"] || "저학년 / 고학년"}
            body={values["curriculum.elem_body"] || "그림책과 문학 작품을 통한 흥미 위주의 독서. 주 1회 주제별 글쓰기 및 자유 토론 진행."}
            detail="소수 정예 4명 그룹 수업"
          />
          <PCCard
            badge="중등부"
            title={values["curriculum.mid_title"] || "내신 및 심화 논술"}
            body={values["curriculum.mid_body"] || "비문학 읽기 및 신문 칼럼 분석. 서술형 평가 대비 및 중등 내신 연계형 심화 논술 작성."}
            detail="내신 성적 향상 집중 지도"
          />
        </div>
        <p className="mt-6 text-center text-xs text-[#6B7280]">
          상세한 설명은 <button onClick={onQna} className="text-[#E8623A] underline underline-offset-2 bg-transparent border-none cursor-pointer">자주 묻는 질문</button>을 참고 부탁드립니다.
        </p>
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div className="rounded-2xl overflow-hidden shadow-sm bg-gray-100 aspect-[4/3]">
            <img src="/src/imports/curriculum2.jpg" alt="수업 모습 1" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-sm bg-gray-100 aspect-[4/3]">
            <img src="/src/imports/curriculum1.jpg" alt="수업 모습 2" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
        </div>
      </section>

      <PCDivider />

      {/* 시설 안내 */}
      <section id="facility" className="max-w-5xl mx-auto px-10 py-20">
        <PCSectionTitle>시설 안내</PCSectionTitle>
        <div className="grid grid-cols-2 gap-6 mt-10">
          <div className="rounded-2xl overflow-hidden shadow-sm bg-gray-100 aspect-[4/3]">
            <img src="/src/imports/classroom3.jpg" alt="교실 내부 모습" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-sm bg-gray-100 aspect-[4/3]">
            <img src="/src/imports/classroom2.jpg" alt="학원 내부 모습" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
        </div>
        <p className="text-center text-sm text-[#6B7280] mt-4">쾌적하고 집중하기 좋은 환경에서 소수 정예로 수업합니다.</p>
      </section>

      <PCDivider />

      {/* 운영 안내 */}
      <section id="info" className="max-w-5xl mx-auto px-10 py-20">
        <PCSectionTitle>운영 안내 및 오시는 길</PCSectionTitle>
        <div className="mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-[#FF7F50] p-8">
          <ul className="space-y-4">
            <PCInfoItem icon="🕐" label="운영 시간" value={values["info.hours"] || "평일 14:00 ~ 20:00 (주말 및 공휴일 휴무)"} />
            <PCInfoItem icon="📍" label="주소" value={values["info.address"] || "경기 파주시 심학산로 385 운정신도시센트럴푸르지오 상가 2동 204호"} />
            <PCInfoItem icon="🚗" label="주차 정보" value={values["info.parking"] || "건물 뒷편 주차장 이용 가능"} />
          </ul>
        </div>
        <div className="mt-6 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div id="daumRoughmapContainer1788803690193" className="root_daum_roughmap root_daum_roughmap_landing w-full" />
          <MapLoader />
        </div>
        <div className="mt-4 flex items-center justify-end gap-3">
          <a
            href={`https://map.kakao.com/link/search/${encodeURIComponent(values["info.address"] || "경기 파주시 심학산로 385 운정신도시센트럴푸르지오")}`}
            target="_blank"
            rel="noreferrer"
            className="py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
          >
            <span>🗺️ 카카오맵 크게보기</span>
          </a>
          <a
            href={`https://map.kakao.com/link/to/한우리독서토론논술 산내푸르지오,37.72895,126.73285`}
            target="_blank"
            rel="noreferrer"
            className="py-2.5 px-4 bg-[#1E2B3A] hover:bg-[#2C3E50] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
          >
            <span>🚗 길찾기 바로가기</span>
          </a>
        </div>
      </section>

      <PCDivider />

      {/* 자주 묻는 질문 + 수업 소식 */}
      <section className="max-w-5xl mx-auto px-10 py-20 text-center">
        <PCSectionTitle>자주 묻는 질문 &amp; 수업 소식</PCSectionTitle>
        <p className="mt-4 text-[#6B7280]">궁금하신 점과 수강생 학부모님들의 생생한 이야기를 확인해보세요.</p>
        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          <button onClick={onQna}
            className="inline-flex items-center gap-3 bg-white border-2 border-[#FF7F50] text-[#E8623A] hover:bg-[#FFF0EA] font-bold text-lg px-10 py-5 rounded-full transition-all hover:-translate-y-1">
            📋 자주 묻는 질문 →
          </button>
          <button onClick={onReview}
            className="inline-flex items-center gap-3 bg-[#FF7F50] hover:bg-[#E8623A] text-white font-bold text-lg px-10 py-5 rounded-full transition-all hover:-translate-y-1 shadow-md">
            📖 수업 소식 →
          </button>
        </div>
      </section>

      <PCDivider />

      {/* 상담 문의 */}
      <section id="contact" className="max-w-5xl mx-auto px-10 py-20 text-center">
        <PCSectionTitle>상담 문의</PCSectionTitle>
        <p className="mt-4 text-[#6B7280] whitespace-pre-line">
          {values["contact.desc"] || "우리 아이에게 딱 맞는 독서 논술 교육, 지금 바로 상담받아보세요!"}
        </p>
        <div className="mt-10">
          <a
            href={values["contact.kakao"] || "http://pf.kakao.com/_xxxxxx"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 bg-[#FF7F50] hover:bg-[#E8623A] text-white font-bold text-lg px-12 py-5 rounded-full shadow-lg shadow-orange-200 transition-all hover:-translate-y-1"
          >
            💬 카카오톡 1:1 상담하기
          </a>
          <p className="mt-4 text-sm text-[#6B7280]">평일 14:00~20:00 운영 · 빠른 답변 드립니다</p>
        </div>
      </section>

      <footer className="bg-[#1E2B3A] text-[#8A9AB0] text-sm text-center py-8 px-10">
        <p>© 2026 {values["header.title"] || "한우리 독서토론논술"} {values["header.subtitle"] || "파주운정 산내푸르지오독서교실"}. All rights reserved.</p>
        <p className="mt-1 text-xs text-[#4A5A6A]">{values["info.address"] || "경기 파주시 심학산로 385 운정신도시센트럴푸르지오 상가 2동 204호"}</p>
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center">
          <button
            onClick={onOpenAdmin}
            className="text-xs text-gray-400 hover:text-orange-300 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition"
          >
            <span>⚙️</span>
            <span>관리자 모드</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

function PCSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-extrabold text-[#1E2B3A] tracking-tight">{children}</h2>
      <div className="mx-auto mt-3 w-10 h-1 rounded-full bg-[#FF7F50]" />
    </div>
  );
}

function PCDivider() {
  return <div className="max-w-5xl mx-auto px-10"><div className="border-t border-gray-100" /></div>;
}

function PCCard({ badge, title, body, detail }: { badge: string; title: string; body: string; detail: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 hover:-translate-y-1 transition-all duration-300 hover:shadow-md border-l-4 border-l-[#FF7F50]">
      <span className="inline-block text-xs font-bold tracking-widest text-[#FF7F50] uppercase bg-[#FFF0EA] px-3 py-1 rounded-full mb-4">
        {badge}
      </span>
      <h3 className="text-xl font-bold text-[#1E2B3A] mb-3">{title}</h3>
      <p className="text-sm text-[#6B7280] leading-relaxed mb-4">{body}</p>
      <p className="text-xs font-semibold text-[#E8623A]">✦ {detail}</p>
    </div>
  );
}

function PCInfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <li className="flex items-start gap-4">
      <span className="text-xl shrink-0">{icon}</span>
      <div>
        <p className="text-xs font-bold text-[#FF7F50] uppercase tracking-wide">{label}</p>
        <p className="text-sm text-[#1E2B3A] mt-0.5">{value}</p>
      </div>
    </li>
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

  const pageHeader = (onBackBtn: () => void, sub: string) => (
    <header className="bg-[#FF7F50] text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #fff 0%, transparent 50%)" }} />
      <div className="relative max-w-3xl mx-auto px-5 md:px-10 py-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">수업 소식</h1>
          <p className="text-xs md:text-sm text-orange-100 mt-0.5">{sub}</p>
        </div>
        <button onClick={onBackBtn}
          className="shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/35 text-white text-sm font-semibold px-4 py-2 rounded-full transition">
          ← {detailId ? "목록으로" : "홈으로"}
        </button>
      </div>
    </header>
  );

  if (detail) return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", wordBreak: "keep-all" }}
      className="min-h-screen bg-[#f9fafb] text-[#1E2B3A]">
      {pageHeader(() => setDetailId(null), "원장 선생님의 수업 이야기")}
      <main className="max-w-3xl mx-auto px-5 md:px-10 py-8 md:py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <p className="text-xs text-[#FF7F50] font-bold mb-2">📅 {detail.date}</p>
          <h2 className="text-xl font-extrabold text-[#1E2B3A] mb-5 leading-snug">{detail.title}</h2>
          <hr className="border-gray-100 mb-5" />
          <div className="text-sm text-[#374151] leading-loose review-body"
            dangerouslySetInnerHTML={{ __html: detail.body }} />
        </div>
        <button onClick={() => setDetailId(null)}
          className="mt-6 text-sm text-[#6B7280] hover:text-[#FF7F50] transition">← 목록으로 돌아가기</button>
      </main>
      <style>{`.review-body p { margin-bottom: 1em; } .review-body p:last-child { margin-bottom: 0; }`}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", wordBreak: "keep-all" }}
      className="min-h-screen bg-[#f9fafb] text-[#1E2B3A]">
      {pageHeader(onBack, "원장 선생님이 직접 전하는 수업 이야기")}

      <main className="max-w-3xl mx-auto px-5 md:px-10 py-8 md:py-10">
        {/* 검색 + 정렬 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa] text-sm">🔍</span>
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="제목, 내용으로 검색"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#FF7F50] transition bg-white"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            {(["date", "title"] as const).map(s => (
              <button key={s} onClick={() => setSort(s)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition ${sort === s ? "bg-[#FF7F50] border-[#FF7F50] text-white" : "bg-white border-gray-200 text-[#6B7280] hover:border-[#FF7F50] hover:text-[#FF7F50]"}`}>
                {s === "date" ? "📅 최신순" : "🔤 제목순"}
              </button>
            ))}
          </div>
        </div>

        {/* 리뷰 목록 */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[#aaa] text-sm">검색 결과가 없습니다.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(r => (
              <button key={r.id} onClick={() => setDetailId(r.id)}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 px-5 py-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-[#1E2B3A] text-sm md:text-base group-hover:text-[#FF7F50] transition truncate">{r.title}</p>
                    <p className="text-xs text-[#aaa] mt-1">📅 {r.date}</p>
                    <p className="text-xs text-[#6B7280] mt-2 line-clamp-2 leading-relaxed">
                      {r.body.replace(/<[^>]+>/g, "").slice(0, 100)}…
                    </p>
                  </div>
                  <span className="shrink-0 text-[#FF7F50] text-lg mt-1 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-[#aaa] mt-8">총 {filtered.length}개의 소식</p>
      </main>
    </div>
  );
}

function QnaPage({ onBack, items }: { onBack: () => void; items?: QnaItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const list = items ?? QNA_LIST;

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", wordBreak: "keep-all" }}
      className="min-h-screen bg-[#f9fafb] text-[#1E2B3A]">

      {/* 헤더 */}
      <header className="bg-[#FF7F50] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #fff 0%, transparent 50%)" }} />
        <div className="relative max-w-3xl mx-auto px-5 md:px-10 py-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">자주 묻는 질문</h1>
            <p className="text-xs md:text-sm text-orange-100 mt-0.5">한우리 독서토론논술 파주운정 산내푸르지오</p>
          </div>
          <button
            onClick={onBack}
            className="shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/35 text-white text-sm font-semibold px-4 py-2 rounded-full transition"
          >
            ← 홈으로
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 md:px-10 py-8 md:py-12">
        {/* 안내 */}
        <div className="bg-[#FFF0EA] border border-orange-100 rounded-2xl px-5 py-4 mb-8">
          <p className="text-sm font-semibold text-[#E8623A] leading-relaxed">
            교습소에 대해 궁금하신 점을 모았습니다.<br />
            더 궁금한 사항은 카카오톡으로 편하게 문의해 주세요.
          </p>
        </div>

        {/* 아코디언 */}
        <div className="space-y-3">
          {list.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full text-left px-5 py-5 flex items-start gap-3"
              >
                <span className="shrink-0 w-7 h-7 rounded-lg bg-[#FF7F50] text-white text-xs font-extrabold flex items-center justify-center mt-0.5">
                  Q
                </span>
                <span className="flex-1 text-sm md:text-base font-semibold text-[#1E2B3A] leading-snug">
                  {item.q}
                </span>
                <span className={`shrink-0 text-[#6B7280] text-xs mt-1 transition-transform duration-200 ${openIdx === idx ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>
              {openIdx === idx && (
                <div className="px-4 pb-5 pt-1 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-lg bg-[#FFF0EA] text-[#E8623A] text-xs font-extrabold flex items-center justify-center shrink-0">
                      A
                    </span>
                  </div>
                  <div className="text-sm text-[#6B7280] leading-relaxed [&_img]:w-full [&_img]:rounded-xl [&_img]:mt-3 [&_strong]:text-[#1E2B3A]"
                    dangerouslySetInnerHTML={{ __html: item.a.replace(/\n\n/g, "<br><br>") }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 bg-[#FFF0EA] border border-orange-100 rounded-2xl px-6 py-7 text-center">
          <p className="text-sm font-medium text-[#1E2B3A] mb-4">더 궁금하신 점이 있으신가요?<br />카카오톡으로 편하게 문의해 주세요.</p>
          <a
            href="http://pf.kakao.com/_xxxxxx"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-[#FF7F50] hover:bg-[#E8623A] text-white font-bold text-sm px-8 py-3.5 rounded-full shadow-md shadow-orange-100 transition-all hover:-translate-y-0.5"
          >
            💬 카카오톡 1:1 상담하기
          </a>
        </div>
      </main>

      <footer className="bg-[#1E2B3A] text-[#8A9AB0] text-xs text-center py-6 px-5 leading-relaxed">
        <p>© 2026 한우리 독서토론논술 파주운정 산내푸르지오독서교실</p>
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
    id: "intro", label: "인트로 문구",
    fields: [
      { key: "quote", label: "인용 문구", type: "text",     defaultValue: "아이의 생각이 깊어지고, 읽는 기쁨이 자라나는 따뜻한 공간" },
      { key: "sub",   label: "보조 문구", type: "text",     defaultValue: "스스로 생각의 씨앗을 틔울 수 있도록 돕습니다." },
    ],
  },
  {
    id: "about", label: "원장 소개",
    fields: [
      { key: "slogan", label: "슬로건",    type: "text",     defaultValue: "생각하는 힘이 아이의 미래를 바꿉니다" },
      { key: "name",   label: "원장 이름", type: "text",     defaultValue: "원장 이해옥" },
      { key: "career", label: "경력 (줄바꿈으로 구분)", type: "textarea", defaultValue: "독서토론논술 교습소 운영 (10년 경력)\n해법·한우리 독서토론교습소 운영\n독서지도사 자격 보유" },
      { key: "desc",   label: "교육 철학", type: "textarea", defaultValue: "단순히 책을 읽고 글을 쓰는 것을 넘어, 아이들이 스스로 생각하고 질문하는 힘을 길러주는 것을 교육 철학으로 삼고 있습니다." },
    ],
  },
  {
    id: "curriculum", label: "커리큘럼",
    fields: [
      { key: "elem_title", label: "초등부 제목",   type: "text",     defaultValue: "저학년 / 고학년" },
      { key: "elem_body",  label: "초등부 설명",   type: "textarea", defaultValue: "그림책과 문학 작품을 통한 흥미 위주의 독서. 주 1회 주제별 글쓰기 및 자유 토론 진행." },
      { key: "mid_title",  label: "중등부 제목",   type: "text",     defaultValue: "내신 및 심화 논술" },
      { key: "mid_body",   label: "중등부 설명",   type: "textarea", defaultValue: "비문학 읽기 및 신문 칼럼 분석. 서술형 평가 대비 및 중등 내신 연계형 심화 논술 작성." },
    ],
  },
  {
    id: "info", label: "운영 안내",
    fields: [
      { key: "hours",   label: "운영 시간", type: "text", defaultValue: "평일 14:00 ~ 20:00 (주말 및 공휴일 휴무)" },
      { key: "address", label: "주소",     type: "text", defaultValue: "경기 파주시 심학산로 385 운정신도시센트럴푸르지오 상가 2동 204호" },
      { key: "parking", label: "주차 안내", type: "text", defaultValue: "건물 뒷편 주차장 이용 가능" },
    ],
  },
  {
    id: "contact", label: "상담 문의",
    fields: [
      { key: "desc",    label: "안내 문구",      type: "text", defaultValue: "우리 아이에게 딱 맞는 독서 논술 교육, 지금 바로 상담받아보세요!" },
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
    onChange(qnaList.filter((_, i) => i !== idx));
    if (editIdx === idx) { setEditIdx(null); setAdding(false); }
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
  const [draft, setDraft] = useState<Review>(newReview());

  function startEdit(r: Review) { setAdding(false); setEditId(r.id); setDraft({ ...r }); }
  function startAdd() { setEditId(null); setAdding(true); setDraft(newReview()); }
  function cancel() { setEditId(null); setAdding(false); }

  function save() {
    if (!draft.title.trim()) return;
    if (adding) onChange([...reviews, draft]);
    else onChange(reviews.map(r => r.id === editId ? draft : r));
    cancel();
  }

  function del(id: number) {
    if (!confirm("이 소식을 삭제할까요?")) return;
    onChange(reviews.filter(r => r.id !== id));
    if (editId === id) cancel();
  }

  const editing = editId !== null || adding;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-[#1E2B3A]">수업 소식 관리</h3>
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
                <p className="text-xs font-bold text-[#1E2B3A] truncate">{r.title}</p>
                <p className="text-[10px] text-[#aaa] mt-0.5">📅 {r.date}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(r)} className="w-6 h-6 rounded flex items-center justify-center text-[#aaa] hover:text-[#FF7F50] transition text-xs">✏️</button>
                <button onClick={() => del(r.id)} className="w-6 h-6 rounded flex items-center justify-center text-[#aaa] hover:text-red-500 transition text-xs">🗑</button>
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
          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-1">본문</label>
            <RichEditor value={draft.body} onChange={body => setDraft(d => ({ ...d, body }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 bg-[#FF7F50] hover:bg-[#E8623A] text-white font-bold text-sm py-2.5 rounded-xl transition">저장</button>
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
        projectId: "",
        dataset: "production",
        apiVersion: "2024-03-01",
        token: "",
      }
    );
  });
  const [sanityLoading, setSanityLoading] = useState(false);
  const [sanityMsg, setSanityMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

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
    if (cfg?.projectId && cfg?.token) {
      setSaveStatusMsg("웹사이트 및 Sanity DB에 저장 중...");
      try {
        const res = await pushDataToSanity(localValues, qnaList, reviews);
        if (res.success) {
          setSaveStatusMsg("✓ 웹사이트 & Sanity DB에 모두 실시간 저장되었습니다!");
        } else {
          setSaveStatusMsg(`✓ 웹사이트 저장 완료 (Sanity 동기화 실패: ${res.message})`);
        }
      } catch (err: any) {
        setSaveStatusMsg("✓ 웹사이트 저장 완료 (Sanity 동기화 중 오류 발생)");
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
    if (!sanityConfig.projectId.trim()) {
      setSanityMsg({ type: "error", text: "Sanity Project ID를 입력해 주세요." });
      return;
    }
    setSanityLoading(true);
    setSanityMsg({ type: "info", text: "Sanity DB 연결을 확인하는 중입니다..." });
    saveLocalSanityConfig(sanityConfig);

    const res = await testSanityConnection(sanityConfig);
    setSanityLoading(false);
    if (res.success) {
      setSanityMsg({ type: "success", text: "✓ Sanity 연결 성공! 프로젝트와 정상 통신 중입니다." });
    } else {
      setSanityMsg({ type: "error", text: `✕ 연결 실패: ${res.message}` });
    }
  }

  async function handlePushToSanity() {
    if (!sanityConfig.projectId.trim()) {
      setSanityMsg({ type: "error", text: "먼저 Project ID를 입력해 주세요." });
      return;
    }
    if (!sanityConfig.token?.trim()) {
      setSanityMsg({
        type: "error",
        text: "Sanity로 데이터를 전송하려면 Write 권한이 있는 API Token이 필요합니다 (Sanity 대시보드 API -> Tokens 발급).",
      });
      return;
    }
    setSanityLoading(true);
    setSanityMsg({ type: "info", text: "Sanity DB로 데이터를 업로드 중입니다..." });
    saveLocalSanityConfig(sanityConfig);

    const res = await pushDataToSanity(localValues, qnaList, reviews);
    setSanityLoading(false);
    if (res.success) {
      setSanityMsg({ type: "success", text: "✓ Sanity DB에 웹사이트 모든 데이터가 성공적으로 업로드되었습니다!" });
    } else {
      setSanityMsg({ type: "error", text: `✕ 업로드 실패: ${res.message}` });
    }
  }

  async function handlePullFromSanity() {
    setSanityLoading(true);
    setSanityMsg({ type: "info", text: "Sanity DB에서 최신 데이터를 가져오는 중입니다..." });
    const data = await fetchSanityData();
    setSanityLoading(false);
    if (data) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* 헤더 */}
        <div className="bg-[#FF7F50] px-6 py-5 flex items-center justify-between shrink-0">
          <div>
            <p className="text-xs font-semibold text-orange-100 uppercase tracking-widest">Admin Panel</p>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              {step === "pw" ? "관리자 로그인" : "웹사이트 실시간 편집 & Sanity DB 관리"}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-sm transition">
            ✕
          </button>
        </div>

        {/* 비밀번호 */}
        {step === "pw" && (
          <form onSubmit={handleLogin} className="p-8 flex flex-col gap-4">
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
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* 사이드바 */}
            <div className="w-36 shrink-0 border-r border-gray-100 bg-[#f9fafb] py-4 overflow-y-auto">
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
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
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
                      Sanity.io 프로젝트와 연결하면 관리자 모드에서 수정한 내용이 클라우드 DB에 영구 보존되고 Vercel 배포 시 모든 방문자에게 최신 내용이 노출됩니다.
                    </p>
                  </div>

                  <div className="bg-[#FFF0EA]/40 border border-orange-200 rounded-2xl p-4 text-xs text-[#8A5030] space-y-1">
                    <p className="font-bold text-[#E8623A]">💡 간편 연동 팁</p>
                    <p>1. Sanity.io 무료 가입 후 프로젝트의 <strong>Project ID</strong>를 입력하세요.</p>
                    <p>2. Vercel 배포 시 환경 변수(<code>VITE_SANITY_PROJECT_ID</code>)로 설정해도 되고, 여기서 직접 저장해두셔도 바로 작동합니다.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#6B7280] mb-1">
                        Sanity Project ID <span className="text-[#FF7F50]">*</span>
                      </label>
                      <input
                        type="text"
                        value={sanityConfig.projectId}
                        onChange={e => setSanityConfig(c => ({ ...c, projectId: e.target.value }))}
                        placeholder="예: x9q8w2y1"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF7F50] transition font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#6B7280] mb-1">Dataset (기본: production)</label>
                      <input
                        type="text"
                        value={sanityConfig.dataset}
                        onChange={e => setSanityConfig(c => ({ ...c, dataset: e.target.value }))}
                        placeholder="production"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF7F50] transition font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#6B7280] mb-1">
                        API Token (Editor/Write 권한 — 웹에서 직접 Sanity 저장 시 필요)
                      </label>
                      <input
                        type="password"
                        value={sanityConfig.token || ""}
                        onChange={e => setSanityConfig(c => ({ ...c, token: e.target.value }))}
                        placeholder="sk..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF7F50] transition font-mono"
                      />
                      <p className="text-[11px] text-[#888] mt-1">
                        * Sanity 대시보드 &gt; API &gt; Tokens에서 'Editor' 권한으로 생성 가능합니다.
                      </p>
                    </div>
                  </div>

                  {sanityMsg && (
                    <div className={`p-3 rounded-xl text-xs font-medium ${
                      sanityMsg.type === "success"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : sanityMsg.type === "error"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}>
                      {sanityMsg.text}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={handleTestSanity}
                      disabled={sanityLoading}
                      className="bg-[#1E2B3A] hover:bg-[#2C3E50] text-white font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer disabled:opacity-50"
                    >
                      {sanityLoading ? "연결 확인 중..." : "✓ 설정 저장 및 연결 테스트"}
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

  // 앱 마운트 시: Sanity DB에 저장된 최신 데이터가 있다면 자동 동기화
  useEffect(() => {
    fetchSanityData().then(remote => {
      if (remote) {
        if (remote.values && Object.keys(remote.values).length > 0) {
          setSiteValues(prev => {
            const merged = { ...prev, ...remote.values };
            saveLocalData(LOCAL_STORAGE_SITE_DATA_KEY, merged);
            return merged;
          });
        }
        if (remote.qnaList && remote.qnaList.length > 0) {
          setLiveQna(remote.qnaList);
          saveLocalData(LOCAL_STORAGE_QNA_KEY, remote.qnaList);
        }
        if (remote.reviews && remote.reviews.length > 0) {
          setLiveReviews(remote.reviews);
          saveLocalData(LOCAL_STORAGE_REVIEWS_KEY, remote.reviews);
        }
      }
    }).catch(e => {
      console.log("Sanity 자동 동기화 대기 중", e);
    });
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
