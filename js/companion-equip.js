/**
 * 동료 장착 UI (덱 구성 추천 - "2. 동료, 탈것 및 가디언" 섹션)
 * ----------------------------------------------------------------------
 * - 동료: 최대 6슬롯 (COMPANION_SLOT_COUNT — 실제 게임 슬롯 수를 알려주시면
 *   이 상수만 바꾸면 됩니다. 지금은 임시값입니다.)
 * - userState.equippedCompanions (state.js) 에 저장되며 값은 각 동료의
 *   image 경로(고유 키)입니다.
 * - 같은 동료를 여러 슬롯에 중복 장착할 수 없습니다 (룬 장착과 동일한 관례).
 * - ⚠️ "고유" 태그가 붙은 동료는 덱 전체에서 단 1마리만 장착 가능합니다.
 *   이미 다른 슬롯에 "고유" 동료가 장착되어 있으면, 그 슬롯을 뺀 나머지
 *   슬롯에서는 다른 "고유" 동료를 선택할 수 없게 막습니다.
 * ----------------------------------------------------------------------
 */

const COMPANION_SLOT_COUNT = 6;

let companionPickerSlotIndex = null;
let companionPickerGrade = "all";
let companionPickerSearch = "";

/* ==========================================================================
   공용 헬퍼
   ========================================================================== */
function findCompanionByKey(key) {
    if (!key) return null;
    return (typeof companionData !== "undefined" ? companionData : []).find((c) => c.image === key) || null;
}

// type/types 필드가 문자열이든 배열이든 안전하게 태그 배열로 변환
function companionTypeTags(companion) {
    const raw = companion && (companion.types || companion.type);
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === "string" && raw.trim()) return [raw.trim()];
    return [];
}

function isUniqueCompanion(companion) {
    return companionTypeTags(companion).includes("고유");
}

// 현재 장착된 동료들 중 "고유" 태그를 가진 동료의 슬롯 인덱스 (없으면 -1)
function findEquippedUniqueSlotIndex(excludeSlotIndex) {
    for (let i = 0; i < userState.equippedCompanions.length; i++) {
        if (i === excludeSlotIndex) continue;
        const c = findCompanionByKey(userState.equippedCompanions[i]);
        if (c && isUniqueCompanion(c)) return i;
    }
    return -1;
}

/* ==========================================================================
   슬롯 렌더링
   ========================================================================== */
function renderCompanionEquipSlots() {
    const box = document.getElementById("companion-slot-grid");
    if (!box) return;

    let html = "";
    for (let i = 0; i < COMPANION_SLOT_COUNT; i++) {
        const key = userState.equippedCompanions[i];
        const companion = findCompanionByKey(key);

        if (companion) {
            const unique = isUniqueCompanion(companion);
            html += `
                <div class="equip-slot filled grade-${companion.grade}" onclick="openCompanionPicker(${i})">
                    <button type="button" class="equip-slot-remove" onclick="event.stopPropagation(); unequipCompanionSlot(${i})" title="장착 해제">✕</button>
                    <img src="${companion.image}" alt="${companion.name}" class="equip-slot-img" onerror="this.style.opacity=0.15">
                    <span class="equip-slot-name">${companion.name}${unique ? " 🔒" : ""}</span>
                    <span class="companion-type-badge grade-${companion.grade}">${(typeof COMPANION_GRADE_NAMES !== "undefined" && COMPANION_GRADE_NAMES[companion.grade]) || companion.grade}</span>
                </div>
            `;
        } else {
            html += `
                <div class="equip-slot empty" onclick="openCompanionPicker(${i})">
                    <span class="equip-slot-plus">＋</span>
                    <span class="equip-slot-empty-label">동료 선택</span>
                </div>
            `;
        }
    }
    box.innerHTML = html;

    const count = userState.equippedCompanions.filter(Boolean).length;
    const badge = document.getElementById("companion-slot-count-badge");
    if (badge) badge.textContent = `${count} / ${COMPANION_SLOT_COUNT}`;
}

function unequipCompanionSlot(slotIndex) {
    userState.equippedCompanions[slotIndex] = null;
    saveUserState();
    renderCompanionEquipSlots();
}

/* ==========================================================================
   동료 선택 피커 모달
   ========================================================================== */
function openCompanionPicker(slotIndex) {
    companionPickerSlotIndex = slotIndex;
    companionPickerGrade = "all";
    companionPickerSearch = "";

    const searchInput = document.getElementById("companion-picker-search-input");
    if (searchInput) searchInput.value = "";

    renderCompanionPickerGradeFilter();
    renderCompanionPickerGrid();

    const modal = document.getElementById("companion-picker-modal");
    if (modal) modal.classList.remove("hidden");
}

