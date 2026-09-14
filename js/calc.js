/**
 * calc.js - 명중/회피 실험 탭 로직
 * ----------------------------------------------------------------------
 * DPS 계산기는 유저 설문(500명 중 약 80%가 불필요 응답) 결과에 따라 제거되었고,
 * 대신 아래 두 계산기로 대체되었습니다.
 *   1) 회피 덱 - 타수 계산기 (calcEvasionHits)
 *   2) 명중 덱 - 방관 기준 딜 계산기 (calcAccuracyDamage)
 *
 * ⚠️ 아직 캣 히어로의 실제 명중/회피/방관 공식이 확정되지 않았습니다.
 *    아래 계산 로직은 자리를 잡아두기 위한 임시(placeholder) 공식이며,
 *    실측 데이터로 검증되는 대로 교체될 예정입니다.
 * ----------------------------------------------------------------------
 */

const EXPERIMENT_TAB_STORAGE_PATCH_KEY = "experimentTab";

/* ==========================================================================
   0. 하위 탭(회피 / 명중) 전환
   ========================================================================== */
function switchExperimentTab(tabName) {
    if (!EXPERIMENT_SUB_TABS.includes(tabName)) tabName = "evasion";

    EXPERIMENT_SUB_TABS.forEach((name) => {
        const panel = document.getElementById("panel-" + name);
        if (panel) panel.classList.toggle("hidden", name !== tabName);

        const btn = document.getElementById("subtab-" + name);
        if (btn) btn.classList.toggle("active", name === tabName);
    });

    if (typeof saveUiState === "function") {
        saveUiState({
            [EXPERIMENT_TAB_STORAGE_PATCH_KEY]: tabName });
    }
}

/* ==========================================================================
   1. 회피 덱 - 타수 계산기
   ----------------------------------------------------------------------
   입력: 회피율(%), 상대 명중 보정(%), 시뮬레이션 타수
   출력(임시): 예상 회피 타수 / 예상 피격 타수
   ========================================================================== */
function calcEvasionHits() {
    const evasionRate = getNumberInput("evasion-rate-input");
    const enemyAccuracy = getNumberInput("evasion-enemy-accuracy-input");
    const totalHits = getNumberInput("evasion-hit-count-input");

    // TODO: 실제 게임 내 회피 판정 공식으로 교체 필요.
    // 임시 공식: 최종 회피율 = 회피율 - 상대 명중 보정 (0~100% 사이로 clamp)
    const finalEvasionRate = clamp(evasionRate - enemyAccuracy, 0, 100);
    const dodgedHits = Math.round((finalEvasionRate / 100) * totalHits);
    const takenHits = totalHits - dodgedHits;

    renderResultBox("evasion-result-box", [
        { label: "적용 회피율 (임시 공식)", value: `${finalEvasionRate.toFixed(1)}%` },
        { label: "예상 회피 타수", value: `${dodgedHits} / ${totalHits}` },
        { label: "예상 피격 타수", value: `${takenHits} / ${totalHits}` },
    ], "이 결과는 확정된 게임 공식이 아닌 임시 추정치입니다.");
}

/* ==========================================================================
   2. 명중 덱 - 방관 기준 딜 계산기
   ----------------------------------------------------------------------
   입력: 명중률(%), 방어 관통(방관) 수치, 상대 방어력
   출력(임시): 방관 적용 후 유효 방어력 / 데미지 배율
   ========================================================================== */
function calcAccuracyDamage() {
    const accuracyRate = getNumberInput("accuracy-rate-input");
    const penetration = getNumberInput("accuracy-penetration-input");
    const enemyDefense = getNumberInput("accuracy-enemy-defense-input");

    // TODO: 실제 게임 내 방관/명중 데미지 공식으로 교체 필요.
    // 임시 공식: 유효 방어력 = max(상대 방어력 - 방관 수치, 0)
    //           데미지 배율 = 100 / (100 + 유효 방어력) * (명중률/100 보정)
    const effectiveDefense = Math.max(enemyDefense - penetration, 0);
    const rawMultiplier = 100 / (100 + effectiveDefense);
    const accuracyFactor = clamp(accuracyRate, 0, 100) / 100;
    const finalMultiplier = rawMultiplier * accuracyFactor;

    renderResultBox("accuracy-result-box", [
        { label: "방관 적용 후 유효 방어력 (임시 공식)", value: `${effectiveDefense}` },
        { label: "명중 보정 전 데미지 배율", value: `${(rawMultiplier * 100).toFixed(1)}%` },
        { label: "최종 데미지 배율", value: `${(finalMultiplier * 100).toFixed(1)}%` },
    ], "이 결과는 확정된 게임 공식이 아닌 임시 추정치입니다.");
}

/* ==========================================================================
   공용 유틸
   ========================================================================== */
function getNumberInput(id) {
    const el = document.getElementById(id);
    const value = el ? parseFloat(el.value) : 0;
    return Number.isFinite(value) ? value : 0;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function renderResultBox(boxId, rows, footnote) {
    const box = document.getElementById(boxId);
    if (!box) return;

    box.innerHTML = `
        <div class="result-rows">
            ${rows.map((r) => `
                <div class="result-row">
                    <span class="result-label">${r.label}</span>
                    <span class="result-value">${r.value}</span>
                </div>
            `).join("")}
        </div>
        ${footnote ? `<p class="result-footnote">⚠️ ${footnote}</p>` : ""}
    `;
    box.classList.remove("hidden");
}