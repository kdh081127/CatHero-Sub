let runeData = [];
let filteredRuneData = []; // 현재 필터 결과 (모달 이전/다음 이동에 사용)
let currentRuneModalKey = null;

const RUNE_FILTER_STORAGE_KEY = "cathero_rune_filter";

let currentFilter = { type: "all", grade: "all", search: "" };

// 등급/타입 표기용 매핑
const RUNE_GRADE_NAMES = {
    uncommon: "언커먼",
    rare: "레어",
    epic: "에픽",
    legendary: "전설",
    Legendary: "전설",
    mythic: "신화",
    ascension: "초월",
};
const RUNE_TYPE_NAMES = {
    main: "메인 룬",
    sub: "서브 룬",
};
const RUNE_TARGET_TYPE_NAMES = {
    companion: "🐾 동료용",
    skill: "⚡ 스킬용",
    stat: "📊 스탯용",
};

/* ==========================================================================
   0. 필터 상태 저장/복원 (새로고침해도 유지)
   ========================================================================== */
function saveRuneFilterState() {
    try {
        localStorage.setItem(RUNE_FILTER_STORAGE_KEY, JSON.stringify(currentFilter));
    } catch (e) { /* localStorage 사용 불가 환경은 무시 */ }
}

function loadRuneFilterState() {
    try {
        const saved = localStorage.getItem(RUNE_FILTER_STORAGE_KEY);
        if (saved) currentFilter = {...currentFilter, ...JSON.parse(saved) };
    } catch (e) { /* 무시 */ }
}

// 저장된 필터 값에 맞게 필터 바 UI(버튼 active, select 값)를 동기화
function syncRuneFilterUI() {
    document.querySelectorAll('.db-filter-bar .filter-btn').forEach((btn) => {
        const onclickAttr = btn.getAttribute("onclick") || "";
        const match = onclickAttr.match(/'type',\s*'(\w+)'/);
        if (!match) return;
        btn.classList.toggle("active", match[1] === currentFilter.type);
    });

    const gradeSelect = document.getElementById("rune-grade-filter");
    if (gradeSelect) gradeSelect.value = currentFilter.grade;

    const searchInput = document.getElementById("rune-search-input");
    if (searchInput && searchInput.value !== currentFilter.search) searchInput.value = currentFilter.search;
}

/* ==========================================================================
   1. 룬 도감 데이터 불러오기 (메인 + 서브 룬 전체)
   ========================================================================== */
async function loadRuneDB() {
    try {
        runeData = await fetchAllRunes();
        loadRuneFilterState();
        syncRuneFilterUI();
        renderRuneList();
    } catch (err) {
        console.error("룬 데이터 로드 실패:", err);
    }
}

/* ==========================================================================
   2. 필터 처리 (type: 'all' | 'main' | 'sub', grade: 'all' | 등급명)
   ========================================================================== */
function filterRunes(category, value) {
    currentFilter[category] = value;
    saveRuneFilterState();
    syncRuneFilterUI();
    renderRuneList();
}

// 룬의 고유 식별자 (id는 등급 내 공통 값이라 image 경로를 키로 사용)
function runeKey(rune) {
    return rune.image;
}

/* ==========================================================================
   3. 카드 리스트 화면 출력 (룬 도감 - #rune-card-grid)
   ========================================================================== */
function renderRuneList() {
    const grid = document.getElementById("rune-card-grid");
    if (!grid) return;

    const keyword = (currentFilter.search || "").trim().toLowerCase();

    filteredRuneData = runeData.filter((rune) => {
        const typeMatch =
            currentFilter.type === "all" || rune.type === currentFilter.type;
        const gradeMatch =
            currentFilter.grade === "all" || rune.grade === currentFilter.grade;
        const searchMatch =
            !keyword || (rune.name || "").toLowerCase().includes(keyword);
        return typeMatch && gradeMatch && searchMatch;
    });

    if (filteredRuneData.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #94a3b8;">조건에 맞는 룬이 없습니다.</div>`;
        return;
    }

    grid.innerHTML = filteredRuneData
        .map(
            (rune) => `
        <div class="rune-card ${rune.grade}" data-key="${encodeURIComponent(runeKey(rune))}" onclick="openRuneModal('${encodeURIComponent(runeKey(rune))}')">
            <div class="rune-badge-group">
                <span class="rune-type-badge">${RUNE_TYPE_NAMES[rune.type] || ""}</span>
                <span class="rune-type-badge grade-${rune.grade}">${RUNE_GRADE_NAMES[rune.grade] || rune.grade}</span>
            </div>
            <div class="rune-img-wrapper">
                <img src="${rune.image}" alt="${rune.name}" class="rune-icon" loading="lazy" />
            </div>
            <span class="rune-name">${rune.name}</span>
        </div>
    `,
        )
        .join("");
}

