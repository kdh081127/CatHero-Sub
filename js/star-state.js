/* ==========================================================================
   Star-State: 성급(1~25성)별 별 모양 및 개수 변화 안내 모달
   ----------------------------------------------------------------------
   - 동료 도감 뷰에서만 우하단에 물음표 버튼(#star-state-fab)이 보이고,
     누르면 1~5 / 6~10 / 11~15 / 16~20 / 21~25성 그룹으로 나눠 별 아이콘을
     그리드로 보여줍니다.
   - 이미지 경로는 아래 STAR_STATE_IMAGE_BASE 기준이며, 파일명은
     star_01.png ~ star_25.png 형식입니다. 실제 프로젝트에 맞게
     경로/파일명을 조정해서 쓰세요.
   ========================================================================== */

const STAR_STATE_IMAGE_BASE = "./assets/star-state/";

const STAR_STATE_TIERS = [
    { label: "1 ~ 5성", from: 1, to: 5 },
    { label: "6 ~ 10성", from: 6, to: 10 },
    { label: "11 ~ 15성", from: 11, to: 15 },
    { label: "16 ~ 20성", from: 16, to: 20 },
    { label: "21 ~ 25성", from: 21, to: 25 },
];

function starStateImagePath(level) {
    const padded = String(level).padStart(2, "0");
    return `${STAR_STATE_IMAGE_BASE}st_${padded}.png`;
}

function renderStarStateModal() {
    const body = document.getElementById("star-state-modal-body");
    if (!body) return;

    const tiersHtml = STAR_STATE_TIERS.map((tier) => {
        const cellsHtml = [];
        for (let level = tier.from; level <= tier.to; level++) {
            cellsHtml.push(`
                <div class="star-state-cell">
                    <div class="star-state-icon-wrap">
                        <img src="${starStateImagePath(level)}" alt="${level}성" class="star-state-icon" loading="lazy" onerror="this.style.opacity=0.15">
                    </div>
                    <span class="star-state-level">${level}성</span>
                </div>
            `);
        }
        return `
            <div class="star-state-tier-block">
                <div class="star-state-tier-label">${tier.label}</div>
                <div class="star-state-tier-grid">
                    ${cellsHtml.join("")}
                </div>
            </div>
        `;
    }).join("");

    body.innerHTML = `
        <div class="star-state-header">
            <span class="star-state-title">⭐ 성급별 별 모양 및 개수 변화</span>
            <p class="star-state-desc">동료의 성급(1~25성)이 오를수록 별의 모양과 개수가 어떻게 바뀌는지 5단계 그룹으로 확인하세요.</p>
        </div>
        ${tiersHtml}
    `;
}

function openStarStateModal() {
    renderStarStateModal();
    const modal = document.getElementById("star-state-modal");
    if (modal) modal.classList.remove("hidden");
    document.addEventListener("keydown", handleStarStateModalKeydown);
}

function closeStarStateModal() {
    const modal = document.getElementById("star-state-modal");
    if (modal) modal.classList.add("hidden");
    document.removeEventListener("keydown", handleStarStateModalKeydown);
}

function handleStarStateModalKeydown(e) {
    if (e.key === "Escape") closeStarStateModal();
}

/* ==========================================================================
   물음표 버튼은 "동료 도감" 뷰일 때만 표시
   main.js의 switchMainView()가 이 함수를 호출해줍니다 (있으면 자동 연동).
   ========================================================================== */
function updateStarStateFabVisibility(viewName) {
    const fab = document.getElementById("star-state-fab");
    if (!fab) return;
    fab.classList.toggle("hidden", viewName !== "companions");
}

// 새로고침 후 복원된 화면에도 바로 적용되도록, 로드 시 현재 뷰 기준으로 한 번 동기화
document.addEventListener("DOMContentLoaded", () => {
    const companionsView = document.getElementById("view-companions");
    const isCompanionsActive = companionsView && !companionsView.classList.contains("hidden");
    updateStarStateFabVisibility(isCompanionsActive ? "companions" : "");
});