function closeCompanionPicker() {
    const modal = document.getElementById("companion-picker-modal");
    if (modal) modal.classList.add("hidden");
    companionPickerSlotIndex = null;
}

function filterCompanionPicker(category, value) {
    if (category === "search") companionPickerSearch = value;
    else if (category === "grade") companionPickerGrade = value;
    renderCompanionPickerGrid();
}

function renderCompanionPickerGradeFilter() {
    const box = document.getElementById("companion-picker-grade-filter");
    if (!box) return;
    const grades = ["all", "uncommon", "rare", "epic", "legendary", "mythic"];
    const names = (typeof COMPANION_GRADE_NAMES !== "undefined") ? COMPANION_GRADE_NAMES : {};
    box.innerHTML = grades
        .map((g) => `
            <button type="button" class="filter-btn ${g === companionPickerGrade ? "active" : ""}" onclick="selectCompanionPickerGrade('${g}')">
                ${g === "all" ? "전체" : (names[g] || g)}
            </button>
        `)
        .join("");
}

function selectCompanionPickerGrade(grade) {
    companionPickerGrade = grade;
    renderCompanionPickerGradeFilter();
    renderCompanionPickerGrid();
}

function renderCompanionPickerGrid() {
    const grid = document.getElementById("companion-picker-grid");
    if (!grid || companionPickerSlotIndex === null) return;

    const slotIndex = companionPickerSlotIndex;
    const equippedArray = userState.equippedCompanions;
    const currentSlotKey = equippedArray[slotIndex];
    // 다른 슬롯에 이미 장착된 동료는 중복 장착 불가
    const takenKeys = new Set(equippedArray.filter((k, idx) => k && idx !== slotIndex));
    // "고유" 동료는 덱 전체에서 1마리만 - 이미 다른 슬롯에 있으면 그 슬롯 키만 기록
    const uniqueSlotIdx = findEquippedUniqueSlotIndex(slotIndex);
    const lockedByUniqueKey = uniqueSlotIdx >= 0 ? equippedArray[uniqueSlotIdx] : null;

    const keyword = (companionPickerSearch || "").trim().toLowerCase();
    const list = (typeof companionData !== "undefined" ? companionData : []).filter((c) => {
        if (companionPickerGrade !== "all" && c.grade !== companionPickerGrade) return false;
        if (keyword && !(c.name || "").toLowerCase().includes(keyword)) return false;
        return true;
    });

    if (list.length === 0) {
        grid.innerHTML = `<div class="companion-picker-empty">조건에 맞는 동료가 없습니다.</div>`;
        return;
    }

    const gradeNames = (typeof COMPANION_GRADE_NAMES !== "undefined") ? COMPANION_GRADE_NAMES : {};

    grid.innerHTML = list
        .map((c) => {
                const isTaken = takenKeys.has(c.image);
                const isCurrent = c.image === currentSlotKey;
                const unique = isUniqueCompanion(c);
                // 이미 다른 슬롯에 고유 동료가 있고, 이 카드도 고유 동료이면서 그 동료가 아니면 선택 불가
                const isBlockedByUniqueRule = unique && lockedByUniqueKey && c.image !== lockedByUniqueKey;
                const isDisabled = isTaken || isBlockedByUniqueRule;

                let badgeHtml = "";
                if (isCurrent) badgeHtml = '<span class="companion-picker-badge current">장착중</span>';
                else if (isTaken) badgeHtml = '<span class="companion-picker-badge taken">다른 슬롯</span>';
                else if (isBlockedByUniqueRule) badgeHtml = '<span class="companion-picker-badge locked">고유 1마리 제한</span>';

                return `
                <div class="companion-picker-card grade-${c.grade} ${isCurrent ? "is-current" : ""} ${isDisabled ? "is-disabled" : ""}"
                    ${isDisabled ? "" : `onclick="equipCompanionToSlot('${encodeURIComponent(c.image)}')"`}>
                    ${badgeHtml}
                    <span class="companion-type-badge grade-${c.grade}">${gradeNames[c.grade] || c.grade}${unique ? " 🔒" : ""}</span>
                    <div class="companion-picker-img-wrapper">
                        <img src="${c.image}" alt="${c.name}" class="companion-picker-icon" loading="lazy" onerror="this.onerror=null;this.style.opacity=0.2;">
                    </div>
                    <span class="companion-picker-name">${c.name}</span>
                </div>
            `;
        })
        .join("");
}

function equipCompanionToSlot(encodedKey) {
    if (companionPickerSlotIndex === null) return;
    const key = decodeURIComponent(encodedKey);
    userState.equippedCompanions[companionPickerSlotIndex] = key;
    saveUserState();
    renderCompanionEquipSlots();
    closeCompanionPicker();
}

document.addEventListener("DOMContentLoaded", renderCompanionEquipSlots);
document.addEventListener("companionDataLoaded", renderCompanionEquipSlots);