/* ==========================================================================
   4. 룬 상세정보 모달
   ========================================================================== */
function findRuneIndexInFiltered(key) {
    return filteredRuneData.findIndex((r) => runeKey(r) === key);
}

function openRuneModal(encodedKey) {
    const key = decodeURIComponent(encodedKey);
    currentRuneModalKey = key;
    renderRuneModal(key);

    const modal = document.getElementById("rune-detail-modal");
    if (modal) modal.classList.remove("hidden");

    document.addEventListener("keydown", handleRuneModalKeydown);
}

function closeRuneModal() {
    const modal = document.getElementById("rune-detail-modal");
    if (modal) modal.classList.add("hidden");
    currentRuneModalKey = null;
    document.removeEventListener("keydown", handleRuneModalKeydown);
}

function navigateRuneModal(direction) {
    if (!currentRuneModalKey) return;
    const idx = findRuneIndexInFiltered(currentRuneModalKey);
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= filteredRuneData.length) return; // 경계에서는 이동 안 함

    const nextRune = filteredRuneData[nextIdx];
    currentRuneModalKey = runeKey(nextRune);
    renderRuneModal(currentRuneModalKey);
}

function handleRuneModalKeydown(e) {
    if (e.key === "Escape") closeRuneModal();
    else if (e.key === "ArrowLeft") navigateRuneModal(-1);
    else if (e.key === "ArrowRight") navigateRuneModal(1);
}

function renderRuneModal(key) {
    const rune = filteredRuneData.find((r) => runeKey(r) === key) || runeData.find((r) => runeKey(r) === key);
    const body = document.getElementById("rune-modal-body");
    if (!rune || !body) return;

    const idx = findRuneIndexInFiltered(key);
    const prevBtn = document.getElementById("rune-modal-prev");
    const nextBtn = document.getElementById("rune-modal-next");
    if (prevBtn) prevBtn.disabled = idx <= 0;
    if (nextBtn) nextBtn.disabled = idx === -1 || idx >= filteredRuneData.length - 1;

    const effectText = (rune.effect || "").trim();
    const holdText = (rune.holdEffect || "").trim();
    const targetLabel = RUNE_TARGET_TYPE_NAMES[rune.targetType] || null;

    body.innerHTML = `
        <div class="rune-modal-head">
            <div class="rune-modal-img-wrapper">
                <img src="${rune.image}" alt="${rune.name}" />
            </div>
            <div class="rune-modal-title-group">
                <div class="rune-modal-badges">
                    <span class="rune-modal-tag">${RUNE_TYPE_NAMES[rune.type] || ""}</span>
                    <span class="rune-modal-tag grade-${rune.grade}">${RUNE_GRADE_NAMES[rune.grade] || rune.grade}</span>
                    ${targetLabel ? `<span class="rune-modal-tag">${targetLabel}</span>` : ""}
                </div>
                <span class="rune-modal-name">${rune.name}</span>
            </div>
        </div>

        <p class="rune-modal-effect ${effectText ? "" : "is-empty"}">
            ${effectText || "효과 정보를 입력 중입니다."}
        </p>

        <div class="rune-modal-hold-row ${holdText ? "" : "is-empty"}">
            <span class="rune-modal-hold-label">보유 효과</span>
            <span class="rune-modal-hold-value">${holdText || "입력 예정"}</span>
        </div>

        ${idx >= 0 ? `<div class="rune-modal-position">${idx + 1} / ${filteredRuneData.length}</div>` : ""}
    `;
}

// 페이지 로드 시 룬 도감 데이터 로드
document.addEventListener("DOMContentLoaded", loadRuneDB);