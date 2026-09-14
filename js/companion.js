let companionData = [];
let filteredCompanionData = []; // 현재 필터 결과 (모달 이전/다음 이동에 사용)
let currentCompanionModalKey = null;

const COMPANION_FILTER_STORAGE_KEY = "cathero_companion_filter";

let currentCompanionFilter = { grade: "all", search: "" };

// 등급 표기용 매핑 (rune.js의 RUNE_GRADE_NAMES와 동일한 체계를 사용)
const COMPANION_GRADE_NAMES = {
    uncommon: "언커먼",
    rare: "레어",
    epic: "에픽",
    legendary: "전설",
    mythic: "신화",
};

/* ==========================================================================
   0. 필터 상태 저장/복원 (새로고침해도 유지)
   ========================================================================== */
function saveCompanionFilterState() {
    try {
        localStorage.setItem(COMPANION_FILTER_STORAGE_KEY, JSON.stringify(currentCompanionFilter));
    } catch (e) { /* localStorage 사용 불가 환경은 무시 */ }
}

function loadCompanionFilterState() {
    try {
        const saved = localStorage.getItem(COMPANION_FILTER_STORAGE_KEY);
        if (saved) currentCompanionFilter = {...currentCompanionFilter, ...JSON.parse(saved) };
    } catch (e) { /* 무시 */ }
}

function syncCompanionFilterUI() {
    const gradeSelect = document.getElementById("companion-grade-filter");
    if (gradeSelect) gradeSelect.value = currentCompanionFilter.grade;

    const searchInput = document.getElementById("companion-search-input");
    if (searchInput && searchInput.value !== currentCompanionFilter.search) searchInput.value = currentCompanionFilter.search;
}

/* ==========================================================================
   1. 동료 도감 데이터 불러오기 (companion.json)
   ========================================================================== */
async function fetchCompanions() {
    // 다른 데이터 파일들(rune-m.json 등)과의 관례를 따라 data/ 폴더를 먼저 시도하고,
    // 없으면 루트 경로(companion.json)도 시도합니다.
    const candidatePaths = ['data/companion.json', 'companion.json'];
    let lastError = null;

    for (const path of candidatePaths) {
        try {
            const res = await fetch(path);
            if (!res.ok) {
                lastError = new Error(`${path} 요청 실패 (status ${res.status})`);
                continue;
            }
            const data = await res.json();
            if (!Array.isArray(data)) {
                lastError = new Error(`${path}가 배열 형식이 아닙니다.`);
                continue;
            }
            console.log(`[companion.js] ${path} 에서 로드 성공`);
            return data;
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError || new Error('companion.json을 찾을 수 없습니다.');
}

async function loadCompanionDB() {
    const grid = document.getElementById("companion-card-grid");
    if (grid) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #94a3b8;">동료 데이터를 불러오는 중...</div>`;
    }
    try {
        companionData = await fetchCompanions();
        console.log(`[companion.js] companion.json 로드 완료: ${companionData.length}개`);
        loadCompanionFilterState();
        syncCompanionFilterUI();
        renderCompanionList();
    } catch (err) {
        console.error("[companion.js] 동료 데이터 로드 실패:", err);
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #ef4444;">
                    ⚠ 동료 데이터를 불러오지 못했습니다.<br>
                    <span style="font-size:0.75rem; color:#94a3b8;">${(err && err.message) || err}</span><br>
                    <span style="font-size:0.75rem; color:#94a3b8;">index.html과 companion.json이 같은 폴더에 있는지, 로컬 서버로 열었는지 확인해주세요 (file://로 직접 열면 fetch가 막힐 수 있습니다).</span>
                </div>`;
        }
    }
}

/* ==========================================================================
   2. 필터 처리 (grade: 'all' | 등급명, search: 검색어)
   ========================================================================== */
function filterCompanions(category, value) {
    currentCompanionFilter[category] = value;
    saveCompanionFilterState();
    syncCompanionFilterUI();
    renderCompanionList();
}

// 동료의 고유 식별자 (image 경로를 키로 사용 - 룬과 동일한 관례)
function companionKey(companion) {
    return companion.image;
}

/* ==========================================================================
   3. 카드 리스트 화면 출력 (동료 도감 - #companion-card-grid)
   ========================================================================== */
function renderCompanionList() {
    const grid = document.getElementById("companion-card-grid");
    if (!grid) return;

    const keyword = (currentCompanionFilter.search || "").trim().toLowerCase();

    filteredCompanionData = companionData.filter((c) => {
        const gradeMatch =
            currentCompanionFilter.grade === "all" || c.grade === currentCompanionFilter.grade;
        const searchMatch = !keyword || (c.name || "").toLowerCase().includes(keyword);
        return gradeMatch && searchMatch;
    });

    if (filteredCompanionData.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #94a3b8;">조건에 맞는 동료가 없습니다.</div>`;
        return;
    }

    grid.innerHTML = filteredCompanionData
        .map(
            (c) => `
        <div class="companion-card" data-key="${encodeURIComponent(companionKey(c))}" onclick="openCompanionModal('${encodeURIComponent(companionKey(c))}')">
            <div class="companion-badge-group">
                <span class="companion-type-badge grade-${c.grade}">${COMPANION_GRADE_NAMES[c.grade] || c.grade}</span>
            </div>
            <div class="companion-img-wrapper">
                <img src="${c.image}" alt="${c.name}" class="companion-icon" loading="lazy" />
            </div>
            <span class="companion-name">${c.name}</span>
        </div>
    `,
        )
        .join("");
}

/* ==========================================================================
   4. 동료 상세정보 모달
   ========================================================================== */
function findCompanionIndexInFiltered(key) {
    return filteredCompanionData.findIndex((c) => companionKey(c) === key);
}

function openCompanionModal(encodedKey) {
    const key = decodeURIComponent(encodedKey);
    currentCompanionModalKey = key;
    renderCompanionModal(key);

    const modal = document.getElementById("companion-detail-modal");
    if (modal) modal.classList.remove("hidden");

    document.addEventListener("keydown", handleCompanionModalKeydown);
}

function closeCompanionModal() {
    const modal = document.getElementById("companion-detail-modal");
    if (modal) modal.classList.add("hidden");
    currentCompanionModalKey = null;
    document.removeEventListener("keydown", handleCompanionModalKeydown);
}

function navigateCompanionModal(direction) {
    if (!currentCompanionModalKey) return;
    const idx = findCompanionIndexInFiltered(currentCompanionModalKey);
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= filteredCompanionData.length) return; // 경계에서는 이동 안 함

    const nextCompanion = filteredCompanionData[nextIdx];
    currentCompanionModalKey = companionKey(nextCompanion);
    renderCompanionModal(currentCompanionModalKey);
}

function handleCompanionModalKeydown(e) {
    if (e.key === "Escape") closeCompanionModal();
    else if (e.key === "ArrowLeft") navigateCompanionModal(-1);
    else if (e.key === "ArrowRight") navigateCompanionModal(1);
}

// type/size/특수효과 등은 아직 "동료 데이터 입력기"로 채워지지 않은 항목이 많을 수 있어
// 문자열이든 배열이든 안전하게 표시 가능한 텍스트로 변환
function toDisplayTags(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === "string" && value.trim()) return [value.trim()];
    return [];
}

function renderCompanionModal(key) {
    const companion = filteredCompanionData.find((c) => companionKey(c) === key) || companionData.find((c) => companionKey(c) === key);
    const body = document.getElementById("companion-modal-body");
    if (!companion || !body) return;

    const idx = findCompanionIndexInFiltered(key);
    const prevBtn = document.getElementById("companion-modal-prev");
    const nextBtn = document.getElementById("companion-modal-next");
    if (prevBtn) prevBtn.disabled = idx <= 0;
    if (nextBtn) nextBtn.disabled = idx === -1 || idx >= filteredCompanionData.length - 1;

    const sizeTags = toDisplayTags(companion.size);
    const typeTags = toDisplayTags(companion.type);
    const holdText = (companion.holdEffect || "").trim();

    // special-effect: 문자열(구버전) 또는 특수효과 슬롯 배열(동료 데이터 입력기 신버전) 모두 지원
    const rawSpecial = companion.specialSlots || companion["special-effect"];
    const specialSlots = Array.isArray(rawSpecial) ? rawSpecial : null;
    const specialText = !specialSlots && typeof rawSpecial === "string" ? rawSpecial.trim() : "";

    const awaken = companion.awaken && typeof companion.awaken === "object" ? companion.awaken : null;

    let specialHtml = "";
    if (specialSlots && specialSlots.length) {
        specialHtml = specialSlots.map((slot) => `
            <div class="companion-special-slot">
                <div class="companion-special-slot-head">
                    <span class="companion-special-slot-name">${slot.iconLabel || "특수효과"}</span>
                    ${slot.currentLevel ? `<span class="companion-special-slot-level">Lv.${slot.currentLevel}</span>` : ""}
                </div>
                ${(slot.levels || []).filter(l => l.text && l.text.trim()).map(l => `
                    <div class="companion-special-level-row">
                        <span class="companion-special-level-num">Lv.${l.level}</span>
                        <span class="companion-special-level-text">${l.text}</span>
                    </div>
                `).join("")}
                ${slot.unlockCondition ? `<div class="companion-special-unlock">🔒 ${slot.unlockCondition}</div>` : ""}
            </div>
        `).join("");
    } else if (specialText) {
        specialHtml = `<p class="companion-modal-effect">${specialText}</p>`;
    } else {
        specialHtml = `<p class="companion-modal-effect is-empty">특수효과 정보를 입력 중입니다.</p>`;
    }

    const awakenHtml = awaken && (awaken.condition || awaken.effect) ? `
        <div class="companion-awaken-box">
            <div class="companion-awaken-title">✨ 각성 효과 ${awaken.condition ? `<span class="companion-awaken-condition">${awaken.condition}</span>` : ""}</div>
            ${awaken.effect ? `<p class="companion-awaken-effect">${awaken.effect}</p>` : ""}
        </div>
    ` : "";

    body.innerHTML = `
        <div class="companion-modal-head">
            <div class="companion-modal-img-wrapper">
                <img src="${companion.image}" alt="${companion.name}" />
            </div>
            <div class="companion-modal-title-group">
                <div class="companion-modal-badges">
                    <span class="companion-modal-tag grade-${companion.grade}">${COMPANION_GRADE_NAMES[companion.grade] || companion.grade}</span>
                    ${sizeTags.map(t => `<span class="companion-modal-tag">${t}</span>`).join("")}
                    ${typeTags.map(t => `<span class="companion-modal-tag">${t}</span>`).join("")}
                </div>
                <span class="companion-modal-name">${companion.name}</span>
            </div>
        </div>

        <div class="companion-modal-hold-row ${holdText ? "" : "is-empty"}">
            <span class="companion-modal-hold-label">보유 효과</span>
            <span class="companion-modal-hold-value">${holdText || "입력 예정"}</span>
        </div>

        <div class="companion-special-section">
            <span class="companion-special-section-label">특수 효과</span>
            ${specialHtml}
        </div>

        ${awakenHtml}

        ${idx >= 0 ? `<div class="companion-modal-position">${idx + 1} / ${filteredCompanionData.length}</div>` : ""}
    `;
}

// 페이지 로드 시 동료 도감 데이터 로드
document.addEventListener("DOMContentLoaded", loadCompanionDB);